# Deployment Guide for CribHub

## Common "Bad Gateway" Issues & Solutions

### 1. Missing Environment Variables (Most Common)

The app requires these environment variables to be set in production:

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=your-anon-public-key
```

**Where to set them:**

#### Lovable Platform:
1. Go to your project settings
2. Navigate to Environment Variables
3. Add both `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY`

#### Vercel:
1. Go to your project settings
2. Navigate to Environment Variables
3. Add the variables for Production, Preview, and Development environments

#### Netlify:
1. Go to Site settings → Environment variables
2. Add both variables

#### Other Platforms:
Set environment variables in your hosting platform's configuration.

**Where to find your Supabase credentials:**
1. Go to your Supabase project dashboard
2. Navigate to Settings → API
3. Copy:
   - **Project URL** → Use as `VITE_SUPABASE_URL`
   - **anon public** key → Use as `VITE_SUPABASE_PUBLISHABLE_KEY`

---

### 2. SPA Routing Issues

This is a Single Page Application (SPA) using React Router. You need to configure your server to serve `index.html` for all routes.

**Already configured for:**
- ✅ Netlify (`public/_redirects`)
- ✅ Vercel (`vercel.json`)
- ✅ Apache (`.htaccess`)

**For other servers:**

#### Nginx:
```nginx
location / {
  try_files $uri $uri/ /index.html;
}
```

#### IIS (web.config):
```xml
<?xml version="1.0" encoding="UTF-8"?>
<configuration>
  <system.webServer>
    <rewrite>
      <rules>
        <rule name="React Routes" stopProcessing="true">
          <match url=".*" />
          <conditions logicalGrouping="MatchAll">
            <add input="{REQUEST_FILENAME}" matchType="IsFile" negate="true" />
            <add input="{REQUEST_FILENAME}" matchType="IsDirectory" negate="true" />
          </conditions>
          <action type="Rewrite" url="/index.html" />
        </rule>
      </rules>
    </rewrite>
  </system.webServer>
</configuration>
```

---

### 3. Build Configuration

Make sure you're building the app correctly:

```bash
npm run build
```

This creates a `dist/` folder with your production files. Upload the contents of `dist/` to your hosting platform.

---

### 4. Verify Your Deployment

After deploying:

1. **Check the browser console** for errors
2. **Verify environment variables** are accessible:
   - Open browser dev tools
   - Check if there are any errors about missing Supabase credentials
3. **Test routes** - Navigate to different pages to ensure SPA routing works

---

### 5. Troubleshooting Checklist

- [ ] Environment variables are set in production
- [ ] Environment variable names start with `VITE_` (required for Vite)
- [ ] Build completed successfully (`npm run build`)
- [ ] SPA routing is configured on your server
- [ ] Supabase project is active and accessible
- [ ] No CORS issues (check browser console)
- [ ] Correct files are uploaded (contents of `dist/` folder)

---

### 6. Testing Locally Before Production

Test your production build locally:

```bash
npm run build
npm run preview
```

This will show you exactly what will be deployed.

---

## Need Help?

If you're still experiencing issues:

1. Check browser console for specific error messages
2. Check server logs for backend errors
3. Verify Supabase project is running and accessible
4. Ensure all environment variables are correctly set
