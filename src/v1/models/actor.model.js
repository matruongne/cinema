const { DataTypes } = require('sequelize')
const { sequelize } = require('../configs/databases/init.mysql')
const { v4: uuidv4 } = require('uuid')

const Actor = sequelize.define(
	'Actor',
	{
		actor_id: {
			type: DataTypes.STRING(24),
			defaultValue: () => uuidv4().replace(/-/g, '').slice(0, 24),
			primaryKey: true,
		},
		name: {
			type: DataTypes.STRING(255),
			allowNull: false,
		},
		bio: {
			type: DataTypes.TEXT,
		},
		birth_date: {
			type: DataTypes.DATE,
		},
		profile_url: {
			type: DataTypes.STRING(255),
		},
		awards: {
			type: DataTypes.JSON,
		},
		nationality: {
			type: DataTypes.STRING(100),
		},
	},
	{
		tableName: 'actors',
		timestamps: false,
	}
)

module.exports = Actor
