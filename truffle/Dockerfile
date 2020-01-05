# Node image
FROM node:alpine

# Set working directory
WORKDIR /app

# Add npm build-tools
RUN apk add -t .gyp --no-cache git python g++ make \
    && npm install -g truffle \
    && apk del .gyp

ENTRYPOINT [ "sh" ]