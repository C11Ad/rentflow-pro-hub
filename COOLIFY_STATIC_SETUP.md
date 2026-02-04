# Quick Setup: Static Deployment in Coolify

## Choose Your Method

### Method 1: Dockerfile (Recommended) ✅

**Use this Dockerfile**: `Dockerfile.static`

**In Coolify:**
1. Build Method: **Dockerfile**
2. Dockerfile Path: `Dockerfile.static`
3. Set Environment Variables (BEFORE build):
   - `VITE_SUPABASE_URL=your-url`
   - `VITE_SUPABASE_PUBLISHABLE_KEY=your-key`
4. Deploy!

**Result**: Uses nginx to serve static files (lightweight, fast)

---

### Method 2: Coolify Static Site Feature

**If Coolify has a "Static Site" option:**

1. Build Command: `npm run build`
2. Publish Directory: `dist`
3. Environment Variables (same as above)
4. Deploy!

**Result**: Coolify serves files directly

---

### Method 3: Nixpacks Static

1. Rename `nixpacks.static.toml` → `nixpacks.toml`
2. Build Method: **Nixpacks**
3. Environment Variables (same as above)
4. Deploy!

---

## Key Differences: Static vs Server

| Feature | Static (nginx) | Server (Express) |
|---------|---------------|------------------|
| Image Size | ~25MB | ~150MB |
| Startup Time | Instant | ~2-3 seconds |
| Resource Usage | Minimal | Higher (Node.js) |
| Performance | Excellent | Good |
| Complexity | Simple | More complex |

**For a React SPA, static deployment is usually the best choice!**

---

## Environment Variables

⚠️ **MUST be set BEFORE building** (Vite embeds them at build time):

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=your-anon-public-key
```

---

## After Deployment

1. Check your domain
2. Test SPA routing (`/dashboard`, `/auth`, etc.)
3. Verify Supabase connection works
4. Check browser console for errors

Everything should work the same, just faster and lighter! 🚀
