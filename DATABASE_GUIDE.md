# 🗄️ PostgreSQL Database Setup - Complete Guide

## ✅ Database Status: ACTIVE

Your SEOgenious application now uses **PostgreSQL** for persistent data storage!

---

## 🎯 What Changed

### Before (In-Memory Storage):
- ❌ Data lost when server restarts
- ❌ Not suitable for production
- ❌ Data only in server RAM

### After (PostgreSQL Database):
- ✅ **Data persists** even after server restarts
- ✅ **Production-ready** and scalable
- ✅ **Real database** with automatic backups
- ✅ **User data, activities, saved items** all saved permanently

---

## 📊 Database Schema

Your database has **4 tables**:

### 1. **users** - User Accounts
```sql
- id (UUID) - Unique user ID
- name (TEXT) - User's full name
- email (TEXT, UNIQUE) - Login email
- password (TEXT) - Hashed password
- theme (TEXT) - 'light' or 'dark'
- onboarding_completed (BOOLEAN) - Onboarding status
- created_at (TIMESTAMP) - Registration date
```

### 2. **chat_messages** - AI Chatbot History
```sql
- id (UUID) - Message ID
- user_id (VARCHAR) - Who sent it
- role (TEXT) - 'user' or 'assistant'
- content (TEXT) - Message text
- created_at (TIMESTAMP) - When sent
```

### 3. **activities** - User Actions Log
```sql
- id (UUID) - Activity ID
- user_id (VARCHAR) - User who performed action
- type (TEXT) - 'keyword_research', 'content_optimize', etc.
- description (TEXT) - Human-readable description
- metadata (JSONB) - Extra data (keyword count, etc.)
- created_at (TIMESTAMP) - When it happened
```

### 4. **saved_items** - Bookmarked Analyses
```sql
- id (UUID) - Item ID
- user_id (VARCHAR) - Who saved it
- type (TEXT) - 'keyword_cluster' or 'content_analysis'
- title (TEXT) - Item name
- data (JSONB) - Full analysis data
- created_at (TIMESTAMP) - When saved
```

---

## 🔧 How It Works

### Database Connection

**File:** `server/db.ts`
```typescript
import { Pool } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';

// Connects using DATABASE_URL environment variable
export const db = drizzle({ client: pool, schema });
```

### Storage Implementation

**File:** `server/storage.ts`
```typescript
// DatabaseStorage class handles all database operations
export class DatabaseStorage implements IStorage {
  // Creates new user in PostgreSQL
  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(insertUser)
      .returning();
    return user;
  }
  
  // All other CRUD operations...
}

// App uses DatabaseStorage automatically
export const storage = new DatabaseStorage();
```

---

## 🚀 Database Commands

### View Database Schema
```bash
# See current database structure
npm run db:push
```

### Update Database Schema
If you modify `shared/schema.ts`:
```bash
# Push changes to database
npm run db:push

# Force push (if there are conflicts)
npm run db:push --force
```

### TypeScript Type Checking
```bash
npm run check
```

---

## 🔐 Environment Variables

Your database connection uses these **automatically set** variables:

```bash
DATABASE_URL=postgresql://user:pass@host:5432/dbname
PGHOST=your-db-host.neon.tech
PGPORT=5432
PGUSER=your-username
PGPASSWORD=your-password
PGDATABASE=your-database-name
```

**You don't need to set these manually** - they're already configured!

---

## 📝 How Data is Stored

### User Registration Example:
```typescript
// User signs up
POST /api/auth/register
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "secret123"
}

// Stored in PostgreSQL:
users table:
  id: "a1b2c3d4-..."
  name: "John Doe"
  email: "john@example.com"
  password: "$2b$10$..." (hashed)
  theme: "light"
  onboarding_completed: false
  created_at: 2024-01-15 10:00:00
```

### Keyword Analysis Example:
```typescript
// User generates keyword clusters
POST /api/keyword_clustering

// Activity logged in PostgreSQL:
activities table:
  id: "xyz789..."
  user_id: "a1b2c3d4-..."
  type: "keyword_clustering"
  description: "Clustered 5 keywords into 2 groups"
  metadata: { "keywordCount": 5, "clusterCount": 2 }
  created_at: 2024-01-15 10:05:00
```

