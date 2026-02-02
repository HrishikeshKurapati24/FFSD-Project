const path = require('path');
const fs = require('fs');
const { uploadToCloudinary } = require('./cloudinary');

/**
 * Uploads a local image file to Cloudinary and returns the URL.
 * If the path is already a URL or file doesn't exist, returns the original path.
 * 
 * @param {string} imagePath - Local path (e.g., "/images/brands/logo.png")
 * @param {string} folder - Cloudinary folder (e.g., "brands", "influencers")
 * @returns {Promise<string>} - Cloudinary URL or original path
 */
const uploadSeedImage = async (imagePath, folder) => {
    try {
        // 1. Check if it's already a URL
        if (imagePath.startsWith('http')) {
            return imagePath;
        }

        // 2. Resolve local file path
        // Removing leading slash if present to resolve correctly from project root
        const cleanPath = imagePath.startsWith('/') ? imagePath.slice(1) : imagePath;
        const localFullPath = path.resolve(process.cwd(), 'public', cleanPath);

        // 3. Check if file exists
        if (!fs.existsSync(localFullPath)) {
            console.warn(`⚠️  Image file not found locally: ${localFullPath}. Using original path.`);
            return imagePath;
        }

        // 4. Upload to Cloudinary
        // Create a temporary object mocking the 'file' object expected by uploadToCloudinary
        // We need to modify uploadToCloudinary to accept a path directly or wrap it here.
        // Looking at utils/cloudinary.js:
        // const uploadToCloudinary = async (file, folder) => { 
        //    ... cloudinary.uploader.upload(file.path, ...) 
        // }
        // So we can pass { path: localFullPath, size: stats.size }

        const stats = fs.statSync(localFullPath);
        const fileMock = {
            path: localFullPath,
            size: stats.size
        };

        // Note: The existing uploadToCloudinary deletes the file after upload (fs.unlinkSync).
        // WE DO NOT WANT TO DELETE SEED IMAGES.
        // We should probably NOT use the existing function if it deletes files, 
        // or we should copy the file to a temp location first.

        // Let's copy to a temp file to be safe
        const tempPath = path.join(process.cwd(), 'temp_' + path.basename(localFullPath));
        fs.copyFileSync(localFullPath, tempPath);
        fileMock.path = tempPath;

        console.log(`☁️  Uploading ${path.basename(imagePath)} to Cloudinary folder '${folder}'...`);
        const url = await uploadToCloudinary(fileMock, folder);

        return url;

    } catch (error) {
        console.error(`❌ Error uploading image ${imagePath}:`, error.message);
        return imagePath; // Fallback to local path
    }
};

module.exports = { uploadSeedImage };
