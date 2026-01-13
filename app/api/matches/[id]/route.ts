import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db/mongodb';
import Match from '@/lib/models/Match';
import { recalculatePointsForMatch } from '@/lib/utils/pointsCalculator';

/**
 * GET /api/matches/[id]
 * Récupère un match par son ID
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await connectDB();

    const match = await Match.findById(params.id).lean();

    if (!match) {
      return NextResponse.json(
        { error: 'Match non trouvé' },
        { status: 404 }
      );
    }

    return NextResponse.json(
      {
        match: {
          id: match._id.toString(),
          teamA: match.teamA,
          teamB: match.teamB,
          matchDate: match.matchDate,
          players: match.players,
          finalScore: match.finalScore || null,
          winner: match.winner || null,
          isFinished: match.isFinished,
        },
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Erreur lors de la récupération du match:', error);
    return NextResponse.json(
      { error: 'Erreur serveur lors de la récupération du match' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/matches/[id]
 * Met à jour le résultat final d'un match (mode admin)
 * Recalcule automatiquement les points de tous les pronostics
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await connectDB();

    const body = await request.json();
    const { finalScore } = body;

    if (!finalScore) {
      return NextResponse.json(
        { error: 'Le score final est requis' },
        { status: 400 }
      );
    }

    if (
      typeof finalScore.teamA !== 'number' ||
      typeof finalScore.teamB !== 'number' ||
      finalScore.teamA < 0 ||
      finalScore.teamB < 0
    ) {
      return NextResponse.json(
        { error: 'Les scores doivent être des nombres positifs' },
        { status: 400 }
      );
    }

    const match = await Match.findById(params.id);

    if (!match) {
      return NextResponse.json(
        { error: 'Match non trouvé' },
        { status: 404 }
      );
    }

    // Mettre à jour le score final et marquer le match comme terminé
    match.finalScore = {
      teamA: finalScore.teamA,
      teamB: finalScore.teamB,
      bestScorer: finalScore.bestScorer || undefined,
    };
    match.isFinished = true;
    
    // Calculer automatiquement l'équipe gagnante
    if (finalScore.teamA > finalScore.teamB) {
      match.winner = 'A';
    } else if (finalScore.teamB > finalScore.teamA) {
      match.winner = 'B';
    } else {
      match.winner = 'DRAW';
    }

    await match.save();

    // Recalculer les points pour tous les pronostics de ce match
    await recalculatePointsForMatch(params.id);

    return NextResponse.json(
      {
        message: 'Résultat du match mis à jour avec succès',
        match: {
          id: match._id.toString(),
          teamA: match.teamA,
          teamB: match.teamB,
          finalScore: match.finalScore,
          winner: match.winner || null,
          isFinished: match.isFinished,
        },
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Erreur lors de la mise à jour du match:', error);
    return NextResponse.json(
      { error: 'Erreur serveur lors de la mise à jour du match' },
      { status: 500 }
    );
  }
}
