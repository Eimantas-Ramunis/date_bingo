import path from 'path';

export const getUploadDir = () => {
  if (process.env.UPLOAD_DIR) {
    return process.env.UPLOAD_DIR;
  }
  return path.resolve(process.cwd(), '..', 'data/uploads');
};
