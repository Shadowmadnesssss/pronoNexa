import mongoose, { Schema, Document, Model } from 'mongoose';

/**
 * Interface TypeScript pour le modèle User
 */
export interface IUser extends Document {
  username: string;
  totalPoints: number;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Schéma Mongoose pour User
 */
const UserSchema: Schema = new Schema(
  {
    username: {
      type: String,
      required: [true, 'Le username est requis'],
      unique: true,
      trim: true,
      minlength: [2, 'Le username doit contenir au moins 2 caractères'],
      maxlength: [30, 'Le username ne peut pas dépasser 30 caractères'],
    },
    totalPoints: {
      type: Number,
      default: 0,
      min: 0,
    },
  },
  {
    timestamps: true, // Ajoute automatiquement createdAt et updatedAt
  }
);

// Index pour améliorer les performances de recherche
UserSchema.index({ totalPoints: -1 }); // Index décroissant pour le classement

/**
 * Modèle User
 */
const User: Model<IUser> = mongoose.models.User || mongoose.model<IUser>('User', UserSchema);

export default User;
