const { DataTypes } = require('sequelize')
const { sequelize } = require('../configs/databases/init.mysql')
const { v4: uuidv4 } = require('uuid')

const Theater = sequelize.define('Theater', {
	theater_id: {
		type: DataTypes.STRING(24),
		defaultValue: () => uuidv4().replace(/-/g, '').slice(0, 24),
		primaryKey: true,
	},
	name: { type: DataTypes.STRING(255), allowNull: false },
})

module.exports = Theater
