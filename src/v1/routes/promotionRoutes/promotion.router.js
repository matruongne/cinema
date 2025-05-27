const express = require('express')
const promotionRouter = express.Router()
const PromotionController = require('../../controllers/promotionControllers/promotion.controller')
const isAuth = require('../../middlewares/isAuth')
const isAdmin = require('../../middlewares/isAdmin')

promotionRouter.get('/', PromotionController.getAll)
promotionRouter.get('/:id', PromotionController.getById)
promotionRouter.use(isAuth)
promotionRouter.use(isAdmin)

promotionRouter.post('/', PromotionController.create)
promotionRouter.patch('/:id', PromotionController.update)
promotionRouter.delete('/:id', PromotionController.delete)

module.exports = promotionRouter
