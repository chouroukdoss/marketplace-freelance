import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import Stripe from 'stripe';

@Injectable()
export class ContratService {
  private stripe: Stripe;

  constructor(private prisma: PrismaService) {
    this.stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
      apiVersion: '2023-10-16' as any,
    });
  }

  /**
   * 1. Créer un nouveau contrat avec ses jalons
   */
  async creerContrat(dto: {
    titre: string;
    description?: string;
    freelanceId: number;
    entrepriseId: number;
    jalons: { titre: string; description?: string; montant: Float32Array | number; pourcentage?: number }[];
  }) {
    const db = this.prisma as any;

    const montantTotal = dto.jalons.reduce((sum, j) => sum + Number(j.montant), 0);

    const contrat = await db.contrat.create({
      data: {
        titre: dto.titre,
        description: dto.description,
        montantTotal: montantTotal,
        freelanceId: dto.freelanceId,
        entrepriseId: dto.entrepriseId,
        jalons: {
          create: dto.jalons.map((j) => ({
            titre: j.titre,
            description: j.description,
            montant: Number(j.montant),
            pourcentage: j.pourcentage || null,
          })),
        },
      },
      include: { jalons: true },
    });

    return contrat;
  }

  /**
   * 2. Récupérer un contrat avec ses jalons
   */
  async obtenirContrat(contratId: number) {
    const db = this.prisma as any;
    const contrat = await db.contrat.findUnique({
      where: { id: contratId },
      include: {
        freelance: { include: { utilisateur: true } },
        entreprise: { include: { utilisateur: true } },
        jalons: { orderBy: { id: 'asc' } },
      },
    });

    if (!contrat) throw new NotFoundException('Contrat introuvable');
    return contrat;
  }

  /**
   * 3. Le Client finance un jalon (Mise sous Séquestre via Stripe)
   */
  async financerJalon(jalonId: number) {
    const db = this.prisma as any;
    const jalon = await db.jalon.findUnique({
      where: { id: jalonId },
      include: { contrat: true },
    });

    if (!jalon) throw new NotFoundException('Jalon introuvable');
    if (jalon.statut !== 'EN_ATTENTE_FINANCEMENT') {
      throw new BadRequestException('Ce jalon est déjà financé ou traité.');
    }

    // Création d'une Intent de paiement Stripe (Séquestre)
    const paymentIntent = await this.stripe.paymentIntents.create({
      amount: Math.round(jalon.montant * 100), // Montant en centimes
      currency: 'eur',
      metadata: {
        jalonId: jalon.id.toString(),
        contratId: jalon.contratId.toString(),
      },
    });

    // Mettre à jour le jalon avec l'ID du paiement
    await db.jalon.update({
      where: { id: jalonId },
      data: {
        statut: 'FINANCE',
        stripePaymentIntentId: paymentIntent.id,
      },
    });

    return {
      message: 'Jalon financé avec succès et placé sous séquestre.',
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
    };
  }

  /**
   * 4. Le Freelance dépose son livrable
   */
  async soumettreLivrable(jalonId: number, livrableUrl: string) {
    const db = this.prisma as any;
    const jalon = await db.jalon.findUnique({ where: { id: jalonId } });

    if (!jalon) throw new NotFoundException('Jalon introuvable');
    if (jalon.statut !== 'FINANCE') {
      throw new BadRequestException('Le jalon doit être financé avant de livrer le travail.');
    }

    return await db.jalon.update({
      where: { id: jalonId },
      data: {
        livrableUrl: livrableUrl,
        statut: 'EN_REVISION',
      },
    });
  }

  /**
   * 5. Le Client valide la livraison et libère les fonds (Transfert au Freelance)
   */
  async validerEtLibererFonds(jalonId: number) {
    const db = this.prisma as any;
    const jalon = await db.jalon.findUnique({
      where: { id: jalonId },
      include: {
        contrat: {
          include: { freelance: true },
        },
      },
    });

    if (!jalon) throw new NotFoundException('Jalon introuvable');
    if (jalon.statut !== 'EN_REVISION') {
      throw new BadRequestException('Le livrable doit être soumis avant validation.');
    }

    const freelanceStripeAccountId = jalon.contrat.freelance.stripeAccountId;

    // Déduction de commission plateforme (ex: 10%)
    const commissionPlateforme = 0.10;
    const montantAProcurer = Math.round(jalon.montant * (1 - commissionPlateforme) * 100);

    // Si le freelance a un compte Stripe Connect configuré, on lui transfère les fonds
    if (freelanceStripeAccountId) {
      await this.stripe.transfers.create({
        amount: montantAProcurer,
        currency: 'eur',
        destination: freelanceStripeAccountId,
        description: `Libération de séquestre pour jalon #${jalon.id} - Contrat: ${jalon.contrat.titre}`,
      });
    }

    // Mise à jour du statut du jalon en PAYE
    const jalonMisAJour = await db.jalon.update({
      where: { id: jalonId },
      data: { statut: 'PAYE' },
    });

    // Vérifier si tous les jalons sont payés pour terminer le contrat
    const autresJalons = await db.jalon.findMany({
      where: { contratId: jalon.contratId },
    });

    const toutEstPaye = autresJalons.every((j: any) => j.statut === 'PAYE');
    if (toutEstPaye) {
      await db.contrat.update({
        where: { id: jalon.contratId },
        data: { statut: 'TERMINE' },
      });
    }

    return {
      message: 'Fonds débloqués et transférés au freelance !',
      jalon: jalonMisAJour,
    };
  }
}