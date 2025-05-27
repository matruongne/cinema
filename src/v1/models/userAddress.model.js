// models/UserAddress.js
const { DataTypes } = require('sequelize')
const { sequelize } = require('../configs/databases/init.mysql')
const User = require('./user.model')
const Address = require('./address.model')

const UserAddress = sequelize.define(
	'UserAddress',
	{
		user_id: {
			type: DataTypes.STRING(24),
			references: {
				model: User,
				key: 'user_id',
			},
			primaryKey: true,
		},
		address_id: {
			type: DataTypes.STRING(24),
			references: {
				model: Address,
				key: 'address_id',
			},
			primaryKey: true,
		},
		address_type: {
			type: DataTypes.ENUM('HOME', 'WORK', 'OTHER'),
			defaultValue: 'HOME',
		},
	},
	{
		timestamps: false,
	}
)

module.exports = UserAddress
