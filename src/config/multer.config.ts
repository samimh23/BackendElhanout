import { diskStorage } from 'multer';
import { v4 as uuidv4 } from 'uuid';
import * as fs from 'fs';
import * as path from 'path';

const UPLOADS_FOLDER = './uploads';

// Ensure uploads folder exists
if (!fs.existsSync(UPLOADS_FOLDER)) {
  fs.mkdirSync(UPLOADS_FOLDER, { recursive: true });
}

export const multerConfig = {
  storage: diskStorage({
    destination: UPLOADS_FOLDER, // Save images in the uploads folder
    filename: (req, file, cb) => {
      const fileExt = path.extname(file.originalname); // Get the file extension
      const filename = `${uuidv4()}${fileExt}`; // Generate a unique filename
      cb(null, filename);
    },
  }),
};
