const express = require('express')
const showtimesRouter = express.Router()
const showtimeController = require('../../controllers/showtimeControllers/showtime.controller')
const isAuth = require('../../middlewares/isAuth')
const isAdmin = require('../../middlewares/isAdmin')

showtimesRouter.use(isAuth)
showtimesRouter.use(isAdmin)

showtimesRouter.post('/new', showtimeController.addShowtime)
showtimesRouter.patch('/:showtimeId', showtimeController.updateShowtime)
showtimesRouter.delete('/:showtimeId', showtimeController.deleteShowtime)

module.exports = showtimesRouter
