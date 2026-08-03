import { Module } from '@nestjs/common';
import { UtilisateursController } from './utilisateurs.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [UtilisateursController],
})
export class UtilisateursModule {}