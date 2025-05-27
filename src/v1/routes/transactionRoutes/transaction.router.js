const express = require('express')
const router = express.Router()
const transactionController = require('../../controllers/transactionControllers/transaction.controller')

router.post('/', transactionController.createTransaction)

router.get('/', transactionController.getAllTransactions)

router.get('/:transaction_id', transactionController.getTransactionById)

router.patch('/:transaction_id/status', transactionController.updateTransactionStatus)

module.exports = router
