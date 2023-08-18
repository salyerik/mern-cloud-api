const Router = require('express');
const auth = require('../middlewares/auth-mw');
const validation = require('../services/validation-service');
const authController = require('../controllers/auth-controller');
const router = new Router();

router.post(
	'/register',
	validation.registerValidation,
	authController.register
);
router.post('/login', validation.loginValidation, authController.login);
router.get('/', auth, authController.auth);
router.get('/activate/:link', authController.activate);

module.exports = router;
