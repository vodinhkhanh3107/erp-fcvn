export interface UploadedFileResult {
  fileUrl: string;
  fileName: string;
  fileSize: number;
  storageKey: string;
}

export interface IFileStorageService {
  upload(file: Express.Multer.File, folder: string): Promise<UploadedFileResult>;
  delete(storageKey: string): Promise<void>;
}

export const FILE_STORAGE_SERVICE = Symbol('FILE_STORAGE_SERVICE');
