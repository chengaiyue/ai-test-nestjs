import { NestFactory } from '@nestjs/core';
import { AdminModule } from './admin.module.js';

async function bootstrap() {
  const app = await NestFactory.create(AdminModule);
  await app.listen(process.env.PORT ?? 3001);
}
await bootstrap();
