const genreService = require('../../services/movieServices/genre.service')
const bindMethodsWithThisContext = require('../../utils/classes/bindMethodsWithThisContext')
const BasicController = require('../../utils/controllers/basicController')

class genreController extends BasicController {
	constructor() {
		super()
		bindMethodsWithThisContext(this)
	}
	async getAllGenres(req, res) {
		try {
			const { sortBy = 'genre_name', orderBy = 'ASC', ...filters } = req.query
			const genres = await genreService.getAllGenres({ sortBy, orderBy, filters })
			res.json(genres)
		} catch (error) {
			return this.handleResponseError(res, error)
		}
	}
	async getGenreById(req, res) {
		try {
			const { genreId } = req.params
			const genre = await genreService.getGenreById({ genreId })
			if (!genre) {
				return res.status(404).json({ message: 'Genre not found.' })
			}
			res.json(genre)
		} catch (error) {
			return this.handleResponseError(res, error)
		}
	}
	async createGenre(req, res) {
		try {
			const genreData = req.body
			const newGenre = await genreService.createGenre(genreData)
			res.status(201).json(newGenre)
		} catch (error) {
			return this.handleResponseError(res, error)
		}
	}
	async updateGenre(req, res) {
		try {
			const { genreId } = req.params
			const updateData = req.body
			const updateGenre = await genreService.updateGenre({ genreId, updateData })
			res.json(updateGenre)
		} catch (error) {
			return this.handleResponseError(res, error)
		}
	}
	async deleteGenre(req, res) {
		try {
			const { genreId } = req.params
			const result = await genreService.deleteGenre({ genreId })
			res.json(result)
		} catch (error) {
			return this.handleResponseError(res, error)
		}
	}
}

module.exports = new genreController()
