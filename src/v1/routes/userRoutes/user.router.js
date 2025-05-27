const express = require('express')
const router = express.Router()
const userController = require('../../controllers/userControllers/user.controller')
const isAuth = require('../../middlewares/isAuth')

router.post('/request-password-reset', userController.requestPasswordReset)
router.post('/reset-password', userController.resetPassword)
router.post('/new-password', userController.createNewPassword)

router.use(isAuth)

router.get('/profile', userController.getUserById)
router.patch('/profile', userController.updateUser)
router.patch('/profile/address', userController.updateUserAddress)
router.patch('/profile/password', userController.updatePassword)
router.delete('/profile', userController.deleteUser)

module.exports = router
