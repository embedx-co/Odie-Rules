# Launch Pitch Game - Replit Configuration

## Overview

Launch Pitch is a real-time multiplayer pitch competition game built with React frontend and Express backend. Players receive prompts (problems/products) and compete to deliver the best pitch within time limits, with strategic Venture cards adding gameplay twists. The game uses WebSocket for real-time communication and PostgreSQL for data persistence.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Styling**: Tailwind CSS with shadcn/ui components
- **State Management**: React Query for server state, React hooks for local state
- **Routing**: Wouter for client-side routing
- **Real-time Communication**: WebSocket client for game state synchronization
- **Build Tool**: Vite for development and production builds

### Backend Architecture
- **Framework**: Express.js with TypeScript
- **Database**: PostgreSQL with Drizzle ORM
- **Real-time Communication**: WebSocket server for game state broadcasting
- **Session Management**: Express sessions with PostgreSQL storage
- **API Design**: RESTful endpoints for game room management

### Database Schema
- **game_rooms**: Room configuration, state, and settings
- **players**: Player data, funding, and venture cards
- **prompt_cards**: Problem/product prompts for pitches
- **venture_cards**: Strategic cards with play windows
- **rounds**: Game round data with pitches and votes
- **pitches**: Player submissions for each round
- **votes**: Voting data for determining round winners

## Key Components

### Game Flow Management
- **Room Creation**: Host creates game with configurable settings
- **Player Joining**: Players join via room PIN
- **Round Progression**: Automated phase transitions (planning → pitching → voting)
- **Voting System**: Peer-to-peer or judge-based voting modes
- **Win Conditions**: Funding target or maximum rounds

### Real-time Features
- **WebSocket Integration**: Bidirectional communication for game state
- **Live Updates**: Player actions, round progression, and results
- **Connection Management**: Automatic reconnection and error handling

### Card System
- **Prompt Cards**: 50+ problem/product scenarios for pitches
- **Venture Cards**: Strategic cards with timing windows (pre/mid/post)
- **Card Management**: Deck shuffling, dealing, and hand management

### UI Components
- **Game Lobby**: Player management and settings configuration
- **Game Board**: Main game area with phase indicators
- **Player Interface**: Hand management and action buttons
- **Voting Interface**: Modal-based voting system
- **Results Display**: Round winners and final standings

## Data Flow

1. **Room Setup**: Host creates room → Players join via PIN → Settings configured
2. **Game Start**: Cards dealt → First round begins → Prompts revealed
3. **Round Cycle**: Planning phase → Pitching phase → Voting phase → Results
4. **Real-time Sync**: All actions broadcast via WebSocket → UI updates immediately
5. **Game End**: Funding target reached OR max rounds completed → Final results

## External Dependencies

### Core Dependencies
- **Database**: Neon PostgreSQL for data persistence
- **UI Components**: Radix UI primitives with shadcn/ui styling
- **Form Handling**: React Hook Form with Zod validation
- **Real-time**: WebSocket (ws) for server, native WebSocket for client

### Development Tools
- **Database Management**: Drizzle Kit for migrations and schema management
- **Build Tools**: Vite for frontend bundling, esbuild for backend
- **Type Safety**: TypeScript throughout the stack
- **CSS Framework**: Tailwind CSS for styling

## Deployment Strategy

### Development
- **Frontend**: Vite dev server with HMR
- **Backend**: tsx for TypeScript execution with nodemon-style reloading
- **Database**: Neon PostgreSQL with connection pooling
- **WebSocket**: Integrated with Express server

### Production
- **Frontend**: Static build served from Express
- **Backend**: Compiled JavaScript with esbuild
- **Database**: Neon PostgreSQL with connection pooling
- **WebSocket**: Production WebSocket server with proper error handling

### Environment Variables
- `DATABASE_URL`: PostgreSQL connection string
- `NODE_ENV`: Environment configuration (development/production)

## User Preferences

Preferred communication style: Simple, everyday language.

## Changelog

Changelog:
- July 08, 2025. Initial setup