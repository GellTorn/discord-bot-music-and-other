FROM node:12

WORKDIR /app

COPY . .

RUN npm i

ENV PORT=5555

EXPOSE 5555

CMD ["npm", "start"]