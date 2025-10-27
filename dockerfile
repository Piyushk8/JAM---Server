FROM node:20-alpine AS BUILDER
WORKDIR /app
COPY Package*.json ./
RUN pnpm install
COPY . .

FROM node:20-alpine
WORKDIR /app
COPY --from=BUILDER /app /app
EXPOSE 3000 
CMD [ "node" , "index.js" ]
