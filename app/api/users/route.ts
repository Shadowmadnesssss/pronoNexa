import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db/mongodb';
import User from '@/lib/models/User';

/**
 * POST /api/users
 * Crée un nouvel utilisateur avec un username
 */
export async function POST(request: NextRequest) {
  try {
    await connectDB();

    const body = await request.json();
    const { username } = body;

    if (!username || typeof username !== 'string' || username.trim().length === 0) {
      return NextResponse.json(
        { error: 'Le username est requis et doit être une chaîne non vide' },
        { status: 400 }
      );
    }

    // Vérifier si l'utilisateur existe déjà
    const existingUser = await User.findOne({ username: username.trim() });
    if (existingUser) {
      return NextResponse.json(
        { error: 'Ce username est déjà utilisé' },
        { status: 409 }
      );
    }

    // Créer le nouvel utilisateur
    const user = await User.create({
      username: username.trim(),
      totalPoints: 0,
    });

    return NextResponse.json(
      {
        message: 'Utilisateur créé avec succès',
        user: {
          id: user._id.toString(),
          username: user.username,
          totalPoints: user.totalPoints,
        },
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Erreur lors de la création de l\'utilisateur:', error);
    return NextResponse.json(
      { error: 'Erreur serveur lors de la création de l\'utilisateur' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/users
 * Récupère tous les utilisateurs (pour le classement)
 */
export async function GET() {
  try {
    await connectDB();

    const users = await User.find({})
      .select('username totalPoints createdAt')
      .sort({ totalPoints: -1, createdAt: 1 }) // Tri par points décroissants, puis par date de création
      .lean();

    return NextResponse.json(
      {
        users: users.map((user) => ({
          id: user._id.toString(),
          username: user.username,
          totalPoints: user.totalPoints,
        })),
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Erreur lors de la récupération des utilisateurs:', error);
    return NextResponse.json(
      { error: 'Erreur serveur lors de la récupération des utilisateurs' },
      { status: 500 }
    );
  }
}
