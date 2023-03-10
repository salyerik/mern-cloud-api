const https = require('https')
const jwt = require('jsonwebtoken')
const File = require('../models/fileModel')
const User = require('../models/userModel')
const fileService = require('../services/fileService')
const sse = require('../sse')

class FileController {
	async createDir(req, res) {
		try {
			const { name, type, parent } = req.body
			const user = await User.findById(req.user.id)
			const parentFile = await File.findOne({ _id: parent })
			const file = new File({ name, type, parent, user: user._id })
			if (!parentFile) {
				file.path = ''
				await fileService.createDir(file)
			} else {
				file.path = `${parentFile.path ? parentFile.path + '/' : ''}${
					parentFile.name
				}`
				parentFile.children.push(file._id)
				await parentFile.save()
				await fileService.createDir(file)
			}
			user.files.push(file._id)
			await user.save()
			const createdFile = await file.save()
			res.json(createdFile)
		} catch (error) {
			res.status(400).json(error)
		}
	}
	async getFiles(req, res) {
		try {
			const { sort, parent } = req.query
			let files
			switch (sort) {
				case 'name':
					files = await File.find({ parent, user: req.user.id }).sort({
						name: 1
					})
					break
				case 'type':
					files = await File.find({ parent, user: req.user.id }).sort({
						type: 1
					})
					break
				case 'date':
					files = await File.find({ parent, user: req.user.id }).sort({
						date: -1
					})
					break
				case 'size':
					files = await File.find({ parent, user: req.user.id }).sort({
						size: -1
					})
					break
				default:
					files = await File.find({ parent, user: req.user.id })
			}
			res.json(files)
		} catch (error) {
			res.status(500).json({ message: error.message })
		}
	}
	async existCheck(req, res) {
		try {
			const { name, parent } = req.query
			const file = await File.findOne({
				user: req.user.id,
				name,
				parent: parent || null
			})
			res.json(!!file)
		} catch (error) {
			res.status(500).json(error.message)
		}
	}
	async uploadFile(req, res) {
		try {
			const { originalname, size } = req.file
			const parent = await File.findById(req.body.parent)
			const user = await User.findById(req.user.id)
			if (user.usedSpace + size > user.diskSpace) {
				return res.status(500).json('Not enough disk space')
			}
			user.usedSpace += size
			await fileService.uploadFile(req.file, parent, user.id, progress => {
				if (size >= 1024 * 1024 * 5) {
					sse.send(progress, `progress-${originalname}`)
				}
			})
			const type = originalname.split('.').pop()
			let filePath = ''
			if (parent) {
				filePath = parent.path + '/' + parent.name
			}
			const dbFile = new File({
				type,
				name: originalname,
				size: size,
				path: filePath,
				user: user._id,
				parent: parent ? parent._id : null
			})
			user.files.push(dbFile._id)
			await dbFile.save()
			await user.save()
			res.json(dbFile)
		} catch (error) {
			res.status(500).json(error.message)
		}
	}
	async downloadFile(req, res) {
		try {
			const signedUrl = await fileService.downloadFile(
				await File.findById(req.query.id)
			)
			console.log(signedUrl)
			https.get(signedUrl, file => {
				file.pipe(res)
			})
		} catch (e) {
			res.status(500).json(e.message)
		}
	}
	async deleteFile(req, res) {
		try {
			const user = await User.findById(req.user.id)
			const file = await File.findOne({ _id: req.query.id, user: user._id })
			if (!file) {
				return res.status(500).json('File has not founded')
			}
			if (file.children.length) {
				return res.status(400).json('Directory is not empty')
			}
			const response = await fileService.deleteFile(file)
			const parent = await File.findById(file.parent)
			user.files = user.files.filter(
				fileId => fileId.toString() !== file._id.toString()
			)
			await user.save()
			if (parent) {
				parent.children = parent.children.filter(
					fileId => fileId.toString() !== file._id.toString()
				)
				await parent.save()
			}
			await file.remove()
			res.json(response)
		} catch (e) {
			res.status(400).json(e.message)
		}
	}
	async searchFiles(req, res) {
		try {
			const { search } = req.query
			const files = await File.find({ user: req.user.id })
			res.json(files.filter(file => file.name.includes(search)))
		} catch (e) {
			res.status(400).json(e.message)
		}
	}
	async uploadAvatar(req, res) {
		try {
			const user = await User.findById(req.user.id)
			if (user.avatar) {
				await fileService.deleteAvatar(user.id, user.avatar)
			}
			await fileService.uploadAvatar(user.id, req.file)
			user.avatar = req.file.originalname
			const userUpdated = await user.save()
			res.json({
				token: jwt.sign({ id: userUpdated._id }, process.env.SECRET_KEY, {
					expiresIn: '1hr'
				}),
				user: {
					firstName: userUpdated.firstName,
					lastName: userUpdated.lastName,
					avatar: userUpdated.avatar
						? await fileService.getAvatarPath(
								userUpdated.id,
								userUpdated.avatar
						  )
						: null
				}
			})
		} catch (error) {
			res.status(500).json(error.message)
		}
	}
	async deleteAvatar(req, res) {
		try {
			const user = await User.findById(req.user.id)
			if (user.avatar) {
				fileService.deleteAvatar(user.id, user.avatar)
				user.avatar = null
				const userUpdated = await user.save()
				res.json({
					token: jwt.sign({ id: userUpdated._id }, process.env.SECRET_KEY, {
						expiresIn: '1hr'
					}),
					user: {
						firstName: userUpdated.firstName,
						lastName: userUpdated.lastName,
						avatar: userUpdated.avatar
							? await fileService.getAvatarPath(
									userUpdated.id,
									userUpdated.avatar
							  )
							: null
					}
				})
			} else {
				res.json(user)
			}
		} catch (error) {
			res.status(500).json(error.message)
		}
	}
}

module.exports = new FileController()
