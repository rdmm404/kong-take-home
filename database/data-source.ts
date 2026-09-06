import 'dotenv/config';
import { DataSource } from 'typeorm';
import { Service } from '../src/services/entities/service.entity';
import { Version } from '../src/services/entities/version.entity';

export default new DataSource({
  type: 'postgres',
  url: process.env.DATABASE_URL,
  entities: [Service, Version],
  migrations: [`${__dirname}/migrations/*{.ts,.js}`],
  synchronize: false,
});
