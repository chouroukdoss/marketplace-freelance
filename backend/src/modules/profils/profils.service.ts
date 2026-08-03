import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class ProfilsService {
  constructor(private prisma: PrismaService) {}

  /**
   * 👤 Récupérer le profil connecté (avec nom, email et infos associées)
   */
  async getMoi(userId?: number) {
    const db = this.prisma as any;

    if (!userId) {
      return {
        utilisateur: {
          nom: 'François',
          email: 'francois@gmail.com',
        },
        titreProfessionnel: 'Développeur Fullstack React / Node',
        competences: 'React, NestJS, TypeScript',
        cvUrl: 'https://drive.com/cv.pdf',
        portfolioUrl: 'https://monportfolio.com',
        noteMoyenne: 4.8,
      };
    }

    const utilisateur = await db.utilisateur.findUnique({
      where: { id: userId },
      include: {
        freelance: true,
        entreprise: true,
      },
    });

    if (!utilisateur) {
      throw new NotFoundException("Utilisateur introuvable.");
    }

    return utilisateur;
  }

  /**
   * 📝 Mettre à jour le profil Freelance
   */
  async updateFreelance(userId: number, dto: any) {
    const db = this.prisma as any;

    if (userId) {
      await db.freelance.update({
        where: { utilisateurId: userId },
        data: { ...dto },
      });
    }

    return { message: 'Profil freelance mis à jour avec succès', ...dto };
  }

  /**
   * 🏢 Mettre à jour le profil Entreprise
   */
  async updateEntreprise(userId: number, dto: any) {
    const db = this.prisma as any;

    if (userId) {
      await db.entreprise.update({
        where: { utilisateurId: userId },
        data: { ...dto },
      });
    }

    return { message: 'Profil entreprise mis à jour avec succès', ...dto };
  }

  /**
   * 🔍 Récupérer le profil public d'un freelance avec ses relations (Prisma)
   */
  async obtenirProfilPublic(freelanceId: number) {
    const db = this.prisma as any;

    // Récupération du profil freelance, de ses infos utilisateur et de ses avis
    const freelance = await db.freelance.findUnique({
      where: { id: freelanceId },
      include: {
        utilisateur: {
          select: {
            nom: true,
            email: true,
          },
        },
        avis: {
          include: {
            entreprise: {
              select: {
                nomEntreprise: true, // S'assure que le nom de l'entreprise qui a noté apparaît
              },
            },
          },
        },
      },
    });

    if (!freelance) {
      throw new NotFoundException("Profil freelance introuvable.");
    }

    // Sécurité : si noteMoyenne est nulle ou indéfinie, on retourne 0
    const noteMoyenne = freelance.noteMoyenne !== undefined && freelance.noteMoyenne !== null
      ? freelance.noteMoyenne
      : 0;

    return {
      id: freelance.id,
      titreProfessionnel: freelance.titreProfessionnel || null,
      competences: freelance.competences || null,
      portfolioUrl: freelance.portfolioUrl || null,
      cvUrl: freelance.cvUrl || null,
      noteMoyenne: noteMoyenne,
      utilisateur: freelance.utilisateur,
      avis: freelance.avis || [],
    };
  }

  /**
   * ➕ Créer un avis et mettre à jour la moyenne du freelance
   */
  async creerAvis(freelanceId: number, entrepriseId: number, note: number, commentaire: string) {
    const db = this.prisma as any;

    // 1. Validation de la note
    if (note < 1 || note > 5) {
      throw new BadRequestException("La note doit être comprise entre 1 et 5.");
    }

    // 2. Vérifier si le freelance existe
    const freelance = await db.freelance.findUnique({
      where: { id: freelanceId },
    });
    if (!freelance) {
      throw new NotFoundException("Profil freelance introuvable.");
    }

    // 3. Éviter les doublons d'avis (Une entreprise ne note qu'une seule fois un freelance)
    const avisExistant = await db.avis.findFirst({
      where: {
        freelanceId: freelanceId,
        entrepriseId: entrepriseId,
      },
    });
    if (avisExistant) {
      throw new BadRequestException("Vous avez déjà attribué une note à ce freelance.");
    }

    // 4. Enregistrement de l'avis
    const nouvelAvis = await db.avis.create({
      data: {
        note: note,
        commentaire: commentaire,
        freelanceId: freelanceId,
        entrepriseId: entrepriseId,
      },
    });

    // 5. Calcul de la nouvelle note moyenne
    const tousLesAvis = await db.avis.findMany({
      where: { freelanceId: freelanceId },
      select: { note: true },
    });

    const totalNotes = tousLesAvis.reduce((sum: number, item: any) => sum + item.note, 0);
    const moyenneCalculee = parseFloat((totalNotes / tousLesAvis.length).toFixed(1));

    // 6. Mise à jour du profil Freelance
    await db.freelance.update({
      where: { id: freelanceId },
      data: { noteMoyenne: moyenneCalculee },
    });

    return {
      success: true,
      message: "Avis enregistré !",
      nouvelleMoyenne: moyenneCalculee,
      avis: nouvelAvis,
    };
  }

  /**
   * 🛠️ Méthodes CRUD standard
   */
  create(createProfilDto: any) {
    return 'This action adds a new profil';
  }

  findAll() {
    return `This action returns all profil`;
  }

  findOne(id: number) {
    return `This action returns a #${id} profil`;
  }

  update(id: number, updateProfilDto: any) {
    return `This action updates a #${id} profil`;
  }

  remove(id: number) {
    return `This action removes a #${id} profil`;
  }
}