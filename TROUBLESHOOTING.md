# Troubleshooting MIME Type Errors in Coolify

## Current Error

```
Failed to load module script: Expected a JavaScript-or-Wasm module script but the server responded with a MIME type of "application/octet-stream"
```

## Root Cause

Coolify (or nginx/Traefik in front) might be overriding or not respecting the Content-Type headers set by Express.

## Solutions

### Option 1: Verify server.js is running

Check your Coolify logs to see if you see these messages:
```
✅ Server running on port 3000
📁 Serving files from: /app/dist
🌐 MIME types configured for JavaScript modules
📦 Serving: /assets/main-[hash].js
✅ Set MIME type for assets/main-[hash].js: text/javascript
```

If you don't see these, the server.js might not be running.

### Option 2: Check if nginx/Traefik is in front

Coolify might be using nginx or Traefik as a reverse proxy. Check your Coolify service settings:

1. Go to your application in Coolify
2. Check if there's a "Traefik" or "Nginx" proxy configured
3. If yes, you may need to configure it to pass through Content-Type headers

### Option 3: Use Dockerfile (Recommended)

I've created a `Dockerfile` that ensures proper setup. In Coolify:

1. Set build method to "Dockerfile"
2. Point it to the Dockerfile in the repo
3. This ensures the server.js runs correctly

### Option 4: Verify Build Output

Make sure the build is working correctly:

1. Check that `dist/index.html` exists
2. Check that `dist/index.html` does NOT contain `/src/main.tsx` 
3. It should reference built files like `/assets/main-[hash].js`

### Option 5: Force MIME Types in Coolify Settings

If Coolify has a reverse proxy, add these headers in Coolify's service settings:

```
Content-Type: text/javascript (for .js files)
Content-Type: text/css (for .css files)
```

### Option 6: Test Locally

Test the production build locally:

```bash
npm run build
npm start
```

Then visit `http://localhost:3000` and check the Network tab:
- Look at the JavaScript files
- Check the Response Headers
- Verify `Content-Type: text/javascript`

## Quick Fix Checklist

- [ ] server.js exists and is executable
- [ ] package.json has `"start": "node server.js"`
- [ ] Express is installed (`npm install express`)
- [ ] Build completes successfully (`dist/` folder exists)
- [ ] Coolify is using the start command (`npm start`)
- [ ] Check Coolify logs for server startup messages
- [ ] No reverse proxy is stripping headers
- [ ] Environment variables are set correctly

## Debug Commands

In Coolify, check the logs:

```bash
# Should show server starting
✅ Server running on port 3000

# Should show files being served
📦 Serving: /assets/main-[hash].js
✅ Set MIME type for assets/main-[hash].js: text/javascript
```

If these don't appear, server.js isn't running or requests aren't reaching it.
