import { Module } from '@nestjs/common';
import { CandidaturesService } from './candidatures.service';
import { CandidaturesController } from './candidatures.controller';
import { PrismaModule } from '../../prisma/prisma.module';
import { JwtStrategy } from '../../auth/jwt.strategy';

@Module({
  imports: [PrismaModule],
  controllers: [CandidaturesController],
  providers: [CandidaturesService, JwtStrategy],
})
export class CandidaturesModule {}