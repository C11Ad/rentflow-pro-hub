# Debugging Coolify Deployment - MIME Type Issues

## Current Error

```
main.tsx:1  Failed to load module script: Expected a JavaScript-or-Wasm module script 
but the server responded with a MIME type of "application/octet-stream".
```

## Critical Issue Identified

The error mentions `main.tsx:1` which means:
- **The HTML is still trying to load `/src/main.tsx`** (the source file)
- **This should NOT happen in production** - Vite should transform it during build

This suggests one of these problems:

### 1. Build Failed or Incomplete
The `npm run build` command may have failed silently, or the dist folder doesn't contain the transformed HTML.

### 2. Wrong Files Being Served
Coolify might be serving source files instead of the `dist/` folder.

### 3. Server Not Running
The Express server might not be running, and Coolify is serving files statically.

---

## Debugging Steps

### Step 1: Check Build Logs in Coolify

Look for these messages in the build logs:

```
✅ Build verified
```

Or warnings:
```
⚠️ WARNING: Build may have failed - index.html still references source files
```

### Step 2: Check Runtime Logs

After deployment, check if you see:

```
✅ Server running on port 3000
📁 Serving files from: /app/dist
🌐 MIME types configured for JavaScript modules
✅ Build verified: index.html references built files
```

If you DON'T see these messages:
- Server.js is not running
- Check if Coolify is using the correct start command

### Step 3: Check Health Endpoint

Visit: `https://your-app-url/health`

Should return:
```json
{
  "status": "ok",
  "distExists": true,
  "port": 3000
}
```

### Step 4: Check What HTML is Being Served

In browser DevTools:
1. Go to Network tab
2. Reload page
3. Click on the main document request
4. Check Response - does it contain `/src/main.tsx` or built files?

**Expected (correct):**
```html
<script type="module" src="/assets/index-[hash].js"></script>
```

**Wrong (what you're seeing):**
```html
<script type="module" src="/src/main.tsx"></script>
```

---

## Common Causes & Fixes

### Cause 1: Build Environment Variables Not Set

**Fix:** Set environment variables in Coolify BEFORE building:
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_PUBLISHABLE_KEY`

Then rebuild.

### Cause 2: Build Failed Silently

**Check:** Look for errors in build logs like:
- TypeScript errors
- Missing dependencies
- Build command failures

**Fix:** Fix build errors and redeploy.

### Cause 3: Coolify Serving Wrong Directory

**Check:** Verify Coolify is using the Dockerfile and not trying to serve files directly.

**Fix:** Ensure build method is set to "Dockerfile" in Coolify.

### Cause 4: Reverse Proxy Stripping Headers

**Check:** If Coolify uses Traefik/nginx, check proxy configuration.

**Fix:** Configure proxy to pass through all headers, or use the nginx.conf provided.

---

## Quick Test

Test the Dockerfile locally:

```bash
docker build -t cribhub-test .
docker run -p 3000:3000 -e PORT=3000 cribhub-test
```

Then visit `http://localhost:3000` and check:
1. Does it load?
2. What does the HTML source show?
3. Check Network tab - what MIME types are JavaScript files served with?

---

## What the Updated Files Do

### server.js Updates:
- ✅ Blocks access to `/src/` files (shouldn't exist in production)
- ✅ Verifies build output on startup
- ✅ Logs all requests for debugging
- ✅ Health check endpoint (`/health`)

### Dockerfile Updates:
- ✅ Verifies dist folder was created
- ✅ Verifies index.html exists
- ✅ Warns if build didn't transform HTML correctly

---

## Next Steps

1. **Check Coolify build logs** - Look for build verification messages
2. **Check Coolify runtime logs** - Verify server.js is running
3. **Test /health endpoint** - Confirm server is responding
4. **Check browser Network tab** - See what HTML/JS files are actually being served

The debug logging should help identify exactly where the problem is occurring.
