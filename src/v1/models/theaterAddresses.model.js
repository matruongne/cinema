const { DataTypes } = require('sequelize')
const { sequelize } = require('../configs/databases/init.mysql')
const { v4: uuidv4 } = require('uuid')
const Theater = require('./theater.model')
const Address = require('./address.model')

const TheaterAddress = sequelize.define('TheaterAddress', {
	theater_id: {
		type: DataTypes.STRING(24),
		references: {
			model: Theater,
			key: 'theater_id',
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
		type: DataTypes.ENUM('MAIN', 'BRANCH'),
		defaultValue: 'MAIN',
	},
})

module.exports = TheaterAddress
