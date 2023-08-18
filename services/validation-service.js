const { check, validationResult } = require('express-validator');

const registerValidation = [
	check('firstName', 'First name cannot be shorter than 2 letters').isLength({
		min: 2,
		max: 22,
	}),
	check('lastName', 'Last name cannot be shorter than 2 letters').isLength({
		min: 2,
		max: 22,
	}),
	check('email', 'Invalid E-mail').isEmail(),
	check('password', 'Password length must be min 6, max 20 letters').isLength({
		min: 6,
		max: 20,
	}),
];

const loginValidation = [
	check('email', 'Invalid E-mail').isEmail(),
	check('password', 'Incorrect Password').isLength({ min: 6, max: 20 }),
];

module.exports = { validationResult, registerValidation, loginValidation };
