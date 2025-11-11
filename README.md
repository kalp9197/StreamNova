# StreamNova - Next.js Streaming Platform

A modern streaming platform built with Next.js 16, TypeScript, MongoDB, and Tailwind CSS.

## Features

- 🎬 Movie and TV Show streaming
- 🔐 User authentication (signup, login, logout)
- 🔍 Search functionality for movies, TV shows, and people
- 📜 Search history tracking
- 🎥 Video player with trailers
- 📱 Responsive design
- 🌙 Dark mode by default

## Tech Stack

- **Framework**: Next.js 16 (App Router)
- **Language**: TypeScript
- **Database**: MongoDB with Mongoose
- **Styling**: Tailwind CSS
- **State Management**: Zustand
- **Authentication**: JWT with HTTP-only cookies
- **API**: TMDB (The Movie Database)

## Setup Instructions

1. **Install Dependencies**

   ```bash
   pnpm install
   ```

2. **Environment Variables**
   Create a `.env` file in the root directory:

   ```env
   MONGO_URI=your_mongodb_connection_string
   JWT_SECRET=your_jwt_secret_key
   TMDB_API_KEY=your_tmdb_api_key
   NODE_ENV=development
   PORT=3000
   ```

3. **Run Development Server**

   ```bash
   pnpm dev
   ```

4. **Build for Production**
   ```bash
   pnpm build
   pnpm start
   ```

## Project Structure

```
├── app/                    # Next.js App Router pages
│   ├── api/               # API routes
│   ├── login/            # Login page
│   ├── signup/           # Signup page
│   ├── watch/            # Watch page
│   ├── search/            # Search page
│   └── history/           # Search history page
├── components/            # React components
├── lib/                   # Utility libraries
├── models/                # Database models
├── store/                 # Zustand stores
├── hooks/                 # Custom React hooks
└── utils/                 # Utility functions
```

## API Routes

All API routes are prefixed with `/api/v1`:

- `/api/v1/auth/signup` - User registration
- `/api/v1/auth/login` - User login
- `/api/v1/auth/logout` - User logout
- `/api/v1/auth/authCheck` - Check authentication status
- `/api/v1/movie/trending` - Get trending movies
- `/api/v1/movie/[id]/details` - Get movie details
- `/api/v1/movie/[id]/trailers` - Get movie trailers
- `/api/v1/movie/[id]/similar` - Get similar movies
- `/api/v1/movie/category/[category]` - Get movies by category
- `/api/v1/tv/trending` - Get trending TV shows
- `/api/v1/tv/[id]/details` - Get TV show details
- `/api/v1/tv/[id]/trailers` - Get TV show trailers
- `/api/v1/tv/[id]/similar` - Get similar TV shows
- `/api/v1/tv/category/[category]` - Get TV shows by category
- `/api/v1/search/movie/[query]` - Search movies
- `/api/v1/search/tv/[query]` - Search TV shows
- `/api/v1/search/person/[query]` - Search people
- `/api/v1/search/history` - Get search history
- `/api/v1/search/history/[id]` - Delete search history item

## Development Notes

- All API routes require authentication except signup and login
- JWT tokens are stored in HTTP-only cookies
- MongoDB connection is cached for better performance
- All components are client-side rendered unless specified otherwise

## License

ISC
