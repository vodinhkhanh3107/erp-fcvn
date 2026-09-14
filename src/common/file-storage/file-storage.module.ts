import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { FILE_STORAGE_SERVICE } from './file-storage.interface';
import { CloudinaryStorageService } from './cloudinary-storage.service';

@Module({
  imports: [ConfigModule],
  providers: [
    {
      provide: FILE_STORAGE_SERVICE,
      useClass: CloudinaryStorageService,
    },
  ],
  exports: [FILE_STORAGE_SERVICE],
})
export class FileStorageModule {}
