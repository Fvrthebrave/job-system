FROM node:18-alpine

WORKDIR /repo

COPY package*.json ./
COPY services/api/package*.json services/api/
COPY packages/shared/contracts/package*.json packages/shared/contracts/

RUN npm install

COPY services/api services/api
COPY packages/shared/contracts packages/shared/contracts

WORKDIR /repo/packages/shared/contracts
RUN npm run build

WORKDIR /repo/services/api
RUN npm run build

CMD ["node", "dist/index.js"]
