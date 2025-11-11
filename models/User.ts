import mongoose, { Schema, Document, Model } from 'mongoose';

export interface ISearchHistoryItem {
  id: number;
  image: string | null;
  title: string;
  searchType: 'movie' | 'tv' | 'person';
  createdAt: Date;
}

export interface IWatchHistoryItem {
  contentId: number;
  contentType: 'movie' | 'tv';
  title: string;
  posterPath?: string | null;
  backdropPath?: string | null;
  currentTime: number; // in seconds
  duration: number; // total duration in seconds
  lastWatched: Date;
  seasonNumber?: number; // for TV shows
  episodeNumber?: number; // for TV shows
}

export interface IUser extends Document {
  username: string;
  email: string;
  password: string;
  image: string;
  searchHistory: ISearchHistoryItem[];
  watchHistory: IWatchHistoryItem[];
}

const searchHistorySchema = new Schema(
  {
    id: Number,
    image: String,
    title: String,
    searchType: String,
    createdAt: Date,
  },
  { _id: false }
);

const watchHistorySchema = new Schema(
  {
    contentId: { type: Number, required: true },
    contentType: { type: String, enum: ['movie', 'tv'], required: true },
    title: { type: String, required: true },
    posterPath: String,
    backdropPath: String,
    currentTime: { type: Number, default: 0 },
    duration: { type: Number, default: 0 },
    lastWatched: { type: Date, default: Date.now },
    seasonNumber: Number,
    episodeNumber: Number,
  },
  { _id: false }
);

const userSchema = new Schema<IUser>({
  username: {
    type: String,
    required: true,
    unique: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
  },
  password: {
    type: String,
    required: true,
  },
  image: {
    type: String,
    default: '',
  },
  searchHistory: {
    type: [searchHistorySchema],
    default: [],
  },
  watchHistory: {
    type: [watchHistorySchema],
    default: [],
  },
});

const User: Model<IUser> =
  mongoose.models.User || mongoose.model<IUser>('User', userSchema);

export default User;
