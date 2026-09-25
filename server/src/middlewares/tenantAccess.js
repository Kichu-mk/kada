const UserShopMembership = require('../models/UserShopMembership');

const requireShopAccess = async (req, res, next) => {
    try {
        const shopId = req.params.shopId || req.params.id || req.body.shopId || req.query.shopId;
        const tenantId = req.user?.tenantId || req.body.tenantId || req.query.tenantId;

        if (!shopId) {
            return res.status(400).json({ message: 'Shop ID is required' });
        }

        if (!tenantId) {
            return res.status(400).json({ message: 'Tenant ID is required' });
        }

        const membership = await UserShopMembership.findOne({
            userId: req.user._id,
            shopId,
            tenantId,
            status: 'active'
        }).lean();

        if (!membership) {
            return res.status(403).json({ message: 'You do not have access to this shop' });
        }

        req.shopId = shopId;
        req.tenantId = tenantId;
        req.membership = membership;
        next();
    } catch (error) {
        console.error('Tenant access error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

module.exports = { requireShopAccess };
