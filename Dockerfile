FROM node:22-alpine
ENV NODE_ENV=production
ENV TZ=Europe/Paris
WORKDIR /usr/src/app
EXPOSE 80
COPY package.json package-lock.json ./
RUN npm install
COPY . .
CMD ["npm", "run", "start"]