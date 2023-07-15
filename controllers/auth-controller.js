const { validationResult } = require('express-validator');
const jwt = require('jsonwebtoken');
const bcryptjs = require('bcryptjs');

const User = require('../models/user-model');
const File = require('../models/file-model');
const fileService = require('../services/file-service');

class authController {
	_checkValidation(req) {
		const errors = validationResult(req);
		if (!errors.isEmpty()) {
			throw new Error(errors.array()[0].msg);
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
					? await fileService.getAvatarPath(user._id, user.avatar)
					: null,
			},
		});
	}
	async register(req, res) {
		try {
			this._checkValidation(req);
			const { firstName, lastName, email, password } = req.body;
			const candidate = await User.findOne({ email });
			if (candidate) {
				return res
					.status(401)
					.json(`User with email: ${email} already exists!`);
			}
			const hashPassword = await bcryptjs.hash(password, 4);
			const user = await User.create({
				firstName,
				lastName,
				email,
				password: hashPassword,
			});
			await fileService.createDir(new File({ user: user._id, name: '' }));
			this._response(user, res);
		} catch (e) {
			res.status(401).json(e.message);
		}
	}
	async login(req, res) {
		try {
			this._checkValidation(req);
			const { email, password } = req.body;
			const user = await User.findOne({ email });
			if (!user) {
				return res
					.status(401)
					.json(`There is no user with this email: ${email}`);
			}
			const isCorrectPassword = await bcryptjs.compare(password, user.password);
			if (!isCorrectPassword) {
				return res.status(401).json('Incorrect Password, please try again');
			}
			this._response(user, res);
		} catch (e) {
			res.status(401).json(e.message);
		}
	}
	async auth(req, res) {
		try {
			const user = await User.findById(req.user.id);
			if (!user) {
				return res.status(401).json('Not authorized');
			}
			this._response(user, res);
		} catch (error) {
			res.status(401).json(error.message);
		}
	}
	async getUsers(req, res) {
		try {
			res.json([1, 2, 3]);
		} catch (error) {
			res.status(401).json(error.message);
		}
	}
}

module.exports = new authController();