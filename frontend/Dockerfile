# ==========================================
# STAGE 1: COMPILATION BUILD
# ==========================================
FROM node:24-alpine AS builder

WORKDIR /build

# Copy manifest configs to leverage cache
COPY package*.json ./
RUN npm ci

# Copy frontend source files
COPY . .

# Compile optimized static bundles
RUN npm run build

# ==========================================
# STAGE 2: SECURED RUNTIME (NGINX)
# ==========================================
FROM nginx:1.25-alpine

# Copy compiled static assets from builder stage
COPY --from=builder /build/dist /usr/share/nginx/html

# Copy secure production Nginx server block configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

# Run nginx in foreground
CMD ["nginx", "-g", "daemon off;"]
