# 🚀 Deployment Guide - PromptCraft Studio

> **Quick deployment options for hackathon judges and evaluators**

## ⚡ One-Click Deployments

### 🔶 Vercel (Recommended - 2 minutes)

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/yourusername/promptcraft-studio&env=NEXT_PUBLIC_SUPABASE_URL,NEXT_PUBLIC_SUPABASE_ANON_KEY&envDescription=Supabase%20credentials%20required&envLink=https://supabase.com)

**Steps:**
1. Click the button above
2. Fork the repository to your GitHub
3. Add environment variables:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
4. Deploy! 🎉

### 🔹 Netlify (Alternative)

1. Connect your GitHub repository
2. Build command: `npm run build`
3. Publish directory: `.next`
4. Add environment variables
5. Deploy!

### 🟣 Railway (Database + App)

```bash
# One command deployment
railway login
railway link
railway up
```

## 🔧 Manual Deployment

### Prerequisites
- Domain/hosting service
- Node.js 18+ on server
- Supabase database

### Steps

1. **Build the project**
   ```bash
   npm run build
   ```

2. **Start production server**
   ```bash
   npm start
   ```

3. **Configure reverse proxy** (Nginx example)
   ```nginx
   server {
       listen 80;
       server_name yourdomain.com;
       
       location / {
           proxy_pass http://localhost:3000;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection 'upgrade';
           proxy_set_header Host $host;
           proxy_cache_bypass $http_upgrade;
       }
   }
   ```

## 🌐 Environment Variables for Production

### Required
```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
```

### Optional (for enhanced features)
```env
OPENAI_API_KEY=sk-your-openai-key
ANTHROPIC_API_KEY=sk-ant-your-anthropic-key
NEXTAUTH_URL=https://yourdomain.com
NEXTAUTH_SECRET=your-production-secret
```

## 🗄️ Database Setup for Production

### Option 1: Supabase (Recommended)
- Create production project on [supabase.com](https://supabase.com)
- Run the schema from `supabase/schema.sql`
- Enable RLS (Row Level Security)
- Copy connection details

### Option 2: Self-hosted PostgreSQL
```sql
-- Run the complete schema
\i supabase/schema.sql

-- Enable RLS
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.prompts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.prompt_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tests ENABLE ROW LEVEL SECURITY;
```

## 🔐 Security Checklist

- [ ] RLS enabled on all tables
- [ ] Environment variables secured
- [ ] API keys not exposed in client
- [ ] HTTPS enabled
- [ ] CORS configured properly
- [ ] Authentication working

## 📊 Performance Optimization

### 1. Enable caching
```javascript
// next.config.js
const nextConfig = {
  experimental: {
    appDir: true,
  },
  images: {
    domains: ['your-domain.com'],
  },
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
    ]
  },
}
```

### 2. Enable compression
```bash
# In your server
gzip on;
gzip_types text/plain text/css application/json application/javascript;
```

## 🚀 Quick Demo Deployment

For hackathon demos, we recommend:

1. **Vercel** for frontend (free tier)
2. **Supabase** for database (free tier)
3. **Your own API keys** for AI models

**Total cost: $0** for demo purposes!

## 🔧 Troubleshooting

### Common deployment issues:

**Build fails**
```bash
# Clear cache and rebuild
rm -rf .next node_modules
npm install
npm run build
```

**Environment variables not working**
- Check variable names (case sensitive)
- Ensure `NEXT_PUBLIC_` prefix for client variables
- Restart deployment after adding variables

**Database connection fails**
- Verify Supabase URL and key
- Check RLS policies are applied
- Ensure tables exist

**API routes fail**
- Check API key configuration
- Verify network access to AI providers
- Check logs for specific errors

## 📞 Production Support

**For hackathon judges experiencing deployment issues:**

1. **Use our demo instance**: [https://promptcraft-demo.vercel.app](https://promptcraft-demo.vercel.app)
2. **Contact for support**: [your-email]
3. **Quick debug**: Check browser console for errors

## 🏆 Scalability Notes

This application is designed to handle:
- **1000+ concurrent users** (with proper hosting)
- **Millions of prompts** (PostgreSQL scales well)
- **High API throughput** (rate limiting implemented)

For enterprise deployment, consider:
- Database connection pooling
- CDN for static assets
- Load balancing
- Monitoring and alerting

---

**Ready to scale from hackathon to production! 🚀** 