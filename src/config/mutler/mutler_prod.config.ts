import { MulterOptions } from '@nestjs/platform-express/multer/interfaces/multer-options.interface';
import { diskStorage } from 'multer';
import * as path from 'path';
import * as crypto from 'crypto';
import * as fs from 'fs';
import { BadRequestException } from '@nestjs/common';

// Ensure upload directory exists
const uploadDir = './uploads/products';
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

export const multerConfig: MulterOptions = {
  storage: diskStorage({
    destination: (req, file, cb) => {
      cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
      const randomName = crypto.randomBytes(16).toString('hex');
      const extension = path.extname(file.originalname);
      cb(null, `${randomName}${extension}`);
    },
  }),
  fileFilter: (req, file, cb) => {
    if (!file.mimetype.match(/(jpg|jpeg|png|gif)$/)) {
      return cb(new BadRequestException('Only image files are allowed!'), false);
    }
    cb(null, true);
  },
  limits: {
    fileSize: 1024 * 1024 * 5, // 5MB
  },
};