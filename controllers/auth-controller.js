const { validationResult } = require('express-validator');
const jwt = require('jsonwebtoken');
const bcryptjs = require('bcryptjs');
const uuid = require('uuid');

const User = require('../models/user-model');
const File = require('../models/file-model');
const fileService = require('../services/file-service');
const mailService = require('../services/mail-service');
const { origin } = require('../config/config');

class AuthController {
	async register(req, res) {
		try {
			this._checkValidation(req);
			const { firstName, lastName, email, password } = req.body;
			const candidate = await User.findOne({ email });
			if (candidate) {
				return res
					.status(401)
					.json(`User with email: ${email} already exists.`);
			}
			const hashPassword = await bcryptjs.hash(password, 4);
			const activationLink = uuid.v4();
			const user = await User.create({
				firstName,
				lastName,
				email,
				password: hashPassword,
				activationLink,
			});
			await mailService.sendActivationMail(email, activationLink);
			const userFolder = new File({ user: user._id, name: '' });
			await fileService.createDir(userFolder);
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
			const isCorrectPassword = bcryptjs.compareSync(password, user.password);
			if (!isCorrectPassword) {
				return res
					.status(401)
					.json('Incorrect Password, please enter the correct one');
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
	async activate(req, res) {
		try {
			const { link } = req.params;
			const user = await User.findOne({ activationLink: link });
			if (!user) {
				throw ApiError.BadRequest('User not found');
			}
			user.isMailConfirmed = true;
			await user.save();
			res.redirect(origin + '/mern-cloud/profile');
		} catch (error) {
			res.status(500).json(error.message);
		}
	}
	_checkValidation(req) {
		const errors = validationResult(req);
		if (!errors.isEmpty()) {
			throw new Error(errors.array()[0].msg);
		}
	}
	async _response(user, res) {
		res.json({
			token: jwt.sign({ id: user._id }, process.env.SECRET_KEY, {
				expiresIn: '28hr',
			}),
			user: {
				firstName: user.firstName,
				lastName: user.lastName,
				isMailConfirmed: user.isMailConfirmed,
				avatar: user.avatar
					? await fileService.getAvatarPath(user._id, user.avatar)
					: null,
			},
		});
	}
}

module.exports = new AuthController();
