import {
  Injectable,
  BadRequestException,
  NotFoundException,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import Stripe from 'stripe';

@Injectable()
export class PaymentsService {
  private stripe: Stripe;
  private readonly logger = new Logger(PaymentsService.name);

  constructor(private prisma: PrismaService) {
    const rawApiKey = process.env.STRIPE_SECRET_KEY;

    if (!rawApiKey) {
      this.logger.error('❌ La variable STRIPE_SECRET_KEY est manquante dans le fichier .env !');
      throw new Error(
        'La variable STRIPE_SECRET_KEY est manquante ou vide dans le fichier .env du backend.'
      );
    }

    // .trim() supprime tout espace ou retour à la ligne parasite en début/fin de chaîne
    const cleanApiKey = rawApiKey.trim();

    this.stripe = new Stripe(cleanApiKey, {
      apiVersion: '2023-10-16' as any,
    });
  }

  /**
   * Génère une intention de paiement lorsque l'entreprise accepte une candidature
   */
  async créerIntentionPaiement(candidatureId: number, entrepriseId: number) {
    const cId = Number(candidatureId);
    const eId = Number(entrepriseId);

    if (isNaN(cId) || isNaN(eId)) {
      throw new BadRequestException('Identifiants de candidature ou entreprise invalides.');
    }

    const candidature = await this.prisma.candidature.findUnique({
      where: { id: cId },
      include: { mission: true },
    });

    if (!candidature) {
      throw new NotFoundException('Candidature introuvable.');
    }

    if (candidature.mission.entrepriseId !== eId) {
      throw new BadRequestException("Vous n'êtes pas autorisé à payer cette mission.");
    }

    if (!candidature.mission.budget || candidature.mission.budget <= 0) {
      throw new BadRequestException('Le montant de la mission doit être supérieur à 0.');
    }

    const montantEnCents = Math.round(candidature.mission.budget * 100);

    try {
      // Création de l'intention de paiement Stripe
      const paymentIntent = await this.stripe.paymentIntents.create({
        amount: montantEnCents,
        currency: 'eur',
        metadata: {
          candidatureId: candidature.id.toString(),
          missionId: candidature.missionId.toString(),
          freelanceId: candidature.freelanceId.toString(),
        },
      });

      // Sauvegarder l'ID Stripe dans la mission
      await this.prisma.mission.update({
        where: { id: candidature.missionId },
        data: {
          stripePaymentIntentId: paymentIntent.id,
          statut: 'EN_ATTENTE_PAIEMENT',
        },
      });

      return {
        clientSecret: paymentIntent.client_secret,
        montant: candidature.mission.budget,
      };
    } catch (error: any) {
      this.logger.error(`Erreur lors de la création de la session Stripe : ${error.message}`);

      // Sécurisation : évite d'exposer les détails d'API internes au client
      if (error.type === 'StripeAuthenticationError') {
        throw new InternalServerErrorException(
          'Clé d\'API Stripe invalide ou non configurée sur le serveur.'
        );
      }

      throw new BadRequestException(
        `Impossible d'initialiser le paiement : ${error.message}`
      );
    }
  }

  /**
   * Traitement automatique du Webhook Stripe une fois le paiement réussi
   */
  async validerPaiementReussi(paymentIntent: Stripe.PaymentIntent) {
    const candidatureId = Number(paymentIntent.metadata?.candidatureId);
    const missionId = Number(paymentIntent.metadata?.missionId);

    if (!candidatureId || !missionId) {
      this.logger.warn('Webhook Stripe reçu sans métadonnées complètes.');
      return;
    }

    // 1. Marquer la candidature comme ACCEPTÉE
    await this.prisma.candidature.update({
      where: { id: candidatureId },
      data: { statut: 'ACCEPTE' },
    });

    // 2. Marquer la mission comme EN_COURS (réservée/payée)
    await this.prisma.mission.update({
      where: { id: missionId },
      data: { statut: 'EN_COURS' },
    });
  }
}