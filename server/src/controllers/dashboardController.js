const History = require('../models/History');
const Product = require('../models/Product');

// @desc    Get dashboard summary (Day, Month, Year)
// @route   GET /api/dashboard
// @access  Private
const getDashboardSummary = async (req, res) => {
    try {
        const today = new Date();
        const startOfDay = new Date(today.setHours(0, 0, 0, 0));
        const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
        const startOfYear = new Date(today.getFullYear(), 0, 1);

        const shopId = req.user.shop;

        // Fetch products count
        const totalProducts = await Product.countDocuments({ shop: shopId });

        // Fetch histories
        const todayHistory = await History.countDocuments({ shop: shopId, date: { $gte: startOfDay } });
        const monthHistory = await History.countDocuments({ shop: shopId, date: { $gte: startOfMonth } });
        const yearHistory = await History.countDocuments({ shop: shopId, date: { $gte: startOfYear } });

        // Notifications/Alerts (e.g., low stock)
        const lowStockProducts = await Product.find({ shop: shopId, quantity: { $lt: 5, $gt: 0 } });
        const outOfStockProducts = await Product.find({ shop: shopId, quantity: { $eq: 0 } });

        res.json({
            totalProducts,
            activity: {
                today: todayHistory,
                month: monthHistory,
                year: yearHistory
            },
            alerts: [
                ...outOfStockProducts.map(p => ({
                    id: p._id,
                    stockStatus: 'out-of-stock',
                    message: `Product ${p.name} is out of stock.`
                })),
                ...lowStockProducts.map(p => ({
                    id: p._id,
                    stockStatus: 'low',
                    message: `Product ${p.name} is running low on stock (${p.quantity} left).`
                })),               
            ]
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

// @desc    Get full history
// @route   GET /api/dashboard/history
// @access  Private
const getHistory = async (req, res) => {
    try {
        const { search, startDate, endDate } = req.query;
        let query = { shop: req.user.shop };

        // Date filtering
        if (startDate || endDate) {
            query.date = {};
            if (startDate) query.date.$gte = new Date(startDate);
            if (endDate) {
                const end = new Date(endDate);
                end.setHours(23, 59, 59, 999);
                query.date.$lte = end;
            }
        }

        // We will do search filtering in-memory or by joining if needed, but since product is a ref,
        // it's easier to fetch first or do an aggregate. For simplicity, we'll fetch and filter if search exists.
        
        const history = await History.find(query)
            .populate('product', 'name image type')
            .sort({ date: -1 });

        let filteredHistory = history;
        if (search) {
            const searchLower = search.toLowerCase();
            filteredHistory = history.filter(h => 
                (h.product && h.product.name.toLowerCase().includes(searchLower)) ||
                h.action.toLowerCase().includes(searchLower)
            );
        }

        res.json(filteredHistory);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

// @desc    Get daily report
// @route   GET /api/dashboard/daily-report
// @access  Private
const getDailyReport = async (req, res) => {
    try {
        const { date } = req.query;
        if (!date) return res.status(400).json({ message: 'Date is required' });

        const startOfDay = new Date(date);
        startOfDay.setHours(0, 0, 0, 0);
        
        const endOfDay = new Date(date);
        endOfDay.setHours(23, 59, 59, 999);

        const history = await History.find({
            shop: req.user.shop,
            date: { $gte: startOfDay, $lte: endOfDay }
        }).populate('product', 'name');

        let createdCount = 0;
        let updatedCount = 0;
        let deletedCount = 0;

        history.forEach(h => {
            if (h.action === 'Created') createdCount++;
            else if (h.action === 'Deleted') deletedCount++;
            else updatedCount++;
        });

        res.json({
            date: startOfDay,
            totalActions: history.length,
            breakdown: {
                created: createdCount,
                updated: updatedCount,
                deleted: deletedCount
            },
            logs: history
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

module.exports = {
    getDashboardSummary,
    getHistory,
    getDailyReport
};
