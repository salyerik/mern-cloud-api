const { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } = require('@aws-sdk/client-s3')
const { Upload } = require('@aws-sdk/lib-storage')
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner')
const Bucket = process.env.AWS_BUCKET
const s3 = new S3Client()

class FileService {
	createDir(file) {
		const Key = this.getPath(file) + '/'
		const params = { Bucket, Key }
		return new Promise(async (resolve, reject) => {
			try {
				s3.send(new GetObjectCommand(params))
					.then(() => {
						reject('Folder already exists')
					})
					.catch(async () => {
						await s3.send(new PutObjectCommand(params))
						resolve()
					})
			} catch (error) {
				console.log(error.message)
				return reject('Folder creating error')
			}
		})
	}
	uploadFile(file, parent, userId, cb) {
		return new Promise(async (resolve, reject) => {
			try {
				const { originalname, buffer, mimetype } = file
				let path = null
				if (parent) {
					path = userId + '/' + parent.path + '/' + parent.name + '/' + originalname
				} else {
					path = userId + '/' + originalname
				}
				const upload = new Upload({
					client: s3,
					params: { Bucket, Key: path, Body: buffer, ContentType: mimetype },
					partSize: 1024 * 1024 * 5
				})
				upload.on('httpUploadProgress', progress => cb(Math.round((progress.loaded * 100) / progress.total)))
				await upload.done()
				resolve()
			} catch (error) {
				console.log(error.message)
				reject(error.message)
			}
		})
	}
	deleteFile(file) {
		const path = this.getPath(file)
		return new Promise(async (resolve, reject) => {
			try {
				if (file.type === 'dir') {
					await s3.send(new DeleteObjectCommand({ Bucket, Key: path + '/' }))
				} else {
					await s3.send(new DeleteObjectCommand({ Bucket, Key: path }))
				}
				resolve({ message: 'File has been deleted' })
			} catch (e) {
				reject({ message: 'Directory is not empty' })
			}
		})
	}
	downloadFile(file) {
		return new Promise(async (resolve, reject) => {
			try {
				const path = this.getPath(file)
				resolve(await getSignedUrl(s3, new GetObjectCommand({ Bucket, Key: path }), { expiresIn: 600 }))
			} catch (e) {
				reject(e.message)
			}
		})
	}
	uploadAvatar(userId, file) {
		return new Promise(async (resolve, reject) => {
			try {
				const Key = userId + '/avatar/' + file.originalname
				resolve(await s3.send(new PutObjectCommand({ Bucket, Key, Body: file.buffer, ContentType: file.mimetype })))
			} catch (error) {
				reject(error)
			}
		})
	}
	deleteAvatar(userId, fileName) {
		return new Promise(async (resolve, reject) => {
			try {
				const Key = userId + '/avatar/' + fileName
				resolve(await s3.send(new DeleteObjectCommand({ Bucket, Key })))
			} catch (error) {
				reject(error.message)
			}
		})
	}
	async getAvatarPath(userId, avatarName) {
		return await getSignedUrl(s3, new GetObjectCommand({ Bucket, Key: userId + '/avatar/' + avatarName }), {
			expiresIn: 600
		})
	}
	getPath(file) {
		const parentPath = file.path ? '/' + file.path : ''
		const filePath = file.name ? '/' + file.name : ''
		return file.user.toString() + parentPath + filePath
	}
}

module.exports = new FileService()
