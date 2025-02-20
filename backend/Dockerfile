FROM node:14

WORKDIR /usr/src/app

COPY package*.json ./

COPY . .

RUN npm install

RUN mkdir -p /usr/src/app/uploads

EXPOSE 5001

CMD ["node", "src/app.js"]