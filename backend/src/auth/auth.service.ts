import { Injectable, BadRequestException, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  async inscription(dto: any) {
    // 1. Validation de sécurité : Vérifier les coordonnées obligatoires si c'est une entreprise
    if (dto.role === 'ENTREPRISE') {
      if (!dto.matriculeFiscal || !dto.adresseSiege || !dto.telephonePro) {
        throw new BadRequestException(
          "Les entreprises doivent fournir un matricule fiscal, l'adresse du siège social et un téléphone professionnel.",
        );
      }

      // Vérifier l'unicité du matricule fiscal en BDD
      const matriculeExiste = await this.prisma.entreprise.findFirst({
        where: { matriculeFiscal: dto.matriculeFiscal },
      });
      if (matriculeExiste) {
        throw new BadRequestException('Ce matricule fiscal est déjà associé à un compte.');
      }
    }

    // 2. Vérifier si l'email existe déjà
    const utilisateurExiste = await this.prisma.utilisateur.findUnique({
      where: { email: dto.email },
    });
    if (utilisateurExiste) {
      throw new BadRequestException('Cet email est déjà utilisé');
    }

    // 3. Hacher le mot de passe pour la sécurité
    const sel = await bcrypt.genSalt();
    const motDePasseHache = await bcrypt.hash(dto.motDePasse, sel);

    // 4. Enregistrer l'utilisateur de base
    const nouvelUtilisateur = await this.prisma.utilisateur.create({
      data: {
        nom: dto.nom,
        email: dto.email,
        motDePasse: motDePasseHache,
        role: dto.role, 
      },
    });

    // 5. Créer le profil lié selon son rôle avec les données spécifiques
    if (dto.role === 'FREELANCE') {
      await this.prisma.freelance.create({
        data: { id: nouvelUtilisateur.id },
      });
    } else if (dto.role === 'ENTREPRISE') {
      await this.prisma.entreprise.create({
        data: {
          id: nouvelUtilisateur.id,
          nomEntreprise: dto.nomEntreprise || dto.nom,
          description: dto.description || null,
          matriculeFiscal: dto.matriculeFiscal,
          registreCommerce: dto.registreCommerce || null,
          adresseSiege: dto.adresseSiege,
          telephonePro: dto.telephonePro,
          siteWeb: dto.siteWeb || null,
        },
      });
    }

    return { message: 'Inscription réussie' };
  }

  async connexion(dto: any) {
    const utilisateur = await this.prisma.utilisateur.findUnique({
      where: { email: dto.email },
    });

    if (!utilisateur) {
      throw new UnauthorizedException('Identifiants incorrects');
    }

    // Comparer le mot de passe saisi avec celui haché en BDD
    const motDePasseCorrect = await bcrypt.compare(dto.motDePasse, utilisateur.motDePasse);
    if (!motDePasseCorrect) {
      throw new UnauthorizedException('Identifiants incorrects');
    }

    // Générer le jeton JWT
    const payload = { sub: utilisateur.id, email: utilisateur.email, role: utilisateur.role };
    return {
      access_token: this.jwtService.sign(payload),
      role: utilisateur.role,
      nom: utilisateur.nom,
    };
  }
}