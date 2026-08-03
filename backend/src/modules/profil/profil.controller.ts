import { Controller, Get, Post, Body, Patch, Param, Delete, Request, UseGuards } from '@nestjs/common';
import { ProfilService } from './profil.service';
import { CreateProfilDto } from './dto/create-profil.dto';
import { UpdateProfilDto } from './dto/update-profil.dto';

@Controller('profils')
export class ProfilController {
  constructor(private readonly profilService: ProfilService) {}

  // Récupérer le profil connecté (avec nom et email)
  @Get('moi')
  getMoi(@Request() req) {
    return this.profilService.findOne(+req.user?.id);
  }

  // Mise à jour profil Freelance
  @Patch('freelance')
  updateFreelance(@Body() updateDto: any, @Request() req) {
    return this.profilService.update(+req.user?.id, updateDto);
  }

  // Mise à jour profil Entreprise
  @Patch('entreprise')
  updateEntreprise(@Body() updateDto: any, @Request() req) {
    return this.profilService.update(+req.user?.id, updateDto);
  }

  @Post()
  create(@Body() createProfilDto: CreateProfilDto) {
    return this.profilService.create(createProfilDto);
  }

  @Get()
  findAll() {
    return this.profilService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.profilService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateProfilDto: UpdateProfilDto) {
    return this.profilService.update(+id, updateProfilDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.profilService.remove(+id);
  }
}