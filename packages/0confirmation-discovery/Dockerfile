FROM node:10
WORKDIR /app
COPY . .
RUN npx yarn
CMD ["npx", "yarn", "workspace" "@0confirmation/discovery", "start"]
