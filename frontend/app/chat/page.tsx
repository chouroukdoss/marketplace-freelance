'use client';
import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { io, Socket } from 'socket.io-client';

interface Message {
  id: number;
  expediteurId: number;
  recepteurId: number;
  contenu: string;
  dateEnvoi: string;
  expediteur: { nom: string };
}

interface Contact {
  id: number;
  nom: string;
  role: string;
}

export default function ChatPage() {
  const router = useRouter();
  const socketRef = useRef<Socket | null>(null);
  const finDeDiscussionRef = useRef<HTMLDivElement | null>(null);

  // Informations utilisateur connecté
  const [monId, setMonId] = useState<number | null>(null);
  const [monNom, setMonNom] = useState('');
  const [role, setRole] = useState('');

  // Contacts & Conversation active
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [contactSelectionne, setContactSelectionne] = useState<Contact | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [nouveauMessage, setNouveauMessage] = useState('');

  useEffect(() => {
    const token = localStorage.getItem('token');
    const userRole = localStorage.getItem('role') || '';
    if (!token) {
      router.push('/login');
      return;
    }
    setRole(userRole);

    // Décodage du Token JWT pour extraire votre identité
    try {
      const payloadBase64 = token.split('.')[1];
      const payload = JSON.parse(atob(payloadBase64));

      const extractedId = payload.sub || payload.id || payload.userId;
      if (extractedId) {
        setMonId(Number(extractedId));
      } else {
        console.error("Impossible de trouver l'ID utilisateur dans le token :", payload);
      }

      setMonNom(localStorage.getItem('nom') || 'Moi');
    } catch (e) {
      console.error('Erreur décodage JWT', e);
    }

    // Récupérer la liste des contacts
    fetchContacts(token);

    // Initialisation du Socket avec transports spécifiques pour éviter les erreurs CORS
    socketRef.current = io('http://localhost:3000', {
      transports: ['websocket', 'polling'],
    });

    return () => {
      if (socketRef.current) socketRef.current.disconnect();
    };
  }, []);

  // Déclencher l'association de l'ID utilisateur une fois le socket connecté & écouter les événements
  useEffect(() => {
    const socket = socketRef.current;
    if (monId && socket) {
      socket.emit('enregistrer_utilisateur', monId);

      const handleNouveauMessage = (message: Message) => {
        setMessages((prev) => {
          const appartientALaDiscussion =
            (message.expediteurId === monId && message.recepteurId === contactSelectionne?.id) ||
            (message.expediteurId === contactSelectionne?.id && message.recepteurId === monId);

          if (appartientALaDiscussion || message.expediteurId === monId) {
            return [...prev, message];
          }
          return prev;
        });
      };

      const handleHistoriqueCharge = (historique: Message[]) => {
        setMessages(historique);
      };

      // Écouter l'arrivée de nouveaux messages
      socket.on('nouveau_message', handleNouveauMessage);
      // Écouter la réception de l'historique
      socket.on('historique_charge', handleHistoriqueCharge);

      // Nettoyage des écouteurs pour éviter la duplication des messages
      return () => {
        socket.off('nouveau_message', handleNouveauMessage);
        socket.off('historique_charge', handleHistoriqueCharge);
      };
    }
  }, [monId, contactSelectionne]);

  // Scroller automatiquement vers le dernier message
  useEffect(() => {
    finDeDiscussionRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Demander l'historique de discussion à NestJS dès qu'on clique sur un contact
  useEffect(() => {
    if (monId && contactSelectionne && socketRef.current) {
      socketRef.current.emit('charger_historique', {
        userId1: monId,
        userId2: contactSelectionne.id,
      });
    }
  }, [contactSelectionne, monId]);

  // Récupérer la liste de tous les utilisateurs inscrits pour le chat
  const fetchContacts = async (token: string) => {
    try {
      const res = await fetch('http://localhost:3000/utilisateurs', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setContacts(data.filter((u: any) => u.id !== monId)); // Ne pas s'afficher soi-même
      }
    } catch (err) {
      console.error('Erreur chargement contacts', err);
    }
  };

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();

    if (!nouveauMessage.trim()) return console.log('Message vide');
    if (!monId) return console.error('Erreur: monId est introuvable');
    if (!contactSelectionne) return console.log('Aucun contact sélectionné');
    if (!socketRef.current) return console.error('Erreur: socket non connecté');

    // Émettre l'événement vers NestJS
    socketRef.current.emit('envoyer_message', {
      expediteurId: monId,
      recepteurId: contactSelectionne.id,
      contenu: nouveauMessage,
    });

    setNouveauMessage('');
  };

  const handleLogout = () => {
    localStorage.clear();
    router.push('/login');
  };

  return (
    <div className="flex flex-col h-screen bg-gray-50 text-gray-800">
      {/* Navbar Modernisée */}
      <nav className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-[#0d6efd]/15 shadow-sm transition-all duration-300 flex-shrink-0">
        <div className="max-w-6xl mx-auto px-6 py-4 flex justify-between items-center w-full">
          {/* Logo & Identité */}
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => router.push('/dashboard')}>
            <div className="w-10 h-10 bg-[#0d6efd] rounded-xl flex items-center justify-center font-black text-white text-xl shadow-md shadow-[#0d6efd]/20 hover:scale-105 transition-transform duration-200">
              M
            </div>
            <div className="flex flex-col">
              <span className="text-lg font-black tracking-tight text-[#0d6efd] leading-none">
                Marketplace
              </span>
              <span className="text-xs font-semibold text-[#0d6efd]/70 tracking-wider uppercase mt-1">
                Freelance
              </span>
            </div>
          </div>

          {/* Profil & Actions de Navigation */}
          <div className="flex items-center gap-4">
            {/* Badge Utilisateur */}
            <div className="hidden md:flex items-center gap-2 px-4 py-2 bg-[#0d6efd]/5 border border-[#0d6efd]/10 rounded-full">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#0d6efd]/60 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-[#0d6efd]"></span>
              </span>
              <span className="text-xs font-bold text-[#0d6efd]">
                {monNom} <span className="font-normal opacity-70">({role})</span>
              </span>
            </div>

            {/* Boutons d'Action */}
            <div className="flex items-center gap-2.5">
              <button
                onClick={() => router.push('/chat')}
                className="flex items-center gap-2 bg-[#0d6efd] text-white px-4 py-2 rounded-lg text-xs font-extrabold hover:bg-[#0d6efd]/90 hover:shadow-md hover:shadow-[#0d6efd]/10 active:scale-95 transition-all duration-200"
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-3.5 h-3.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H8.25m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H12m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 0 1-2.555-.337A5.972 5.972 0 0 1 5.41 20.97a.75.75 0 0 1-1.074-.765 5.99 5.99 0 0 1 1.01-3.207C4.12 15.68 3 13.977 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25Z" />
                </svg>
                <span className="hidden sm:inline">Messagerie</span>
              </button>

              <button
                onClick={() => router.push('/profil')}
                className="flex items-center gap-1.5 border-2 border-[#0d6efd] text-[#0d6efd] hover:bg-[#0d6efd] hover:text-white px-3.5 py-1.5 rounded-lg text-xs font-extrabold active:scale-95 transition-all duration-200"
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-3.5 h-3.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
                </svg>
                <span className="hidden sm:inline">Mon Profil</span>
              </button>

              <button
                onClick={handleLogout}
                className="flex items-center gap-1.5 bg-[#0d6efd]/10 text-[#0d6efd] hover:bg-[#0d6efd] hover:text-white px-3.5 py-1.5 rounded-lg text-xs font-extrabold active:scale-95 transition-all duration-200"
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-3.5 h-3.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0 0 13.5 3h-6a2.25 2.25 0 0 0-2.25 2.25v13.5A2.25 2.25 0 0 0 7.5 21h6a2.25 2.25 0 0 0 2.25-2.25V15M12 9l-3 3m0 0 3 3m-3-3h12.75" />
                </svg>
                <span className="hidden sm:inline">Déconnexion</span>
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Zone de Contenu du Chat avec Hauteur Fixée sous la Navbar */}
      <div className="flex flex-1 overflow-hidden">
        {/* 1. PANNEAU DE GAUCHE : LISTE DES DISCUSSIONS */}
        <div className="w-80 bg-white border-r border-gray-200 flex flex-col h-full">
          <div className="p-4 border-b border-gray-200">
            <h1 className="font-bold text-lg text-gray-950">Discussions</h1>
          </div>

          <div className="flex-1 overflow-y-auto divide-y divide-gray-100">
            {contacts.length === 0 ? (
              <p className="text-center text-sm text-gray-400 p-8">Aucun contact trouvé.</p>
            ) : (
              contacts.map((contact) => (
                <button
                  key={contact.id}
                  onClick={() => setContactSelectionne(contact)}
                  className={`w-full text-left p-4 hover:bg-gray-50 transition flex flex-col gap-1 ${
                    contactSelectionne?.id === contact.id ? 'bg-blue-50 border-l-4 border-blue-600' : ''
                  }`}
                >
                  <div className="flex justify-between items-center">
                    <span className="font-semibold text-sm text-gray-900">{contact.nom}</span>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-gray-100 font-bold uppercase text-gray-500">
                      {contact.role}
                    </span>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>

        {/* 2. ZONE DE DROITE : FIL DE DISCUSSION */}
        <div className="flex-1 flex flex-col h-full bg-gray-50">
          {contactSelectionne ? (
            <>
              {/* Header du chat */}
              <div className="p-4 bg-white border-b border-gray-200 shadow-sm flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-gray-900">{contactSelectionne.nom}</h3>
                  <p className="text-xs text-gray-500 uppercase font-semibold">Rôle: {contactSelectionne.role}</p>
                </div>
              </div>

              {/* Corps de la conversation */}
              <div className="flex-1 p-6 overflow-y-auto space-y-4">
                {messages.length === 0 ? (
                  <div className="text-center py-12 text-gray-400 text-sm">
                    Aucun message. Envoyez le premier message pour lancer la discussion !
                  </div>
                ) : (
                  messages.map((msg) => {
                    const estLeMien = msg.expediteurId === monId;
                    return (
                      <div key={msg.id} className={`flex ${estLeMien ? 'justify-end' : 'justify-start'}`}>
                        <div
                          className={`max-w-md px-4 py-2.5 rounded-2xl text-sm shadow-sm ${
                            estLeMien
                              ? 'bg-blue-600 text-white rounded-tr-none'
                              : 'bg-white text-gray-800 border border-gray-200 rounded-tl-none'
                          }`}
                        >
                          <p className="leading-relaxed whitespace-pre-line">{msg.contenu}</p>
                          <span
                            className={`block text-[9px] mt-1 text-right ${
                              estLeMien ? 'text-blue-100' : 'text-gray-400'
                            }`}
                          >
                            {new Date(msg.dateEnvoi).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={finDeDiscussionRef} />
              </div>

              {/* Saisie de message */}
              <form onSubmit={handleSendMessage} className="p-4 bg-white border-t border-gray-200 flex gap-2">
                <input
                  type="text"
                  placeholder={`Écrire à ${contactSelectionne.nom}...`}
                  className="flex-1 px-4 py-2.5 border border-gray-300 rounded-full focus:outline-none focus:border-blue-500 text-sm"
                  value={nouveauMessage}
                  onChange={(e) => setNouveauMessage(e.target.value)}
                  required
                />
                <button
                  type="submit"
                  className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-full font-semibold text-sm transition shadow-sm"
                >
                  Envoyer
                </button>
              </form>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-gray-400 bg-gray-50">
              <span className="text-5xl mb-3">💬</span>
              <p className="text-sm font-medium">Sélectionnez un contact pour démarrer la messagerie instantanée.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}