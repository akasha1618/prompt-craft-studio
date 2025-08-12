# 🚀 PromptCraft Studio - A comprehensive platform for LLMs prompt engineering: creating prompts from scratch, prompt-chaining, prompt improvement/optimization and testing

![PromptCraft Studio](https://img.shields.io/badge/Next.js-14-black?logo=next.js) ![Supabase](https://img.shields.io/badge/Supabase-3ECF8E?logo=supabase&logoColor=white) ![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?logo=typescript&logoColor=white) ![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?logo=tailwind-css&logoColor=white)

## 🎯 What is PromptCraft Studio?

PromptCraft Studio is a **professional-grade platform** designed for LLMs prompt engineers, developers and teams who need to create, test, improve, and manage LLMs prompts at scale. Built during the Cognizant's Vibe Coding Week, it provides an intuitive yet powerful interface for working with various LLMs models.

## ✨ Key Features

### 🔧 **Prompt Engineering**
- **Smart Prompt Generation** - AI-powered prompt creation based on goals
- **Structured Prompts** - Professional prompt format with roles, context, instructions, rules and output format
- **Variable Support** - Dynamic placeholders for reusable prompts
- **Multi-Model Support** - OpenAI GPTs, Anthropic Claude, and more

### 🔗 **Chained Prompts**
- **Workflow Creation** - Break complex tasks into sequential prompt chains
- **Step-by-Step Processing** - Each step builds on the previous output
- **Chain Optimization** - AI-powered workflow enhancement
- **Visual Flow** - Clear representation of prompt sequences

### 🧪 **Testing & Validation**
- **Multi-Model Testing** - Test prompts across different AI models simultaneously
- **Performance Metrics** - Response time, token usage, and success rates
- **A/B Testing** - Compare prompt variations side-by-side
- **Test History** - Track and analyze testing sessions

### 🎨 **Enhancement Tools**
- **AI-Powered Improvement** - Enhance prompts with specific requirements
- **Auto-Optimization** - Optimize for clarity, performance, and effectiveness
- **Version Control** - Track prompt evolution and improvements
- **Bulk Operations** - Improve multiple prompts at once

### 📊 **Analytics & Management**
- **Dashboard Overview** - Real-time statistics and insights
- **Prompt Library** - Organized collection of all your prompts
- **Usage Analytics** - Track testing frequency and improvement metrics
- **Team Collaboration** - Share and collaborate on prompt projects

### 🔐 **Security & Privacy**
- **Row Level Security (RLS)** - Complete data isolation between users
- **Secure Authentication** - Supabase-powered auth with password reset
- **API Key Management** - Secure storage of AI provider credentials
- **Data Encryption** - All data encrypted at rest and in transit

## 🚀 Quick Start

### Prerequisites

- **Node.js** 18+ 
- **npm** or **yarn**
- **Supabase credentials** (optional)
- **OpenAI API Key** (optional but recommended)
- **Anthropic API Key** (optional)

### 1. Download the project files

### 2. Install Dependencies

```bash
npm install
# or
yarn install
```

### 3. Environment Setup

Use the `.env.local` file rom the root directory:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# Optional: Default API Keys (users can add their own in settings)
OPENAI_API_KEY=your_openai_api_key
ANTHROPIC_API_KEY=your_anthropic_api_key
```

### 4. Database Setup

**⚠️ CRITICAL: The app requires a database to function!**

**📖 [Complete Database Setup Guide](DATABASE_SETUP.md)** ← **Read this for detailed instructions**

**You have 3 options to get the database running:**

#### **Option A: Use Demo Database (Quickest - 30 seconds)**

For vibe coding week judges or quick testing, use our demo database(already saved in the .env.local):

```env
# Add these to your .env.local file
NEXT_PUBLIC_SUPABASE_URL=https://nclwrrauvgynuysndesu.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5jbHdycmF1dmd5bnV5c25kZXN1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM4ODg1NzMsImV4cCI6MjA2OTQ2NDU3M30.7sAsOabm8M4nfy-z3O1UgjvXFrBDYzGzbZexknzdsbE
```


#### **Option B: Create Your Own Database (Recommended - 2 minutes)**

1. **Create Supabase Project**
   - Go to [supabase.com](https://supabase.com) and sign up (free)
   - Click "New Project"
   - Choose organization, name your project
   - Wait for setup to complete (~1 minute)

2. **Set Up Database Tables**
   - Go to your project dashboard
   - Click "SQL Editor" in the left sidebar
   - Click "New Query"
   - **Copy the ENTIRE content** from `supabase/schema.sql` 
   - **Paste it** in the query editor
   - Click **"RUN"** to execute
   - You should see "Success. No rows returned" ✅

3. **Get Your Credentials**
   - Go to Settings → API
   - Copy your "Project URL" 
   - Copy your "anon public" key
   - Add these to your `.env.local` file:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
```

#### **Option C: Quick Setup Script**

If you have Supabase CLI installed:

```bash
# Login to Supabase
npx supabase login

# Link to existing project or create new one
npx supabase init
npx supabase link --project-ref your-project-id

# Push the schema
npx supabase db push
```

### 5. Verify Database Setup

After setting up the database, verify it's working:

1. **Check Tables Created**
   - Go to Supabase Dashboard → Table Editor
   - You should see tables: `users`, `prompts`, `prompt_versions`, `tests`, `test_sessions`

2. **Verify RLS is Enabled**
   - Go to Authentication → Policies
   - You should see policies for each table

3. **Test Connection**
   ```bash
   npm run dev
   ```
   - Go to http://localhost:3000
   - Sign up for an account
   - Try creating a prompt

### 5. Run the Application

```bash
npm run dev
# or
yarn dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## 📖 User Guide

### Getting Started
1. **Sign Up or Demo Sign In** - Create your account or use the demo acount: account: demo@demo.com
password:demo
2. **Add API Keys** - Go to Settings → API Keys (optional)
3. **Create Your First Prompt** - Use the Create page
4. **Test & Improve** - Use the testing and enhancement tools

### Creating Prompts
- **Simple Prompts**: Single, focused prompts for specific tasks
- **Chained Prompts**: Multi-step workflows for complex operations
- **Variables**: Add dynamic placeholders like `{{company_name}}`

### Testing Workflow
1. Select prompts to test
2. Choose LLMs 
3. Add test inputs(if needed)
4. Compare results across models
5. Save successful variations

### Enhancement Process
1. Select existing prompts
2. Choose improvement type (Improve/Optimize)
3. Specify requirements
4. Review AI-enhanced version
5. Save as new version

## 🏗️ Technical Architecture

### Frontend
- **Next.js 14** - React framework with App Router
- **TypeScript** - Type-safe development
- **Tailwind CSS** - Utility-first styling
- **Shadcn/ui** - Modern component library
- **Lucide Icons** - Beautiful icon system

### Backend
- **Supabase** - Database, authentication, and real-time features
- **PostgreSQL** - Robust relational database
- **Row Level Security** - Multi-tenant data isolation
- **API Routes** - Next.js API for AI model integration

### AI Integration
- **OpenAI GPT Models** - GPT-4, GPT-4o, o1, and more
- **Anthropic Claude** - Claude 3.5, Claude 4, and Haiku
- **Flexible API** - Easy to add new model providers

### Security
- **Authentication** - Supabase Auth with email/password
- **Authorization** - RLS policies for data protection
- **API Security** - Secure key storage and validation
- **Data Encryption** - End-to-end security

## 🚀 Deployment

### Vercel (Recommended)

1. **Connect to Vercel**
   ```bash
   npx vercel
   ```

2. **Add Environment Variables**
   - Go to Vercel Dashboard → Settings → Environment Variables
   - Add all variables from `.env.local`

3. **Deploy**
   ```bash
   npx vercel --prod
   ```

### Manual Deployment

1. **Build the project**
   ```bash
   npm run build
   ```

2. **Start production server**
   ```bash
   npm start
   ```

## 🛠️ Development

### Project Structure
```
promptcraft-studio/
├── app/                    # Next.js App Router pages
│   ├── auth/              # Authentication pages
│   ├── dashboard/         # Main application pages
│   └── api/               # API routes
├── components/            # Reusable UI components
├── lib/                   # Utility functions
├── supabase/             # Database schema and migrations
├── types/                # TypeScript type definitions
└── public/               # Static assets
```

### Available Scripts
```bash
npm run dev         # Start development server
npm run build       # Build for production
npm run start       # Start production server
npm run lint        # Run ESLint
npm run type-check  # Run TypeScript check
```

### Adding New Features
1. Create components in `components/`
2. Add pages in `app/`
3. Update database schema in `supabase/`
4. Add types in `types/`

## 🎨 Design System

The platform uses a **vibrant, techy color scheme** representing AI and futurism:

- **Primary**: Blue/Indigo gradients
- **Secondary**: Orange/Red gradients  
- **Success**: Green/Emerald gradients
- **Warning**: Amber/Yellow gradients
- **Accent**: Purple/Violet gradients

## 🤝 Contributing

This is a hackathon project, but contributions are welcome!

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## 📄 License

MIT License - feel free to use this project for your own purposes.

## 🏆 Hackathon Achievement

Built during Cognizant's Vibe Coding Week with focus on:
- **Innovation** - Novel approach to prompt engineering
- **User Experience** - Intuitive, professional interface
- **Technical Excellence** - Modern stack with best practices
- **Scalability** - Ready for production use

## 📞 Support

- **Issues**: Open a GitHub issue
- **Questions**: Check the documentation or create a discussion
- **Features**: Submit feature requests via issues
- **Contact**: pop.alexandru@cognizant.com - Pop Alexandru Gabriel

---

**Made with ❤️ for Vibe Coding Week*

Transform your prompt engineering workflow with PromptCraft Studio - the professional platform for LLMs prompt creation, testing, and optimization. 

Natural language is the hottest new programming language!