![](doc/screens.png)

Production | Development
--- | ---
[![Build Status](https://travis-ci.org/OwenRay/Remote-MediaServer.svg?branch=master)](https://travis-ci.org/OwenRay/Remote-MediaServer) | [![Build Status](https://travis-ci.org/OwenRay/Remote-MediaServer.svg?branch=dev)](https://travis-ci.org/OwenRay/Remote-MediaServer)
# PREREQUISITES
- npm  
- nodejs >= 8

# USING
### INSTALL
dev:  
`$ npm install -g https://s3-eu-west-1.amazonaws.com/remote-mediaserver/dev/remote-mediaserver-0.1.0.tgz`  

prod:  
`$ npm install -g remote-mediaserver`

### RUN
`$ remote`  
direct your browser to http://localhost:8234

# DEVELOPMENT
### Installing dependencies
To setup your development environment run the following command  
`$ node setup.js`  
  
To start the server:  
`$ node main.js`  
  
A settings file (~/.remote/settings.json) will be created at first run  
Restart the server after direct modification  
  
direct your browser to http://localhost:8234
  
### Frontend
The frontend is build on [React](reactjs.org/)   
to build and test the frontend first make sure the backend is running  
then execute the following:  
`$ cd frontend`  
`$ npm start`  
  
The webapplication will now be accessible from http://localhost:3000
