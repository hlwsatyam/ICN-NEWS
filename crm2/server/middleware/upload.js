import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Ensure upload directories exist
const uploadDirs = ['documents', 'avatars', 'products'];
uploadDirs.forEach((dir) => {
  const dirPath = path.join(__dirname, '..', 'uploads', dir);
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
});

// Storage configuration for different file types
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    let uploadDir = 'documents';
    
    if (req.path.includes('avatar')) {
      uploadDir = 'avatars';
    } else if (req.path.includes('product')) {
      uploadDir = 'products';
    }
    
    const dir = path.join(__dirname, '..', 'uploads', uploadDir);
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  },
});

// File filter
const fileFilter = (req, file, cb) => {
  // Define allowed MIME types
  const allowedMimes = {
    documents: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain', 'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'],
    avatars: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
    products: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
  };

  let allowedTypes = allowedMimes.documents;
  
  if (req.path.includes('avatar')) {
    allowedTypes = allowedMimes.avatars;
  } else if (req.path.includes('product')) {
    allowedTypes = allowedMimes.products;
  }

  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error(`Invalid file type: ${file.mimetype}`));
  }
};

// Upload middleware
export const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB
  },
});

// Middleware to handle upload errors
export const handleUploadError = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'FILE_TOO_LARGE') {
      return res.status(400).json({ error: 'File is too large' });
    }
    return res.status(400).json({ error: err.message });
  } else if (err) {
    return res.status(400).json({ error: err.message });
  }
  next();
};
