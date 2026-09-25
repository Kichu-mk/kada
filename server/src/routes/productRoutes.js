const express = require('express');
const router = express.Router();
const { getProducts, getProduct, createProduct, updateProduct, deleteProduct, sellProduct, getMonthlySales, getAvailableMonths} = require('../controllers/productController');
const { protect } = require('../middlewares/auth');
const { ensureTenantContext } = require('../middlewares/tenantContext');
const upload = require('../middlewares/upload');

router.route('/')
    .get(protect, ensureTenantContext, getProducts)
    .post(protect, ensureTenantContext, upload.single('image'), createProduct);

router.route('/:id')
    .get(protect, ensureTenantContext, getProduct)
    .put(protect, ensureTenantContext, upload.single('image'), updateProduct)
    .delete(protect, ensureTenantContext, deleteProduct);

router.route('/:id/sell')
    .patch(protect, ensureTenantContext, sellProduct);

router.route('/:id/monthly-sales')
    .get(protect, ensureTenantContext, getMonthlySales);

router.route('/:id/available-months')
    .get(protect, ensureTenantContext, getAvailableMonths);

module.exports = router;
