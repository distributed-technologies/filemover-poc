#stage build
FROM node:16 as node
WORKDIR /app
COPY . .
RUN npm install
RUN npm run build --prod
#stage application
FROM nginx:alpine
COPY --from=node /app/dist/filemover /usr/share/nginx/html
