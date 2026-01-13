'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface Match {
  id: string;
  teamA: string;
  teamB: string;
  matchDate: string;
  players: { name: string; team: 'A' | 'B' }[];
  finalScore: { teamA: number; teamB: number; bestScorer?: string } | null;
  winner: 'A' | 'B' | 'DRAW' | null;
  isFinished: boolean;
}

interface Prediction {
  id: string;
  matchId: string;
  exactScore: { teamA: number; teamB: number };
  bestScorer: string;
  result: 'A' | 'B' | 'DRAW';
  points: number;
}

export default function MatchesPage() {
  const [matches, setMatches] = useState<Match[]>([]);
  const [predictions, setPredictions] = useState<Record<string, Prediction>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [userId, setUserId] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    // Vérifier si l'utilisateur est connecté
    const storedUserId = localStorage.getItem('userId');
    if (!storedUserId) {
      router.push('/');
      return;
    }
    setUserId(storedUserId);

    fetchMatches();
    fetchPredictions(storedUserId);
  }, [router]);

  const fetchMatches = async () => {
    try {
      // Essayer d'abord sans filtre pour voir tous les matchs non terminés
      const response = await fetch('/api/matches');
      const data = await response.json();
      console.log('[Matches Page] Réponse API:', data);
      if (response.ok) {
        // Filtrer côté client pour ne garder que les matchs non terminés
        const nonFinishedMatches = (data.matches || []).filter((m: Match) => !m.isFinished);
        console.log('[Matches Page] Nombre de matchs non terminés:', nonFinishedMatches.length);
        setMatches(nonFinishedMatches);
      } else {
        console.error('[Matches Page] Erreur API:', data.error);
        setError(data.error || 'Erreur lors du chargement des matchs');
      }
    } catch (err) {
      console.error('[Matches Page] Erreur de connexion:', err);
      setError('Erreur de connexion au serveur');
    } finally {
      setLoading(false);
    }
  };

  const fetchPredictions = async (uid: string) => {
    try {
      const response = await fetch(`/api/predictions?userId=${uid}`);
      const data = await response.json();
      if (response.ok) {
        const preds: Record<string, Prediction> = {};
        data.predictions.forEach((pred: any) => {
          preds[pred.matchId] = pred;
        });
        setPredictions(preds);
      }
    } catch (err) {
      console.error('Erreur lors du chargement des pronostics:', err);
    }
  };

  if (loading) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600">Chargement des matchs...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
        {error}
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-800">Matchs disponibles</h1>
        <div className="text-sm text-gray-500">
          Heure actuelle : {new Date().toLocaleString('fr-FR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            timeZoneName: 'short'
          })}
        </div>
      </div>

      {matches.length === 0 ? (
        <div className="bg-white rounded-lg shadow-md p-8 text-center">
          <p className="text-gray-600">Aucun match à venir pour le moment.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {matches.map((match) => (
            <MatchCard
              key={match.id}
              match={match}
              prediction={predictions[match.id]}
              userId={userId!}
              onPredictionCreated={() => fetchPredictions(userId!)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function MatchCard({
  match,
  prediction,
  userId,
  onPredictionCreated,
}: {
  match: Match;
  prediction?: Prediction;
  userId: string;
  onPredictionCreated: () => void;
}) {
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    exactScoreA: '',
    exactScoreB: '',
    bestScorer: '',
    result: '' as 'A' | 'B' | 'DRAW' | '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  
  // Calculer automatiquement le résultat à partir des scores
  const calculateResult = (scoreA: string, scoreB: string): 'A' | 'B' | 'DRAW' | '' => {
    const a = parseInt(scoreA) || 0;
    const b = parseInt(scoreB) || 0;
    if (scoreA === '' || scoreB === '') return '';
    if (a > b) return 'A';
    if (b > a) return 'B';
    return 'DRAW';
  };
  
  // Mettre à jour le résultat quand les scores changent
  const handleScoreChange = (field: 'exactScoreA' | 'exactScoreB', value: string) => {
    const newFormData = { ...formData, [field]: value };
    const newResult = calculateResult(
      field === 'exactScoreA' ? value : formData.exactScoreA,
      field === 'exactScoreB' ? value : formData.exactScoreB
    );
    newFormData.result = newResult;
    setFormData(newFormData);
  };
  const [currentTime, setCurrentTime] = useState(new Date());

  // Rafraîchir l'heure toutes les minutes pour mettre à jour l'affichage
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000); // Toutes les minutes

    return () => clearInterval(interval);
  }, []);

  // Utiliser l'heure actuelle du client pour la comparaison
  // Convertir la date du match en objet Date
  const matchDate = new Date(match.matchDate);
  const now = currentTime;
  
  // Comparer les timestamps pour éviter les problèmes de fuseau horaire
  // Ajouter une marge de 5 minutes pour permettre les pronostics de dernière minute
  const fiveMinutesInMs = 5 * 60 * 1000;
  const hasStarted = now.getTime() >= matchDate.getTime() - fiveMinutesInMs;
  const canPredict = !hasStarted && !match.isFinished && !prediction;
  
  // Calculer le nombre de jours restants
  const daysRemaining = Math.max(0, Math.floor((matchDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');

    const scoreA = parseInt(formData.exactScoreA);
    const scoreB = parseInt(formData.exactScoreB);

    if (isNaN(scoreA) || isNaN(scoreB) || scoreA < 0 || scoreB < 0) {
      setError('Les scores doivent être des nombres positifs');
      setSubmitting(false);
      return;
    }

    if (!formData.bestScorer.trim()) {
      setError('Veuillez sélectionner un meilleur buteur');
      setSubmitting(false);
      return;
    }

    if (!formData.result) {
      setError('Veuillez vérifier le résultat du match');
      setSubmitting(false);
      return;
    }

    try {
      const response = await fetch('/api/predictions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId,
          matchId: match.id,
          exactScore: {
            teamA: scoreA,
            teamB: scoreB,
          },
          bestScorer: formData.bestScorer,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Erreur lors de la création du pronostic');
        setSubmitting(false);
        return;
      }

      setShowForm(false);
      onPredictionCreated();
    } catch (err) {
      setError('Erreur de connexion au serveur');
      setSubmitting(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex justify-between items-start mb-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">
            {match.teamA} vs {match.teamB}
          </h2>
          <p className="text-gray-600 mt-1">
            {matchDate.toLocaleString('fr-FR', {
              day: 'numeric',
              month: 'long',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
              timeZoneName: 'short'
            })}
            {!hasStarted && daysRemaining > 0 && (
              <span className="ml-2 text-sm text-green-600">
                (dans {daysRemaining} jour{daysRemaining > 1 ? 's' : ''})
              </span>
            )}
            {hasStarted && !match.isFinished && (
              <span className="ml-2 text-sm text-red-600">
                (Match en cours ou commencé)
              </span>
            )}
          </p>
        </div>
        {match.finalScore && (
          <div className="text-right">
            <p className="text-sm text-gray-500">Score final</p>
            <p className="text-xl font-bold">
              {match.finalScore.teamA} - {match.finalScore.teamB}
            </p>
            {match.winner && (
              <p className="text-sm font-semibold mt-1">
                {match.winner === 'A' ? (
                  <span className="text-green-600">🏆 {match.teamA} gagne</span>
                ) : match.winner === 'B' ? (
                  <span className="text-green-600">🏆 {match.teamB} gagne</span>
                ) : (
                  <span className="text-gray-600">⚖️ Match nul</span>
                )}
              </p>
            )}
          </div>
        )}
      </div>

      {prediction && (
        <div className="bg-indigo-50 border border-indigo-200 rounded-md p-4 mb-4">
          <p className="font-semibold text-indigo-800 mb-2">Votre pronostic :</p>
          <p>
            Score : {prediction.exactScore.teamA} - {prediction.exactScore.teamB}
          </p>
          <p>Meilleur buteur : {prediction.bestScorer}</p>
          <p>Résultat : {prediction.result === 'A' ? 'Victoire ' + match.teamA : prediction.result === 'B' ? 'Victoire ' + match.teamB : 'Match nul'}</p>
          {match.isFinished && (
            <p className="mt-2 font-bold text-indigo-600">
              Points obtenus : {prediction.points}
            </p>
          )}
        </div>
      )}

      {canPredict && !showForm && (
        <button
          onClick={() => setShowForm(true)}
          className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 transition-colors"
        >
          Faire un pronostic
        </button>
      )}

      {showForm && (
        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Score {match.teamA}
              </label>
              <input
                type="number"
                min="0"
                value={formData.exactScoreA}
                onChange={(e) => handleScoreChange('exactScoreA', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Score {match.teamB}
              </label>
              <input
                type="number"
                min="0"
                value={formData.exactScoreB}
                onChange={(e) => handleScoreChange('exactScoreB', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Résultat du match
            </label>
            <select
              value={formData.result}
              onChange={(e) => setFormData({ ...formData, result: e.target.value as 'A' | 'B' | 'DRAW' })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md bg-indigo-50 font-medium"
              required
            >
              <option value="">
                {!formData.exactScoreA || !formData.exactScoreB 
                  ? 'Entrez d\'abord les scores pour voir le résultat' 
                  : 'Sélectionner le résultat'}
              </option>
              <option value="A">🏆 Victoire {match.teamA}</option>
              <option value="B">🏆 Victoire {match.teamB}</option>
              <option value="DRAW">⚖️ Match nul</option>
            </select>
            {formData.result && (
              <div className="mt-2 p-2 bg-green-50 border border-green-200 rounded-md">
                <p className="text-sm font-medium text-green-800">
                  {formData.result === 'A' 
                    ? `✅ Vous prédisez une victoire de ${match.teamA}`
                    : formData.result === 'B'
                    ? `✅ Vous prédisez une victoire de ${match.teamB}`
                    : '✅ Vous prédisez un match nul'}
                </p>
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Meilleur buteur
            </label>
            <select
              value={formData.bestScorer}
              onChange={(e) => setFormData({ ...formData, bestScorer: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
              required
            >
              <option value="">Sélectionner un joueur</option>
              {match.players.map((player, idx) => (
                <option key={idx} value={player.name}>
                  {player.name} ({player.team === 'A' ? match.teamA : match.teamB})
                </option>
              ))}
            </select>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md text-sm">
              {error}
            </div>
          )}

          <div className="flex space-x-2">
            <button
              type="submit"
              disabled={submitting}
              className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 disabled:opacity-50 transition-colors"
            >
              {submitting ? 'Envoi...' : 'Valider'}
            </button>
            <button
              type="button"
              onClick={() => {
                setShowForm(false);
                setError('');
              }}
              className="bg-gray-200 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-300 transition-colors"
            >
              Annuler
            </button>
          </div>
        </form>
      )}

      {hasStarted && !prediction && (
        <p className="text-gray-500 italic">Le match a commencé, vous ne pouvez plus pronostiquer.</p>
      )}
    </div>
  );
}
