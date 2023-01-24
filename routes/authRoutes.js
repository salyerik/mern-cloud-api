const Router = require('express')
const auth = require('./../middlewares/authMiddleware')
const { registrationValidation, loginValidation } = require('../services/validation')
const authController = require('../controllers/authController')
const router = new Router()

router.post('/registration', registrationValidation, authController.registration.bind(authController))
router.post('/login', loginValidation, authController.login.bind(authController))
router.get('/', auth, authController.auth.bind(authController))

module.exports = router
