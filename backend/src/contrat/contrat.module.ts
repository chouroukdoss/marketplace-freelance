import { Module } from '@nestjs/common';
import { ContratService } from './contrat.service';
import { ContratController } from './contrat.controller';
import { PrismaModule } from '../prisma/prisma.module'; // Assurez-vous du bon chemin

@Module({
  imports: [PrismaModule],
  controllers: [ContratController],
  providers: [ContratService],
  exports: [ContratService],
})
export class ContratModule {}