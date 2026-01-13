import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db/mongodb';
import Match from '@/lib/models/Match';

/**
 * POST /api/matches
 * Crée un nouveau match (mode admin)
 */
export async function POST(request: NextRequest) {
  try {
    await connectDB();

    const body = await request.json();
    const { teamA, teamB, matchDate, players } = body;

    // Validation
    if (!teamA || !teamB || !matchDate) {
      return NextResponse.json(
        { error: 'teamA, teamB et matchDate sont requis' },
        { status: 400 }
      );
    }

    if (!Array.isArray(players) || players.length === 0) {
      return NextResponse.json(
        { error: 'La liste des joueurs est requise et doit contenir au moins un joueur' },
        { status: 400 }
      );
    }

    // Valider que tous les joueurs ont un nom et une équipe valide
    for (const player of players) {
      if (!player.name || !player.team || !['A', 'B'].includes(player.team)) {
        return NextResponse.json(
          { error: 'Chaque joueur doit avoir un nom et une équipe (A ou B)' },
          { status: 400 }
        );
      }
    }

    const matchDateObj = new Date(matchDate);
    if (isNaN(matchDateObj.getTime())) {
      return NextResponse.json(
        { error: 'La date du match est invalide' },
        { status: 400 }
      );
    }

    // Créer le match
    const match = await Match.create({
      teamA: teamA.trim(),
      teamB: teamB.trim(),
      matchDate: matchDateObj,
      players: players.map((p: any) => ({
        name: p.name.trim(),
        team: p.team,
      })),
      isFinished: false,
    });

    return NextResponse.json(
      {
        message: 'Match créé avec succès',
        match: {
          id: match._id.toString(),
          teamA: match.teamA,
          teamB: match.teamB,
          matchDate: match.matchDate,
          players: match.players,
          isFinished: match.isFinished,
        },
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Erreur lors de la création du match:', error);
    return NextResponse.json(
      { error: 'Erreur serveur lors de la création du match' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/matches
 * Récupère tous les matchs
 * Query params optionnels:
 * - upcoming: true pour ne récupérer que les matchs à venir
 * - finished: true pour ne récupérer que les matchs terminés
 */
export async function GET(request: NextRequest) {
  try {
    await connectDB();

    const searchParams = request.nextUrl.searchParams;
    const upcoming = searchParams.get('upcoming') === 'true';
    const finished = searchParams.get('finished') === 'true';

    let query: any = {};

    if (upcoming) {
      // Pour les matchs à venir, on prend ceux qui ne sont pas terminés
      query.isFinished = false;
      // Utiliser l'heure actuelle du serveur en UTC
      // Inclure les matchs qui commencent dans les prochaines heures pour permettre les pronostics
      const now = new Date();
      // Inclure les matchs jusqu'à 1 heure dans le passé (au cas où il y a un décalage)
      const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
      query.matchDate = { $gte: oneHourAgo };
    }

    if (finished) {
      query.isFinished = true;
    }

    const matches = await Match.find(query)
      .sort({ matchDate: 1 }) // Tri par date croissante
      .lean();

    console.log(`[API Matches] Requête:`, JSON.stringify(query));
    console.log(`[API Matches] Nombre de matchs trouvés:`, matches.length);

    return NextResponse.json(
      {
        matches: matches.map((match) => ({
          id: match._id.toString(),
          teamA: match.teamA,
          teamB: match.teamB,
          matchDate: match.matchDate,
          players: match.players,
          finalScore: match.finalScore || null,
          winner: match.winner || null,
          isFinished: match.isFinished,
        })),
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Erreur lors de la récupération des matchs:', error);
    return NextResponse.json(
      { error: 'Erreur serveur lors de la récupération des matchs' },
      { status: 500 }
    );
  }
}
