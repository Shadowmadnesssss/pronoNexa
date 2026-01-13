import mongoose, { Schema, Document, Model } from 'mongoose';

/**
 * Interface pour un joueur
 */
export interface IPlayer {
  name: string;
  team: 'A' | 'B';
}

/**
 * Interface pour le score final
 */
export interface IScore {
  teamA: number;
  teamB: number;
  bestScorer?: string; // Nom du meilleur buteur
}

/**
 * Interface TypeScript pour le modèle Match
 */
export interface IMatch extends Document {
  teamA: string;
  teamB: string;
  matchDate: Date;
  players: IPlayer[];
  finalScore: IScore | null;
  winner: 'A' | 'B' | 'DRAW' | null; // Équipe gagnante : A, B, ou DRAW (nul)
  isFinished: boolean;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Schéma Mongoose pour Match
 */
const MatchSchema: Schema = new Schema(
  {
    teamA: {
      type: String,
      required: [true, "Le nom de l'équipe A est requis"],
      trim: true,
    },
    teamB: {
      type: String,
      required: [true, "Le nom de l'équipe B est requis"],
      trim: true,
    },
    matchDate: {
      type: Date,
      required: [true, 'La date du match est requise'],
    },
    players: [
      {
        name: {
          type: String,
          required: true,
          trim: true,
        },
        team: {
          type: String,
          enum: ['A', 'B'],
          required: true,
        },
      },
    ],
    finalScore: {
      teamA: {
        type: Number,
        min: 0,
      },
      teamB: {
        type: Number,
        min: 0,
      },
      bestScorer: {
        type: String,
        trim: true,
      },
    },
    winner: {
      type: String,
      enum: ['A', 'B', 'DRAW'],
      default: null,
    },
    isFinished: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

// Index pour améliorer les performances
MatchSchema.index({ matchDate: 1 }); // Index croissant pour trier par date
MatchSchema.index({ isFinished: 1 });

/**
 * Méthode pour vérifier si le match a commencé
 * Utilise l'heure actuelle du serveur pour une comparaison précise
 */
MatchSchema.methods.hasStarted = function (): boolean {
  const now = new Date();
  const matchDate = new Date(this.matchDate);
  // Comparer les timestamps pour éviter les problèmes de fuseau horaire
  return now.getTime() >= matchDate.getTime();
};

/**
 * Méthode pour calculer et définir l'équipe gagnante à partir du score final
 */
MatchSchema.methods.calculateWinner = function (): void {
  if (this.finalScore && this.finalScore.teamA !== undefined && this.finalScore.teamB !== undefined) {
    if (this.finalScore.teamA > this.finalScore.teamB) {
      this.winner = 'A';
    } else if (this.finalScore.teamB > this.finalScore.teamA) {
      this.winner = 'B';
    } else {
      this.winner = 'DRAW';
    }
  }
};

/**
 * Modèle Match
 */
const Match: Model<IMatch> = mongoose.models.Match || mongoose.model<IMatch>('Match', MatchSchema);

export default Match;
