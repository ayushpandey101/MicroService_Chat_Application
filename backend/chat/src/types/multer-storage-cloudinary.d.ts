declare module "multer-storage-cloudinary" {
  import type { StorageEngine } from "multer";

  interface CloudinaryStorageOptions {
    cloudinary: unknown;
    params?: Record<string, unknown>;
  }

  class CloudinaryStorage implements StorageEngine {
    constructor(options: CloudinaryStorageOptions);
    _handleFile(req: Express.Request, file: Express.Multer.File, callback: (error?: unknown, info?: Partial<Express.Multer.File>) => void): void;
    _removeFile(req: Express.Request, file: Express.Multer.File, callback: (error: Error | null) => void): void;
  }

  export default CloudinaryStorage;
}
