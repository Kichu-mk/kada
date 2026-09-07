const express = require('express');
const router = express.Router();
const { getProducts, getProduct, createProduct, updateProduct, deleteProduct, sellProduct } = require('../controllers/productController');
const { protect } = require('../middlewares/auth');
const upload = require('../middlewares/upload');

router.route('/')
    .get(protect, getProducts)
    .post(protect, upload.single('image'), createProduct);

router.route('/:id')
    .get(protect, getProduct)
    .put(protect, upload.single('image'), updateProduct)
    .delete(protect, deleteProduct);

router.route('/:id/sell')
    .patch(protect, sellProduct);

module.exports = router;
