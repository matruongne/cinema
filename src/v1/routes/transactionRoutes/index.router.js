const express = require('express')
const router = express.Router()
const transactionRouter = require('./transaction.router')

router.get('/checkstatus', (req, res, next) => {
	res.status(200).json({
		status: 'success',
		message: 'api ok',
	})
})
router.use('/v1/transactions', transactionRouter)

module.exports = router
