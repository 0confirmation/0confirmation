FROM node
WORKDIR /app
COPY . .
RUN yarn install --network-concurrency 1
CMD ["yarn", "start"]
