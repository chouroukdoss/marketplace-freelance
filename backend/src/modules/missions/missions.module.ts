import { Module } from '@nestjs/common';
import { MissionsService } from './missions.service';
import { MissionsController } from './missions.controller';
import { PrismaModule } from '../../prisma/prisma.module';
import { AuthModule } from '../../auth/auth.module';
import { JwtStrategy } from '../../auth/jwt.strategy'; // ➕ AJOUTER CET IMPORT

@Module({
  imports: [
    PrismaModule, 
    AuthModule
  ], 
  controllers: [MissionsController],
  providers: [
    MissionsService, 
    JwtStrategy // ➕ ENREGISTRER LA STRATÉGIE ICI POUR QUE PASSPORT LA CONNAISSE
  ],
})
export class MissionsModule {}