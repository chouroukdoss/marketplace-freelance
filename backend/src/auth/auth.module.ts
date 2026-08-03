import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { PrismaModule } from '../prisma/prisma.module'; // <-- Vérifiez ce chemin !
import { JwtModule } from '@nestjs/jwt';
import { JwtStrategy } from './jwt.strategy';       

@Module({
  imports: [
    PrismaModule, // <-- IMPORTANT : Cela donne l'accès à Prisma au service Auth
    JwtModule.register({
      secret: 'CLE_SECRET_MARKETPLACE_2026',
      signOptions: { expiresIn: '1d' },
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService],
})
export class AuthModule {}