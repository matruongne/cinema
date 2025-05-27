const express = require('express')
const showdatesRouter = express.Router()
const showdateController = require('../../controllers/showtimeControllers/showdate.controller')
const isAuth = require('../../middlewares/isAuth')
const isAdmin = require('../../middlewares/isAdmin')

showdatesRouter.get('/:showDateId', showdateController.getShowDate)
showdatesRouter.get('/', showdateController.getAllShowDatesByMovie)
showdatesRouter.use(isAuth)
showdatesRouter.use(isAdmin)

showdatesRouter.post('/new', showdateController.addShowDate)
showdatesRouter.patch('/:showDateId', showdateController.updateShowDate)
showdatesRouter.delete('/:showDateId', showdateController.deleteShowDate)

module.exports = showdatesRouter
