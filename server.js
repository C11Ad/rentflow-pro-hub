// Production server for Coolify - serves static files with correct MIME types
import express from 'express';
import { fileURLToPath } from 'url';
import { dirname, join, extname } from 'path';
import { existsSync, readFileSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;
const distPath = join(__dirname, 'dist');

// Check if dist folder exists
if (!existsSync(distPath)) {
  console.error('❌ dist directory not found! Make sure to run "npm run build" first.');
  process.exit(1);
}

// MIME type mapping for correct content types
const mimeTypes = {
  '.js': 'text/javascript',
  '.mjs': 'text/javascript',
  '.jsx': 'text/javascript',
  '.ts': 'text/typescript',
  '.tsx': 'text/typescript',
  '.json': 'application/json',
  '.css': 'text/css',
  '.html': 'text/html',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
  '.eot': 'application/vnd.ms-fontobject'
};

// Middleware to intercept and handle problematic requests
app.use((req, res, next) => {
  // Block direct access to source files (they shouldn't exist in dist anyway)
  if (req.path.startsWith('/src/')) {
    console.error(`❌ Blocked access to source file: ${req.path}`);
    console.error('   This suggests the build failed or wrong files are being served');
    return res.status(404).send('Source files not available in production');
  }
  next();
});

// Serve static files with explicit MIME type handling
// IMPORTANT: This must come before the SPA fallback route
app.use(express.static(distPath, {
  setHeaders: (res, filePath, stat) => {
    const ext = extname(filePath).toLowerCase();
    
    // CRITICAL: Force correct MIME types for JavaScript modules
    // Express default might be application/octet-stream
    if (ext === '.js' || ext === '.mjs') {
      // Explicitly remove any existing Content-Type and set correct one
      res.removeHeader('Content-Type');
      res.setHeader('Content-Type', 'text/javascript; charset=utf-8');
      res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
      console.log(`✅ Set MIME type for ${filePath}: text/javascript`);
      return;
    }
    
    // Handle TypeScript files if they somehow end up in dist (shouldn't happen)
    if (ext === '.ts' || ext === '.tsx') {
      res.removeHeader('Content-Type');
      res.setHeader('Content-Type', 'text/javascript; charset=utf-8');
      console.log(`⚠️ WARNING: TypeScript file in dist: ${filePath} - serving as JavaScript`);
      return;
    }
    
    // Set MIME types for other file types
    if (mimeTypes[ext]) {
      res.removeHeader('Content-Type');
      res.setHeader('Content-Type', mimeTypes[ext]);
      // Cache static assets
      if (ext.match(/\.(css|png|jpg|jpeg|gif|svg|woff|woff2|ttf|ico)$/)) {
        res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
      } else {
        res.setHeader('Cache-Control', 'no-cache');
      }
    } else {
      // Unknown file type - log it
      console.log(`⚠️ Unknown file type: ${filePath} (ext: ${ext})`);
    }
  },
  // Don't allow serving files outside dist directory
  dotfiles: 'ignore'
}));

// SPA fallback - serve index.html for all routes
app.get('*', (req, res) => {
  const indexPath = join(distPath, 'index.html');
  if (existsSync(indexPath)) {
    res.setHeader('Content-Type', 'text/html');
    res.setHeader('Cache-Control', 'no-cache');
    res.sendFile(indexPath);
  } else {
    res.status(404).send('Not found');
  }
});

// Add health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    distExists: existsSync(distPath),
    port: PORT 
  });
});

// Log all requests for debugging
app.use((req, res, next) => {
  console.log(`📥 ${req.method} ${req.path}`);
  next();
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`✅ Server running on port ${PORT}`);
  console.log(`📁 Serving files from: ${distPath}`);
  console.log(`🌐 MIME types configured for JavaScript modules`);
  
  // Verify build output
  const indexPath = join(distPath, 'index.html');
  if (existsSync(indexPath)) {
    const htmlContent = readFileSync(indexPath, 'utf-8');
    if (htmlContent.includes('/src/main.tsx')) {
      console.error('⚠️ WARNING: dist/index.html still contains /src/main.tsx - build may have failed!');
    } else {
      console.log('✅ Build verified: index.html references built files');
    }
  } else {
    console.error('❌ ERROR: dist/index.html not found!');
  }
});
