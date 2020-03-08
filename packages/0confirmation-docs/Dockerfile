FROM nginx
WORKDIR /book
COPY . .
RUN apt-get update && apt-get install -y curl bash && sh -c 'curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.35.3/install.sh | bash' && bash -c 'source ~/.bashrc && nvm install v10.17.0 && nvm use v10.17.0 && npm install && npm run build'
COPY ./service/nginx.conf /etc/nginx/nginx.conf
