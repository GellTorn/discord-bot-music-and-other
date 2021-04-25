FROM node:14.16.1-alpine

WORKDIR /app

COPY . .

RUN npm i

CMD ["npm", "start"]