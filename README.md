# SEOgenious 🚀

> Professional AI-powered SEO platform for digital marketing agencies and content creators

[![Built with Replit](https://img.shields.io/badge/Built%20with-Replit-667881?style=flat&logo=replit)](https://replit.com)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.6-blue?style=flat&logo=typescript)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-18-61DAFB?style=flat&logo=react)](https://reactjs.org/)
[![Express](https://img.shields.io/badge/Express-4.21-000000?style=flat&logo=express)](https://expressjs.com/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-Neon-4169E1?style=flat&logo=postgresql)](https://neon.tech/)

## ✨ Features

### 🎯 SEO Analysis Tools
- **Keyword Research & Clustering** - Discover and group related keywords
- **Content Optimizer** - Real-time content analysis with actionable suggestions
- **SERP Competitor Analysis** - Analyze top 10 ranking pages
- **Keyword Density Checker** - Free public tool (no login required)
- **On-Page SEO Analyzer** - Comprehensive page optimization

### 🤖 AI-Powered Features (NEW!)
- **AI Content Rewriter** - Enhance content quality and SEO optimization
- **AI Chatbot Assistant** - Get intelligent SEO advice
- **Executive Summaries** - Auto-generate report summaries
- **Content Outline Refinement** - Improve content structure
- **Feature Flag Support** - Toggle between mock and real AI modes

### 📊 Dashboard & Analytics
- **Real-time Statistics** - Track keywords, content, competitors analyzed
- **Activity Feed** - Monitor all user actions
- **SEO Health Score** - Animated score widget (0-100)
- **Save & Bookmark** - Save analyses for later review
- **Export Reports** - Download as PDF or CSV

### 🔧 Professional Features
- **User Authentication** - Secure session-based auth with bcrypt
- **Dark Mode** - Full theme support with persistence
- **PostgreSQL Database** - Production-ready persistent storage
- **n8n Integration** - Optional workflow automation
- **RESTful API** - Well-documented endpoints

## 🚀 Quick Start

### Running on Replit (Recommended)

1. **Click "Run"** - That's it! Everything is pre-configured
2. **Create an account** on the app
3. **Start analyzing** your SEO immediately

### Running Locally

**Prerequisites:**
- Node.js 20+
- PostgreSQL (or use Neon database)
- Git

**Installation:**

```bash
# Clone the repository
git clone <your-repo-url>
cd seogenious

# Install dependencies
npm install

# Configure environment
cp .env.example .env
# Edit .env with your database credentials

# Setup database
npm run db:push

# Start development server
npm run dev
```

Open http://localhost:5000

## ⚙️ Configuration

### Required Environment Variables

```bash
# Session Secret (REQUIRED)
SESSION_SECRET=your-random-secret-key-here

# Database (REQUIRED)
DATABASE_URL=postgresql://user:password@host:5432/database
```

### Optional: AI Features

```bash
# Enable Real AI (default: false)
ENABLE_REAL_AI=true
AI_MODE=real

# Option 1: Use Replit AI Integration (automatic on Replit)
# No configuration needed - already set up!

# Option 2: Use your own OpenAI API key
OPENAI_API_KEY=sk-your-api-key-here
```

See [AI Integration Guide](docs/AI_INTEGRATION.md) for detailed setup.

### Optional: n8n Automation

```bash
N8N_WEBHOOK_URL=https://your-n8n-instance.com/webhook
N8N_AUTH_USER=username
N8N_AUTH_PASS=password
```

See [n8n Quick Start Guide](N8N_QUICK_START.md) for setup instructions.

## 🎨 Tech Stack

### Frontend
- **React 18** - UI framework
- **TypeScript** - Type safety
- **Tailwind CSS** - Utility-first styling
- **Shadcn UI** - Component library
- **Wouter** - Lightweight routing
- **TanStack Query** - Server state management
- **Vite** - Build tool & dev server

### Backend
- **Express.js** - Web framework
- **TypeScript** - Type safety
- **Drizzle ORM** - Type-safe database queries
- **PostgreSQL** - Database (via Neon)
- **OpenAI GPT-5** - AI features
- **bcryptjs** - Password hashing
- **express-session** - Authentication

### Development
- **tsx** - TypeScript execution
- **esbuild** - Production bundling
- **ESLint** - Code linting
- **Replit** - Development platform

## 📖 Documentation

- [AI Integration Guide](docs/AI_INTEGRATION.md) - Complete AI setup and usage
- [Database Guide](DATABASE_GUIDE.md) - Database schema and migrations
- [n8n Quick Start](N8N_QUICK_START.md) - Workflow automation setup
- [API Documentation](docs/API.md) - RESTful API reference (coming soon)

## 🔐 Security Features

- ✅ **Bcrypt password hashing** (10 rounds)
- ✅ **HTTP-only cookies** (XSS protection)
- ✅ **SameSite cookie policy** (CSRF protection)
- ✅ **Session-based authentication** (no JWT vulnerabilities)
- ✅ **Environment-based secrets** (no hardcoded keys)
- ✅ **PostgreSQL injection protection** (ORM-based queries)

## 📊 Database Schema

The application uses PostgreSQL with the following tables:
- `users` - User accounts and profiles
- `chat_messages` - AI chatbot conversation history
- `activities` - User action tracking
- `saved_items` - Bookmarked analyses

Run `npm run db:push` to sync schema changes automatically.

## 🧪 Testing

```bash
# Run all tests
npm test

# Run with coverage
npm test -- --coverage

# Watch mode
npm run test:watch
```

## 📦 Available Scripts

```bash
npm run dev         # Start development server
npm run build       # Build for production
npm start           # Start production server
npm run check       # TypeScript type checking
npm run db:push     # Sync database schema
npm test            # Run tests
```

## 🤝 Contributing

Contributions are welcome! Please:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License.

## 🙏 Acknowledgments

- Built with [Replit](https://replit.com)
- UI components from [Shadcn UI](https://ui.shadcn.com/)
- Icons by [Lucide](https://lucide.dev/)
- AI powered by [OpenAI](https://openai.com/)
- Database by [Neon](https://neon.tech/)

## 💬 Support

Need help? 
- Check the [documentation](docs/)
- Open an [issue](https://github.com/your-repo/issues)
- Join our [community](https://discord.gg/your-discord)

## 🎯 Roadmap

### ✅ Completed
- Core SEO analysis tools
- User authentication & profiles
- PostgreSQL database integration
- Export to PDF/CSV
- AI content rewriter
- AI chatbot with feature flags
- Free keyword density checker

### 🔄 In Progress (Feature 1 Complete!)
- AI integration wrapper ✅
- Mock/Real AI toggle ✅
- Content rewrite functionality ✅
- Chatbot AI enhancement ✅
- Comprehensive documentation ✅

### 🔮 Coming Soon (Features 2-8)
- Automated SEO health audits with crawler
- Rank tracking dashboard with historical data
- Backlink analysis and monitoring
- Trend & topic discovery
- Content planner / editorial calendar
- One-click AI PDF report generator
- Unified SEO score system

---

Made with ❤️ by SEOgenious Team
