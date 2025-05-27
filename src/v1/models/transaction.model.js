const { DataTypes } = require('sequelize')
const { sequelize } = require('../configs/databases/init.mysql')
const { v4: uuidv4 } = require('uuid')
const Booking = require('./booking.model')

const Transaction = sequelize.define(
	'Transaction',
	{
		transaction_id: {
			type: DataTypes.STRING(24),
			defaultValue: () => uuidv4().replace(/-/g, '').slice(0, 24),
			primaryKey: true,
		},
		booking_id: {
			type: DataTypes.STRING(24),
			allowNull: false,
			references: {
				model: Booking,
				key: 'booking_id',
			},
			onDelete: 'CASCADE',
		},
		amount: {
			type: DataTypes.DECIMAL(10, 2),
			allowNull: false,
		},
		method: {
			type: DataTypes.ENUM('credit_card', 'paypal', 'bank_transfer', 'wallet'),
			allowNull: false,
		},
		status: {
			type: DataTypes.ENUM('PENDING', 'COMPLETED', 'FAILED'),
			defaultValue: 'PENDING',
		},
		transaction_date: {
			type: DataTypes.DATE,
			defaultValue: DataTypes.NOW,
		},
		failure_reason: {
			type: DataTypes.STRING(255),
			allowNull: true,
		},
	},
	{
		timestamps: true,
		createdAt: 'created_at',
		updatedAt: 'updated_at',
	}
)

module.exports = Transaction
