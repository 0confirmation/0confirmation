FROM node:10

RUN apt-get update && apt-get install -y build-essential python git bash
WORKDIR /src
ADD . .
RUN yarn
WORKDIR /src/packages/0confirmation-ganache

EXPOSE 8545

ENTRYPOINT ["node", "./cli.js"]
