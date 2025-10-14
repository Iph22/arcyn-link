# Arcyn Link

**Minimal. Intelligent. Seamless.**

A cross-platform communication app built for teams (Arcyn.x, Modulex, Nexalab) with AI-powered insights from Claude.

## 🚀 Features

- **Real-time Chat**: Instant messaging with Socket.io
- **Team Channels**: Organized spaces for each team and project
- **Thread Support**: Organize conversations with threaded discussions
- **AI Summaries**: Claude 3 Sonnet powered insights and key takeaways
- **Emoji Reactions**: Express yourself with quick reactions
- **Modern UI**: Clean, minimal, futuristic design with dark mode
- **Cross-platform**: Web-based with responsive design

## 🏗️ Architecture

```
arcyn-link/
├── backend/          # Node.js + Express + Prisma + PostgreSQL
├── frontend/         # Next.js + TypeScript + Tailwind CSS
├── worker/           # AI worker service with Claude integration
├── docker-compose.yml
└── README.md
```

## 🛠️ Tech Stack

### Backend
- **Node.js** + **Express** - REST API server
- **PostgreSQL** - Primary database
- **Prisma** - Database ORM and migrations
- **Socket.io** - Real-time communication
- **BullMQ** + **Redis** - Background job processing
- **JWT** - Authentication
- **Anthropic SDK** - Claude AI integration

### Frontend
- **Next.js 14** - React framework with App Router
- **TypeScript** - Type safety
- **Tailwind CSS** - Styling
- **Framer Motion** - Animations
- **Radix UI** - Accessible components
- **React Query** - Data fetching and caching
- **Zustand** - State management
- **Socket.io Client** - Real-time updates

### Infrastructure
- **Docker** - Containerization
- **Docker Compose** - Multi-service orchestration
- **Redis** - Caching and job queue

## 🚀 Quick Start

### Prerequisites

- **Docker** and **Docker Compose**
- **Node.js 18+** (for local development)
- **Claude API Key** from Anthropic

### 1. Clone the Repository

```bash
git clone https://github.com/Iph22/arcyn-link.git
cd arcyn-link
```

### 2. Environment Setup

Copy the environment template:

```bash
cp .env.example .env
```

Edit `.env` and add your Claude API key:

```env
# Database
DATABASE_URL="postgresql://postgres:password@localhost:5432/arcyn_link?schema=public"

# Authentication
JWT_SECRET="your-super-secret-jwt-key-change-this-in-production"

# Claude AI
CLAUDE_API_KEY="your-claude-api-key-here"

# Redis
REDIS_URL="redis://redis:6379"

# Server
PORT=4000
NODE_ENV=development

# Frontend
NEXT_PUBLIC_API_URL="http://localhost:4000"
NEXT_PUBLIC_WS_URL="http://localhost:4000"
```

### 3. Start with Docker

```bash
# Build and start all services
docker compose up --build

# Or run in background
docker compose up --build -d
```

### 4. Access the Application

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:4000
- **Health Check**: http://localhost:4000/health

## 🏃‍♂️ Development Setup

### Backend Development

```bash
cd backend
npm install
npm run db:generate  # Generate Prisma client
npm run db:push      # Push schema to database
npm run dev          # Start development server
```

### Frontend Development

```bash
cd frontend
npm install
npm run dev          # Start Next.js development server
```

### Worker Development

```bash
cd worker
npm install
npm run dev          # Start AI worker service
```

## 📊 Database Schema

The application uses PostgreSQL with the following main entities:

- **Users** - Team members with authentication
- **Teams** - Arcyn.x, Modulex, Nexalab
- **Channels** - Team communication spaces
- **Messages** - Chat messages with reactions
- **Threads** - Organized conversation threads
- **AI Summaries** - Claude-generated insights

## 🤖 AI Integration

### Claude 3 Sonnet Features

- **Thread Summarization**: Analyze conversations for key insights
- **Decision Tracking**: Identify important decisions made
- **Action Items**: Extract tasks and next steps
- **Participant Analysis**: Understand who contributed what

### Usage

1. Start a conversation in any channel
2. Create a thread for focused discussion
3. Click "AI Summary" to generate insights
4. Claude analyzes the thread and provides structured summaries

## 🔧 API Endpoints

### Authentication
- `POST /api/auth/register` - Create new account
- `POST /api/auth/login` - Sign in
- `GET /api/auth/me` - Get current user

### Teams & Channels
- `GET /api/teams` - List all teams
- `GET /api/channels` - Get user's team channels
- `POST /api/channels` - Create new channel

### Messages
- `GET /api/messages/channel/:id` - Get channel messages
- `POST /api/messages` - Send message
- `POST /api/messages/:id/reactions` - Add/remove reaction

### AI Summaries
- `POST /api/ai/summarize` - Generate thread summary
- `GET /api/ai/summary/:threadId` - Get latest summary
- `GET /api/ai/summaries/:threadId` - Get all summaries

## 🔌 Socket.io Events

### Client → Server
- `channel:join` - Join a channel
- `message:send` - Send a message
- `reaction:add` - Add emoji reaction
- `typing:start/stop` - Typing indicators

### Server → Client
- `message:new` - New message received
- `reaction:added/removed` - Reaction updates
- `typing:start/stop` - User typing status
- `ai:summary:new` - New AI summary available

## 🎨 Design System

### Colors
- **Primary**: Cyan (#06b6d4) - Arcyn.x
- **Secondary**: Violet (#8b5cf6) - Modulex  
- **Accent**: Emerald (#10b981) - Nexalab
- **Background**: Gray-900 to Gray-800 gradient
- **Text**: White/Gray scale

### Typography
- **Display**: Satoshi (headings)
- **Body**: Inter (content)

## 🚢 Deployment

### Production Environment

1. **Set up environment variables**:
   ```env
   NODE_ENV=production
   DATABASE_URL="your-production-db-url"
   CLAUDE_API_KEY="your-production-claude-key"
   JWT_SECRET="your-production-jwt-secret"
   ```

2. **Deploy with Docker**:
   ```bash
   docker compose -f docker-compose.prod.yml up -d
   ```

3. **Database migrations**:
   ```bash
   docker exec arcyn-backend npx prisma migrate deploy
   ```

### Scaling Considerations

- **Database**: Use managed PostgreSQL (AWS RDS, Google Cloud SQL)
- **Redis**: Use managed Redis (AWS ElastiCache, Redis Cloud)
- **Load Balancing**: Multiple backend instances behind load balancer
- **CDN**: Serve static assets via CDN
- **Monitoring**: Add logging and monitoring (Sentry, DataDog)

## 🧪 Testing

```bash
# Backend tests
cd backend
npm test

# Frontend tests  
cd frontend
npm test

# E2E tests
npm run test:e2e
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit changes: `git commit -m 'Add amazing feature'`
4. Push to branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

## 📝 License

This project is licensed under the ISC License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **Anthropic** for Claude AI capabilities
- **Vercel** for Next.js framework
- **Prisma** for excellent database tooling
- **Radix UI** for accessible components
- **Tailwind CSS** for utility-first styling

---

**Built with ❤️ by the Arcyn team**

For support or questions, reach out to the development team or create an issue in this repository.
