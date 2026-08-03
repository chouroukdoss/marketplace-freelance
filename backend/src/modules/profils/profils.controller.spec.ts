import { Test, TestingModule } from '@nestjs/testing';
import { ProfilsController } from './profils.controller';

describe('ProfilsController', () => {
  let controller: ProfilsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ProfilsController],
    }).compile();

    controller = module.get<ProfilsController>(ProfilsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
