import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from './auth/auth.module';
import { createTypeOrmOptions } from './config/typeorm.config';
import { ServicesModule } from './services/services.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    AuthModule,
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: createTypeOrmOptions,
    }),
    ServicesModule,
  ],
})
export class AppModule {}
