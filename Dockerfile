FROM  node:11-alpine
WORKDIR /app
COPY src/index.js .
COPY src/config.js .
COPY package.json .
RUN npm install
CMD ["node", "index.js"]