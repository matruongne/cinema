const express = require('express')
const genreController = require('../../controllers/movieControllers/genre.controller')
const genresRouter = express.Router()
const isAdmin = require('../../middlewares/isAdmin')
const isAuth = require('../../middlewares/isAuth')

genresRouter.get('/', genreController.getAllGenres)
genresRouter.get('/:genreId', genreController.getGenreById)

genresRouter.use(isAuth)
genresRouter.use(isAdmin)
genresRouter.post('/new', genreController.createGenre)
genresRouter.patch('/:genreId', genreController.updateGenre)
genresRouter.delete('/:genreId', genreController.deleteGenre)

module.exports = genresRouter
