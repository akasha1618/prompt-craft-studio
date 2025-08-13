# Azure App Service Deployment Guide

## Prerequisites

1. Azure App Service with Node.js 22 runtime
2. GitHub repository connected to Azure App Service
3. Environment variables configured in Azure App Service

## Required Environment Variables

Configure these in your Azure App Service Application Settings:

```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
NODE_ENV=production
NEXT_TELEMETRY_DISABLED=1
```

## Deployment Steps

1. **Connect GitHub Repository**
   - In Azure Portal, go to your App Service
   - Navigate to "Deployment Center"
   - Choose "GitHub" as source
   - Connect your repository

2. **Configure Build Settings**
   - Set the following Application Settings:
     - `SCM_DO_BUILD_DURING_DEPLOYMENT=true`
     - `WEBSITE_NODE_DEFAULT_VERSION=22.17.0`
     - `NODE_ENV=production`

3. **Deploy**
   - Push changes to your main branch
   - Azure will automatically build and deploy

## Build Process

The deployment will:
1. Install Node.js 22.17.0
2. Run `npm install` to install dependencies
3. Run `npm run build` to build the Next.js application
4. Start the application with `npm start` (uses custom server.js)

## Troubleshooting

### Common Issues

1. **Build fails with autoprefixer error**
   - ✅ Fixed: Moved autoprefixer to dependencies

2. **Module resolution errors**
   - ✅ Fixed: Updated tsconfig.json paths

3. **Conflicting routes**
   - ✅ Fixed: Removed duplicate auth callback route

4. **Deprecated Next.js config**
   - ✅ Fixed: Removed appDir experimental option

### Logs

Check deployment logs in:
- Azure Portal → App Service → Deployment Center → Logs
- Kudu Console: `https://your-app-name.scm.azurewebsites.net`

### Manual Deployment

If automatic deployment fails, you can deploy manually:

```bash
# Build locally
npm run build

# Zip the .next folder and deploy via Kudu
# Or use Azure CLI
az webapp deployment source config-zip --resource-group your-rg --name your-app-name --src build.zip
```

## Application Structure

- **Custom Server**: `server.js` handles HTTP requests for Azure App Service
- **Build Output**: `.next` folder contains the built application
- **Static Files**: Served from the `public` directory
- **API Routes**: Located in `app/api/` directory

## Performance Optimization

- Static assets are automatically optimized by Next.js
- Images are optimized using Next.js Image component
- CSS is automatically minified and optimized
- JavaScript is bundled and minified for production
