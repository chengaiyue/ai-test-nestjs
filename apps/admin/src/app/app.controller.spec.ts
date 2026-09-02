import { Test, TestingModule } from '@nestjs/testing';
import { CommonModule } from '@app/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';

describe('AppController', () => {
  let app: TestingModule;

  beforeAll(async () => {
    app = await Test.createTestingModule({
      imports: [CommonModule],
      controllers: [AppController],
      providers: [AppService],
    }).compile();
  });

  describe('getData', () => {
    it('should return "Hello API"', () => {
      const appController = app.get<AppController>(AppController);
      expect(appController.getData()).toEqual({ message: 'Hello API' });
    });
  });

  describe('getHealth', () => {
    it('should return health status from CommonService', () => {
      const appController = app.get<AppController>(AppController);
      expect(appController.getHealth()).toEqual(
        expect.objectContaining({ status: 'ok' }),
      );
    });
  });
});
