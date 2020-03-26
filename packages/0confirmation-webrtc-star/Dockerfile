FROM node:10
WORKDIR /app
COPY package.json .
RUN npm install || exit 0
ENTRYPOINT ["npx", "star-signal", "--port", "9090", "--host", "0.0.0.0"]
