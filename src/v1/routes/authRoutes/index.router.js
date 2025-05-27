const express = require('express')
const router = express.Router()
const authRouter = require('./auth.router')
router.get('/checkstatus', (req, res, next) => {
	res.status(200).json({
		status: 'success',
		message: 'api ok',
	})
})
router.use('/v1/auth', authRouter)

module.exports = router
