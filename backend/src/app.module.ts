import { Module } from '@nestjs/common';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { MissionsModule } from './modules/missions/missions.module';
import { CandidaturesModule } from './modules/candidatures/candidatures.module';
import { ProfilModule } from './modules/profils/profils.module';
import { ChatModule } from './chat/chat.module';
import { UtilisateursModule } from './utilisateurs/utilisateurs.module';
import { PaiementsModule } from './paiements/paiements.module';
// Removed non-existing ContratsModule import. Keep the existing ContratModule.
import { ContratModule } from './contrat/contrat.module';

@Module({
  imports: [
    PrismaModule,
    AuthModule,
    MissionsModule,
    CandidaturesModule,
    ProfilModule,
    ChatModule,
    UtilisateursModule,
    PaiementsModule,
    ContratModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}