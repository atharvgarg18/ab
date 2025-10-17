const multer = require('multer');

// Use memory storage for Vercel (no persistent file system)
const storage = multer.memoryStorage();

// File filter - accept common image and document formats
const fileFilter = (req, file, cb) => {
  console.log('[Upload] Processing file:', file.originalname);
  
  // Accept most common formats
  const allowedMimeTypes = [
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/gif',
    'image/webp',
    'application/pdf'
  ];
  
  // Accept if MIME type matches or if it has image/pdf in name
  const isMimeTypeValid = allowedMimeTypes.some(mime => file.mimetype.includes(mime.split('/')[0]));
  const hasImageOrPdfInName = /\.(jpg|jpeg|png|gif|webp|pdf)$/i.test(file.originalname);

  if (isMimeTypeValid || hasImageOrPdfInName) {
    console.log('[Upload] File validated - accepting');
    cb(null, true);
  } else {
    console.log('[Upload] File rejected - unsupported type:', file.mimetype);
    cb(new Error(`File type not supported. Please upload images (JPG, PNG, GIF) or PDF`), false);
  }
};

// Create multer upload instance
const upload = multer({
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: fileFilter
});

module.exports = upload;
