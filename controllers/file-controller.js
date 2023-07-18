const jwt = require('jsonwebtoken');
const File = require('../models/file-model');
const User = require('../models/user-model');
const fileService = require('../services/file-service');

class FileController {
	async createDir(req, res) {
		try {
			const { name, parent } = req.body;
			const user = await User.findById(req.user.id);
			const file = new File({ name, type: 'dir', parent, user: user._id });
			if (parent) {
				const parentFile = await File.findOne({ _id: parent });
				file.path = `${parentFile.path ? parentFile.path + '/' : ''}${
					parentFile.name
				}`;
				parentFile.children.push(file._id);
				await parentFile.save();
				await fileService.createDir(file);
			} else {
				file.path = '';
				await fileService.createDir(file);
			}
			user.files.push(file._id);
			await user.save();
			const createdFile = await file.save();
			res.json(createdFile);
		} catch (error) {
			res.status(400).json(error);
		}
	}
	async getFiles(req, res) {
		try {
			const { sort, parent } = req.query;
			const files = await File.find({ parent, user: req.user.id }).sort({
				[sort]: 1,
			});
			res.json(files);
		} catch (error) {
			res.status(500).json({ message: error.message });
		}
	}
	async existCheck(req, res) {
		try {
			const { name, parent } = req.query;
			const file = await File.findOne({
				user: req.user.id,
				name,
				parent: parent || null,
			});
			res.json(!!file);
		} catch (error) {
			res.status(500).json(error.message);
		}
	}
	async uploadFile(req, res) {
		try {
			const { originalname, size } = req.file;
			const parent = await File.findById(req.body.parent);
			const user = await User.findById(req.user.id);
			if (user.usedSpace + size > user.diskSpace) {
				return res.status(500).json('Not enough disk space');
			}
			user.usedSpace += size;
			await fileService.uploadFile(req.file, parent, user.id);
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
			res.json(dbFile);
		} catch (error) {
			res.status(500).json(error.message);
		}
	}
	async downloadFile(req, res) {
		try {
			const file = await File.findById(req.query.id);
			const fileStream = await fileService.downloadFile(file);
			fileStream.Body.pipe(res);
		} catch (e) {
			res.status(500).end(e.message);
		}
	}
	async getSignedFileUrl(req, res) {
		try {
			const file = await File.findById(req.query.id);
			const signedUrl = await fileService.getSignedUrl(file);
			res.json(signedUrl);
		} catch (e) {
			res.status(500).end(e.message);
		}
	}
	async deleteFile(req, res) {
		try {
			const user = await User.findById(req.user.id);
			const file = await File.findOne({ _id: req.query.id, user: user._id });
			if (!file) {
				return res.status(500).json('File has not been founded');
			}
			if (file.children.length) {
				return res.status(400).json('Directory is not empty');
			}
			const response = await fileService.deleteFile(file);
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
			res.json(response);
		} catch (e) {
			res.status(400).json(e.message);
		}
	}
	async searchFiles(req, res) {
		try {
			const { search } = req.query;
			const files = await File.find({ user: req.user.id });
			res.json(files.filter(file => file.name.includes(search)));
		} catch (e) {
			res.status(400).json(e.message);
		}
	}
	async uploadAvatar(req, res) {
		try {
			const user = await User.findById(req.user.id);
			if (user.avatar) {
				await fileService.deleteAvatar(user.id, user.avatar);
			}
			await fileService.uploadAvatar(user.id, req.file);
			user.avatar = req.file.originalname;
			const userUpdated = await user.save();
			this._response(userUpdated, res);
		} catch (error) {
			res.status(500).json(error.message);
		}
	}
	async deleteAvatar(req, res) {
		try {
			const user = await User.findById(req.user.id);
			if (user.avatar) {
				fileService.deleteAvatar(user.id, user.avatar);
				user.avatar = null;
				const userUpdated = await user.save();
				this._response(userUpdated, res);
			} else {
				res.json(user);
			}
		} catch (error) {
			res.status(500).json(error.message);
		}
	}
	async _response(user, res) {
		res.json({
			token: jwt.sign({ id: user._id }, process.env.SECRET_KEY, {
				expiresIn: '1hr',
			}),
			user: {
				firstName: user.firstName,
				lastName: user.lastName,
				avatar: user.avatar
					? await fileService.getAvatarPath(user.id, user.avatar)
					: null,
			},
		});
	}
}

module.exports = new FileController();
