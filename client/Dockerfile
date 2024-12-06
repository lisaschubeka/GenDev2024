FROM node:alpine3.20

WORKDIR /usr/src/client

COPY client/package*.json ./

RUN npm install

COPY client/ .

EXPOSE 5173

CMD ["npm", "run", "dev", "--", "--host"]
