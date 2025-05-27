const transactionService = require('../../services/transactionServices/transaction.service')

const createTransaction = async (req, res) => {
	try {
		const transaction = await transactionService.createTransaction(req.body)
		res.status(201).json(transaction)
	} catch (err) {
		res.status(500).json({ message: err.message })
	}
}

const getAllTransactions = async (req, res) => {
	try {
		const { search, sort, order, page, limit, status, method } = req.query

		const result = await transactionService.getAllTransactions({
			search,
			sort,
			order,
			page: Number(page),
			limit: Number(limit),
			status,
			method,
		})

		if (!result) {
			return res.status(404).json({ message: 'Transactions not found.' })
		}

		res.status(200).json(result)
	} catch (error) {
		console.error('[Get Transactions] Error:', error)
		res.status(500).json({ message: error.message || 'Failed to get transactions' })
	}
}

const getTransactionById = async (req, res) => {
	try {
		const transaction = await transactionService.getTransactionById(req.params.transaction_id)
		if (!transaction) return res.status(404).json({ message: 'Not found' })
		res.json(transaction)
	} catch (err) {
		res.status(500).json({ message: err.message })
	}
}

const updateTransactionStatus = async (req, res) => {
	try {
		const { status, failure_reason } = req.body
		const transaction = await transactionService.updateTransactionStatus(
			req.params.transaction_id,
			status,
			failure_reason
		)
		res.json(transaction)
	} catch (err) {
		res.status(500).json({ message: err.message })
	}
}

module.exports = {
	createTransaction,
	getAllTransactions,
	getTransactionById,
	updateTransactionStatus,
}
