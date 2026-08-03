import {
  WebSocketGateway,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { PrismaService } from '../prisma/prisma.service'; 

@WebSocketGateway({
  cors: {
    origin: '*', 
    methods: ['GET', 'POST'], // ➕ Autorisation explicite des méthodes
  },
})
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server!: Server;

  // Stockage temporaire pour mapper l'ID de l'utilisateur avec son socket.id actuel
  private clientsActifs = new Map<number, string>();

  constructor(private readonly prisma: PrismaService) {}

  handleConnection(client: Socket) {
    console.log(`[Socket] Client connecté : ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    // Retirer l'utilisateur déconnecté de notre map de clients actifs
    for (const [userId, socketId] of this.clientsActifs.entries()) {
      if (socketId === client.id) {
        this.clientsActifs.delete(userId);
        console.log(`[Socket] Utilisateur ${userId} déconnecté.`);
        break;
      }
    }
  }

  /**
   * 🆔 Enregistrer la connexion d'un utilisateur authentifié
   */
  @SubscribeMessage('enregistrer_utilisateur')
  enregistrerClient(@MessageBody() userId: number | string, @ConnectedSocket() client: Socket) {
    const id = Number(userId);
    this.clientsActifs.set(id, client.id);
    console.log(`[Socket] Utilisateur ID: ${id} associé au socket ${client.id}`);
  }

  /**
   * 💬 Gérer l'envoi et la réception d'un message
   */
  @SubscribeMessage('envoyer_message')
  async gererMessage(
    @MessageBody() payload: { expediteurId: number | string; recepteurId: number | string; contenu: string },
    @ConnectedSocket() client: Socket,
  ) {
    console.log("Tentative de réception de message :", payload);

    try {
      // ➕ Forcer les IDs en Number pour éviter les erreurs Prisma
      const expediteurId = Number(payload.expediteurId);
      const recepteurId = Number(payload.recepteurId);
      const contenu = payload.contenu;

      // 1. Sauvegarder le message en base de données via Prisma
      const db = this.prisma as any;
      const messageSauvegarde = await db.message.create({
        data: {
          expediteurId,
          recepteurId,
          contenu,
        },
        include: {
          expediteur: { select: { nom: true } },
        },
      });

      console.log("Message sauvegardé en BDD : ID", messageSauvegarde.id);

      // 2. Envoyer le message en temps réel au récepteur s'il est connecté
      const recepteurSocketId = this.clientsActifs.get(recepteurId);
      if (recepteurSocketId) {
        this.server.to(recepteurSocketId).emit('nouveau_message', messageSauvegarde);
      }

      // 3. Renvoyer également une confirmation à l'expéditeur
      client.emit('nouveau_message', messageSauvegarde);

    } catch (error) {
      console.error("Erreur Prisma lors de la sauvegarde du message :", error);
    }
  }

  /**
   * 📜 Charger l'historique de discussion entre deux utilisateurs
   */
  @SubscribeMessage('charger_historique')
  async chargerHistorique(
    @MessageBody() payload: { userId1: number | string; userId2: number | string },
    @ConnectedSocket() client: Socket,
  ) {
    const userId1 = Number(payload.userId1);
    const userId2 = Number(payload.userId2);
    const db = this.prisma as any;

    try {
      const messages = await db.message.findMany({
        where: {
          OR: [
            { expediteurId: userId1, recepteurId: userId2 },
            { expediteurId: userId2, recepteurId: userId1 },
          ],
        },
        orderBy: {
          dateEnvoi: 'asc',
        },
        include: {
          expediteur: { select: { nom: true } },
        },
      });

      client.emit('historique_charge', messages);
    } catch (error) {
      console.error("Erreur lors du chargement de l'historique :", error);
    }
  }
}