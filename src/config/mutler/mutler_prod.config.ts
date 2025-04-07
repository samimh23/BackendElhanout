import { diskStorage } from 'multer';
import { v4 as uuidv4 } from 'uuid';
import * as path from 'path';
import * as fs from 'fs';

// Define uploads directory path
const UPLOADS_PATH = './uploads/product';

// Ensure uploads directory exists
if (!fs.existsSync(UPLOADS_PATH)) {
  fs.mkdirSync(UPLOADS_PATH, { recursive: true });
  console.log(`Created uploads directory: ${UPLOADS_PATH}`);
}

export const multerConfig = {
  storage: diskStorage({
    destination: (req, file, callback) => {
      callback(null, UPLOADS_PATH);
    },
    filename: (req, file, callback) => {
      // Get product name from request body
      const productName = req.body.name || 'product';
      
      // Clean product name for file system (remove special characters, replace spaces with underscores)
      const cleanName = productName
        .toLowerCase()
        .replace(/[^a-z0-9]/g, '_')
        .replace(/_+/g, '_')
        .substring(0, 50); // Limit length
        
      // Add timestamp to ensure uniqueness
      const timestamp = Date.now();
      const extension = path.extname(file.originalname) || '.jpg';
      
      // Create unique filename
      let finalFileName = `${cleanName}${extension}`;
      let counter = 1;
      
      // If file exists, append a counter
      while (fs.existsSync(path.join(UPLOADS_PATH, finalFileName))) {
        finalFileName = `${cleanName}_${counter}${extension}`;
        counter++;
      }
      
      console.log(`Saving product image as: ${finalFileName}`);
      callback(null, finalFileName);
    },
  }),
  // No fileFilter or limits to allow all files
};