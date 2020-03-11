FROM node:10
WORKDIR /app
COPY . .
RUN bash -c "yarn --ignore-scripts || exit 0"
WORKDIR packages/0confirmation-discovery
ENTRYPOINT ["yarn", "start"]
