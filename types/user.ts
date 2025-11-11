// User types
export interface User {
  _id: string;
  username: string;
  email: string;
  image: string;
  searchHistory: Array<{
    id: number;
    title: string;
    searchType: 'movie' | 'tv' | 'person';
    image?: string | null;
    createdAt?: string;
  }>;
}

export interface AuthenticatedUser {
  userId: string;
  user: User;
}
