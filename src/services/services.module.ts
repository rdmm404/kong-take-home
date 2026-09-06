import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Service } from './entities/service.entity';
import { Version } from './entities/version.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Service, Version])],
})
export class ServicesModule {}
