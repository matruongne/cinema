const { DataTypes } = require('sequelize')
const { sequelize } = require('../configs/databases/init.mysql')
const { v4: uuidv4 } = require('uuid')

const ScreenShowtime = sequelize.define('ScreenShowtime', {
	id: {
		type: DataTypes.STRING(24),
		defaultValue: () => uuidv4().replace(/-/g, '').slice(0, 24),
		primaryKey: true,
	},
	screen_id: {
		type: DataTypes.STRING(24),
		allowNull: false,
	},
	showtime_id: {
		type: DataTypes.STRING(24),
		allowNull: false,
	},
})

module.exports = ScreenShowtime
