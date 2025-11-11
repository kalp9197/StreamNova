# StreamNova - System Architecture

## Overview

StreamNova is built as a full-stack Next.js application using the App Router architecture. The application follows a modern, scalable architecture pattern with clear separation of concerns.

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                      Client Layer                           │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐    │
│  │   React      │  │  Redux       │  │  Shadcn/ui  │    │
│  │  Components  │  │  Toolkit     │  │  Components │    │
│  └──────────────┘  └──────────────┘  └──────────────┘    │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                    Next.js App Router                        │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐    │
│  │   Pages      │  │  API Routes  │  │  Middleware  │    │
│  └──────────────┘  └──────────────┘  └──────────────┘    │
└─────────────────────────────────────────────────────────────┘
                            │
                ┌───────────┴───────────┐
                ▼                       ▼
┌──────────────────────────┐  ┌──────────────────────────┐
│    MongoDB Database      │  │    TMDB External API     │
│  ┌────────────────────┐ │  │  ┌────────────────────┐ │
│  │  Users             │ │  │  │  Movie/TV Data     │ │
│  │  Watch History     │ │  │  │  Trailers          │ │
│  │  Search History    │ │  │  │  Credits           │ │
│  └────────────────────┘ │  │  └────────────────────┘ │
└──────────────────────────┘  └──────────────────────────┘
```

## Layer Breakdown

### 1. Client Layer (Frontend)

#### Components (`/components`)

- **UI Components**: Reusable UI elements (Shadcn/ui)
- **Feature Components**: Domain-specific components
- **Layout Components**: Navigation, headers, footers

#### State Management (`/store`)

- **Redux Toolkit Slices**:
  - `authSlice`: Authentication state
  - `contentSlice`: Content type (movie/tv) selection
  - `searchHistorySlice`: Search history management
  - `watchHistorySlice`: Watch progress tracking
  - `apiCacheSlice`: API response caching

#### Hooks (`/hooks`)

- Custom React hooks for reusable logic
- `useGetTrendingContent`: Fetches trending content
- `useDebounce`: Debounce utility hook

#### Types (`/types`)

- TypeScript type definitions
- Shared interfaces and types
- API response types

### 2. Application Layer (Next.js)

#### Pages (`/app`)

- **Route Handlers**: Next.js App Router pages
- **API Routes**: Server-side API endpoints (`/app/api`)
- **Middleware**: Authentication and request handling

#### API Routes Structure

```
/api/v1/
├── auth/
│   ├── signup
│   ├── login
│   ├── logout
│   └── authCheck
├── movie/
│   ├── trending
│   ├── [id]/details
│   ├── [id]/trailers
│   ├── [id]/similar
│   └── category/[category]
├── tv/
│   └── (same structure as movie)
├── search/
│   ├── [query]
│   └── history
└── watch/
    └── history
```

### 3. Data Layer

#### Database (MongoDB)

- **User Model**: User accounts and authentication
- **Watch History**: Content viewing progress
- **Search History**: User search queries

#### External APIs

- **TMDB API**: Movie and TV show data
- **Video Sources**: External video streaming services

## Data Flow

### Authentication Flow

1. User submits credentials
2. API route validates credentials
3. JWT token generated and stored in HTTP-only cookie
4. Redux store updated with user data
5. Protected routes check authentication state

### Content Fetching Flow

1. Component dispatches action to fetch content
2. Redux thunk checks cache first
3. If not cached, API route called
4. API route fetches from TMDB
5. Response cached and returned
6. Redux store updated
7. Component re-renders with new data

### Watch History Flow

1. User watches content
2. Progress tracked client-side
3. Progress saved to API every 30 seconds
4. API route updates MongoDB
5. Redux store updated
6. Continue Watching section updates

## Security Architecture

### Authentication

- JWT tokens in HTTP-only cookies
- Server-side token validation
- Protected API routes with middleware

### API Security

- Rate limiting on API routes
- Input validation with Zod
- CORS configuration
- Security headers

### Data Security

- Password hashing with bcrypt
- Encrypted tokens (if needed)
- Input sanitization
- SQL injection prevention (MongoDB)

## Performance Optimizations

### Caching Strategy

- **Client-side**: Redux store with TTL
- **API-level**: Response caching
- **Image**: Next.js Image optimization

### Code Splitting

- Dynamic imports for heavy components
- Route-based code splitting
- Lazy loading

### Bundle Optimization

- Tree shaking
- Minification
- Compression

## Scalability Considerations

### Horizontal Scaling

- Stateless API routes
- External database
- CDN for static assets

### Database Scaling

- MongoDB indexes
- Query optimization
- Connection pooling

### Caching Strategy

- Multi-layer caching
- Cache invalidation
- TTL management

## Monitoring & Observability

### Error Tracking

- Error boundaries
- Structured logging
- Error monitoring service (future)

### Performance Monitoring

- Core Web Vitals
- API response times
- Database query performance

### Analytics

- User engagement metrics
- Content popularity
- Search patterns

## Deployment Architecture

### Production Environment

- Next.js standalone build
- Node.js runtime
- MongoDB Atlas (cloud)
- Environment variables for secrets

### CI/CD Pipeline (Future)

- Automated testing
- Build verification
- Deployment automation
- Rollback capabilities

## Technology Stack

### Frontend

- Next.js 16
- React 19
- TypeScript
- Tailwind CSS
- Redux Toolkit
- Shadcn/ui
- Framer Motion

### Backend

- Next.js API Routes
- MongoDB
- Mongoose
- JWT
- Zod

### Infrastructure

- Node.js
- MongoDB Atlas
- Vercel/Netlify (deployment)

## Future Architecture Enhancements

1. **Microservices**: Split into separate services if needed
2. **GraphQL**: Consider GraphQL API layer
3. **Real-time**: WebSocket support for watch parties
4. **CDN**: Content delivery network for assets
5. **Edge Functions**: Serverless functions for edge computing
