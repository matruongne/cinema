const { DataTypes } = require('sequelize')
const { sequelize } = require('../configs/databases/init.mysql')
const { v4: uuidv4 } = require('uuid')
const User = require('./user.model')

const UserWallet = sequelize.define(
	'UserWallet',
	{
		wallet_id: {
			type: DataTypes.STRING(24),
			defaultValue: () => uuidv4().replace(/-/g, '').slice(0, 24),
			primaryKey: true,
		},
		user_id: {
			type: DataTypes.STRING(24),
			unique: true,
			allowNull: false,
			references: {
				model: User,
				key: 'user_id',
			},
			onDelete: 'CASCADE',
		},
		balance: {
			type: DataTypes.DECIMAL(10, 2),
			defaultValue: 0.0,
		},
	},
	{
		timestamps: true,
		createdAt: 'created_at',
		updatedAt: 'updated_at',
	}
)

module.exports = UserWallet
