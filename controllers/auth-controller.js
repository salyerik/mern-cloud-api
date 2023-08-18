const { validationResult } = require('express-validator');
const authService = require('../services/auth-service');
const { origin } = require('../config/config');

class AuthController {
	async register(req, res) {
		try {
			const errors = validationResult(req);
			if (!errors.isEmpty()) throw new Error(errors.array()[0].msg);
			const createdUser = await authService.register(req.body);
			res.json(createdUser);
		} catch (e) {
			res.status(401).json(e.message);
		}
	}
	async login(req, res) {
		try {
			const errors = validationResult(req);
			if (!errors.isEmpty()) throw new Error(errors.array()[0].msg);
			const loginUser = await authService.login(req.body);
			res.json(loginUser);
		} catch (e) {
			res.status(401).json(e.message);
		}
	}
	async auth(req, res) {
		try {
			const authUser = await authService.auth(req.user.id);
			res.json(authUser);
		} catch (error) {
			res.status(401).json(error.message);
		}
	}
	async activate(req, res) {
		try {
			await authService.activate(req.params.link);
			res.redirect(origin + '/mern-cloud/profile');
		} catch (error) {
			res.status(500).json(error.message);
		}
	}
}

module.exports = new AuthController();
