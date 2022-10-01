FROM node:16 AS build_backend

WORKDIR /backend
COPY ./package* ./
RUN npm install --production

##################################
FROM node:16 AS build_frontend

WORKDIR /frontend
COPY ./frontend/package* ./

RUN npm install --production
COPY frontend/ ./

RUN npm run build


##################################
FROM node:16

WORKDIR /app

COPY --from=build_frontend /frontend/build /app/frontend/build
COPY --from=build_backend /backend /app/

COPY . backend/ /app/

# EXPOSE [P2P] [HTTP]
EXPOSE 8234 8235

# USER rms
CMD node main.js
