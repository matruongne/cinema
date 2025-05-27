const express = require('express')
const router = express.Router()
const authController = require('../../controllers/authControllers/auth.controller')
const isAuth = require('../../middlewares/isAuth')

router.post('/register', authController.register)
router.post('/verify', authController.verifyAccount)
router.post('/resend-verification-code', authController.resendVerificationCode)
router.post('/login', authController.login)
router.get('/refresh-token', authController.refreshToken)
router.get('/check', authController.checkAuth)

router.use(isAuth)
router.get('/logout', authController.logout)

module.exports = router
