FROM node:alpine3.20

WORKDIR /usr/src/server

COPY server/package*.json ./

RUN npm install --production

COPY server/ .

RUN apk add --no-cache openssl

RUN npx prisma generate

EXPOSE 4000

CMD ["sh", "-c", "npx prisma migrate deploy --schema=./prisma/schema.prisma && npm run build && npm run start"]
