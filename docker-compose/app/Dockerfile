FROM node:9

WORKDIR /app

COPY package.json /app

RUN npm install --production

COPY . /app

EXPOSE 7331

CMD ["npm", "start"]