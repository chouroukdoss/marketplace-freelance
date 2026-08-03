import { Controller, Post, Get, Body, Param, UseGuards, Request, ForbiddenException } from '@nestjs/common';
import { ProfilsService } from './profils.service';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';

@Controller('profils')
export class ProfilsController {
  constructor(private readonly profilsService: ProfilsService) {}

  /**
   * 🔍 Récupérer le profil public d'un freelance (avec ses avis) pour la modale
   * GET /profils/freelance/:id
   */
  @UseGuards(JwtAuthGuard)
  @Get('freelance/:id')
  async obtenirProfilPublic(@Param('id') freelanceId: string) {
    return this.profilsService.obtenirProfilPublic(Number(freelanceId));
  }

  /**
   * ➕ Laisser un avis et une note sur un freelance (Sprint 4)
   * POST /profils/freelance/:id/avis
   */
  @UseGuards(JwtAuthGuard)
  @Post('freelance/:id/avis')
  async ajouterAvis(
    @Param('id') freelanceId: string,
    @Body() body: { note: number; commentaire: string },
    @Request() req: any
  ) {
    const entrepriseId = req.user.userId; // ID de l'entreprise connectée issu du Token JWT
    const role = req.user.role;

    if (role !== 'ENTREPRISE') {
      throw new ForbiddenException("Seules les entreprises peuvent attribuer une note.");
    }

    return this.profilsService.creerAvis(
      Number(freelanceId),
      entrepriseId,
      body.note,
      body.commentaire
    );
  }
}