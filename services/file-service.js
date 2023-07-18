const {
	S3Client,
	PutObjectCommand,
	GetObjectCommand,
	DeleteObjectCommand,
} = require('@aws-sdk/client-s3');
const { Upload } = require('@aws-sdk/lib-storage');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');
const sse = require('../services/sse');
const { MB } = require('../config/config');

const s3 = new S3Client();
const Bucket = process.env.AWS_BUCKET;

class FileService {
	createDir(file) {
		return new Promise(async (resolve, reject) => {
			const Key = this._getPath(file) + '/';
			const params = { Bucket, Key };
			try {
				await s3.send(new GetObjectCommand(params));
				reject('Folder already exists');
			} catch (e) {
				await s3.send(new PutObjectCommand(params));
				resolve();
			}
		});
	}
	uploadFile(file, parent, userId) {
		return new Promise(async (resolve, reject) => {
			try {
				if (file.size > 10 * MB) {
					return reject({ message: 'File size must be less than 10 MB' });
				}
				const { originalname, buffer, mimetype } = file;
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
				if (file.size < 5 * MB) {
					setTimeout(() => {
						!isLoaded &&
							sse.send(Math.floor(Math.random() * 50) + 20, progressName);
					}, 500);
				}
				upload.on('httpUploadProgress', progress => {
					const result = Math.round((progress.loaded * 100) / progress.total);
					if (file.size >= 5 * MB) {
						sse.send(result, progressName);
					}
				});
				await upload.done();
				isLoaded = true;
				if (file.size < 5 * MB) {
					setTimeout(() => {
						sse.send(100, progressName);
					}, 0);
				}
				resolve();
			} catch (error) {
				reject(error.message);
			}
		});
	}
	deleteFile(file) {
		const path = this._getPath(file);
		return new Promise(async (resolve, reject) => {
			try {
				if (file.type === 'dir') {
					await s3.send(new DeleteObjectCommand({ Bucket, Key: path + '/' }));
				} else {
					await s3.send(new DeleteObjectCommand({ Bucket, Key: path }));
				}
				resolve({ message: 'File has been deleted' });
			} catch (e) {
				reject({ message: 'Directory is not empty' });
			}
		});
	}
	downloadFile(file) {
		return new Promise(async (resolve, reject) => {
			try {
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
			} catch (e) {
				reject(e.message);
			}
		});
	}
	getSignedUrl(file) {
		return new Promise(async (resolve, reject) => {
			try {
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
		return new Promise(async (resolve, reject) => {
			try {
				const Key = userId + '/avatar/' + file.originalname;
				const params = new PutObjectCommand({
					Bucket,
					Key,
					Body: file.buffer,
					ContentType: file.mimetype,
				});
				resolve(await s3.send(params));
			} catch (error) {
				reject(error);
			}
		});
	}
	deleteAvatar(userId, fileName) {
		return new Promise(async (resolve, reject) => {
			try {
				const Key = userId + '/avatar/' + fileName;
				resolve(await s3.send(new DeleteObjectCommand({ Bucket, Key })));
			} catch (error) {
				reject(error.message);
			}
		});
	}
	async getAvatarPath(userId, avatarName) {
		const command = new GetObjectCommand({
			Bucket,
			Key: userId + '/avatar/' + avatarName,
		});
		return await getSignedUrl(s3, command, { expiresIn: 600 });
	}
	_getPath(file) {
		const parentPath = file.path ? '/' + file.path : '';
		const filePath = file.name ? '/' + file.name : '';
		return file.user.toString() + parentPath + filePath;
	}
}

module.exports = new FileService();
