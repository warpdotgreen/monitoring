FROM node:18

WORKDIR /app

COPY package*.json ./
COPY tsconfig.json ./

RUN npm install -g npm
RUN npm install

COPY src/ ./src/

RUN npm run build

ENTRYPOINT ["npm", "start"]
