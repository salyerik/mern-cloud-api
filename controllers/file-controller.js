const fileService = require('../services/file-service');

class FileController {
	async getFiles(req, res) {
		try {
			const files = await fileService.getFiles(
				req.user.id,
				req.query.sort,
				req.query.parent
			);
			res.json(files);
		} catch (error) {
			res.status(500).json(error.message);
		}
	}
	async createDir(req, res) {
		try {
			const createdFile = await fileService.createDir(
				req.user.id,
				req.body.parent,
				req.body.name
			);
			res.json(createdFile);
		} catch (error) {
			res.status(400).json(error);
		}
	}
	async existCheck(req, res) {
		try {
			const response = await fileService.existCheck(
				req.user.id,
				req.query.name,
				req.query.parent
			);
			res.json(response);
		} catch (error) {
			res.status(500).json(error.message);
		}
	}
	async uploadFile(req, res) {
		try {
			const dbFile = await fileService.uploadFile(
				req.file,
				req.body.parent,
				req.user.id
			);
			res.json(dbFile);
		} catch (error) {
			res.status(500).json(error.message);
		}
	}
	async downloadFile(req, res) {
		try {
			const fileStream = await fileService.downloadFile(req.query.id);
			fileStream.Body.pipe(res);
		} catch (e) {
			res.status(500).end(e.message);
		}
	}
	async getSignedFileUrl(req, res) {
		try {
			const signedUrl = await fileService.getSignedUrl(req.query.id);
			res.json(signedUrl);
		} catch (e) {
			res.status(500).end(e.message);
		}
	}
	async deleteFile(req, res) {
		try {
			const response = await fileService.deleteFile(req.user.id, req.query.id);
			res.json({ ...response });
		} catch (e) {
			res.status(400).json(e.message);
		}
	}
	async searchFiles(req, res) {
		try {
			const files = await fileService.searchFiles(
				req.user.id,
				req.query.search
			);
			res.json(files);
		} catch (e) {
			res.status(400).json(e.message);
		}
	}
	async uploadAvatar(req, res) {
		try {
			const response = await fileService.uploadAvatar(req.user.id, req.file);
			res.json(response);
		} catch (error) {
			res.status(500).json(error.message);
		}
	}
	async deleteAvatar(req, res) {
		try {
			const response = await fileService.deleteAvatar(req.user.id);
			res.json(response);
		} catch (error) {
			res.status(500).json(error.message);
		}
	}
}

module.exports = new FileController();
