# Deploying to Coolify Using Dockerfile

## Quick Setup Guide

### Step 1: Configure in Coolify

1. **Go to your Coolify dashboard**
2. **Create a new application** (or edit existing)
3. **Select your Git repository**
4. **Choose build method**: Select **"Dockerfile"**
5. **Dockerfile path**: `Dockerfile` (should be in root)
6. **Set environment variables** (IMPORTANT - do this BEFORE first build):

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=your-anon-public-key
PORT=3000
```

**⚠️ Critical**: Environment variables MUST be set before the first build, as they're embedded during the build process!

---

### Step 2: Deploy

1. Click **"Deploy"** or push to your repository
2. Coolify will:
   - Build the Docker image using the Dockerfile
   - Run the container
   - Start the server with `node server.js`

---

## What the Dockerfile Does

### Stage 1: Builder
- Installs all dependencies (including dev dependencies)
- Copies source code
- Builds the React app (`npm run build`)
- Creates `dist/` folder with production files

### Stage 2: Production
- Creates minimal production image
- Installs only production dependencies
- Copies built files from builder stage
- Starts Express server on port 3000

---

## Verify Deployment

### Check Build Logs
You should see:
```
✅ Server running on port 3000
📁 Serving files from: /app/dist
🌐 MIME types configured for JavaScript modules
```

### Check Runtime Logs
When JavaScript files are requested:
```
📦 Serving: /assets/main-[hash].js
✅ Set MIME type for assets/main-[hash].js: text/javascript
```

---

## Troubleshooting

### Build Fails
- Check that `package.json` exists
- Verify Node.js version (uses Node 20)
- Check for build errors in Coolify logs

### App Doesn't Load
- Verify environment variables are set
- Check that `dist/` folder was created during build
- Verify port 3000 is exposed and accessible

### MIME Type Errors
- Check server logs for MIME type messages
- Verify Express is installed (should be in dependencies)
- Check that server.js is running

### 404 on Routes
- SPA routing should work automatically
- Verify `dist/index.html` exists
- Check server.js SPA fallback is working

---

## Environment Variables

| Variable | Description | Required | Example |
|----------|-------------|----------|---------|
| `VITE_SUPABASE_URL` | Supabase project URL | ✅ Yes | `https://xxx.supabase.co` |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Supabase anon key | ✅ Yes | `eyJhbGci...` |
| `PORT` | Server port | ❌ No | `3000` (default) |

**Find your Supabase credentials:**
1. Go to Supabase project dashboard
2. Settings → API
3. Copy Project URL → `VITE_SUPABASE_URL`
4. Copy anon public key → `VITE_SUPABASE_PUBLISHABLE_KEY`

---

## Docker Image Size

The multi-stage build creates an optimized image:
- **Builder stage**: ~1GB (includes dev dependencies)
- **Production stage**: ~150-200MB (only production files)

Only the production stage is included in the final image.

---

## Rebuilding

After changing code:
1. Push to Git repository
2. Coolify will automatically rebuild (if auto-deploy is enabled)
3. Or manually trigger rebuild in Coolify dashboard

---

## Port Configuration

- Default port: `3000`
- Coolify usually sets `PORT` environment variable automatically
- If not, the app defaults to port 3000
- Make sure Coolify exposes this port

---

## Health Check

The server will fail fast if:
- `dist/` folder doesn't exist
- Required files are missing

Check logs for specific error messages.
