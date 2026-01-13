import { IPrediction } from '@/lib/models/Prediction';
import { IMatch } from '@/lib/models/Match';

/**
 * Calcule le résultat global d'un match
 * @param scoreA Score de l'équipe A
 * @param scoreB Score de l'équipe B
 * @returns 'A' si victoire équipe A, 'B' si victoire équipe B, 'DRAW' si match nul
 */
export function calculateResult(scoreA: number, scoreB: number): 'A' | 'B' | 'DRAW' {
  if (scoreA > scoreB) return 'A';
  if (scoreB > scoreA) return 'B';
  return 'DRAW';
}

/**
 * Calcule les points pour un pronostic donné
 * @param prediction Le pronostic de l'utilisateur
 * @param match Le match avec le score final
 * @returns Le nombre de points gagnés (0 à 6)
 */
export function calculatePoints(prediction: IPrediction, match: IMatch): number {
  if (!match.finalScore) {
    return 0; // Le match n'est pas encore terminé
  }

  let points = 0;

  // 1. Score exact correct → 3 points
  const exactScoreMatch =
    prediction.exactScore.teamA === match.finalScore.teamA &&
    prediction.exactScore.teamB === match.finalScore.teamB;

  if (exactScoreMatch) {
    points += 3;
  }

  // 2. Meilleur buteur correct → 2 points
  if (match.finalScore.bestScorer && prediction.bestScorer === match.finalScore.bestScorer) {
    points += 2;
  }

  // 3. Résultat global correct → 1 point
  const predictedResult = prediction.result;
  const actualResult = calculateResult(match.finalScore.teamA, match.finalScore.teamB);

  if (predictedResult === actualResult) {
    points += 1;
  }

  return points;
}

/**
 * Recalcule tous les points pour un match donné
 * Cette fonction est appelée après la saisie du résultat final d'un match
 * @param matchId L'ID du match
 */
export async function recalculatePointsForMatch(matchId: string): Promise<void> {
  const Prediction = (await import('@/lib/models/Prediction')).default;
  const Match = (await import('@/lib/models/Match')).default;
  const User = (await import('@/lib/models/User')).default;

  const match = await Match.findById(matchId);
  if (!match || !match.finalScore) {
    return; // Le match n'a pas encore de résultat
  }

  // Récupérer tous les pronostics pour ce match
  const predictions = await Prediction.find({ match: matchId });

  // Recalculer les points pour chaque pronostic
  for (const prediction of predictions) {
    const newPoints = calculatePoints(prediction, match);
    prediction.points = newPoints;
    await prediction.save();

    // Mettre à jour le total de points de l'utilisateur
    const user = await User.findById(prediction.user);
    if (user) {
      // Soustraire les anciens points et ajouter les nouveaux
      // Pour simplifier, on recalcule le total depuis zéro
      const allUserPredictions = await Prediction.find({ user: user._id });
      const totalPoints = allUserPredictions.reduce((sum, pred) => sum + pred.points, 0);
      user.totalPoints = totalPoints;
      await user.save();
    }
  }
}
