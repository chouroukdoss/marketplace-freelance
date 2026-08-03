import { Injectable, ForbiddenException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class MissionsService {
  constructor(private prisma: PrismaService) {}

  /**
   * Enregistrer une nouvelle mission dans MySQL
   */
  async create(data: any, userId: any) {
    const idConverti = Number(userId);

    if (isNaN(idConverti)) {
      throw new ForbiddenException("Session utilisateur invalide.");
    }

    const db = this.prisma as any;

    // 1. On cherche d'abord l'utilisateur dans la table globale
    const utilisateur = await db.utilisateur.findUnique({
      where: { id: idConverti },
    });

    if (!utilisateur) {
      throw new ForbiddenException("Utilisateur introuvable dans la table Utilisateur.");
    }

    // 2. On vérifie ou on crée à la volée son profil Entreprise pour éviter le crash de clé étrangère
    let entreprise = await db.entreprise.findUnique({
      where: { id: idConverti },
    });

    if (!entreprise) {
      try {
        entreprise = await db.entreprise.create({
          data: {
            id: idConverti,
            nomEntreprise: utilisateur.nom || "Entreprise Anonyme",
            description: "Profil généré automatiquement",
          },
        });
      } catch (e) {
        console.error("Impossible de créer automatiquement le profil Entreprise requis :", e);
      }
    }

    // 3. Tentative d'insertion sécurisée de la mission conforme à la structure de données
    try {
      return await db.mission.create({
        data: {
          titre: data.titre || "Sans titre",
          description: data.description || "",
          budget: parseFloat(data.budget) || 0,
          competences: data.competences && data.competences.trim() !== "" ? data.competences : null,
          statut: "OUVERT", 
          entrepriseId: idConverti,
        },
      });
    } catch (error: any) {
      console.error("ÉCHEC CRITIQUE DE L'INSERTION DE LA MISSION DANS MYSQL :");
      console.error(error);
      throw new Error(`Erreur SQL interne : ${error.message || error}`);
    }
  }

  /**
   * Récupérer toutes les missions ouvertes (Pour l'interface Freelance)
   * RECTIFIÉ : Inclus les candidatures pour permettre le filtrage dynamique côté client
   */
  async findAllAvailable() {
    const db = this.prisma as any;
    try {
      return await db.mission.findMany({
        where: { statut: 'OUVERT' },
        orderBy: { dateCreation: 'desc' },
        include: {
          candidatures: true,
        },
      });
    } catch (error) {
      console.error("Erreur lors de la récupération de toutes les missions disponibles :", error);
      return [];
    }
  }

  /**
   * Récupérer les missions d'une entreprise spécifique (Avec ses candidats)
   * CORRIGÉ : Tolère les profils orphelins ou corrompus en BDD sans faire crasher l'API
   */
  async findCompanyMissions(userId: any) {
    const idConverti = Number(userId);
    if (isNaN(idConverti)) return [];

    const db = this.prisma as any;
    try {
      return await db.mission.findMany({
        where: { entrepriseId: idConverti },
        orderBy: { dateCreation: 'desc' },
        include: {
          candidatures: {
            include: {
              freelance: {
                include: {
                  utilisateur: {
                    select: {
                      nom: true // Récupération sécurisée du nom
                    }
                  }
                }
              }
            }
          }
        }
      });
    } catch (error) {
      console.error(`Erreur lors de la récupération des missions de l'entreprise ${idConverti}, tentative de repli sécurisé...`);
      
      // REPLI SÉCURISÉ : Si la jointure complexe crash à cause de données corrompues,
      // on extrait les missions brutes pour ne pas bloquer l'écran de l'utilisateur.
      try {
        return await db.mission.findMany({
          where: { entrepriseId: idConverti },
          orderBy: { dateCreation: 'desc' },
          include: { candidatures: true }
        });
      } catch (fallbackError) {
        console.error("Échec du mécanisme de repli des missions :", fallbackError);
        return [];
      }
    }
  }

  /**
   * Supprimer une mission de manière sécurisée
   */
  async delete(missionId: number, entrepriseId: number) {
    const db = this.prisma as any;
    
    // Sécurité : on vérifie que la mission appartient bien à cette entreprise
    const mission = await db.mission.findUnique({ where: { id: missionId } });
    if (!mission) throw new ForbiddenException("Mission introuvable.");
    if (mission.entrepriseId !== entrepriseId) {
      throw new ForbiddenException("Vous n'avez pas l'autorisation de supprimer cette mission.");
    }

    return db.mission.delete({ where: { id: missionId } });
  }

  async findOne(id: number) {
    const db = this.prisma as any;
    try {
      const mission = await db.mission.findUnique({
        where: { id },
        include: {
          entreprise: true,
          candidatures: true,
        },
      });

      if (!mission) {
        throw new NotFoundException(`La mission avec l'ID ${id} n'existe pas.`);
      }

      return mission;
    } catch (error) {
      console.error(`Erreur lors de la récupération de la mission ${id}:`, error);
      throw error;
    }
  }
}