FROM node:10 AS build_backend

WORKDIR /backend
COPY ./package* ./
RUN npm install --production

##################################
FROM node:10 AS build_frontend

WORKDIR /frontend
COPY ./frontend/package* ./

RUN npm install --production

##################################
FROM node:10

# RUN adduser rms --gecos GECOS --shell /bin/bash --disabled-password --home /src
WORKDIR /app

# COPY --chown=rms:rms --from=build_frontend /frontend/* /root/
COPY --from=build_frontend /frontend /app/

# COPY --chown=rms:rms --from=build_backend /backend/* /root/
COPY --from=build_backend /backend /app/

# COPY --chown=rms:rms ./* /root/
COPY . /app/

# EXPOSE [P2P] [HTTP]
EXPOSE 8234 8235

# USER rms
CMD node main.js
