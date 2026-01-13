import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db/mongodb';
import Prediction from '@/lib/models/Prediction';
import Match from '@/lib/models/Match';
import { calculateResult } from '@/lib/utils/pointsCalculator';

/**
 * POST /api/predictions
 * Crée un nouveau pronostic
 */
export async function POST(request: NextRequest) {
  try {
    await connectDB();

    const body = await request.json();
    const { userId, matchId, exactScore, bestScorer } = body;

    // Validation
    if (!userId || !matchId || !exactScore || !bestScorer) {
      return NextResponse.json(
        { error: 'userId, matchId, exactScore et bestScorer sont requis' },
        { status: 400 }
      );
    }

    if (
      typeof exactScore.teamA !== 'number' ||
      typeof exactScore.teamB !== 'number' ||
      exactScore.teamA < 0 ||
      exactScore.teamB < 0
    ) {
      return NextResponse.json(
        { error: 'Les scores doivent être des nombres positifs' },
        { status: 400 }
      );
    }

    // Vérifier que le match existe et n'a pas encore commencé
    const match = await Match.findById(matchId);
    if (!match) {
      return NextResponse.json(
        { error: 'Match non trouvé' },
        { status: 404 }
      );
    }

    if (match.isFinished) {
      return NextResponse.json(
        { error: 'Ce match est déjà terminé' },
        { status: 400 }
      );
    }

    // Utiliser l'heure actuelle du serveur en UTC pour une comparaison précise
    const now = new Date();
    const matchDate = new Date(match.matchDate);
    
    // Comparer les timestamps pour éviter les problèmes de fuseau horaire
    // Ajouter une marge de 5 minutes pour permettre les pronostics de dernière minute
    const fiveMinutesInMs = 5 * 60 * 1000;
    if (now.getTime() >= matchDate.getTime() - fiveMinutesInMs) {
      return NextResponse.json(
        { error: 'Le match a déjà commencé ou commence dans moins de 5 minutes, vous ne pouvez plus pronostiquer' },
        { status: 400 }
      );
    }

    // Vérifier que le meilleur buteur est dans la liste des joueurs du match
    const playerExists = match.players.some(
      (p) => p.name.toLowerCase().trim() === bestScorer.toLowerCase().trim()
    );
    if (!playerExists) {
      return NextResponse.json(
        { error: 'Le meilleur buteur doit être un joueur du match' },
        { status: 400 }
      );
    }

    // Vérifier que l'utilisateur n'a pas déjà fait un pronostic pour ce match
    const existingPrediction = await Prediction.findOne({
      user: userId,
      match: matchId,
    });
    if (existingPrediction) {
      return NextResponse.json(
        { error: 'Vous avez déjà fait un pronostic pour ce match' },
        { status: 409 }
      );
    }

    // Calculer le résultat global
    const result = calculateResult(exactScore.teamA, exactScore.teamB);

    // Créer le pronostic
    const prediction = await Prediction.create({
      user: userId,
      match: matchId,
      exactScore: {
        teamA: exactScore.teamA,
        teamB: exactScore.teamB,
      },
      bestScorer: bestScorer.trim(),
      result: result,
      points: 0, // Les points seront calculés après le match
    });

    return NextResponse.json(
      {
        message: 'Pronostic créé avec succès',
        prediction: {
          id: prediction._id.toString(),
          userId: prediction.user.toString(),
          matchId: prediction.match.toString(),
          exactScore: prediction.exactScore,
          bestScorer: prediction.bestScorer,
          result: prediction.result,
          points: prediction.points,
        },
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Erreur lors de la création du pronostic:', error);
    
    // Gérer les erreurs de duplication (index unique)
    if (error.code === 11000) {
      return NextResponse.json(
        { error: 'Vous avez déjà fait un pronostic pour ce match' },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { error: 'Erreur serveur lors de la création du pronostic' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/predictions
 * Récupère les pronostics
 * Query params optionnels:
 * - userId: pour filtrer par utilisateur
 * - matchId: pour filtrer par match
 */
export async function GET(request: NextRequest) {
  try {
    await connectDB();

    const searchParams = request.nextUrl.searchParams;
    const userId = searchParams.get('userId');
    const matchId = searchParams.get('matchId');

    let query: any = {};
    if (userId) query.user = userId;
    if (matchId) query.match = matchId;

    const predictions = await Prediction.find(query)
      .populate('user', 'username')
      .populate('match', 'teamA teamB matchDate')
      .sort({ createdAt: -1 })
      .lean();

    return NextResponse.json(
      {
        predictions: predictions.map((pred) => ({
          id: pred._id.toString(),
          userId: pred.user._id.toString(),
          username: (pred.user as any).username,
          matchId: pred.match._id.toString(),
          match: {
            teamA: (pred.match as any).teamA,
            teamB: (pred.match as any).teamB,
            matchDate: (pred.match as any).matchDate,
          },
          exactScore: pred.exactScore,
          bestScorer: pred.bestScorer,
          result: pred.result,
          points: pred.points,
        })),
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Erreur lors de la récupération des pronostics:', error);
    return NextResponse.json(
      { error: 'Erreur serveur lors de la récupération des pronostics' },
      { status: 500 }
    );
  }
}
