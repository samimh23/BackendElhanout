import { diskStorage } from 'multer';
import { v4 as uuidv4 } from 'uuid';
import * as path from 'path';
import * as fs from 'fs';

// Define uploads directory path
const UPLOADS_PATH = './uploads/markets';

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
      // Create a unique filename with timestamp and UUID
      const uniqueName = `${Date.now()}-${uuidv4()}${path.extname(file.originalname)}`;
      callback(null, uniqueName);
    },
  }),
  // Remove fileFilter and limits to allow all files
};