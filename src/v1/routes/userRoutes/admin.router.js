const express = require('express')
const router = express.Router()
const adminController = require('../../controllers/userControllers/admin.controller')
const isAuth = require('../../middlewares/isAuth')
const isAdmin = require('../../middlewares/isAdmin')

router.use(isAuth)
router.use(isAdmin)

router.get('/users', adminController.getlistUsers)
router.get('/roles', adminController.getAllRole)
router.patch('/users/:targetUserId/role/', adminController.updateUserRole)
router.post('/role', adminController.createRole)
router.patch('/role/:id', adminController.updateRole)
router.delete('/role/:id', adminController.deleteRole)

module.exports = router
