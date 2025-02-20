FROM node:20.17.0
 
WORKDIR /app
 
COPY . .

RUN npm run prepare-client
RUN npm run prepare-server

ENV NODE_ENV=production
 
CMD [ "npm", "start" ]
