# Source: https://medium.com/@chemidy/create-a-small-and-secure-angular-docker-image-based-on-nginx-93452cb08aa2
FROM node:11-alpine

# https://github.com/nodkz/mongodb-memory-server/issues/32 > can't execute npm run test as memory server can't be spawned

RUN apk update && apk add --no-cache --virtual .build-dependency \
    g++ gcc git make python bash 

# Create app directory
WORKDIR /app

# Install app dependencies
COPY package.json package-lock.json /app/
COPY lib /app/lib
RUN npm set progress=false && npm install --no-optional

# Copy project files into the docker image
COPY . /app

RUN npm run build

CMD ["npm", "run", "start"]