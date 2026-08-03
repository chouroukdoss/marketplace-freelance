import { Controller, Post, Get, Patch, Delete, Param, Body, UseGuards, Request } from '@nestjs/common';
import { CandidaturesService } from './candidatures.service';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';

@Controller('candidatures')
@UseGuards(JwtAuthGuard)
export class CandidaturesController {
  constructor(private readonly candidaturesService: CandidaturesService) {}

  // Postuler à une mission
  @Post('postuler/:missionId')
  async postuler(@Param('missionId') missionId: string, @Request() req: any) {
    return this.candidaturesService.postuler(Number(missionId), req.user.id);
  }

  // Obtenir les candidatures du Freelance connecté
  @Get('mes-candidatures')
  async getMesCandidatures(@Request() req: any) {
    return this.candidaturesService.findFreelanceApplications(req.user.id);
  }

  // Changer le statut d'une candidature (Pour l'Entreprise)
  @Patch(':id/statut')
  async modifierStatut(
    @Param('id') id: string,
    @Body('statut') statut: string,
    @Request() req: any
  ) {
    return this.candidaturesService.updateStatus(Number(id), statut, req.user.id);
  }

  @Delete('annuler/:missionId')
  async annulerCandidature(@Param('missionId') missionId: string, @Request() req: any) {
    return this.candidaturesService.annulerCandidature(Number(missionId), req.user.id);
  }
}
