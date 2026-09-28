const multer = require('multer');
const cloudinary = require('../config/cloudinary');
const sharp = require('sharp');

const upload = multer({ storage: multer.memoryStorage() });

const uploadToCloudinary = async (req, res, next) => {
    if (!req.file) {
        return next();
    }

    if (!req.tenantId) {
        return next(new Error('Tenant context is required to upload images'));
    }

    try {
        const image = sharp(req.file.buffer).rotate();
        const metadata = await image.metadata();
        if (!['jpeg', 'png', 'webp'].includes(metadata.format)) {
            return next(new Error('Only JPEG, PNG, and WebP images are supported'));
        }

        const format = metadata.format === 'webp' ? 'webp' : 'jpeg';
        const compressedImage = await image
            .resize({
                width: 1600,
                height: 1600,
                fit: 'inside',
                withoutEnlargement: true
            })
            .toFormat(format, { quality: 75 })
            .toBuffer();

        const result = await new Promise((resolve, reject) => {
            const uploadStream = cloudinary.uploader.upload_stream({
                folder: `tenants/${req.tenantId}`,
                quality: 'auto',
                fetch_format: 'auto',
                resource_type: 'image'
            }, (error, uploadedFile) => {
                if (error) {
                    reject(error);
                } else if (!uploadedFile) {
                    reject(new Error('Cloudinary did not return an uploaded image'));
                } else {
                    resolve(uploadedFile);
                }
            });

            uploadStream.end(compressedImage);
        });

        req.file.path = result.secure_url;
        req.file.filename = result.public_id;
        next();
    } catch (error) {
        next(error);
    }
};

module.exports = upload;
module.exports.uploadToCloudinary = uploadToCloudinary;
