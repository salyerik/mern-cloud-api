const Router = require('express');
const auth = require('../middlewares/auth-mw');
const {
	registerValidation,
	loginValidation,
} = require('../services/validation-service');
const authController = require('../controllers/auth-controller');
const router = new Router();

router.get('/', auth, authController.auth.bind(authController));
router.post(
	'/register',
	registerValidation,
	authController.register.bind(authController)
);
router.post(
	'/login',
	loginValidation,
	authController.login.bind(authController)
);

module.exports = router;
