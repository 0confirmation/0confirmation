FROM node:10

RUN apk add --no-cache make gcc g++ python git bash
WORKDIR /src
ADD . .
RUN yarn

EXPOSE 8545

ENTRYPOINT ["node", "./cli.js"]
