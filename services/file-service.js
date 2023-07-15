const {
	S3Client,
	PutObjectCommand,
	GetObjectCommand,
	DeleteObjectCommand,
} = require('@aws-sdk/client-s3');
const { Upload } = require('@aws-sdk/lib-storage');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');
const Bucket = process.env.AWS_BUCKET;
const s3 = new S3Client();
const { MB } = require('../config/config');
const sse = require('../services/sse');

class FileService {
	getPath(file) {
		const parentPath = file.path ? '/' + file.path : '';
		const filePath = file.name ? '/' + file.name : '';
		return file.user.toString() + parentPath + filePath;
	}
	createDir(file) {
		const Key = this.getPath(file) + '/';
		const params = { Bucket, Key };
		return new Promise(async (resolve, reject) => {
			try {
				s3.send(new GetObjectCommand(params))
					.then(() => {
						reject('Folder already exists');
					})
					.catch(async () => {
						await s3.send(new PutObjectCommand(params));
						resolve();
					});
			} catch (error) {
				console.log(error.message);
				return reject('Folder creating error');
			}
		});
	}
	uploadFile(file, parent, userId) {
		return new Promise(async (resolve, reject) => {
			try {
				const { originalname, buffer, mimetype } = file;
				let path = null;
				if (parent) {
					path = parent.path
						? userId +
						  '/' +
						  parent.path +
						  '/' +
						  parent.name +
						  '/' +
						  originalname
						: userId + '/' + parent.name + '/' + originalname;
				} else {
					path = userId + '/' + originalname;
				}
				const upload = new Upload({
					client: s3,
					params: { Bucket, Key: path, Body: buffer, ContentType: mimetype },
					partSize: 5 * MB,
				});
				let isLoaded = false;
				if (file.size < 5 * MB) {
					setTimeout(() => {
						!isLoaded &&
							sse.send(
								Math.floor(Math.random() * 50) + 20,
								`progress-${originalname}`,
							);
					}, 500);
				}
				upload.on('httpUploadProgress', progress => {
					const result = Math.round((progress.loaded * 100) / progress.total);
					if (file.size >= 5 * MB) {
						sse.send(result, `progress-${originalname}`);
					}
				});
				await upload.done();
				isLoaded = true;
				if (file.size < 5 * MB) {
					setTimeout(() => {
						sse.send(100, `progress-${originalname}`);
					}, 0);
				}
				resolve();
			} catch (error) {
				reject(error.message);
			}
		});
	}
	deleteFile(file) {
		const path = this.getPath(file);
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
				const filePath = this.getPath(file);
				const command = new GetObjectCommand({ Bucket, Key: filePath });
				const response = await s3.send(command);
				resolve(response);
			} catch (e) {
				reject(e.message);
			}
		});
	}
	getSignedUrl(file) {
		return new Promise(async (resolve, reject) => {
			try {
				const filePath = this.getPath(file);
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
				resolve(
					await s3.send(
						new PutObjectCommand({
							Bucket,
							Key,
							Body: file.buffer,
							ContentType: file.mimetype,
						}),
					),
				);
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
		return await getSignedUrl(
			s3,
			new GetObjectCommand({ Bucket, Key: userId + '/avatar/' + avatarName }),
			{
				expiresIn: 600,
			},
		);
	}
}

module.exports = new FileService();