### Saved Items Example:
```typescript
// User saves keyword cluster
POST /api/saved
{
  "type": "keyword_cluster",
  "title": "SEO Keywords for Blog",
  "data": { "keywords": [...], "clusters": [...] }
}

// Stored in PostgreSQL:
saved_items table:
  id: "def456..."
  user_id: "a1b2c3d4-..."
  type: "keyword_cluster"
  title: "SEO Keywords for Blog"
  data: { "keywords": [...], "clusters": [...] }
  created_at: 2024-01-15 10:10:00
```

---

## 🛠️ Database Features

### Automatic UUIDs
```typescript
// IDs generated automatically
id: varchar("id").primaryKey().default(sql`gen_random_uuid()`)

// No need to provide IDs when creating records!
```

### Type Safety with Drizzle
```typescript
// TypeScript ensures correct types
const user = await db.select().from(users).where(eq(users.id, userId));
//    ^? User | undefined (fully typed!)
```

### JSONB for Flexible Data
```typescript
// Store complex data structures
metadata: json("metadata")

// Example:
{
  keywordCount: 10,
  averageDifficulty: 45,
  searchVolume: 12000
}
```

---

## 📊 Querying the Database

### From Your Code:
```typescript
// Get user
const user = await storage.getUser(userId);

// Get activities (last 10)
const activities = await storage.getActivities(userId, 10);

// Save item
const item = await storage.createSavedItem({
  userId,
  type: 'keyword_cluster',
  title: 'My Keywords',
  data: { keywords: [...] }
});
```

### Direct SQL (for debugging):
```typescript
import { db } from './server/db';
import { users } from '@shared/schema';

// Count users
const allUsers = await db.select().from(users);
console.log('Total users:', allUsers.length);
```

---

## 🔄 Data Persistence

### What Gets Saved:
- ✅ User accounts (name, email, password)
- ✅ User preferences (theme, onboarding status)
- ✅ All activities (keyword research, content optimization)
- ✅ Saved keyword clusters and content analyses
- ✅ AI chatbot conversation history

### What Doesn't Get Saved:
- ❌ Session data (stored in memory, expires after 7 days)
- ❌ CSRF tokens (regenerated per request)
- ❌ Password reset tokens (not implemented yet)

---

## 🚨 Important Notes

### Data Persists Forever
```
⚠️ User data is permanent!
   - Users created in the database stay there
   - Activities and saved items accumulate over time
   - Delete operations are permanent
```

### Server Restart = Data Stays
```
✅ Before: Restart server → All data lost
✅ Now: Restart server → Data intact
```

### Database Backups
```
✅ Automatic backups by Neon/Replit
✅ Point-in-time recovery available
✅ Production and development databases separate
```

---

## 🐛 Troubleshooting

### Error: "DATABASE_URL must be set"
**Cause:** Database not provisioned

**Fix:** Already done! The database is set up.

### Error: Database connection failed
**Fix:**
```bash
# Check database status
# (Database should be running automatically)

# Restart workflow
npm run dev
```

### Error: Schema mismatch
**Fix:**
```bash
# Sync schema to database
npm run db:push

# Or force sync if needed
npm run db:push --force
```

### Want to see database data?
Use the Replit database viewer:
1. Click "Tools" → "Database"
2. View all tables and data
3. Run SQL queries

---

## 🎓 Learn More

### Drizzle ORM Documentation
- https://orm.drizzle.team/docs/overview
- https://orm.drizzle.team/docs/crud

### PostgreSQL Documentation
- https://www.postgresql.org/docs/

### Neon Serverless
- https://neon.tech/docs/introduction

---

## ✅ Current Status

**Database:** ✅ Active and connected
**Tables:** ✅ 4 tables created (users, chat_messages, activities, saved_items)
**Schema:** ✅ Synced to database
**Storage:** ✅ Using DatabaseStorage (PostgreSQL)
**Data:** ✅ Persists across server restarts

---

## 🎉 You're All Set!

Your SEOgenious application now has **enterprise-grade data persistence** with PostgreSQL!

**What this means:**
- Users can register and their accounts stay forever
- All SEO analyses are saved and retrievable
- Data survives server restarts
- Ready for production deployment
- Scalable to thousands of users

**Next steps:**
- Use the app normally - data saves automatically
- Check the database viewer to see your data
- Deploy to production when ready!

---

**Need Help?**
- Check schema: `shared/schema.ts`
- Check storage: `server/storage.ts`
- Check connection: `server/db.ts`
- Run: `npm run db:push` to sync schema changes

Happy building! 🚀
