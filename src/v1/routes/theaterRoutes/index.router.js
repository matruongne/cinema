const express = require('express')
const router = express.Router()
const theatersRouter = require('./theater.router')
const screensRouter = require('./screen.router')
const seatsRouter = require('./seat.router')

router.get('/checkstatus', (req, res, next) => {
	res.status(200).json({
		status: 'success',
		message: 'api ok',
	})
})
router.use('/v1/theaters', theatersRouter)
router.use('/v1/screens', screensRouter)
router.use('/v1/seats', seatsRouter)

module.exports = router
