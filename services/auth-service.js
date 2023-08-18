const bcryptjs = require('bcryptjs');
const uuid = require('uuid');

const mailService = require('./mail-service');
const fileService = require('./file-service');
const commonService = require('./common-service');
const User = require('../models/user-model');
const File = require('../models/file-model');

class AuthService {
	async register(body) {
		const { firstName, lastName, email, password } = body;
		const candidate = await User.findOne({ email });
		if (candidate) {
			throw new Error(`User with email: ${email} already exists.`);
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
		await fileService.createUserDir(userFolder);
		return await commonService.response(user);
	}
	async login(body) {
		const { email, password } = body;
		const user = await User.findOne({ email });
		if (!user) {
			throw new Error(`There is no user with this email: ${email}`);
		}
		const isCorrectPassword = bcryptjs.compareSync(password, user.password);
		if (!isCorrectPassword) {
			throw new Error('Incorrect Password, please enter the correct one');
		}
		return await commonService.response(user);
	}
	async auth(userId) {
		const user = await User.findById(userId);
		if (!user) {
			throw new Error('Not authorized');
		}
		return await commonService.response(user);
	}
	async activate(link) {
		const user = await User.findOne({ activationLink: link });
		if (!user) {
			throw new Error('User not found');
		}
		user.isMailConfirmed = true;
		await user.save();
	}
}

module.exports = new AuthService();
