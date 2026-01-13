import mongoose, { Schema, Document, Model, Types } from 'mongoose';

/**
 * Interface pour le pronostic de score
 */
export interface IPredictedScore {
  teamA: number;
  teamB: number;
}

/**
 * Interface TypeScript pour le modèle Prediction
 */
export interface IPrediction extends Document {
  user: Types.ObjectId;
  match: Types.ObjectId;
  exactScore: IPredictedScore;
  bestScorer: string;
  result: 'A' | 'B' | 'DRAW'; // A = victoire équipe A, B = victoire équipe B, DRAW = match nul
  points: number;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Schéma Mongoose pour Prediction
 */
const PredictionSchema: Schema = new Schema(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, "L'utilisateur est requis"],
    },
    match: {
      type: Schema.Types.ObjectId,
      ref: 'Match',
      required: [true, 'Le match est requis'],
    },
    exactScore: {
      teamA: {
        type: Number,
        required: [true, 'Le score de léquipe A est requis'],
        min: 0,
      },
      teamB: {
        type: Number,
        required: [true, 'Le score de léquipe B est requis'],
        min: 0,
      },
    },
    bestScorer: {
      type: String,
      required: [true, 'Le meilleur buteur est requis'],
      trim: true,
    },
    result: {
      type: String,
      enum: ['A', 'B', 'DRAW'],
      required: [true, 'Le résultat est requis'],
    },
    points: {
      type: Number,
      default: 0,
      min: 0,
    },
  },
  {
    timestamps: true,
  }
);

// Index composé pour éviter les doublons (un utilisateur ne peut pronostiquer qu'une fois par match)
PredictionSchema.index({ user: 1, match: 1 }, { unique: true });

// Index pour améliorer les performances
PredictionSchema.index({ user: 1 });
PredictionSchema.index({ match: 1 });

/**
 * Modèle Prediction
 */
const Prediction: Model<IPrediction> =
  mongoose.models.Prediction || mongoose.model<IPrediction>('Prediction', PredictionSchema);

export default Prediction;
