# 🗄️ Database Setup Guide - PromptCraft Studio

> **Complete guide to set up your Supabase database for PromptCraft Studio**

## 🚨 Important Note

**You MUST set up a database** for the app to work. Without proper database setup, you'll see errors and the app won't function.

## 🎯 Quick Options Overview

| Option | Time | Best For | Difficulty |
|--------|------|----------|------------|
| **Demo Database** | 30 sec | Judges, Quick Testing | ⭐ Easy |
| **Your Own Database** | 2 min | Development, Production | ⭐⭐ Medium |
| **Supabase CLI** | 1 min | Developers with CLI | ⭐⭐⭐ Advanced |

---

## 🚀 Option 1: Demo Database (Recommended for Judges)

Perfect for hackathon judges or quick evaluation:

### Steps:
1. **Contact us** for demo credentials
2. **Add to `.env.local`**:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://demo-project-id.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=demo_anon_key_here
   ```
3. **Run the app**: `npm run dev`
4. **Done!** ✅

### Demo Features:
- ✅ Pre-configured tables
- ✅ Sample data included
- ✅ All features working
- ✅ No setup required

---

## 🛠️ Option 2: Your Own Database (Full Setup)

### Step 1: Create Supabase Account (1 minute)

1. **Go to [supabase.com](https://supabase.com)**
2. **Click "Start your project"**
3. **Sign up** with GitHub or email
4. **Create new organization** (if first time)

### Step 2: Create New Project (1 minute)

1. **Click "New Project"**
2. **Fill in details**:
   - Name: `promptcraft-studio`
   - Database Password: `[create strong password]`
   - Region: `[choose closest to you]`
3. **Click "Create new project"**
4. **Wait for setup** (~60 seconds)

### Step 3: Set Up Database Schema (30 seconds)

1. **Navigate to SQL Editor**:
   - In left sidebar, click **"SQL Editor"**
   - Click **"New query"**

2. **Copy Schema**:
   - Open `supabase/schema.sql` in your project
   - **Select ALL** content (Ctrl/Cmd + A)
   - **Copy** it (Ctrl/Cmd + C)

3. **Paste and Execute**:
   - **Paste** in Supabase SQL Editor (Ctrl/Cmd + V)
   - **Click "RUN"** button
   - **Wait for completion** (~10 seconds)
   - **Should see**: "Success. No rows returned" ✅

### Step 4: Get Your Credentials (30 seconds)

1. **Go to Settings**:
   - Click **"Settings"** in left sidebar
   - Click **"API"**

2. **Copy Credentials**:
   - **Project URL**: Copy the URL
   - **anon public**: Copy the key (NOT the service_role key)

3. **Add to `.env.local`**:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://your-actual-project-id.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_actual_anon_key_here
   ```

### Step 5: Verify Setup ✅

1. **Check Tables Created**:
   - Go to **"Table Editor"**
   - Should see 5 tables:
     - ✅ `users`
     - ✅ `prompts` 
     - ✅ `prompt_versions`
     - ✅ `tests`
     - ✅ `test_sessions`

2. **Check Security Policies**:
   - Go to **"Authentication"** → **"Policies"**
   - Should see multiple RLS policies ✅

3. **Test App Connection**:
   ```bash
   npm run dev
   ```
   - Go to http://localhost:3000
   - Sign up for account
   - Try creating a prompt

---

## ⚡ Option 3: Supabase CLI (Advanced)

For developers with Supabase CLI:

```bash
# Install Supabase CLI (if not installed)
npm install -g supabase

# Login to Supabase
supabase login

# Initialize project
supabase init

# Link to existing project (or create new)
supabase link --project-ref your-project-ref

# Push schema to database
supabase db push
```

---

## 🔧 Troubleshooting

### ❌ "Failed to connect to database"
- **Check** your `.env.local` file
- **Verify** URL and anon key are correct
- **Ensure** no extra spaces or quotes

### ❌ "Table doesn't exist" errors
- **Run the schema** again in SQL Editor
- **Check** Table Editor for all 5 tables
- **Verify** schema ran without errors

### ❌ "Permission denied" errors
- **Check** RLS policies are created
- **Go to** Authentication → Policies
- **Re-run** the schema if policies missing

### ❌ App loads but features don't work
- **Sign up** for a new account first
- **Check** browser console for errors
- **Verify** you're using the anon key (not service role)

---

## 🛡️ Security Notes

### ✅ Safe to Share:
- Project URL
- Anon public key
- Database schema

### ❌ Never Share:
- Service role key
- Database password
- JWT secret

---

## 📊 What Gets Created

The schema creates these tables:

```
📋 users           - User profiles
📝 prompts         - Main prompt storage
🔄 prompt_versions - Version history  
🧪 tests           - Test results
📊 test_sessions   - Test analytics
```

Plus:
- 🔐 **Row Level Security** (RLS) policies
- 📈 **Performance indexes**
- ⚡ **Auto-triggers** for user creation

---

## 📞 Need Help?

**For hackathon judges**: Use demo database option

**For developers**: 
1. Check troubleshooting section above
2. Review browser console for errors
3. Contact: [your-email]

**Emergency backup**: We can provide temporary demo access

---

**🎉 Once setup is complete, your PromptCraft Studio will be fully functional!** 