'use client';

import { useState, useEffect } from 'react';

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

export default function AdminResultsPage() {
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editingMatch, setEditingMatch] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    teamA: 0,
    teamB: 0,
    bestScorer: '',
  });

  useEffect(() => {
    fetchMatches();
  }, []);

  const fetchMatches = async () => {
    try {
      const response = await fetch('/api/matches');
      const data = await response.json();
      if (response.ok) {
        setMatches(data.matches);
      } else {
        setError(data.error || 'Erreur lors du chargement des matchs');
      }
    } catch (err) {
      setError('Erreur de connexion au serveur');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (matchId: string) => {
    setError('');

    if (formData.teamA < 0 || formData.teamB < 0) {
      setError('Les scores doivent être positifs');
      return;
    }

    try {
      const response = await fetch(`/api/matches/${matchId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          finalScore: {
            teamA: formData.teamA,
            teamB: formData.teamB,
            bestScorer: formData.bestScorer || undefined,
          },
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Erreur lors de la mise à jour du résultat');
        return;
      }

      setEditingMatch(null);
      fetchMatches(); // Recharger les matchs
    } catch (err) {
      setError('Erreur de connexion au serveur');
    }
  };

  const startEditing = (match: Match) => {
    setEditingMatch(match.id);
    setFormData({
      teamA: match.finalScore?.teamA || 0,
      teamB: match.finalScore?.teamB || 0,
      bestScorer: match.finalScore?.bestScorer || '',
    });
  };

  if (loading) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600">Chargement des matchs...</p>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-800 mb-6">Saisir les résultats (Admin)</h1>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md mb-4">
          {error}
        </div>
      )}

      {matches.length === 0 ? (
        <div className="bg-white rounded-lg shadow-md p-8 text-center">
          <p className="text-gray-600">Aucun match pour le moment.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {matches.map((match) => (
            <div key={match.id} className="bg-white rounded-lg shadow-md p-6">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h2 className="text-2xl font-bold text-gray-800">
                    {match.teamA} vs {match.teamB}
                  </h2>
                  <p className="text-gray-600 mt-1">
                    {new Date(match.matchDate).toLocaleDateString('fr-FR', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
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
                    {match.finalScore.bestScorer && (
                      <p className="text-sm text-gray-600 mt-1">
                        Meilleur buteur: {match.finalScore.bestScorer}
                      </p>
                    )}
                  </div>
                )}
              </div>

              {editingMatch === match.id ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Score {match.teamA}
                      </label>
                      <input
                        type="number"
                        min="0"
                        value={formData.teamA}
                        onChange={(e) =>
                          setFormData({ ...formData, teamA: parseInt(e.target.value) || 0 })
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-md"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Score {match.teamB}
                      </label>
                      <input
                        type="number"
                        min="0"
                        value={formData.teamB}
                        onChange={(e) =>
                          setFormData({ ...formData, teamB: parseInt(e.target.value) || 0 })
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-md"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Meilleur buteur (optionnel)
                    </label>
                    <select
                      value={formData.bestScorer}
                      onChange={(e) => setFormData({ ...formData, bestScorer: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    >
                      <option value="">Aucun</option>
                      {match.players.map((player, idx) => (
                        <option key={idx} value={player.name}>
                          {player.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="flex space-x-2">
                    <button
                      onClick={() => handleSubmit(match.id)}
                      className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 transition-colors"
                    >
                      Enregistrer
                    </button>
                    <button
                      onClick={() => setEditingMatch(null)}
                      className="bg-gray-200 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-300 transition-colors"
                    >
                      Annuler
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => startEditing(match)}
                  className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 transition-colors"
                >
                  {match.isFinished ? 'Modifier le résultat' : 'Saisir le résultat'}
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
