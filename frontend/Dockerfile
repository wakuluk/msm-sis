FROM node:24

WORKDIR /app

# Install dependencies first for better layer caching.
COPY package.json package-lock.json ./
RUN npm ci

# Copy the rest of the app after dependencies are installed.
COPY . .

EXPOSE 5173

# The compose bind mount replaces /app at runtime, so refresh deps before starting Vite.
CMD ["sh", "-lc", "npm ci && npm run dev -- --host 0.0.0.0"]
