import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: 'CLE_SECRET_MARKETPLACE_2026', // La clé secrète partagée
    });
  }

  async validate(payload: any) {
    if (!payload) {
      throw new UnauthorizedException("Jeton JWT vide ou invalide.");
    }

    // Récupération multi-source de l'identifiant utilisateur (Sprint 1)
    const rawId = payload.sub || payload.id || payload.userId || payload.user?.id;

    if (!rawId) {
      throw new UnauthorizedException("Le jeton ne contient aucun identifiant utilisateur.");
    }

    // Conversion en nombre pour correspondre aux types Int attendus par MySQL/Prisma
    const userId = Number(rawId);

    return { 
      id: userId, 
      userId: userId, 
      email: payload.email, 
      role: payload.role 
    };
  }
}