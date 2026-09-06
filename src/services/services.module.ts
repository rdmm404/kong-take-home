import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from '../auth/auth.module';
import { Service } from './entities/service.entity';
import { Version } from './entities/version.entity';
import { ListServicesQuery } from './queries/list-services.query';
import { ServicesController } from './services.controller';
import { ServicesService } from './services.service';
import { VersionsController } from './versions.controller';
import { VersionsService } from './versions.service';

@Module({
  imports: [AuthModule, TypeOrmModule.forFeature([Service, Version])],
  controllers: [ServicesController, VersionsController],
  providers: [ServicesService, VersionsService, ListServicesQuery],
})
export class ServicesModule {}
