const Tenant = require('../models/Tenant');
const Shop = require('../models/Shop');
const User = require('../models/User');
const UserShopMembership = require('../models/UserShopMembership');

const makeSlug = (name, id) => `${String(name).trim().toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '') || 'tenant'}-${id.toString().slice(-6)}`;

const ensureTenantContext = async (req, res, next) => {
    try {
        if (!req.user || !req.user.shop) {
            return res.status(400).json({ message: 'User is not assigned to a shop' });
        }

        const shop = await Shop.findById(req.user.shop);
        if (!shop) {
            return res.status(403).json({ message: 'User shop was not found' });
        }

        let tenantId = req.user.tenantId || shop.tenantId;
        if (!tenantId) {
            const tenant = await Tenant.create({
                name: shop.name,
                slug: makeSlug(shop.name, shop._id)
            });
            shop.tenantId = tenant._id;
            await shop.save({ validateBeforeSave: false });

            await User.findByIdAndUpdate(req.user._id, { tenantId: tenant._id });
            await UserShopMembership.updateOne(
                { tenantId: tenant._id, shopId: shop._id, userId: req.user._id },
                { $setOnInsert: { role: 'super_admin', status: 'active' } },
                { upsert: true }
            );
            tenantId = tenant._id;
        }

        req.tenantId = tenantId;
        req.shopId = shop._id;
        req.user.tenantId = tenantId;
        next();
    } catch (error) {
        console.error('Tenant context error:', error);
        res.status(500).json({ message: 'Unable to initialize tenant context' });
    }
};

module.exports = { ensureTenantContext };
