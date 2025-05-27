const express = require('express')
const entertainmentRouter = express.Router()
const EntertainmentController = require('../../controllers/entertainmentControllers/entertainment.controller')
const isAuth = require('../../middlewares/isAuth')
const isAdmin = require('../../middlewares/isAdmin')

entertainmentRouter.get('/', EntertainmentController.getAll)
entertainmentRouter.get('/:id', EntertainmentController.getById)
entertainmentRouter.use(isAuth)
entertainmentRouter.use(isAdmin)

entertainmentRouter.post('/', EntertainmentController.create)
entertainmentRouter.patch('/:id', EntertainmentController.update)
entertainmentRouter.delete('/:id', EntertainmentController.delete)

module.exports = entertainmentRouter
