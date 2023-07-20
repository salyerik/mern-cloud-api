const Router = require('express');
const auth = require('../middlewares/auth-mw');
const validation = require('../services/validation-service');
const authController = require('../controllers/auth-controller');
const router = new Router();

router.get('/', auth, authController.auth.bind(authController));
router.post(
	'/register',
	validation.registerValidation,
	authController.register.bind(authController)
);
router.post(
	'/login',
	validation.loginValidation,
	authController.login.bind(authController)
);

module.exports = router;
