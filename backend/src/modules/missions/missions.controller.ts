import { Controller, Post, Get, Delete, Param, Body, UseGuards, Request, UnauthorizedException } from '@nestjs/common';
import { MissionsService } from './missions.service';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';

@Controller('missions')
export class MissionsController {
  constructor(private readonly missionsService: MissionsService) {}

  /**
   * ➕ Créer une mission (Accessible aux Entreprises et Freelances)
   */
  @UseGuards(JwtAuthGuard)
  @Post()
  create(@Body() createMissionDto: any, @Request() req: any) {
    if (!req.user) {
      throw new UnauthorizedException("Session utilisateur introuvable dans la requête.");
    }
    
    const targetUserId = req.user.userId || req.user.id; 
    return this.missionsService.create(createMissionDto, targetUserId);
  }

  /**
   * 🔍 Récupérer toutes les missions disponibles sur le marché
   */
  @Get()
  findAll() {
    return this.missionsService.findAllAvailable();
  }

  /**
   * 📁 Récupérer les missions publiées par l'utilisateur connecté (Entreprise ou Freelance)
   */
  @UseGuards(JwtAuthGuard)
  @Get('mes-missions')
  findMyMissions(@Request() req: any) {
    if (!req.user) {
      throw new UnauthorizedException("Session utilisateur introuvable.");
    }

    const targetUserId = req.user.userId || req.user.id;
    return this.missionsService.findCompanyMissions(targetUserId);
  }

  /**
   * 🔍 Récupérer les détails d'une mission par son ID
   */
  @UseGuards(JwtAuthGuard)
  @Get(':id')
  async findOne(@Param('id') id: string) {
    return (this.missionsService as any).findOne?.(Number(id));
  }

  /**
   * ❌ Supprimer une mission
   */
  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  async supprimerMission(@Param('id') id: string, @Request() req: any) {
    if (!req.user) {
      throw new UnauthorizedException("Session utilisateur introuvable.");
    }
    const targetUserId = req.user.userId || req.user.id;
    return this.missionsService.delete(Number(id), targetUserId);
  }
}