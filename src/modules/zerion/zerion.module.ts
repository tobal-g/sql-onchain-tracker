import { Module } from '@nestjs/common';
import { ZerionService } from './zerion.service';

@Module({
  providers: [ZerionService],
  exports: [ZerionService],
})
export class ZerionModule {}
