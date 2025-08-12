# 🧹 Project Cleanup Guide - Hackathon Preparation

> **Clean up your project for judges, GitHub, and production deployment**

## 🗑️ Files to DELETE Before Submission

### 🔐 **Environment & Secrets (CRITICAL)**
```bash
# Delete these files - they contain sensitive data
rm -f .env
rm -f .env.local
rm -f .env.development.local
rm -f .env.production.local

# Keep only the template
# .env.example (if you created it)
```

### 📝 **Development Notes & Drafts**
```bash
# Remove personal notes and drafts
rm -f NOTES.md
rm -f TODO.md
rm -f SCRATCH.md
rm -f RANDOM_THOUGHTS.md
rm -f PERSONAL_NOTES.txt
```

### 🗄️ **Database Dumps & Local Data**
```bash
# Remove any local database files
rm -f *.db
rm -f *.sqlite
rm -f *.sqlite3
rm -f database.json
rm -f local_data.sql
```

### 🔧 **IDE & Editor Files**
```bash
# Remove IDE configuration (personal preferences)
rm -rf .vscode/settings.json
rm -rf .idea/
rm -f *.swp
rm -f *.swo
rm -f *~
```

### 📦 **Build & Cache Files**
```bash
# Clean build artifacts
rm -rf .next/
rm -rf node_modules/
rm -rf dist/
rm -rf build/
rm -rf out/
rm -f *.tsbuildinfo
rm -f next-env.d.ts
```

### 📊 **Logs & Debug Files**
```bash
# Remove log files
rm -rf logs/
rm -f *.log
rm -f npm-debug.log*
rm -f yarn-debug.log*
rm -f yarn-error.log*
```

## 🧹 Quick Cleanup Script

Create and run this script:

```bash
#!/bin/bash
# cleanup.sh - Quick project cleanup

echo "🧹 Cleaning up project for hackathon submission..."

# Remove sensitive files
rm -f .env*
echo "✅ Environment files removed"

# Remove build artifacts
rm -rf .next/ node_modules/ dist/ build/ out/
rm -f *.tsbuildinfo next-env.d.ts
echo "✅ Build artifacts removed"

# Remove development files
rm -rf .vscode/ .idea/
rm -f *.swp *.swo *~
echo "✅ IDE files removed"

# Remove logs
rm -rf logs/
rm -f *.log npm-debug.log* yarn-debug.log* yarn-error.log*
echo "✅ Log files removed"

# Remove personal notes
rm -f NOTES.md TODO.md SCRATCH.md
echo "✅ Personal notes removed"

echo "🎉 Cleanup complete! Your project is ready for submission."
```

## ✅ Files to KEEP

### 📋 **Essential Documentation**
- `README.md` ✅
- `SETUP.md` ✅
- `DATABASE_SETUP.md` ✅
- `DEPLOYMENT.md` ✅
- `CLEANUP.md` ✅ (this file)
- `LICENSE` ✅ (if you have one)

### 🔧 **Configuration Files**
- `package.json` ✅
- `package-lock.json` ✅
- `next.config.js` ✅
- `tailwind.config.js` ✅
- `tsconfig.json` ✅
- `.gitignore` ✅

### 📁 **Source Code**
- `app/` ✅ (all application code)
- `components/` ✅ (all UI components)
- `lib/` ✅ (utility functions)
- `types/` ✅ (TypeScript definitions)
- `public/` ✅ (static assets)

### 🗄️ **Database**
- `supabase/schema.sql` ✅
- `supabase/migrations/` ✅ (if any)

### 🛠️ **Scripts**
- `scripts/setup.sh` ✅

## 🔍 Security Audit Checklist

Before publishing, ensure:

- [ ] No API keys in code
- [ ] No passwords in files
- [ ] No personal information
- [ ] No test data with real info
- [ ] No internal URLs or IPs
- [ ] No debug credentials

### 🔎 **Search for sensitive data:**
```bash
# Search for potential secrets
grep -r "sk-" . --exclude-dir=node_modules
grep -r "password" . --exclude-dir=node_modules
grep -r "secret" . --exclude-dir=node_modules
grep -r "token" . --exclude-dir=node_modules
grep -r "key" . --exclude-dir=node_modules
```

## 📊 Repository Health Check

### ✅ **Good Repository Structure**
```
promptcraft-studio/
├── 📋 README.md (comprehensive)
├── 📋 SETUP.md (quick start)
├── 📋 DEPLOYMENT.md (hosting)
├── 🔧 package.json (all deps)
├── 🔧 .gitignore (comprehensive)
├── 📁 app/ (clean code)
├── 📁 components/ (reusable)
├── 📁 lib/ (utilities)
├── 📁 types/ (TypeScript)
├── 📁 public/ (assets)
├── 📁 supabase/ (schema)
└── 📁 scripts/ (setup tools)
```

### ❌ **Avoid These**
- Huge files (>10MB)
- Personal photos/videos
- Multiple README files
- Duplicate dependencies
- Unused packages
- Test data with personal info

## 🚀 Pre-Submission Checklist

### 📋 **Before Publishing to GitHub:**
- [ ] Run cleanup script
- [ ] Update README with actual repo URL
- [ ] Test setup on fresh machine/container
- [ ] Verify all links work
- [ ] Check demo deployment
- [ ] Remove all TODOs and FIXMEs
- [ ] Ensure code is commented
- [ ] Verify TypeScript compiles
- [ ] Test with empty database

### 🎯 **For Hackathon Judges:**
- [ ] Clear setup instructions
- [ ] Working demo link
- [ ] Video demo (if required)
- [ ] Contact information
- [ ] License file
- [ ] Feature highlights in README

## 📦 Final Package Size

After cleanup, your repository should be:
- **< 50MB total** (excluding node_modules)
- **< 1000 files** (excluding dependencies)
- **Clean git history** (no sensitive commits)

## 🎬 Demo Preparation

### 📱 **Create Demo Assets:**
1. **Screenshots** of key features
2. **Demo video** (2-3 minutes)
3. **Sample prompts** for testing
4. **Deployment link** that works
5. **Backup plan** if demo fails

### 🎪 **Presentation Materials:**
- Slide deck highlighting features
- Live demo script
- Fallback screenshots/video
- Technical architecture diagram
- Business value proposition

## ⚠️ **Final Warning**

**DO NOT COMMIT:**
- Real API keys
- Personal passwords
- Private database URLs
- Internal company data
- Personal contact info (in code)

**DOUBLE-CHECK:**
- `.env.local` is in .gitignore
- No secrets in git history
- Repository is public-ready
- All links work
- Demo deployment functions

---

**🎉 Your project is now ready for hackathon submission!**

**Good luck with your presentation! 🚀** 