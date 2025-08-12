# 🚀 Quick Setup Guide for PromptCraft Studio

> **For Hackathon Judges & Developers** - Get the project running in 5 minutes!

## 📋 Prerequisites Checklist

- [ ] **Node.js 18+** installed ([Download here](https://nodejs.org/))
- [ ] **Git** installed
- [ ] **Supabase account** (free at [supabase.com](https://supabase.com))
- [ ] **OpenAI API key** (optional - [Get here](https://platform.openai.com/api-keys))

## ⚡ 5-Minute Setup

### 1. Clone & Install (1 minute)
```bash
git clone https://github.com/yourusername/promptcraft-studio.git
cd promptcraft-studio
npm install
```

### 2. Environment Setup (2 minutes)

Create `.env.local` file with:
```env
# Supabase (Required)
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# AI APIs (Optional - users can add in app)
OPENAI_API_KEY=sk-your-openai-key
ANTHROPIC_API_KEY=sk-ant-your-anthropic-key
```

### 3. Database Setup (1 minute)

**Choose one option:**

#### **Option A: Demo Database (Quickest)**
Use our pre-configured database for testing:
```env
# Use these demo credentials in your .env.local
NEXT_PUBLIC_SUPABASE_URL=https://demo-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=demo_anon_key_here
```
> Contact for demo credentials: [your-email]

#### **Option B: Your Own Database (Recommended)**
1. **Create Supabase project** at [supabase.com](https://supabase.com)
2. **Set up tables**:
   - Go to SQL Editor
   - Copy ALL content from `supabase/schema.sql`
   - Paste and click "RUN" 
   - Should see "Success. No rows returned" ✅
3. **Get credentials**: Settings → API → Copy URL and anon key

#### **Quick Verification**
- Dashboard → Table Editor → Should see 5 tables
- Authentication → Policies → Should see security policies

### 4. Run the App (30 seconds)
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) 🎉

### 5. Test the Features (30 seconds)
1. Sign up for an account
2. Go to "Create Prompt" 
3. Enter: "Help me write a professional email"
4. Click "Generate Prompt"
5. Test the generated prompt!

## 🎯 Demo Flow for Presentations

### **Flow 1: Prompt Creation (2 minutes)**
1. **Create Page** → Enter goal: "Write product descriptions for e-commerce"
2. **Add Variables** → `product_name`, `features`, `price`
3. **Generate** → Show AI-generated structured prompt
4. **Save** → Demonstrate prompt library

### **Flow 2: Multi-Model Testing (2 minutes)**
1. **Test Page** → Select the saved prompt
2. **Add Test Input** → Product details
3. **Select Models** → GPT-4, Claude 3.5
4. **Run Test** → Compare results side-by-side
5. **Save Results** → Show analytics

### **Flow 3: Prompt Enhancement (2 minutes)**
1. **Enhance Page** → Select existing prompt
2. **Choose "Improve"** → Add requirement: "Make it more persuasive"
3. **Generate** → Show enhanced version
4. **Compare** → Old vs new version
5. **Save** → Demonstrate versioning

### **Flow 4: Chained Prompts (3 minutes)**
1. **Chains Page** → Enter complex goal: "Create a marketing campaign"
2. **Generate Chain** → Show 3-step workflow
3. **Review Steps** → Research → Create → Optimize
4. **Save Chain** → Show workflow visualization
5. **Test Chain** → Demonstrate step-by-step execution

## 🔧 Troubleshooting

### Common Issues

**"Module not found" error**
```bash
rm -rf node_modules package-lock.json
npm install
```

**Database connection error**
- Check your Supabase URL and key
- Ensure RLS is enabled (see security commands below)

**API key errors**
- Add keys in app Settings → API Keys
- Or use environment variables

### Security Setup (If needed)
Run in Supabase SQL Editor:
```sql
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.prompts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.prompt_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tests ENABLE ROW LEVEL SECURITY;
```

## 🎨 Demo Features to Highlight

### **🌟 Standout Features**
- **AI-Powered Generation** - Smart prompt creation from natural language
- **Multi-Model Testing** - Compare GPT, Claude, etc. side-by-side  
- **Chained Workflows** - Break complex tasks into steps
- **Version Control** - Track prompt evolution
- **Professional UI** - Modern, responsive design

### **🔧 Technical Excellence**
- **Type Safety** - Full TypeScript implementation
- **Security** - Row Level Security for data isolation
- **Performance** - Optimized with Next.js 14
- **Scalability** - Ready for production use

### **📊 Business Value**
- **Productivity** - 10x faster prompt development
- **Quality** - AI-enhanced prompt optimization
- **Collaboration** - Team-friendly interface
- **Analytics** - Track what works best

## 🚀 Deployment Options

### **Instant Deploy to Vercel**
[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/yourusername/promptcraft-studio)

### **Manual Deployment**
```bash
npm run build
npm start
```

## 📞 Support During Demo

**If something breaks during your presentation:**

1. **Refresh the page** - Often fixes React state issues
2. **Check browser console** - Look for API errors
3. **Use demo account** - We can provide pre-populated data
4. **Contact us** - [your-email] for immediate help

## 🏆 Judging Criteria Alignment

| Criteria | How We Deliver |
|----------|----------------|
| **Innovation** | Novel chained prompt approach, AI-powered enhancement |
| **Technical** | Modern stack, TypeScript, security best practices |
| **Design** | Professional UI, responsive, accessibility-focused |
| **Usability** | Intuitive workflow, clear value proposition |
| **Impact** | Solves real problem for AI engineers and developers |

---

**Need help? Contact us immediately!**
- Email: [your-email]
- Discord: [your-discord]
- Phone: [your-phone] (during hackathon only)

**Good luck with your presentation! 🚀** 