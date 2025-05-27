const { DataTypes } = require('sequelize')
const { sequelize } = require('../configs/databases/init.mysql')
const Movie = require('./movie.model')
const Genre = require('./genre.model')

const MovieGenre = sequelize.define(
	'MovieGenre',
	{
		movie_id: {
			type: DataTypes.STRING(24),
			allowNull: false,
			references: {
				model: Movie,
				key: 'movie_id',
			},
			onDelete: 'CASCADE',
		},
		genre_id: {
			type: DataTypes.STRING(24),
			allowNull: false,
			references: {
				model: Genre,
				key: 'genre_id',
			},
			onDelete: 'CASCADE',
		},
	},
	{
		tableName: 'movie_genres',
		timestamps: false,
	}
)

module.exports = MovieGenre
