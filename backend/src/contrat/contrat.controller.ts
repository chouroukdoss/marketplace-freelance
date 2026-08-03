import { Controller, Get, Post, Body, Param, ParseIntPipe, UseGuards } from '@nestjs/common';
import { ContratService } from './contrat.service';

@Controller('contrats')
export class ContratController {
  constructor(private readonly contratService: ContratService) {}

  @Post()
  creerContrat(@Body() dto: any) {
    return this.contratService.creerContrat(dto);
  }

  @Get(':id')
  obtenirContrat(@Param('id', ParseIntPipe) id: number) {
    return this.contratService.obtenirContrat(id);
  }

  // 1. Client finance le jalon (Escrow)
  @Post('jalons/:id/financer')
  financerJalon(@Param('id', ParseIntPipe) id: number) {
    return this.contratService.financerJalon(id);
  }

  // 2. Freelance soumet le livrable
  @Post('jalons/:id/livrer')
  soumettreLivrable(
    @Param('id', ParseIntPipe) id: number,
    @Body('livrableUrl') livrableUrl: string,
  ) {
    return this.contratService.soumettreLivrable(id, livrableUrl);
  }

  // 3. Client valide et débloque le paiement
  @Post('jalons/:id/valider')
  validerEtLibererFonds(@Param('id', ParseIntPipe) id: number) {
    return this.contratService.validerEtLibererFonds(id);
  }
}