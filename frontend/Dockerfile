FROM node:24

WORKDIR /app

# Install dependencies first for better layer caching.
COPY package.json package-lock.json ./
RUN npm ci && sha256sum package-lock.json | awk '{print $1}' > node_modules/.package-lock.sha

# Copy the rest of the app after dependencies are installed.
COPY . .

EXPOSE 5173

# Dependencies are installed in the image. Compose keeps /app/node_modules on a
# volume so the bind-mounted source does not hide them at runtime. The entrypoint
# refreshes dependencies only when package-lock.json changes.
CMD ["sh", "./docker-entrypoint.sh"]
