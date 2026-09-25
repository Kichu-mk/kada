const Product = require('../models/Product');
const History = require('../models/History');

// @desc    Get paginated products for a shop
// @route   GET /api/products?page=1&limit=18&search=&type=
// @access  Private
const getProducts = async (req, res) => {
    try {
        const page = Math.max(Number.parseInt(req.query.page, 10) || 1, 1);
        const limit = Math.min(Math.max(Number.parseInt(req.query.limit, 10) || 18, 1), 100);
        const search = typeof req.query.search === 'string' ? req.query.search.trim() : '';
        const type = typeof req.query.type === 'string' ? req.query.type.trim() : '';
        const query = { shop: req.user.shop };

        if (search) {
            const searchExpression = new RegExp(search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
            query.$or = [
                { name: searchExpression },
                { place: searchExpression },
                { about: searchExpression },
            ];
        }
        if (type && type !== 'All') {
            query.type = type;
        }

        const [products, total, types] = await Promise.all([
            Product.find(query)
                .sort({ createdAt: -1 })
                .skip((page - 1) * limit)
                .limit(limit),
            Product.countDocuments(query),
            Product.distinct('type', { shop: req.user.shop }),
        ]);

        res.json({
            products,
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit),
            types: ['All', ...types.filter(Boolean).sort()],
        });
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
        const { name, quantity, place, price, stock, type, about } = req.body;
        const imageUrl = req.file ? req.file.path : '';

        const product = await Product.create({
            tenantId: req.tenantId,
            name,
            quantity,
            place,
            type,
            price,
            stock,
            about,
            image: imageUrl,
            shop: req.user.shop
        });

        // Add to history
        await History.create({
            tenantId: req.tenantId,
            product: product._id,
            shop: req.user.shop,
            action: 'Created',
            changes: { initialQuantity: quantity, initialPrice: price }
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

        const { name, quantity, place, price, stock, type, about } = req.body;
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
        product.price = price !== undefined ? price : product.price;
        product.stock = stock || product.stock;
        product.image = imageUrl;
        product.about = about || product.about;
        product.tenantId = req.tenantId;

        const updatedProduct = await product.save();

        // Add to history if quantity changed
        if (Object.keys(changes).length > 0) {
            await History.create({
                tenantId: req.tenantId,
                product: updatedProduct._id,
                shop: req.user.shop,
                action: 'Updated Quantity',
                changes
            });
        } else {
             await History.create({
                tenantId: req.tenantId,
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
            tenantId: req.tenantId,
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
    const totalPrice = sellQuantity * product.price;

    // Reduce stock
    product.quantity -= sellQuantity;
    product.tenantId = req.tenantId;
    product.stock = product.quantity === 0
      ? 'Out of Stock'
      : product.quantity < 5
        ? 'Low Stock'
        : 'In Stock';

    const updatedProduct = await product.save();

    // Add sale to history
    await History.create({
      tenantId: req.tenantId,
      product: updatedProduct._id,
      shop: req.user.shop,
      action: 'Sold Product',
      changes: {
        oldQuantity,
        soldQuantity: sellQuantity,
        newQuantity: updatedProduct.quantity,
        price: product.price,
        totalPrice
      }
    });

    // Keep other product views in sync with the sale.
    req.app.get('io').emit(`shop-${req.user.shop}-product-updated`, updatedProduct);

    res.status(200).json({
      message: 'Product sold successfully',
      product: updatedProduct,
      sale: {
        quantity: sellQuantity,
        price: product.price,
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


// @desc    Get daily units-sold data for a given month (for the sales graph)
// @route   GET /api/products/:id/monthly-sales?month=&year=
// @access  Private
const getMonthlySales = async (req, res) => {
  try {
    const product = await Product.findOne({ _id: req.params.id, shop: req.user.shop });
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    const { month, year } = req.query;
    const targetMonth = month ? parseInt(month) - 1 : new Date().getMonth();
    const targetYear = year ? parseInt(year) : new Date().getFullYear();

    const startDate = new Date(targetYear, targetMonth, 1);
    const endDate = new Date(targetYear, targetMonth + 1, 1);
    const daysInMonth = new Date(targetYear, targetMonth + 1, 0).getDate();

    const sales = await History.find({
      product: product._id,
      shop: req.user.shop,
      action: 'Sold Product',
      date: { $gte: startDate, $lt: endDate }
    });

    // Sum soldQuantity per day (a product could be sold more than once in a day)
    const salesMap = {};
    sales.forEach((entry) => {
      const day = new Date(entry.date).getDate();
      const qty = entry.changes?.soldQuantity || 0;
      salesMap[day] = (salesMap[day] || 0) + qty;
    });

    const chartData = [];
    for (let day = 1; day <= daysInMonth; day++) {
      chartData.push({ day, unitsSold: salesMap[day] || 0 });
    }

    const sorted = [...chartData].sort((a, b) => b.unitsSold - a.unitsSold);
    const topDays = sorted
      .slice(0, 3)
      .filter((d) => d.unitsSold > 0)
      .map((d) => d.day);

    res.json({
      productName: product.name,
      currentPrice: product.price,
      month: targetMonth + 1,
      year: targetYear,
      chartData,
      topDays
    });
  } catch (error) {
    console.error('Monthly sales error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get list of year-month combos that have sales data (for the picker dropdown)
// @route   GET /api/products/:id/available-months
// @access  Private
const getAvailableMonths = async (req, res) => {
  try {
    const product = await Product.findOne({ _id: req.params.id, shop: req.user.shop });
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    const sales = await History.find({
      product: product._id,
      shop: req.user.shop,
      action: 'Sold Product'
    }).select('date');

    const monthsSet = new Set();
    sales.forEach((entry) => {
      const d = new Date(entry.date);
      monthsSet.add(`${d.getFullYear()}-${d.getMonth() + 1}`);
    });

    const months = Array.from(monthsSet)
      .map((m) => {
        const [year, month] = m.split('-').map(Number);
        return { year, month };
      })
      .sort((a, b) => b.year - a.year || b.month - a.month);

    res.json({ months });
  } catch (error) {
    console.error('Available months error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};


module.exports = {
    getProducts,
    getProduct,
    createProduct,
    updateProduct,
    deleteProduct,
    sellProduct,
    getMonthlySales,
    getAvailableMonths
};
