const { Op } = require('sequelize')
const Booking = require('../../models/booking.model')
const Transaction = require('../../models/transaction.model')
const UserWallet = require('../../models/userWallet.model')
const User = require('../../models/user.model')

const createTransaction = async data => {
	const transaction = await Transaction.create(data)
	return transaction
}

const getAllTransactions = async ({
	search = '',
	sort = 'created_at',
	order = 'DESC',
	page = 1,
	limit = 10,
	status = '',
	method = '',
}) => {
	const offset = (page - 1) * limit
	const cacheKey = `transactions:${search}:${sort}:${order}:${page}:${limit}:${status}:${method}`

	try {
		const where = {
			[Op.and]: [],
		}

		// Tìm kiếm theo text
		if (search) {
			where[Op.and].push({
				[Op.or]: [
					{ status: { [Op.like]: `%${search}%` } },
					{ method: { [Op.like]: `%${search}%` } },
					{ '$Booking.User.username$': { [Op.like]: `%${search}%` } },
					{ '$Booking.User.email$': { [Op.like]: `%${search}%` } },
				],
			})
		}

		if (status) {
			where[Op.and].push({ status })
		}

		if (method) {
			where[Op.and].push({ method })
		}

		const { count, rows } = await Transaction.findAndCountAll({
			where,
			include: [
				{
					model: Booking,
					include: [
						{
							model: User,
							attributes: ['user_id', 'username', 'email'],
						},
					],
				},
			],
			order: [[sort, order.toUpperCase()]],
			offset,
			limit,
			subQuery: false,
		})

		const response = {
			totalItems: count,
			totalPages: Math.ceil(count / limit),
			currentPage: page,
			items: rows,
		}

		return response
	} catch (error) {
		console.error('[Get Transactions] Error:', error.message)
		throw new Error('Failed to fetch transactions.')
	}
}

const getTransactionById = async transaction_id => {
	return await Transaction.findByPk(transaction_id, {
		include: [{ model: Booking }],
	})
}
const updateTransactionStatus = async (transaction_id, status, failure_reason = null) => {
	const transaction = await Transaction.findByPk(transaction_id)
	if (!transaction) throw new Error('Transaction not found')

	transaction.status = status
	if (failure_reason) transaction.failure_reason = failure_reason
	await transaction.save()

	const booking = await Booking.findByPk(transaction.booking_id)
	if (!booking) throw new Error('Booking not found')

	if (status === 'COMPLETED') {
		if (transaction.method === 'wallet') {
			const wallet = await UserWallet.findOne({ where: { user_id: booking.user_id } })
			if (!wallet) throw new Error('Wallet not found')
			if (wallet.balance < transaction.amount) throw new Error('Insufficient wallet balance')

			wallet.balance -= transaction.amount
			await wallet.save()
		}

		booking.payment_status = 'COMPLETED'
	} else if (status === 'FAILED') {
		booking.payment_status = 'CANCELED'
	}

	await booking.save()

	return transaction
}

module.exports = {
	createTransaction,
	getAllTransactions,
	getTransactionById,
	updateTransactionStatus,
}
