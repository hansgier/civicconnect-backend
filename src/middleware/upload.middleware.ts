import multer from 'multer';
import { Request } from 'express';
import { UPLOAD_LIMITS } from '../shared/constants/index.js';

const storage = multer.memoryStorage();

const fileFilter = (
  _req: Request,
  file: Express.Multer.File,
  cb: multer.FileFilterCallback
): void => {
  if (UPLOAD_LIMITS.ALLOWED_TYPES.includes(file.mimetype as typeof UPLOAD_LIMITS.ALLOWED_TYPES[number])) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only JPEG, PNG, and WebP are allowed.'));
  }
};

export const upload = multer({
  storage,
  limits: {
    fileSize: UPLOAD_LIMITS.MAX_FILE_SIZE,
    files: UPLOAD_LIMITS.MAX_FILES,
  },
  fileFilter,
});

export const uploadImages = upload.array('images', UPLOAD_LIMITS.MAX_FILES);
