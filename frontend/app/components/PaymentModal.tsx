'use client';

import { useEffect, useState } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, useStripe, useElements, PaymentElement } from '@stripe/react-stripe-js';

// Récupération de la clé publique
const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

interface CheckoutFormProps {
  onSuccess: () => void;
}

function CheckoutForm({ onSuccess }: CheckoutFormProps) {
  const stripe = useStripe();
  const elements = useElements();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) return;

    setIsProcessing(true);
    setErrorMessage(null);

    try {
      const { error, paymentIntent } = await stripe.confirmPayment({
        elements,
        redirect: 'if_required',
      });

      if (error) {
        setErrorMessage(error.message || 'Une erreur est survenue lors du paiement.');
        setIsProcessing(false);
      } else if (paymentIntent && paymentIntent.status === 'succeeded') {
        alert('Paiement sécurisé effectué avec succès !');
        onSuccess();
      } else {
        setErrorMessage(`Statut du paiement : ${paymentIntent?.status || 'inconnu'}. Veuillez réessayer.`);
        setIsProcessing(false);
      }
    } catch (err: any) {
      console.error('Erreur Stripe inattendue:', err);
      setErrorMessage('Une erreur inattendue est survenue.');
      setIsProcessing(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <PaymentElement />
      {errorMessage && (
        <p className="text-red-500 text-xs font-bold bg-red-50 p-2 rounded border border-red-200">
          {errorMessage}
        </p>
      )}
      <button
        type="submit"
        disabled={!stripe || isProcessing}
        className="w-full bg-[#0d6efd] text-[#ffffff] py-2.5 rounded-md font-bold hover:bg-[#0d6efd]/90 transition disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isProcessing ? 'Traitement en cours...' : 'Payer et Confirmer'}
      </button>
    </form>
  );
}

interface PaymentModalProps {
  candidatureId: number;
  entrepriseId: number;
  onClose: () => void;
  onPaymentSuccess: () => void;
}

export default function PaymentModal({
  candidatureId,
  entrepriseId,
  onClose,
  onPaymentSuccess,
}: PaymentModalProps) {
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setError(null);

    if (!candidatureId || candidatureId <= 0) {
      setError('Identifiant de candidature invalide.');
      return;
    }

    if (!entrepriseId || entrepriseId <= 0) {
      setError('Session entreprise invalide (ID manquant dans la session). Veuillez vous déconnecter puis re-connecter.');
      return;
    }

    fetch('http://localhost:3000/payments/create-intent', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ candidatureId, entrepriseId }),
    })
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.message || "Erreur lors de la création de l'intention de paiement");
        }
        return data;
      })
      .then((data) => {
        if (data.clientSecret) {
          setClientSecret(data.clientSecret);
        } else {
          setError('Impossible de récupérer la clé de transaction Stripe.');
        }
      })
      .catch((err: any) => {
        console.error('Erreur initialisation paiement:', err);
        setError(err.message || 'Erreur de connexion au serveur backend (port 3000).');
      });
  }, [candidatureId, entrepriseId]);

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white p-6 rounded-xl border border-[#0d6efd] max-w-md w-full relative shadow-xl">
        <button
          onClick={onClose}
          className="absolute top-3 right-3 text-gray-400 hover:text-gray-700 font-bold text-lg"
        >
          ✕
        </button>

        <h3 className="text-lg font-black text-[#0d6efd] mb-4">Paiement sécurisé par Carte</h3>

        {error ? (
          <div className="text-center py-4">
            <p className="text-red-500 text-sm font-semibold mb-3">{error}</p>
            <button
              onClick={onClose}
              className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-md text-sm font-medium transition"
            >
              Fermer
            </button>
          </div>
        ) : clientSecret ? (
          <Elements stripe={stripePromise} options={{ clientSecret }}>
            <CheckoutForm
              onSuccess={() => {
                onPaymentSuccess();
                onClose();
              }}
            />
          </Elements>
        ) : (
          <div className="flex flex-col items-center justify-center py-6 space-y-3">
            <div className="w-8 h-8 border-4 border-[#0d6efd] border-t-transparent rounded-full animate-spin"></div>
            <p className="text-sm text-gray-600 font-medium">Chargement du module Stripe...</p>
          </div>
        )}
      </div>
    </div>
  );
}