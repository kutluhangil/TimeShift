# TimeShift Deployment Guide

## Local Development

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Set Environment Variables**
   - Copy `.env.example` to `.env.local`
   - Add your Gemini API key (get it from https://ai.google.dev/)
   ```
   VITE_GEMINI_API_KEY=your_api_key_here
   ```

3. **Start Development Server**
   ```bash
   npm run dev
   ```

## Deployment to Vercel

### Step 1: Create Vercel Project
- Push your code to GitHub
- Go to https://vercel.com/new
- Import your TimeShift repository

### Step 2: Configure Environment Variables
In the Vercel dashboard, go to **Settings → Environment Variables** and add:
- **Key**: `VITE_GEMINI_API_KEY`
- **Value**: Your Gemini API key from https://ai.google.dev/
- **Environments**: Select "Production", "Preview", and "Development"

### Step 3: Deploy
Click "Deploy" and Vercel will automatically build and deploy your site.

## Getting a Gemini API Key

1. Go to https://ai.google.dev/
2. Click "Get API Key"
3. Create a new API key in Google Cloud Console
4. Copy the key and use it for both local development and Vercel deployment

## Troubleshooting

### "GEMINI_API_KEY environment variable is not set"
- Verify `VITE_GEMINI_API_KEY` is set in Vercel Environment Variables
- Redeploy after setting the environment variable
- Check that the variable is set for the correct environment (Production/Preview)

### Styles not loading (no CSS)
- This should be handled by the Tailwind configuration
- If styles are missing, ensure `npm install` was run
- Check that `tailwind.config.js` and `postcss.config.js` exist

### Build fails on Vercel
- Check Vercel Build Logs
- Ensure all environment variables are set
- Verify Node.js version compatibility (should use Node 18+)

## Build Commands

```bash
# Development
npm run dev

# Production build
npm run build

# Preview production build locally
npm run preview
```
