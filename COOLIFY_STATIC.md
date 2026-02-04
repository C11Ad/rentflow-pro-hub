# Deploying as Static Site in Coolify

This guide explains how to deploy your React app as a **static site** in Coolify (without a Node.js server).

## Option 1: Using Static Dockerfile (Recommended)

### Setup Steps:

1. **In Coolify Dashboard:**
   - Create/Edit your application
   - Select **"Dockerfile"** as build method
   - Set **Dockerfile path**: `Dockerfile.static`
   - OR rename `Dockerfile.static` to `Dockerfile`

2. **Set Environment Variables** (BEFORE first build!):
   ```env
   VITE_SUPABASE_URL=https://your-project.supabase.co
   VITE_SUPABASE_PUBLISHABLE_KEY=your-anon-public-key
   ```
   
   ⚠️ **Critical**: These must be set BEFORE building, as Vite embeds them during build!

3. **Deploy**
   - Coolify will build using nginx
   - Files will be served from `/usr/share/nginx/html`
   - Port 80 will be used

### What This Does:

- **Build Stage**: Uses Node.js to build your React app
- **Production Stage**: Uses nginx (lightweight web server) to serve static files
- **Benefits**: 
  - Much smaller image size (~25MB vs ~150MB)
  - Better performance (nginx is optimized for static files)
  - No Node.js runtime needed
  - Built-in gzip compression

---

## Option 2: Using Coolify Static Site Feature

If Coolify supports direct static site deployment:

1. **Set build command**: `npm run build`
2. **Set publish directory**: `dist`
3. **Set environment variables** (same as above)
4. **Deploy**

Coolify will:
- Build your app
- Serve files from `dist/` folder
- Handle SPA routing automatically

---

## Option 3: Using Nixpacks (Static)

1. **Rename** `nixpacks.static.toml` to `nixpacks.toml`
2. **Configure in Coolify**:
   - Build method: Nixpacks
   - Environment variables: Same as above
3. **Deploy**

---

## Environment Variables

**Required** (must be set before build):
- `VITE_SUPABASE_URL` - Your Supabase project URL
- `VITE_SUPABASE_PUBLISHABLE_KEY` - Your Supabase anon/public key

**Optional**:
- `PORT` - Not needed for static (nginx uses port 80)

---

## Verify Deployment

1. **Check build logs** - Should see:
   ```
   ✅ Build verified
   ```

2. **Check runtime** - Should see nginx serving files

3. **Test the app**:
   - Navigate to your domain
   - Test SPA routing (try `/dashboard`, `/auth`, etc.)
   - Check browser console for errors

---

## SPA Routing

The `nginx.conf` file includes SPA routing configuration:
- All routes fall back to `index.html`
- Static assets are cached
- JavaScript modules have correct MIME types

---

## Advantages of Static Deployment

✅ **Smaller image size** (25MB vs 150MB)  
✅ **Better performance** (nginx optimized for static files)  
✅ **Lower resource usage** (no Node.js runtime)  
✅ **Faster startup** (nginx starts instantly)  
✅ **Simpler setup** (no server.js needed)

---

## Switch Between Static and Server

- **For static**: Use `Dockerfile.static` or `nixpacks.static.toml`
- **For server**: Use `Dockerfile` (with Express) or `nixpacks.toml`

You can switch anytime by changing the file Coolify uses!
