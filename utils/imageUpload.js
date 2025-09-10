const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');

// Configure storage
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        // Create uploads directory if it doesn't exist
        const uploadDir = path.join(__dirname, '../uploads');
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }
        cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    }
});

// Configure file filter
const fileFilter = (req, file, cb) => {
    // Accept images only
    if (!file.originalname.match(/\.(jpg|JPG|jpeg|JPEG|png|PNG|gif|GIF)$/)) {
        req.fileValidationError = 'Only image files are allowed!';
        return cb(new Error('Only image files are allowed!'), false);
    }
    cb(null, true);
};

// Create multer instance
const upload = multer({
    storage: storage,
    fileFilter: fileFilter,
    limits: {
        fileSize: 5 * 1024 * 1024 // 5MB max file size
    }
});

// Middleware for profile picture upload
const uploadProfilePic = upload.single('logo');

// Middleware for banner image upload
const uploadBanner = upload.single('banner');

// Common function to handle image upload
const handleImageUpload = async (file, uploadDir) => {
    try {
        console.log('Handling image upload:', {
            originalname: file.originalname,
            mimetype: file.mimetype,
            size: file.size,
            uploadDir
        });

        // Validate file type
        const validTypes = ['image/jpeg', 'image/png', 'image/gif'];
        if (!validTypes.includes(file.mimetype)) {
            throw new Error('Invalid file type. Only JPG, PNG, and GIF are allowed.');
        }

        // Create upload directory if it doesn't exist
        if (!fs.existsSync(uploadDir)) {
            console.log('Creating upload directory:', uploadDir);
            fs.mkdirSync(uploadDir, { recursive: true });
        }

        // Generate unique filename
        const ext = path.extname(file.originalname);
        const filename = `${uuidv4()}${ext}`;
        const filepath = path.join(uploadDir, filename);

        console.log('Moving file to:', filepath);

        // Move file to upload directory
        await fs.promises.rename(file.path, filepath);

        // Return relative path for database storage
        const relativePath = path.relative(path.join(__dirname, '..', 'public'), filepath);
        console.log('File uploaded successfully:', relativePath);
        return `/${relativePath.replace(/\\/g, '/')}`;
    } catch (error) {
        console.error('Error in handleImageUpload:', error);
        throw error;
    }
};

// Brand image upload functions
const uploadBrandLogo = async (file) => {
    const uploadDir = path.join(__dirname, '../public/uploads/brands/logos');
    return handleImageUpload(file, uploadDir);
};

const uploadBrandBanner = async (file) => {
    const uploadDir = path.join(__dirname, '../public/uploads/brands/banners');
    return handleImageUpload(file, uploadDir);
};

// Upload influencer profile picture
const uploadInfluencerProfilePic = async (file) => {
    const uploadDir = path.join(__dirname, '..', 'public', 'uploads', 'influencers', 'profile-pics');
    return handleImageUpload(file, uploadDir);
};

// Upload influencer banner
const uploadInfluencerBanner = async (file) => {
    const uploadDir = path.join(__dirname, '..', 'public', 'uploads', 'influencers', 'banners');
    return handleImageUpload(file, uploadDir);
};

// Delete old image
const deleteOldImage = async (imagePath) => {
    try {
        console.log('Attempting to delete old image:', imagePath);

        // Skip if it's a default image
        if (imagePath.includes('/images/default-')) {
            console.log('Skipping deletion of default image');
            return;
        }

        const fullPath = path.join(__dirname, '..', 'public', imagePath.replace(/^\//, ''));

        if (fs.existsSync(fullPath)) {
            await fs.promises.unlink(fullPath);
            console.log('Old image deleted successfully:', fullPath);
        } else {
            console.log('Old image not found:', fullPath);
        }
    } catch (error) {
        console.error('Error deleting old image:', error);
        throw error;
    }
};

// Function to get image URL
const getImageUrl = (req, filename) => {
    return `/uploads/${filename}`;
};

// Handle upload error
const handleUploadError = (error, res) => {
    console.error('Upload error:', error);
    if (res.xhr || res.headers.accept.indexOf('json') > -1) {
        return res.status(400).json({
            success: false,
            message: 'Error uploading file',
            error: error.message
        });
    }
    return res.status(400).send('Error uploading file');
};

module.exports = {
    upload,
    uploadProfilePic,
    uploadBanner,
    uploadBrandLogo,
    uploadBrandBanner,
    uploadInfluencerProfilePic,
    uploadInfluencerBanner,
    deleteOldImage,
    getImageUrl,
    handleUploadError
};