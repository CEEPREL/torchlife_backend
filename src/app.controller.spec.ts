import { Test, TestingModule } from '@nestjs/testing';
import { AppController } from './app.controller';
import { AppService } from './app.service';

describe('AppController', () => {
  let appController: AppController;
  const appServiceMock = {
    getHello: jest.fn().mockResolvedValue({ message: 'Hello world!, Welcome to Torchlife Backend' }),
    getHealth: jest.fn().mockResolvedValue({
      message: 'Healthy',
      status: 200,
      checks: {
        application: 'ok',
        database: 'ok',
        redis: 'ok',
      },
    }),
  };

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [AppController],
      providers: [
        {
          provide: AppService,
          useValue: appServiceMock,
        },
      ],
    }).compile();

    appController = app.get<AppController>(AppController);
  });

  describe('root', () => {
    it('returns the API greeting payload', async () => {
      await expect(appController.getHello()).resolves.toEqual({
        message: 'Hello world!, Welcome to Torchlife Backend',
      });
    });

    it('returns the health payload', async () => {
      await expect(appController.getHealth()).resolves.toEqual({
        message: 'Healthy',
        status: 200,
        checks: {
          application: 'ok',
          database: 'ok',
          redis: 'ok',
        },
      });
    });
  });
});
