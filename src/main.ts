import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import cookieParser from 'cookie-parser';
import { HttpExceptionFilter } from './domain/exceptions/http-exception.filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { rawBody: true });

  app.setGlobalPrefix('api');
  app.use(cookieParser());
  app.getHttpAdapter().getInstance().disable('x-powered-by');

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
      stopAtFirstError: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );
  app.useGlobalFilters(new HttpExceptionFilter());

  const config = new DocumentBuilder()
    .setTitle('TorchLife Backend API')
    .setDescription(
  'Professional production-grade API for TorchLife platform. Supports campaigns, secure payments via Paystack and VANT, medical document verification, and user authentication.',
)
    .setVersion('1.0.0')
    .setContact('TorchLife Engineering', 'https://torchlife.co', 'info@torchlife.com')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'JWT',
        description: 'Enter JWT token',
        in: 'header',
      },
      'access-token',
    )
    .addTag('Auth', 'Authentication and account management')
    .addTag('Campaigns', 'Crowdfunding campaigns and urgency-based discovery')
    .addTag('Payments', 'Paystack payment initialization and webhook handling')
    .addTag('Uploads', 'Medical and proof document management via Cloudinary')
    .addTag('Admin', 'Internal administrative and verification workflows')
    .addTag('Wallet', 'Crypto deposits via Breet')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document, {
    swaggerOptions: {
      persistAuthorization: true,
      filter: true,
      displayRequestDuration: true,
    },
    customSiteTitle: 'TorchLife API Documentation',
  });

  const allowedOrigins = new Set<string>([
    ...((process.env.CORS_PROD || '')
      .split(',')
      .map((origin) => origin.trim())
      .filter(Boolean)),
    'http://localhost:3000',
    'http://localhost:8080',
    'http://localhost:3001',
    'http://127.0.0.1:3000',
    'http://localhost:1011',
    'http://127.0.0.1:1011',
    'https://torchlife.co',
    'https://staging.torchlife.co',
    'https://api.staging.torchlife.co',
    'https://torchlife-backend-3lnl.onrender.com',
  ]);

  const isAllowedOrigin = (origin: string) => {
    if (allowedOrigins.has(origin)) return true;

    try {
      const { protocol, hostname } = new URL(origin);
      const isHttpOrigin = protocol === 'http:' || protocol === 'https:';
      const isTorchlifeDomain =
        hostname === 'torchlife.co' || hostname.endsWith('.torchlife.co');

      return isHttpOrigin && isTorchlifeDomain;
    } catch {
      return false;
    }
  };

  app.enableCors({
    origin: (
      origin: string | undefined,
      callback: (error: Error | null, allow?: boolean) => void,
    ) => {
      if (!origin) return callback(null, true);
      if (isAllowedOrigin(origin)) return callback(null, true);
      return callback(new Error('Not allowed by CORS'), false);
    },
    credentials: true,
  });

  console.log('✅ App initialized. Listening soon...');
  await app.listen(process.env.PORT || 8080, '0.0.0.0');
  console.log('Server listening successfully, running on PORT:', process.env.PORT || 8080);
}
bootstrap();
