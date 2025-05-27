const express = require('express')
const bookingsRouter = express.Router()
const bookingController = require('../../controllers/bookingControllers/booking.controller')
const isAuth = require('../../middlewares/isAuth')
const isAdmin = require('../../middlewares/isAdmin')

bookingsRouter.use(isAuth)

bookingsRouter.post('/hold/:showtimeId', bookingController.holdSeats)
bookingsRouter.post('/remove-hold/:showtimeId', bookingController.removeHoldSeat)
bookingsRouter.post('/new/:showtimeId', bookingController.createBooking)
bookingsRouter.post('/cancel/:bookingId', bookingController.cancelBooking)
bookingsRouter.get('/', bookingController.getBookings)
bookingsRouter.get('/all/:showtimeId', bookingController.getBookingsByShowtime)
bookingsRouter.get('/own/', bookingController.getBookingHistory)

bookingsRouter.use(isAdmin)
bookingsRouter.post('/confirm/:bookingId', bookingController.confirmBooking)

module.exports = bookingsRouter
