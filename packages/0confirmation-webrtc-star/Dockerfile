FROM node:10
COPY . .
RUN npm install
ENTRYPOINT ["npx", "star-signal", "--port", "9090", "--host", "0.0.0.0"]
