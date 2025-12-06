FROM node:25-alpine AS builder

WORKDIR /app

COPY package*.json ./

RUN npm ci --force

COPY . .

RUN npm run build

# Production stage
FROM node:25-alpine

WORKDIR /app

COPY package*.json ./

RUN npm ci --only=production --force

COPY --from=builder /app/dist ./dist

EXPOSE 3000

CMD ["node", "--env-file=.env", "dist/main"]
