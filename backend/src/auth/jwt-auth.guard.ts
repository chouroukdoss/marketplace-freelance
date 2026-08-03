import { Injectable, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  // Cette méthode intercepte la requête et valide automatiquement le token via Passport
  canActivate(context: ExecutionContext) {
    return super.canActivate(context);
  }

  // Cette méthode gère la réponse du décodage
  handleRequest(err: any, user: any, info: any) {
    if (err || !user) {
      throw err || new UnauthorizedException("Vous devez être connecté pour accéder à cette ressource.");
    }
    return user; // C'est ce retour qui peuple automatiquement req.user !
  }
}