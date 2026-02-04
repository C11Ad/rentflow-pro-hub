# Static site Dockerfile for Coolify
# Uses nginx to serve the built static files

FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy source code
COPY . .

# Build the application
# Note: Environment variables must be set during build for Vite
RUN npm run build

# Verify build output
RUN if [ ! -d "dist" ]; then echo "❌ ERROR: dist directory not created!" && exit 1; fi
RUN if [ ! -f "dist/index.html" ]; then echo "❌ ERROR: dist/index.html not found!" && exit 1; fi
RUN if grep -q "/src/main.tsx" dist/index.html; then echo "⚠️ WARNING: Build may have failed - index.html still references source files"; else echo "✅ Build verified"; fi

# Production stage - use nginx to serve static files
FROM nginx:alpine

# Copy custom nginx config
COPY nginx.static.conf /etc/nginx/conf.d/default.conf

# Test nginx configuration
RUN nginx -t

# Copy built files from builder
COPY --from=builder /app/dist /usr/share/nginx/html

# Expose port 3000
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --quiet --tries=1 --spider http://localhost:3000/ || exit 1

# Explicitly start nginx in foreground
CMD ["nginx", "-g", "daemon off;"]
