# base image
FROM node:12.2.0-alpine

# set working directory
WORKDIR /usr/app

# add `/app/node_modules/.bin` to $PATH
ENV PATH /usr/app/node_modules/.bin:$PATH

# install and cache app dependencies
COPY package* /usr/app/
COPY public /usr/app/public
COPY .env /usr/app/.env
COPY src /usr/app/src
COPY entrypoint.sh /usr/app/


RUN npm install --silent
RUN npm install react-scripts@3.0.1 -g --silent
RUN npm install -g pushstate-server@3.1.0 && \
  npm cache clear --force

RUN npm run build

ENV PORT=80


EXPOSE 80
CMD [ "sh", "-c", "/usr/app/entrypoint.sh" ]