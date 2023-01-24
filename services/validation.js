const { check, validationResult } = require('express-validator')

const registrationValidation = [
	check('firstName', 'Invalid First Name').isLength({ min: 2, max: 22 }),
	check('lastName', 'Invalid Last Name').isLength({ min: 2, max: 22 }),
	check('email', 'Invalid E-mail').isEmail(),
	check('password', 'Password length must be min: 6, max: 15 letters').isLength({ min: 6, max: 12 })
]

const loginValidation = [
	check('email', 'Invalid E-mail').isEmail(),
	check('password', 'Invalid Password').isLength({ min: 6, max: 12 })
]

module.exports = { validationResult, registrationValidation, loginValidation }
