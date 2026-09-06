import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Service } from './entities/service.entity';
import { Version } from './entities/version.entity';
import { ListServicesQuery } from './queries/list-services.query';
import { ServicesController } from './services.controller';
import { ServicesService } from './services.service';

@Module({
  imports: [TypeOrmModule.forFeature([Service, Version])],
  controllers: [ServicesController],
  providers: [ServicesService, ListServicesQuery],
})
export class ServicesModule {}
