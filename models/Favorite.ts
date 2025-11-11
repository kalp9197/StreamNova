import mongoose from 'mongoose';

export interface FavoriteItem {
  userId: mongoose.Types.ObjectId;
  contentId: number;
  contentType: 'movie' | 'tv';
  title: string;
  posterPath: string | null;
  backdropPath: string | null;
  addedAt: Date;
}

const FavoriteSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  contentId: { type: Number, required: true },
  contentType: { type: String, enum: ['movie', 'tv'], required: true },
  title: { type: String, required: true },
  posterPath: { type: String, default: null },
  backdropPath: { type: String, default: null },
  addedAt: { type: Date, default: Date.now },
});

// Compound index to prevent duplicates
FavoriteSchema.index(
  { userId: 1, contentId: 1, contentType: 1 },
  { unique: true }
);

const Favorite =
  mongoose.models.Favorite || mongoose.model('Favorite', FavoriteSchema);

export default Favorite;
