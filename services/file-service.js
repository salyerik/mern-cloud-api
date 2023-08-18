const {
	S3Client,
	PutObjectCommand,
	GetObjectCommand,
	DeleteObjectCommand,
} = require('@aws-sdk/client-s3');
const { Upload } = require('@aws-sdk/lib-storage');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');

const sse = require('./sse');
const commonService = require('./common-service');
const User = require('../models/user-model');
const File = require('../models/file-model');

const { MB } = require('../config/config');
const s3 = new S3Client();
const Bucket = process.env.AWS_BUCKET;

class FileService {
	async getFiles(user, sort, parent) {
		return await File.find({ parent, user }).sort({ [sort]: 1 });
	}
	async searchFiles(user, search) {
		const regex = new RegExp(search, 'i');
		const files = await File.find({ user, name: { $regex: regex } });
		return files;
	}
	createDir(userId, parent, name) {
		return new Promise(async (resolve, reject) => {
			const user = await User.findById(userId);
			const file = new File({ name, type: 'dir', parent, user: user._id });
			if (parent) {
				const parentFile = await File.findOne({ _id: parent });
				file.path = `${parentFile.path ? parentFile.path + '/' : ''}${
					parentFile.name
				}`;
				parentFile.children.push(file._id);
				await parentFile.save();
			} else {
				file.path = '';
			}
			const Key = this._getPath(file) + '/';
			const params = { Bucket, Key };
			try {
				await s3.send(new GetObjectCommand(params));
				reject('Folder already exists');
			} catch (e) {
				await s3.send(new PutObjectCommand(params));
				user.files.push(file._id);
				await user.save();
				const createdFolder = await file.save();
				resolve(createdFolder);
			}
		});
	}
	async createUserDir(userFolder) {
		await s3.send(
			new PutObjectCommand({ Bucket, Key: userFolder.user.toString() + '/' })
		);
	}
	async existCheck(user, name, parent) {
		const file = await File.findOne({ user, name, parent: parent || null });
		return !!file;
	}
	uploadFile(file, parentId, userId) {
		return new Promise(async (resolve, reject) => {
			const { originalname, size, buffer, mimetype } = file;
			if (size > 10 * MB) {
				return reject({ message: 'File size must be less than 10 MB' });
			}
			const parent = await File.findById(parentId);
			const user = await User.findById(userId);
			if (user.usedSpace + size > user.diskSpace) {
				return reject({ message: 'Not enough disk space' });
			}
			user.usedSpace += size;
			let path = '';
			if (parent) {
				path = parent.path
					? `${userId}/${parent.path}/${parent.name}/${originalname}`
					: `${userId}/${parent.name}/${originalname}`;
			} else {
				path = userId + '/' + originalname;
			}
			const upload = new Upload({
				client: s3,
				params: { Bucket, Key: path, Body: buffer, ContentType: mimetype },
				partSize: 5 * MB,
			});
			let isLoaded = false;
			let progressName = `progress-${originalname}`;
			if (parent) {
				progressName += parent._id;
			}
			if (size < 5 * MB) {
				setTimeout(() => {
					!isLoaded &&
						sse.send(Math.floor(Math.random() * 50) + 20, progressName);
				}, 500);
			}
			upload.on('httpUploadProgress', progress => {
				const result = Math.round((progress.loaded * 100) / progress.total);
				if (size >= 5 * MB) {
					sse.send(result, progressName);
				}
			});
			await upload.done();
			isLoaded = true;
			if (size < 5 * MB) {
				setTimeout(() => {
					sse.send(100, progressName);
				}, 0);
			}
			const type = originalname.split('.').pop();
			let filePath = '';
			if (parent) {
				filePath = parent.path ? parent.path + '/' + parent.name : parent.name;
			}
			const dbFile = new File({
				type,
				name: originalname,
				size,
				path: filePath,
				user: user._id,
				parent: parent ? parent._id : null,
			});
			user.files.push(dbFile._id);
			if (parent) {
				parent.children.push(dbFile._id);
				await parent.save();
			}
			await dbFile.save();
			await user.save();
			resolve(dbFile);
		});
	}
	deleteFile(userId, fileId) {
		return new Promise(async (resolve, reject) => {
			const user = await User.findById(userId);
			const file = await File.findOne({ _id: fileId, user: user._id });
			if (!file) {
				return reject({ message: 'File has not been founded' });
			}
			if (file.children.length) {
				return reject({ message: 'Directory is not empty' });
			}
			const path = this._getPath(file);
			if (file.type === 'dir') {
				await s3.send(new DeleteObjectCommand({ Bucket, Key: path + '/' }));
			} else {
				await s3.send(new DeleteObjectCommand({ Bucket, Key: path }));
			}
			const parentFile = await File.findById(file.parent);
			user.files = user.files.filter(
				fileId => fileId.toString() !== file._id.toString()
			);
			user.usedSpace -= file.size;
			await user.save();
			if (parentFile) {
				parentFile.children = parentFile.children.filter(
					fileId => fileId.toString() !== file._id.toString()
				);
				await parentFile.save();
			}
			await file.remove();
			resolve({ id: file._id, message: 'File has been deleted' });
		});
	}
	downloadFile(user) {
		return new Promise(async resolve => {
			const file = await File.findById(user);
			const filePath = this._getPath(file);
			const command = new GetObjectCommand({ Bucket, Key: filePath });
			const response = await s3.send(command);
			const total = response['ContentLength'];
			let diff = total;
			let progress = 0;
			response.Body.on('data', chunk => {
				diff -= chunk.length;
				const result = 100 - parseInt((diff * 100) / total);
				if (progress !== result) {
					progress = result;
					sse.send(progress, `download-${file.name}`);
				}
			});
			resolve(response);
		});
	}
	getSignedUrl(user) {
		return new Promise(async (resolve, reject) => {
			try {
				const file = await File.findById(user);
				const filePath = this._getPath(file);
				const command = new GetObjectCommand({ Bucket, Key: filePath });
				const signedUrl = await getSignedUrl(s3, command, { expiresIn: 3000 });
				resolve(signedUrl);
			} catch (e) {
				reject(e.message);
			}
		});
	}
	uploadAvatar(userId, file) {
		return new Promise(async resolve => {
			const user = await User.findById(userId);
			if (user.avatar) {
				await this.deleteAvatar(user.id);
			}
			const Key = userId + '/avatar/' + file.originalname;
			const params = new PutObjectCommand({
				Bucket,
				Key,
				Body: file.buffer,
				ContentType: file.mimetype,
			});
			await s3.send(params);
			user.avatar = file.originalname;
			const userUpdated = await user.save();
			resolve(await commonService.response(userUpdated));
		});
	}
	deleteAvatar(userId) {
		return new Promise(async (resolve, reject) => {
			const user = await User.findById(userId);
			if (!user.avatar) {
				return reject({ message: 'There is no avatar' });
			}
			const Key = userId + '/avatar/' + user.avatar;
			await s3.send(new DeleteObjectCommand({ Bucket, Key }));
			user.avatar = null;
			const userUpdated = await user.save();
			resolve(await commonService.response(userUpdated));
		});
	}
	_getPath(file) {
		const parentPath = file.path ? '/' + file.path : '';
		const filePath = file.name ? '/' + file.name : '';
		return file.user.toString() + parentPath + filePath;
	}
}

module.exports = new FileService();
