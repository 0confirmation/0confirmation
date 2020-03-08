FROM node:10
WORKDIR /book
COPY . .
RUN npm install -g gitbook-cli && gitbook build
FROM nginx
COPY ./nginx.conf /etc/nginx/nginx.conf
