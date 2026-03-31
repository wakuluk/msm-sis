FROM node:20

WORKDIR /app

# Install dependencies first (better caching)
COPY package*.json ./
RUN npm install

# Copy rest of the app
COPY . .

RUN chmod +x /app/docker-entrypoint.sh

# Vite default port
EXPOSE 5173

# IMPORTANT: bind to 0.0.0.0 so Docker can expose it
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]