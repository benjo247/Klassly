# Klassly

Eltern-Community App für Schulklassen.

## Setup

### Vercel Environment Variables
```
DATABASE_URL              = Neon Connection String
VITE_CLERK_PUBLISHABLE_KEY = pk_test_xxx (aus Clerk Dashboard → API Keys)
CLERK_SECRET_KEY           = sk_test_xxx (Sensitive!)
```

### Neon Schema
SQL Editor → supabase/schema.sql ausführen

## Stack
- Vite + React
- Clerk Auth (Email + Google)
- Neon PostgreSQL
- Vercel
