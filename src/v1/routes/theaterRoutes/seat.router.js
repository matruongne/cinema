const express = require('express')
const seatsRouter = express.Router()
const seatController = require('../../controllers/theaterControllers/seat.controller')
const isAuth = require('../../middlewares/isAuth')
const isAdmin = require('../../middlewares/isAdmin')

seatsRouter.get('/', seatController.getSeatsByScreen)
seatsRouter.get('/:seatId', seatController.getSeatById)

seatsRouter.use(isAuth)
seatsRouter.use(isAdmin)

seatsRouter.post('/new', seatController.createSeatsBatch)
seatsRouter.patch('/:seatId', seatController.updateSeat)
seatsRouter.delete('/:seatId', seatController.deleteSeat)

module.exports = seatsRouter
