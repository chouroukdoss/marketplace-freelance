import { Controller, Get, UseGuards, Request } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard'; 

@Controller('utilisateurs')
export class UtilisateursController {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * 👥 Récupérer tous les utilisateurs pour la liste des contacts de la messagerie
   * GET /utilisateurs
   */
  @UseGuards(JwtAuthGuard)
  @Get()
  async obtenirTousPourMessagerie(@Request() req: any) {
    const monId = req.user.userId;
    const db = this.prisma as any;

    // On récupère tous les utilisateurs sauf soi-même
    return db.utilisateur.findMany({
      where: {
        id: { not: monId }
      },
      select: {
        id: true,
        nom: true,
        role: true,
      },
      orderBy: {
        nom: 'asc'
      }
    });
  }
}