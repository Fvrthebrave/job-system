FROM node:18-alpine

WORKDIR /repo

COPY package*.json ./
COPY services/worker/package*.json services/worker/
COPY packages/shared/contracts/package*.json packages/shared/contracts/

RUN npm install

COPY services/worker services/worker
COPY packages/shared/contracts packages/shared/contracts

WORKDIR /repo/packages/shared/contracts
RUN npm run build

WORKDIR /repo/services/worker
RUN npm run build

CMD ["node", "dist/index.js"]
