const { DataTypes } = require('sequelize')
const { sequelize } = require('../configs/databases/init.mysql')
const { v4: uuidv4 } = require('uuid')

const Genre = sequelize.define(
	'Genre',
	{
		genre_id: {
			type: DataTypes.STRING(24),
			defaultValue: () => uuidv4().replace(/-/g, '').slice(0, 24),
			primaryKey: true,
		},
		genre_name: {
			type: DataTypes.STRING(50),
			allowNull: false,
		},
		description: {
			type: DataTypes.STRING(255),
		},
	},

	{
		tableName: 'genres',
		timestamps: false,
	}
)

module.exports = Genre
