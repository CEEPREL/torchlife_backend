import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
    const app = await NestFactory.create(AppModule);

    app.getHttpAdapter().getInstance().disable('x-powered-by');
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, stopAtFirstError: true }));

    await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
