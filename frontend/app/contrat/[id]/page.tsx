'use client';
import { use } from 'react';
import { useRouter } from 'next/navigation';

export default function ContratDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();

  return (
    <div className="min-h-screen bg-white text-[#0d6efd] p-8">
      <div className="max-w-4xl mx-auto border border-[#0d6efd]/30 rounded-xl p-6 shadow-lg bg-white">
        <button
          onClick={() => router.back()}
          className="mb-6 flex items-center gap-2 text-xs font-bold text-[#0d6efd] hover:underline"
        >
          ← Retour
        </button>

        <div className="border-b border-[#0d6efd]/20 pb-4 mb-6 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-black">Contrat de Prestation de Service</h1>
            <p className="text-xs text-[#0d6efd]/70 font-mono mt-1">ID Candidature / Contrat : #{id}</p>
          </div>
          <span className="bg-[#0d6efd] text-white text-xs font-bold px-3 py-1 rounded-full">
            ACTIF / ACCEPTÉ
          </span>
        </div>

        <div className="space-y-4 text-sm text-[#0d6efd]">
          <div className="p-4 bg-[#0d6efd]/5 rounded-lg border border-[#0d6efd]/10">
            <h3 className="font-bold mb-2">Termes du Contrat</h3>
            <p className="text-xs text-[#0d6efd]/80 leading-relaxed">
              Ce contrat atteste que la candidature <strong>#{id}</strong> a été acceptée avec succès. Les deux parties s'engagent à respecter les termes de la mission telle qu'elle a été définie.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}