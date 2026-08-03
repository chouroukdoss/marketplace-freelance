import { Injectable, BadRequestException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class CandidaturesService {
  constructor(private prisma: PrismaService) {}

  // 1. Un freelance postule à une mission
  // RECTIFIÉ : Vérifie le statut de la mission et s'assure qu'aucun autre candidat n'a déjà été accepté
  async postuler(missionId: number, freelanceId: number) {
    const db = this.prisma as any;

    // Vérifier si la mission existe, est ouverte et n'a pas déjà été attribuée
    const mission = await db.mission.findUnique({
      where: { id: missionId },
      include: { candidatures: true },
    });

    if (!mission) throw new BadRequestException("Cette mission n'existe pas.");

    const dejaAttribuee =
      mission.statut !== 'OUVERT' ||
      mission.candidatures?.some((c: any) => c.statut === 'ACCEPTE');

    if (dejaAttribuee) {
      throw new BadRequestException("Cette offre a déjà été attribuée ou n'est plus disponible.");
    }

    // Vérifier si le freelance a déjà postulé
    const dejaPostule = await db.candidature.findUnique({
      where: {
        missionId_freelanceId: { missionId, freelanceId }
      }
    });
    if (dejaPostule) throw new BadRequestException("Vous avez déjà postulé à cette mission.");

    return db.candidature.create({
      data: {
        missionId,
        freelanceId,
        statut: 'EN_ATTENTE'
      }
    });
  }

  // 2. Freelance : Voir ses propres candidatures
  async findFreelanceApplications(freelanceId: number) {
    return (this.prisma as any).candidature.findMany({
      where: { freelanceId },
      include: {
        mission: true // Inclus les détails de la mission pour l'affichage
      },
      orderBy: { datePostulation: 'desc' }
    });
  }

  // 3. Entreprise : Mettre à jour le statut (ACCEPTE / REFUSE)
  // RECTIFIÉ : Met à jour le statut de la mission à 'ACCEPTE' si la candidature est acceptée
  async updateStatus(candidatureId: number, statut: string, entrepriseId: number) {
    const db = this.prisma as any;

    // Sécurité : Vérifier si la candidature appartient bien à une mission de cette entreprise
    const candidature = await db.candidature.findUnique({
      where: { id: candidatureId },
      include: { mission: true }
    });

    if (!candidature) throw new BadRequestException("Candidature introuvable.");
    if (candidature.mission.entrepriseId !== entrepriseId) {
      throw new ForbiddenException("Vous n'avez pas l'autorisation de modifier cette candidature.");
    }

    // Si la candidature est acceptée, verrouiller la mission en changeant son statut BDD
    if (statut === 'ACCEPTE') {
      await db.mission.update({
        where: { id: candidature.missionId },
        data: { statut: 'ACCEPTE' }
      });
    }

    return db.candidature.update({
      where: { id: candidatureId },
      data: { statut }
    });
  }

  // ➕ Freelance : Annuler sa candidature
  async annulerCandidature(missionId: number, freelanceId: number) {
    const db = this.prisma as any;

    // 1. Vérifier si la candidature existe
    const candidature = await db.candidature.findUnique({
      where: {
        missionId_freelanceId: { missionId, freelanceId }
      }
    });

    if (!candidature) {
      throw new BadRequestException("Vous n'avez pas postulé à cette mission.");
    }

    // 2. Optionnel : Empêcher l'annulation si l'entreprise a déjà accepté
    if (candidature.statut === 'ACCEPTE') {
      throw new BadRequestException("Impossible d'annuler une candidature déjà acceptée par l'entreprise.");
    }

    // 3. Suppression dans MySQL
    return db.candidature.delete({
      where: {
        missionId_freelanceId: { missionId, freelanceId }
      }
    });
  }
}