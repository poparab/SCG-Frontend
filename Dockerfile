# Build stage
FROM node:22-alpine AS build
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .
RUN npx ng build --configuration production
RUN npx ng build admin --configuration production --base-href /admin/

# Runtime stage
FROM nginx:alpine AS runtime

# Remove default nginx config
RUN rm /etc/nginx/conf.d/default.conf

# Copy custom nginx config
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy built apps
COPY --from=build /app/dist/scg-frontend/browser /usr/share/nginx/html/portal
COPY --from=build /app/dist/admin/browser /usr/share/nginx/html/admin

EXPOSE 80

HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
  CMD wget -q --spider http://127.0.0.1/ || exit 1

CMD ["nginx", "-g", "daemon off;"]
