import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db/mongodb';
import User from '@/lib/models/User';

/**
 * GET /api/leaderboard
 * Récupère le classement des utilisateurs triés par nombre de points
 */
export async function GET() {
  try {
    await connectDB();

    const users = await User.find({})
      .select('username totalPoints')
      .sort({ totalPoints: -1, createdAt: 1 }) // Tri par points décroissants, puis par date de création
      .lean();

    console.log(`[API Leaderboard] Nombre d'utilisateurs trouvés:`, users.length);

    return NextResponse.json(
      {
        leaderboard: users.map((user, index) => ({
          rank: index + 1,
          id: user._id.toString(),
          username: user.username,
          totalPoints: user.totalPoints,
        })),
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Erreur lors de la récupération du classement:', error);
    return NextResponse.json(
      { error: 'Erreur serveur lors de la récupération du classement' },
      { status: 500 }
    );
  }
}
