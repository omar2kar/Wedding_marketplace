"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const multer_1 = __importDefault(require("multer"));
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const router = express_1.default.Router();
// Ensure images directory exists
const imagesDir = path_1.default.join(__dirname, '../../../frontend/public/images');
if (!fs_1.default.existsSync(imagesDir)) {
    fs_1.default.mkdirSync(imagesDir, { recursive: true });
}
// Configure multer for file upload
const storage = multer_1.default.diskStorage({
    destination: (req, file, cb) => {
        cb(null, imagesDir);
    },
    filename: (req, file, cb) => {
        // Use the filename provided in the request, or generate one
        const fileName = req.body.fileName || `${Date.now()}_${Math.random().toString(36).substring(2, 15)}.${file.originalname.split('.').pop()}`;
        cb(null, fileName);
    }
});
const upload = (0, multer_1.default)({
    storage: storage,
    limits: {
        fileSize: 10 * 1024 * 1024, // 10MB limit
    },
    fileFilter: (req, file, cb) => {
        // Check file type
        const allowedTypes = /jpeg|jpg|png|gif|webp/;
        const extname = allowedTypes.test(path_1.default.extname(file.originalname).toLowerCase());
        const mimetype = allowedTypes.test(file.mimetype);
        if (mimetype && extname) {
            return cb(null, true);
        }
        else {
            cb(new Error('Only image files are allowed (jpeg, jpg, png, gif, webp)'));
        }
    }
});
// Upload single image endpoint
router.post('/upload-image', upload.single('image'), (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No image file provided' });
        }
        // Return the file path relative to the public directory
        const relativePath = `/images/${req.file.filename}`;
        res.json({
            success: true,
            message: 'Image uploaded successfully',
            filePath: relativePath,
            fileName: req.file.filename,
            originalName: req.file.originalname,
            size: req.file.size
        });
    }
    catch (error) {
        console.error('Error uploading image:', error);
        res.status(500).json({ error: 'Failed to upload image' });
    }
});
// Upload multiple images endpoint
router.post('/upload-images', upload.array('images', 10), (req, res) => {
    try {
        if (!req.files || req.files.length === 0) {
            return res.status(400).json({ error: 'No image files provided' });
        }
        const files = req.files;
        const uploadedFiles = files.map(file => ({
            filePath: `/images/${file.filename}`,
            fileName: file.filename,
            originalName: file.originalname,
            size: file.size
        }));
        res.json({
            success: true,
            message: `${files.length} images uploaded successfully`,
            files: uploadedFiles
        });
    }
    catch (error) {
        console.error('Error uploading images:', error);
        res.status(500).json({ error: 'Failed to upload images' });
    }
});
// Delete image endpoint
router.delete('/delete-image/:fileName', (req, res) => {
    try {
        const { fileName } = req.params;
        const filePath = path_1.default.join(imagesDir, fileName);
        if (fs_1.default.existsSync(filePath)) {
            fs_1.default.unlinkSync(filePath);
            res.json({
                success: true,
                message: 'Image deleted successfully'
            });
        }
        else {
            res.status(404).json({ error: 'Image not found' });
        }
    }
    catch (error) {
        console.error('Error deleting image:', error);
        res.status(500).json({ error: 'Failed to delete image' });
    }
});
exports.default = router;
//# sourceMappingURL=upload.js.map