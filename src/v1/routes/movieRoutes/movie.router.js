const express = require('express')
const movieController = require('../../controllers/movieControllers/movie.controller')
const moviesRouter = express.Router()
const isAdmin = require('../../middlewares/isAdmin')
const isAuth = require('../../middlewares/isAuth')

moviesRouter.get('/', movieController.getMovies)
moviesRouter.get('/search', movieController.searchMovies)
moviesRouter.get('/:movieId', movieController.getMovieById)
moviesRouter.get('/:theaterId/now-showing', movieController.getNowShowingMoviesByTheater)
moviesRouter.get('/:theaterId/group', movieController.getNowShowingMoviesByTheaterGrouped)

moviesRouter.use(isAuth)
moviesRouter.use(isAdmin)
moviesRouter.post('/new', movieController.createMovie)
moviesRouter.patch('/:movieId', movieController.updateMovie)
moviesRouter.delete('/:movieId', movieController.deleteMovie)

module.exports = moviesRouter
