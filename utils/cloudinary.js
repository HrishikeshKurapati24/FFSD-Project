const cloudinary = require('cloudinary').v2;
const fs = require('fs');
const path = require('path');

// Debug: Log environment variables
console.log('Cloudinary Config:', {
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET ? '***' : 'undefined'
});

// Configure Cloudinary
try {
    cloudinary.config({
        cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
        api_key: process.env.CLOUDINARY_API_KEY,
        api_secret: process.env.CLOUDINARY_API_SECRET,
        secure: true // Ensure we're using HTTPS
    });
    console.log('Cloudinary configured successfully');
} catch (error) {
    console.error('Error configuring Cloudinary:', error);
    throw error;
}

// Function to upload file to Cloudinary (from file path)
const uploadToCloudinary = async (file, folder) => {
    try {
        console.log('Uploading file to folder:', folder);
        console.log('File path:', file.path);
        console.log('File size:', file.size);

        // Upload the file with additional options
        const result = await cloudinary.uploader.upload(file.path, {
            folder: folder,
            resource_type: 'auto',
            use_filename: true,
            unique_filename: true,
            overwrite: true
        });

        console.log('Upload successful:', {
            public_id: result.public_id,
            secure_url: result.secure_url
        });

        // Delete the temporary file
        fs.unlinkSync(file.path);

        // Return the secure URL
        return result.secure_url;
    } catch (error) {
        console.error('Detailed Cloudinary Error:', {
            message: error.message,
            http_code: error.http_code,
            name: error.name,
            stack: error.stack
        });
        throw error;
    }
};

// Function to upload buffer to Cloudinary (from memory storage)
const uploadBufferToCloudinary = async (file, folder) => {
    try {
        console.log('Uploading buffer to folder:', folder);
        console.log('File size:', file.size);
        console.log('File mimetype:', file.mimetype);

        // Create a data URI from the buffer
        const dataUri = `data:${file.mimetype};base64,${file.buffer.toString('base64')}`;

        // Upload the buffer with additional options
        const result = await cloudinary.uploader.upload(dataUri, {
            folder: folder,
            resource_type: 'auto',
            use_filename: true,
            unique_filename: true,
            overwrite: true
        });

        console.log('Upload successful:', {
            public_id: result.public_id,
            secure_url: result.secure_url
        });

        // Return the secure URL
        return result.secure_url;
    } catch (error) {
        console.error('Detailed Cloudinary Error:', {
            message: error.message,
            http_code: error.http_code,
            name: error.name,
            stack: error.stack
        });
        throw error;
    }
};

module.exports = {
    uploadToCloudinary,
    uploadBufferToCloudinary
};