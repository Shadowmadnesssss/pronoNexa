'use client';

import { useState } from 'react';

export default function AdminPage() {
  const [formData, setFormData] = useState({
    teamA: '',
    teamB: '',
    matchDate: '',
    players: [{ name: '', team: 'A' as 'A' | 'B' }],
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const addPlayer = () => {
    setFormData({
      ...formData,
      players: [...formData.players, { name: '', team: 'A' }],
    });
  };

  const removePlayer = (index: number) => {
    setFormData({
      ...formData,
      players: formData.players.filter((_p: { name: string; team: 'A' | 'B' }, i: number) => i !== index),
    });
  };

  const updatePlayer = (index: number, field: 'name' | 'team', value: string) => {
    const newPlayers = [...formData.players];
    newPlayers[index] = { ...newPlayers[index], [field]: value };
    setFormData({ ...formData, players: newPlayers });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    // Validation
    if (!formData.teamA || !formData.teamB || !formData.matchDate) {
      setError('Tous les champs sont requis');
      setLoading(false);
      return;
    }

    const validPlayers = formData.players.filter((p: { name: string; team: 'A' | 'B' }) => p.name.trim() !== '');
    if (validPlayers.length === 0) {
      setError('Au moins un joueur est requis');
      setLoading(false);
      return;
    }

    try {
      const response = await fetch('/api/matches', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          teamA: formData.teamA,
          teamB: formData.teamB,
          matchDate: formData.matchDate,
          players: validPlayers,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Erreur lors de la création du match');
        setLoading(false);
        return;
      }

      setSuccess('Match créé avec succès !');
      setFormData({
        teamA: '',
        teamB: '',
        matchDate: '',
        players: [{ name: '', team: 'A' }],
      });
    } catch (err) {
      setError('Erreur de connexion au serveur');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-3xl font-bold text-gray-800 mb-6">Créer un match (Admin)</h1>

      <div className="bg-white rounded-lg shadow-md p-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Équipe A
              </label>
              <input
                type="text"
                value={formData.teamA}
                onChange={(e) => setFormData({ ...formData, teamA: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Équipe B
              </label>
              <input
                type="text"
                value={formData.teamB}
                onChange={(e) => setFormData({ ...formData, teamB: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Date et heure du match
            </label>
            <input
              type="datetime-local"
              value={formData.matchDate}
              onChange={(e) => setFormData({ ...formData, matchDate: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
              required
            />
          </div>

          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="block text-sm font-medium text-gray-700">
                Joueurs
              </label>
              <button
                type="button"
                onClick={addPlayer}
                className="text-sm text-indigo-600 hover:text-indigo-700"
              >
                + Ajouter un joueur
              </button>
            </div>
            <div className="space-y-2">
              {formData.players.map((player, index) => (
                <div key={index} className="flex gap-2">
                  <input
                    type="text"
                    value={player.name}
                    onChange={(e) => updatePlayer(index, 'name', e.target.value)}
                    placeholder="Nom du joueur"
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md"
                  />
                  <select
                    value={player.team}
                    onChange={(e) => updatePlayer(index, 'team', e.target.value as 'A' | 'B')}
                    className="px-3 py-2 border border-gray-300 rounded-md"
                  >
                    <option value="A">Équipe A</option>
                    <option value="B">Équipe B</option>
                  </select>
                  {formData.players.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removePlayer(index)}
                      className="px-3 py-2 bg-red-100 text-red-700 rounded-md hover:bg-red-200"
                    >
                      Supprimer
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md text-sm">
              {error}
            </div>
          )}

          {success && (
            <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-md text-sm">
              {success}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-indigo-600 text-white py-2 px-4 rounded-md hover:bg-indigo-700 disabled:opacity-50 transition-colors"
          >
            {loading ? 'Création en cours...' : 'Créer le match'}
          </button>
        </form>
      </div>
    </div>
  );
}
