import { Test, TestingModule } from '@nestjs/testing';
import { CommonService } from './common.service';

describe('CommonService', () => {
  let service: CommonService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [CommonService],
    }).compile();

    service = module.get(CommonService);
  });

  describe('getHealth', () => {
    it('should return ok status with a timestamp', () => {
      const result = service.getHealth();
      expect(result.status).toBe('ok');
      expect(typeof result.timestamp).toBe('number');
    });
  });

  describe('getGreeting', () => {
    it('should greet the given name', () => {
      expect(service.getGreeting('Nest')).toEqual({ message: 'Hello Nest' });
    });

    it('should default to API', () => {
      expect(service.getGreeting()).toEqual({ message: 'Hello API' });
    });
  });
});
