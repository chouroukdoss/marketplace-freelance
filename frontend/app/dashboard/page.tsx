'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import PaymentModal from '../components/PaymentModal';

interface Mission {
  id: number;
  titre: string;
  description: string;
  budget: number;
  competences: string | null;
  statut: string;
  dateCreation: string;
  candidatures?: CandidatureEnrichie[];
}

interface CandidatureEnrichie {
  id: number;
  statut: string;
  datePostulation: string;
  missionId: number;
  mission?: Mission;
  freelanceId: number;
  freelance?: {
    id: number;
    utilisateur: {
      id: number;
      nom: string;
    };
  };
}

interface PublicFreelance {
  id: number;
  titreProfessionnel: string | null;
  competences: string | null;
  portfolioUrl: string | null;
  cvUrl: string | null;
  noteMoyenne: number;
  utilisateur: {
    nom: string;
    email: string;
  };
  avis: Array<{
    id: number;
    note: number;
    commentaire: string;
    dateCreation: string;
    entreprise: {
      nomEntreprise: string;
    };
  }>;
}

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<{ id: number; nom: string; role: string }>({
    id: 0,
    nom: '',
    role: '',
  });
  const [missions, setMissions] = useState<Mission[]>([]);
  const [mesMissions, setMesMissions] = useState<Mission[]>([]);
  const [mesCandidatures, setMesCandidatures] = useState<CandidatureEnrichie[]>([]);

  // États pour la recherche et le filtrage (Freelance)
  const [searchQuery, setSearchQuery] = useState('');
  const [minBudget, setMinBudget] = useState('');

  // États formulaire de création de mission
  const [showForm, setShowForm] = useState(false);
  const [newMission, setNewMission] = useState({
    titre: '',
    description: '',
    budget: '',
    competences: '',
  });
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // États pour la modale Profil Public & Avis
  const [selectedFreelance, setSelectedFreelance] = useState<PublicFreelance | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [reviewNote, setReviewNote] = useState(5);
  const [reviewComment, setReviewComment] = useState('');
  const [reviewMessage, setReviewMessage] = useState('');

  // État pour le paiement Stripe
  const [selectedCandidatureId, setSelectedCandidatureId] = useState<number | null>(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const nom = localStorage.getItem('nom') || '';
    const role = localStorage.getItem('role') || '';

    // Extraction robuste de l'ID avec secours par décodage du token JWT
    let userId = Number(localStorage.getItem('userId')) || 0;
    if (!userId && token) {
      try {
        const base64Url = token.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const jsonPayload = decodeURIComponent(
          atob(base64)
            .split('')
            .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
            .join('')
        );
        const decoded = JSON.parse(jsonPayload);
        userId = Number(decoded.id || decoded.sub || decoded.userId) || 0;
        if (userId) {
          localStorage.setItem('userId', String(userId));
        }
      } catch (e) {
        // Ignorer l'erreur de parsage
      }
    }

    if (!token) {
      router.push('/login');
      return;
    }

    setUser({ id: userId, nom, role });
    fetchMissions(token, role);

    if (role === 'FREELANCE') {
      fetchMesCandidatures(token);
    }
  }, []);

  const fetchMissions = async (token: string, role: string) => {
    try {
      const resMes = await fetch('http://localhost:3000/missions/mes-missions', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (resMes.ok) {
        const dataMes = await resMes.json();
        setMesMissions(dataMes);
      }

      if (role === 'FREELANCE') {
        const resAll = await fetch('http://localhost:3000/missions', {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (resAll.ok) {
          const dataAll = await resAll.json();
          setMissions(dataAll);
        }
      }
    } catch (err) {
      console.error('Erreur lors de la récupération des missions', err);
    }
  };

  const fetchMesCandidatures = async (token: string) => {
    try {
      const res = await fetch('http://localhost:3000/candidatures/mes-candidatures', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setMesCandidatures(data);
      }
    } catch (err) {
      console.error('Erreur récup candidatures', err);
    }
  };

  const handleOpenFreelanceProfile = async (freelanceId: number) => {
    if (!freelanceId) {
      alert("L'identifiant du candidat est introuvable.");
      return;
    }
    const token = localStorage.getItem('token');
    setReviewMessage('');
    setReviewComment('');
    try {
      const res = await fetch(`http://localhost:3000/profils/freelance/${freelanceId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setSelectedFreelance(data);
        setShowModal(true);
      } else {
        const errorData = await res.json().catch(() => null);
        if (res.status === 404) {
          alert("Ce candidat n'a pas encore complété ou créé son profil public.");
        } else {
          alert(`Erreur (${res.status}): ${errorData?.message || 'Impossible de charger le profil.'}`);
        }
      }
    } catch (err) {
      alert('Impossible de joindre le serveur.');
    }
  };

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFreelance) return;
    const token = localStorage.getItem('token');
    try {
      const res = await fetch(`http://localhost:3000/profils/freelance/${selectedFreelance.id}/avis`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ note: reviewNote, commentaire: reviewComment }),
      });
      if (res.ok) {
        setReviewMessage('Avis enregistré avec succès!');
        handleOpenFreelanceProfile(selectedFreelance.id);
      } else {
        const data = await res.json();
        setReviewMessage(`Erreur: ${data.message || 'Déjà noté ou note invalide.'}`);
      }
    } catch (err) {
      setReviewMessage('Erreur de communication avec le serveur.');
    }
  };

  const handleCreateMission = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;
    const token = localStorage.getItem('token');
    setMessage('');
    setIsSubmitting(true);
    try {
      const res = await fetch('http://localhost:3000/missions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          titre: newMission.titre,
          description: newMission.description,
          budget: parseFloat(newMission.budget) || 0,
          competences: newMission.competences,
        }),
      });
      const responseData = await res.json();
      if (res.ok) {
        setMessage('Mission publiée avec succès !');
        setNewMission({ titre: '', description: '', budget: '', competences: '' });
        setShowForm(false);
        fetchMissions(token!, user.role);
      } else {
        setMessage(`Erreur: ${responseData.message || 'Impossible de publier la mission.'}`);
      }
    } catch (err) {
      setMessage('Impossible de joindre le serveur backend.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePostuler = async (missionId: number) => {
    const targetMission = missions.find((m) => m.id === missionId);
    if (
      targetMission?.statut === 'ACCEPTE' ||
      targetMission?.statut === 'POURVUE' ||
      targetMission?.candidatures?.some((c) => c.statut === 'ACCEPTE')
    ) {
      alert('Cette mission a déjà été attribuée à un autre freelance.');
      return;
    }
    const token = localStorage.getItem('token');
    try {
      const res = await fetch(`http://localhost:3000/candidatures/postuler/${missionId}`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok) {
        alert('Votre candidature a été enregistrée avec succès!');
        fetchMesCandidatures(token!);
      } else {
        alert(`Attention: ${data.message || 'Erreur lors de la postulation.'}`);
      }
    } catch (err) {
      alert('Impossible de joindre le serveur.');
    }
  };

  const handleAnnulerCandidature = async (missionId: number) => {
    const cand = mesCandidatures.find((c) => c.missionId === missionId);
    if (cand?.statut === 'ACCEPTE' || cand?.statut === 'REFUSE') {
      alert('Vous ne pouvez pas annuler une candidature qui a déjà été acceptée ou refusée.');
      return;
    }
    if (!confirm('Êtes-vous sûr de vouloir annuler votre candidature à cette mission?')) return;
    const token = localStorage.getItem('token');
    try {
      const res = await fetch(`http://localhost:3000/candidatures/annuler/${missionId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        alert('Candidature annulée avec succès.');
        fetchMesCandidatures(token!);
      } else {
        const data = await res.json();
        alert(`Erreur: ${data.message || "Impossible d'annuler la candidature."}`);
      }
    } catch (err) {
      alert('Impossible de joindre le serveur.');
    }
  };

  const handleTrancherCandidature = async (
    candidatureId: number,
    nouveauStatut: 'ACCEPTE' | 'REFUSE'
  ) => {
    const token = localStorage.getItem('token');
    try {
      const res = await fetch(`http://localhost:3000/candidatures/${candidatureId}/statut`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ statut: nouveauStatut }),
      });
      if (res.ok) {
        alert(`Statut mis à jour avec succès: ${nouveauStatut}`);
        fetchMissions(token!, user.role);
      } else {
        const data = await res.json();
        alert(`Erreur: ${data.message}`);
      }
    } catch (err) {
      alert('Erreur serveur lors de la mise à jour.');
    }
  };

  const handleDeleteMission = async (missionId: number) => {
    if (
      !confirm(
        'Êtes-vous sûr de vouloir supprimer définitivement cette mission? Toutes les candidatures associées seront effacées.'
      )
    ) {
      return;
    }
    const token = localStorage.getItem('token');
    try {
      const res = await fetch(`http://localhost:3000/missions/${missionId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        alert('Mission supprimée avec succès.');
        fetchMissions(token!, user.role);
      } else {
        alert('Erreur lors de la suppression de la mission.');
      }
    } catch (err) {
      alert('Impossible de joindre le serveur.');
    }
  };

  const handleLogout = () => {
    localStorage.clear();
    router.push('/login');
  };

  const handleMissionClick = (missionId: number) => {
    router.push(`/missions/${missionId}`);
  };

  const getStatusStyle = (statut: string) => {
    switch (statut) {
      case 'ACCEPTE':
        return 'bg-[#0d6efd] text-white border-[#0d6efd]';
      case 'REFUSE':
        return 'bg-white text-[#0d6efd] border-[#0d6efd]';
      default:
        return 'bg-[#0d6efd]/10 text-[#0d6efd] border-[#0d6efd]/30';
    }
  };

  const filteredMissions = missions.filter((mission) => {
    const matchesSearch =
      mission.titre.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (mission.competences &&
        mission.competences.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesBudget = !minBudget || mission.budget >= parseFloat(minBudget);
    const isNotMyOwn = !mesMissions.some((myM) => myM.id === mission.id);
    const isAvailable =
      mission.statut !== 'ACCEPTE' &&
      mission.statut !== 'POURVUE' &&
      mission.statut !== 'FERME' &&
      !mission.candidatures?.some((c) => c.statut === 'ACCEPTE');
    return matchesSearch && matchesBudget && isNotMyOwn && isAvailable;
  });

  return (
    <div className="min-h-screen bg-white text-[#0d6efd]">
      {/* Navbar Modernisée */}
      <nav className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-[#0d6efd]/15 shadow-sm transition-all duration-300">
        <div className="max-w-6xl mx-auto px-6 py-4 flex justify-between items-center">
          {/* Logo */}
          <div
            className="flex items-center gap-3 cursor-pointer"
            onClick={() => router.push('/dashboard')}
          >
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

          {/* Profil Actions */}
          <div className="flex items-center gap-4">
            <div className="hidden md:flex items-center gap-2 px-4 py-2 bg-[#0d6efd]/5 border border-[#0d6efd]/10 rounded-full">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#0d6efd]/60 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-[#0d6efd]"></span>
              </span>
              <span className="text-xs font-bold text-[#0d6efd]">
                {user.nom}{' '}
                <span className="font-normal opacity-70">({user.role})</span>
              </span>
            </div>

            {/* Boutons d'Action */}
            <div className="flex items-center gap-2.5">
              <button
                onClick={() => router.push('/chat')}
                className="flex items-center gap-2 bg-[#0d6efd] text-white px-4 py-2 rounded-lg text-xs font-extrabold hover:bg-[#0d6efd]/90 hover:shadow-md active:scale-95 transition-all duration-200"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={2.5}
                  stroke="currentColor"
                  className="w-3.5 h-3.5"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M8.625 12a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H8.25m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H12m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 0 1-2.555-.337A5.972 5.972 0 0 1 5.41 20.97a.75.75 0 0 1-1.074-.765 5.99 5.99 0 0 1 1.01-3.207C4.12 15.68 3 13.977 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25Z"
                  />
                </svg>
                <span className="hidden sm:inline">Messagerie</span>
              </button>

              {/* Bouton Contrats dans la Navbar */}
              <button
                onClick={() => router.push('/contrat')}
                className="flex items-center gap-1.5 border-2 hover:bg-[#0d6efd] hover:text-white border-[#0d6efd] text-[#0d6efd] px-3.5 py-1.5 rounded-lg text-xs font-extrabold active:scale-95 transition-all duration-200"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={2.5}
                  stroke="currentColor"
                  className="w-3.5 h-3.5"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5A3.375 3.375 0 0 0 10.125 2.25H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z"
                  />
                </svg>
                <span className="hidden sm:inline">Mes Contrats</span>
              </button>

              <button
                onClick={() => router.push('/profil')}
                className="flex items-center gap-1.5 border-2 hover:bg-[#0d6efd] hover:text-white border-[#0d6efd] text-[#0d6efd] px-3.5 py-1.5 rounded-lg text-xs font-extrabold active:scale-95 transition-all duration-200"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={2.5}
                  stroke="currentColor"
                  className="w-3.5 h-3.5"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632"
                  />
                </svg>
                <span className="hidden sm:inline">Mon Profil</span>
              </button>
              <button
                onClick={handleLogout}
                className="flex items-center gap-1.5 bg-[#0d6efd]/10 text-[#0d6efd] hover:bg-[#0d6efd] hover:text-white px-3.5 py-1.5 rounded-lg text-xs font-extrabold active:scale-95 transition-all duration-200"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={2.5}
                  stroke="currentColor"
                  className="w-3.5 h-3.5"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M15.75 9V5.25A2.25 2.25 0 0 0 13.5 3h-6a2.25 2.25 0 0 0-2.25 2.25v13.5A2.25 2.25 0 0 0 7.5 21h6a2.25 2.25 0 0 0 2.25-2.25V15M12 9l-3 3m0 0 3 3m-3-3h12.75"
                  />
                </svg>
                <span className="hidden sm:inline">Déconnexion</span>
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto p-6">
        {/* FORMULAIRE DE CRÉATION DE MISSION */}
        {(user.role === 'ENTREPRISE' || user.role === 'FREELANCE') && (
          <div className="mb-8">
            <button
              onClick={() => {
                setShowForm(!showForm);
                setMessage('');
              }}
              className="bg-[#0d6efd] text-white px-5 py-2.5 rounded-md hover:bg-[#0d6efd]/90 font-bold transition shadow"
            >
              {showForm ? 'Annuler' : 'Publier une nouvelle mission'}
            </button>
            {showForm && (
              <form
                onSubmit={handleCreateMission}
                className="bg-white p-6 rounded-lg shadow-md mt-4 max-w-2xl border border-[#0d6efd]/30"
              >
                <h3 className="text-lg font-bold mb-4 text-[#0d6efd]">
                  Détails de la mission
                </h3>
                {message && (
                  <p className="mb-4 text-sm font-semibold">{message}</p>
                )}
                <div className="mb-4">
                  <label className="block text-sm font-bold mb-1 text-[#0d6efd]">
                    Titre de l'offre
                  </label>
                  <input
                    type="text"
                    required
                    className="w-full px-3 py-2 border border-[#0d6efd] rounded-md focus:outline-none focus:ring-1 focus:ring-[#0d6efd] bg-white text-[#0d6efd]"
                    value={newMission.titre}
                    onChange={(e) =>
                      setNewMission({ ...newMission, titre: e.target.value })
                    }
                  />
                </div>
                <div className="mb-4">
                  <label className="block text-sm font-bold mb-1 text-[#0d6efd]">
                    Description
                  </label>
                  <textarea
                    required
                    rows={4}
                    className="w-full px-3 py-2 border border-[#0d6efd] rounded-md focus:outline-none focus:ring-1 focus:ring-[#0d6efd] bg-white text-[#0d6efd]"
                    value={newMission.description}
                    onChange={(e) =>
                      setNewMission({
                        ...newMission,
                        description: e.target.value,
                      })
                    }
                  />
                </div>
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-sm font-bold mb-1 text-[#0d6efd]">
                      Budget (DT)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      required
                      className="w-full px-3 py-2 border border-[#0d6efd] rounded-md focus:outline-none focus:ring-1 focus:ring-[#0d6efd] bg-white text-[#0d6efd]"
                      value={newMission.budget}
                      onChange={(e) =>
                        setNewMission({
                          ...newMission,
                          budget: e.target.value,
                        })
                      }
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold mb-1 text-[#0d6efd]">
                      Compétences requises
                    </label>
                    <input
                      type="text"
                      placeholder="Ex: React, Node"
                      className="w-full px-3 py-2 border border-[#0d6efd] rounded-md focus:outline-none focus:ring-1 focus:ring-[#0d6efd] bg-white text-[#0d6efd] placeholder-[#0d6efd]/50"
                      value={newMission.competences}
                      onChange={(e) =>
                        setNewMission({
                          ...newMission,
                          competences: e.target.value,
                        })
                      }
                    />
                  </div>
                </div>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className={`px-4 py-2 rounded-md font-bold text-white transition ${
                    isSubmitting
                      ? 'bg-[#0d6efd]/40 cursor-not-allowed'
                      : 'bg-[#0d6efd] hover:bg-[#0d6efd]/80'
                  }`}
                >
                  {isSubmitting ? 'Publication en cours...' : 'Mettre en ligne!'}
                </button>
              </form>
            )}
          </div>
        )}

        {/* SUIVI DES CANDIDATURES (Freelance) */}
        {user.role === 'FREELANCE' && mesCandidatures.length > 0 && (
          <div className="mb-10 bg-white p-6 rounded-lg shadow-sm border border-[#0d6efd]">
            <h2 className="text-xl font-bold mb-4 text-[#0d6efd]">
              Vos candidatures envoyées
            </h2>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-[#0d6efd]/20 text-[#0d6efd]/80 text-sm">
                    <th className="pb-2">Mission</th>
                    <th className="pb-2">Date</th>
                    <th className="pb-2">Statut & Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#0d6efd]/10">
                  {mesCandidatures.map((cand) => (
                    <tr
                      key={cand.id}
                      onClick={() =>
                        cand.missionId && handleMissionClick(cand.missionId)
                      }
                      className="hover:bg-[#0d6efd]/5 cursor-pointer text-[#0d6efd] transition-colors"
                    >
                      <td className="py-3 font-semibold">
                        {cand.mission?.titre}
                      </td>
                      <td className="py-3 text-[#0d6efd]/70">
                        {new Date(cand.datePostulation).toLocaleDateString()}
                      </td>
                      <td className="py-3 flex items-center gap-2">
                        <span
                          className={`px-2.5 py-1 rounded-full text-xs font-bold border ${getStatusStyle(
                            cand.statut
                          )}`}
                        >
                          {cand.statut}
                        </span>

                        {/* Bouton Voir le contrat pour le Freelance */}
                        {cand.statut === 'ACCEPTE' && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              router.push(`/contrat/${cand.id}`);
                            }}
                            className="bg-[#0d6efd] text-white px-3 py-1.5 rounded-md text-xs font-bold hover:bg-[#0d6efd]/90 transition"
                          >
                            Voir le contrat
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* BARRE DE RECHERCHE ET FILTRES (Freelance) */}
        {user.role === 'FREELANCE' && (
          <div className="bg-white p-4 rounded-lg shadow-sm border border-[#0d6efd] mb-6 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-[#0d6efd] uppercase mb-1">
                Rechercher une mission
              </label>
              <input
                type="text"
                placeholder="Ex: React, Développeur Mobile, Node..."
                className="w-full px-3 py-2 border border-[#0d6efd] focus:outline-none focus:border-[#0d6efd] rounded-md text-sm bg-white text-[#0d6efd] placeholder-[#0d6efd]/50"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-[#0d6efd] uppercase mb-1">
                Budget Minimum (DT)
              </label>
              <input
                type="number"
                placeholder="Ex: 500"
                className="w-full px-3 py-2 border border-[#0d6efd] focus:outline-none focus:border-[#0d6efd] rounded-md text-sm bg-white text-[#0d6efd] placeholder-[#0d6efd]/50"
                value={minBudget}
                onChange={(e) => setMinBudget(e.target.value)}
              />
            </div>
          </div>
        )}

        {/* SECTION VOS MISSIONS PUBLIÉES */}
        {mesMissions.length > 0 && (
          <div className="mb-10">
            <h2 className="text-2xl font-bold mb-6 text-[#0d6efd]">
              Vos missions publiées
            </h2>
            <div className="grid md:grid-cols-2 gap-6">
              {mesMissions.map((mission) => (
                <div
                  key={mission.id}
                  onClick={() => handleMissionClick(mission.id)}
                  className="bg-[#061624] p-6 rounded-lg shadow-sm flex flex-col justify-between text-white border border-[#061624] hover:border-[#0d6efd] cursor-pointer transition-all duration-200 mb-2"
                >
                  <div>
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="text-xl font-bold text-white">
                        {mission.titre}
                      </h3>
                      <span className="bg-[#0d6efd] text-white text-xs px-2.5 py-1 rounded-full font-bold">
                        {mission.budget} DT
                      </span>
                    </div>
                    <p className="text-white/80 text-sm mb-4 line-clamp-3">
                      {mission.description}
                    </p>
                    {mission.competences && (
                      <div className="flex flex-wrap gap-2 mb-4">
                        {mission.competences.split(',').map((comp, i) => (
                          <span
                            key={i}
                            className="bg-[#0d6efd] text-white text-xs px-2 py-0.5 rounded"
                          >
                            {comp.trim()}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Candidats postulant sur mes offres */}
                    {mission.candidatures && mission.candidatures.length > 0 && (
                      <div
                        className="mt-4 bg-white/5 p-3 rounded-md border border-white/20"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <p className="text-xs font-bold text-white/70 uppercase mb-2">
                          CANDIDATS POSTULANTS:
                        </p>
                        <div className="space-y-2">
                          {mission.candidatures.map((cand) => (
                            <div
                              key={cand.id}
                              className="flex justify-between items-center bg-[#061624] p-2 rounded border border-[#0d6efd]/30 text-xs"
                            >
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleOpenFreelanceProfile(cand.freelanceId);
                                }}
                                className="font-semibold text-[#0d6efd] hover:underline cursor-pointer text-left"
                              >
                                {cand.freelance?.utilisateur?.nom ||
                                  `Freelance N°${cand.freelanceId}`}
                              </button>

                              {(cand.statut === 'EN_ATTENTE' ||
                              cand.statut === 'EN ATTENTE') ? (
                                <div className="flex gap-1">
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setSelectedCandidatureId(cand.id);
                                    }}
                                    className="bg-[#0d6efd] text-white px-3 py-1.5 rounded-md font-bold hover:bg-[#0d6efd]/90 transition text-xs"
                                  >
                                    Accepter & Payer
                                  </button>
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleTrancherCandidature(
                                        cand.id,
                                        'REFUSE'
                                      );
                                    }}
                                    className="bg-white text-[#0d6efd] px-3 py-1.5 rounded font-bold hover:bg-white/90 transition text-xs border border-[#0d6efd]"
                                  >
                                    Refuser
                                  </button>
                                </div>
                              ) : (
                                <div className="flex items-center gap-2">
                                  <span
                                    className={`px-2.5 py-1 rounded-full text-xs font-bold border ${getStatusStyle(
                                      cand.statut
                                    )}`}
                                  >
                                    {cand.statut}
                                  </span>

                                  {/* Bouton Voir le contrat pour l'Entreprise */}
                                  {cand.statut === 'ACCEPTE' && (
                                    <button
                                      type="button"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        router.push(`/contrat/${cand.id}`);
                                      }}
                                      className="bg-[#0d6efd] text-white px-3 py-1.5 rounded-md text-xs font-bold hover:bg-[#0d6efd]/90 transition"
                                    >
                                      Voir le contrat
                                    </button>
                                  )}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="pt-4 mt-4 border-t border-white/10 flex justify-between items-center">
                    <span className="text-xs text-white/60">
                      Publié le{' '}
                      {new Date(mission.dateCreation).toLocaleDateString()}
                    </span>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteMission(mission.id);
                      }}
                      className="bg-white text-[#0d6efd] hover:bg-[#0d6efd] hover:text-white px-3 py-1.5 rounded text-xs font-bold transition"
                    >
                      Supprimer
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* CATALOGUE DES MISSIONS DISPONIBLES (Freelance) */}
        {user.role === 'FREELANCE' && (
          <div className="mb-10">
            <h2 className="text-2xl font-bold mb-6 text-[#0d6efd]">
              Missions disponibles pour vous
            </h2>
            {filteredMissions.length === 0 ? (
              <p className="text-[#0d6efd] bg-white p-6 rounded-lg shadow-sm border border-[#0d6efd] text-center">
                Aucune mission disponible pour le moment.
              </p>
            ) : (
              <div className="grid md:grid-cols-2 gap-6">
                {filteredMissions.map((mission) => (
                  <div
                    key={mission.id}
                    onClick={() => handleMissionClick(mission.id)}
                    className="bg-[#061624] p-6 rounded-lg shadow-sm flex flex-col justify-between text-white border border-[#061624] hover:border-[#0d6efd] cursor-pointer transition-all duration-200 mb-2"
                  >
                    <div>
                      <div className="flex justify-between items-start mb-2">
                        <h3 className="text-xl font-bold text-white">
                          {mission.titre}
                        </h3>
                        <span className="bg-[#0d6efd] text-white text-xs px-2.5 py-1 rounded-full font-bold">
                          {mission.budget} DT
                        </span>
                      </div>
                      <p className="text-white/80 text-sm mb-4 line-clamp-3">
                        {mission.description}
                      </p>
                      {mission.competences && (
                        <div className="flex flex-wrap gap-2 mb-4">
                          {mission.competences.split(',').map((comp, i) => (
                            <span
                              key={i}
                              className="bg-[#0d6efd] text-white text-xs px-2 py-0.5 rounded"
                            >
                              {comp.trim()}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="pt-4 mt-4 border-t border-white/10 flex justify-between items-center">
                      <span className="text-xs text-white/60">
                        Publié le{' '}
                        {new Date(mission.dateCreation).toLocaleDateString()}
                      </span>
                      {mesCandidatures.some((c) => c.missionId === mission.id) ? (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleAnnulerCandidature(mission.id);
                          }}
                          disabled={
                            mesCandidatures.find((c) => c.missionId === mission.id)
                              ?.statut === 'ACCEPTE' ||
                            mesCandidatures.find((c) => c.missionId === mission.id)
                              ?.statut === 'REFUSE'
                          }
                          className={`px-4 py-1.5 rounded text-sm font-bold transition ${
                            mesCandidatures.find((c) => c.missionId === mission.id)
                              ?.statut === 'ACCEPTE' ||
                            mesCandidatures.find((c) => c.missionId === mission.id)
                              ?.statut === 'REFUSE'
                              ? 'bg-[#0d6efd]/40 text-white/70 cursor-not-allowed'
                              : 'bg-white text-[#0d6efd] hover:bg-white/90'
                          }`}
                        >
                          {mesCandidatures.find((c) => c.missionId === mission.id)
                            ?.statut === 'ACCEPTE'
                            ? 'Retenu'
                            : mesCandidatures.find((c) => c.missionId === mission.id)
                                ?.statut === 'REFUSE'
                            ? 'Refusé'
                            : 'Annuler ma candidature'}
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handlePostuler(mission.id);
                          }}
                          className="bg-[#0d6efd] hover:bg-[#0d6efd]/80 px-4 py-1.5 rounded text-sm font-bold transition text-white"
                        >
                          Postuler
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </main>

      {/* MODALE COMMUNE: PROFIL PUBLIC DU FREELANCE & LAISSER UN AVIS */}
      {showModal && selectedFreelance && (
        <div className="fixed inset-0 bg-[#061624]/75 flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-lg p-6 max-w-xl w-full max-h-[90vh] overflow-y-auto border-2 border-[#0d6efd] shadow-xl">
            <div className="flex justify-between items-start border-b border-[#0d6efd]/30 pb-3 mb-4">
              <div>
                <h3 className="text-xl font-bold text-[#0d6efd]">
                  {selectedFreelance.utilisateur.nom}
                </h3>
                <p className="text-sm text-[#0d6efd] font-medium">
                  {selectedFreelance.titreProfessionnel || 'Titre non défini'}
                </p>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="text-[#0d6efd] hover:text-[#0d6efd]/80 font-bold text-xl"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-sm text-[#0d6efd]">
              <div>
                <span className="block text-xs font-bold text-[#0d6efd]/70 uppercase">
                  Contact:
                </span>
                <span>{selectedFreelance.utilisateur.email}</span>
              </div>
              <div>
                <span className="block text-xs font-bold text-[#0d6efd]/70 uppercase">
                  Note moyenne de la communauté :
                </span>
                <span className="bg-[#0d6efd] text-white px-2 py-0.5 rounded font-bold text-xs inline-block mt-1">
                  {selectedFreelance.noteMoyenne} / 5 ★
                </span>
              </div>
              <div>
                <span className="block text-xs font-bold text-[#0d6efd]/70 uppercase">
                  Compétences:
                </span>
                <div className="flex flex-wrap gap-1 mt-1">
                  {selectedFreelance.competences ? (
                    selectedFreelance.competences.split(',').map((c, i) => (
                      <span
                        key={i}
                        className="bg-[#0d6efd]/10 px-2 py-0.5 rounded text-xs text-[#0d6efd] border border-[#0d6efd]/20"
                      >
                        {c.trim()}
                      </span>
                    ))
                  ) : (
                    <span className="text-[#0d6efd]/60 italic">
                      Aucune compétence mentionnée
                    </span>
                  )}
                </div>
              </div>
              <div className="flex gap-4 pt-1">
                {selectedFreelance.portfolioUrl && (
                  <a
                    href={selectedFreelance.portfolioUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="text-xs text-[#0d6efd] font-bold hover:underline"
                  >
                    Visiter le Portfolio
                  </a>
                )}
                {selectedFreelance.cvUrl && (
                  <a
                    href={selectedFreelance.cvUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="text-xs text-[#0d6efd] font-bold hover:underline"
                  >
                    Consulter le CV
                  </a>
                )}
              </div>
            </div>

            <div className="mt-6 border-t border-[#0d6efd]/30 pt-4 text-[#0d6efd]">
              <h4 className="text-sm font-bold mb-2">
                Avis des précédents recruteurs ({selectedFreelance.avis.length})
              </h4>
              {selectedFreelance.avis.length === 0 ? (
                <p className="text-xs text-[#0d6efd]/60 italic">
                  Aucun avis pour le moment.
                </p>
              ) : (
                <div className="space-y-2 max-h-32 overflow-y-auto pr-1">
                  {selectedFreelance.avis.map((av) => (
                    <div
                      key={av.id}
                      className="bg-[#0d6efd]/5 p-2 rounded border border-[#0d6efd]/20 text-xs mb-1"
                    >
                      <div className="flex justify-between font-bold">
                        <span>{av.entreprise.nomEntreprise}</span>
                        <span className="text-[#0d6efd]">{av.note}/5 ★</span>
                      </div>
                      <p className="text-[#0d6efd]/80 italic">
                        "{av.commentaire}"
                      </p>
                    </div>
                  ))}
                </div>
              )}

              {user.role === 'ENTREPRISE' && (
                <form
                  onSubmit={handleSubmitReview}
                  className="mt-6 border-t border-[#0d6efd]/30 pt-4 text-[#0d6efd]"
                >
                  <h4 className="text-sm font-bold mb-3 text-[#0d6efd]">
                    Laisser un avis sur ce freelance
                  </h4>
                  {reviewMessage && (
                    <p className="text-xs font-semibold mb-2">{reviewMessage}</p>
                  )}
                  <div className="flex items-center gap-2 mb-3">
                    <label className="text-xs font-bold text-[#0d6efd]">
                      Note (1-5):
                    </label>
                    <select
                      value={reviewNote}
                      onChange={(e) => setReviewNote(Number(e.target.value))}
                      className="border border-[#0d6efd] rounded px-2 py-1 text-xs bg-white text-[#0d6efd] focus:outline-none"
                    >
                      {[1, 2, 3, 4, 5].map((n) => (
                        <option key={n} value={n}>
                          {n}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="mb-3">
                    <textarea
                      required
                      placeholder="Votre commentaire sur la mission effectuée..."
                      value={reviewComment}
                      onChange={(e) => setReviewComment(e.target.value)}
                      className="w-full border border-[#0d6efd] rounded p-2 text-xs bg-white text-[#0d6efd] focus:outline-none focus:ring-1 focus:ring-[#0d6efd]"
                      rows={3}
                    />
                  </div>
                  <button
                    type="submit"
                    className="bg-[#0d6efd] text-white px-3 py-1.5 rounded text-xs font-bold hover:bg-[#0d6efd]/90 transition"
                  >
                    Publier l'avis
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      )}

      {/* MODALE DE PAIEMENT STRIPE */}
      {selectedCandidatureId && (
        <PaymentModal
          candidatureId={selectedCandidatureId}
          entrepriseId={user.id}
          onClose={() => setSelectedCandidatureId(null)}
          onPaymentSuccess={() => {
            const token = localStorage.getItem('token');
            if (token) fetchMissions(token, user.role);
          }}
        />
      )}
    </div>
  );
}