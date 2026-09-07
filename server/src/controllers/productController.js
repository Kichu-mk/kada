const Product = require('../models/Product');
const History = require('../models/History');

// @desc    Get all products for a shop
// @route   GET /api/products
// @access  Private
const getProducts = async (req, res) => {
    try {
        const products = await Product.find({ shop: req.user.shop }).sort({ createdAt: -1 });
        res.json(products);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

// @desc    Get single product
// @route   GET /api/products/:id
// @access  Private
const getProduct = async (req, res) => {
    try {
        const product = await Product.findOne({ _id: req.params.id, shop: req.user.shop });
        if (!product) {
            return res.status(404).json({ message: 'Product not found' });
        }
        res.json(product);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

// @desc    Create a product
// @route   POST /api/products
// @access  Private
const createProduct = async (req, res) => {
    try {
        const { name, quantity, place, prize, stock, type, about } = req.body;
        const imageUrl = req.file ? req.file.path : '';

        const product = await Product.create({
            name,
            quantity,
            place,
            type,
            prize,
            stock,
            about,
            image: imageUrl,
            shop: req.user.shop
        });

        // Add to history
        await History.create({
            product: product._id,
            shop: req.user.shop,
            action: 'Created',
            changes: { initialQuantity: quantity, initialPrize: prize }
        });

        // Emit real-time event
        req.app.get('io').emit(`shop-${req.user.shop}-product-created`, product);

        res.status(201).json(product);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

// @desc    Update a product
// @route   PUT /api/products/:id
// @access  Private
const updateProduct = async (req, res) => {
    try {
        const product = await Product.findOne({ _id: req.params.id, shop: req.user.shop });
        if (!product) {
            return res.status(404).json({ message: 'Product not found' });
        }

        const { name, quantity, place, prize, stock, type, about } = req.body;
        const imageUrl = req.file ? req.file.path : product.image;

        const changes = {};
        if (quantity !== undefined && product.quantity !== Number(quantity)) {
            changes.oldQuantity = product.quantity;
            changes.newQuantity = quantity;
        }

        product.name = name || product.name;
        product.quantity = quantity !== undefined ? quantity : product.quantity;
        product.place = place || product.place;
        product.type = type || product.type;
        product.prize = prize !== undefined ? prize : product.prize;
        product.stock = stock || product.stock;
        product.image = imageUrl;
        product.about = about || product.about;

        const updatedProduct = await product.save();

        // Add to history if quantity changed
        if (Object.keys(changes).length > 0) {
            await History.create({
                product: updatedProduct._id,
                shop: req.user.shop,
                action: 'Updated Quantity',
                changes
            });
        } else {
             await History.create({
                product: updatedProduct._id,
                shop: req.user.shop,
                action: 'Updated Details',
                changes: {}
            });
        }

        // Emit real-time event
        req.app.get('io').emit(`shop-${req.user.shop}-product-updated`, updatedProduct);

        res.json(updatedProduct);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

// @desc    Delete a product
// @route   DELETE /api/products/:id
// @access  Private
const deleteProduct = async (req, res) => {
    try {
        const product = await Product.findOne({ _id: req.params.id, shop: req.user.shop });
        if (!product) {
            return res.status(404).json({ message: 'Product not found' });
        }

        await product.deleteOne();

        // Add to history
        await History.create({
            product: product._id, // Will be a dangling reference, which is okay for history tracking if we don't strict populate
            shop: req.user.shop,
            action: 'Deleted',
            changes: {}
        });

        // Emit real-time event
        req.app.get('io').emit(`shop-${req.user.shop}-product-deleted`, product._id);

        res.json({ message: 'Product removed' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

// @route  PATCH /api/products/:id/sell
// @access Private
const sellProduct = async (req, res) => {
  try {
    const { quantity } = req.body;

    const sellQuantity = Number(quantity);

    // Validate quantity
    if (!sellQuantity || sellQuantity <= 0) {
      return res.status(400).json({
        message: 'Please enter a valid quantity'
      });
    }

    // Find product belonging to current shop
    const product = await Product.findOne({
      _id: req.params.id,
      shop: req.user.shop
    });

    if (!product) {
      return res.status(404).json({
        message: 'Product not found'
      });
    }

    // Check stock
    if (sellQuantity > product.quantity) {
      return res.status(400).json({
        message: `Only ${product.quantity} items available`
      });
    }

    const oldQuantity = product.quantity;

    // Calculate total
    const totalPrice = sellQuantity * product.prize;

    // Reduce stock
    product.quantity -= sellQuantity;

    const updatedProduct = await product.save();

    // Add sale to history
    await History.create({
      product: updatedProduct._id,
      shop: req.user.shop,
      action: 'Sold Product',
      changes: {
        oldQuantity,
        soldQuantity: sellQuantity,
        newQuantity: updatedProduct.quantity,
        price: product.prize,
        totalPrice
      }
    });

    res.status(200).json({
      message: 'Product sold successfully',
      product: updatedProduct,
      sale: {
        quantity: sellQuantity,
        price: product.prize,
        totalPrice
      }
    });

  } catch (error) {
    console.error('Sell product error:', error);

    res.status(500).json({
      message: 'Failed to sell product',
      error: error.message
    });
  }
};


module.exports = {
    getProducts,
    getProduct,
    createProduct,
    updateProduct,
    deleteProduct,
    sellProduct
};
