Production | Development
--- | ---
[![Build Status](https://travis-ci.org/OwenRay/Remote-MediaServer.svg?branch=master)](https://travis-ci.org/OwenRay/Remote-MediaServer) | [![Build Status](https://travis-ci.org/OwenRay/Remote-MediaServer.svg?branch=dev)](https://travis-ci.org/OwenRay/Remote-MediaServer)

# PREREQUISITES
- npm  
- nodejs >= 6

# USING
### INSTALL
dev:  
`$ npm install -g https://s3-eu-west-1.amazonaws.com/remote-mediaserver/dev/remote-mediaserver-0.0.1.tgz`  

prod:  
`$ npm install -g https://s3-eu-west-1.amazonaws.com/remote-mediaserver/master/remote-mediaserver-0.0.1.tgz`  
### RUN
`$ remote`  
direct your browser to http://localhost:8080

# DEVELOPMENT
### Installing dependencies
To setup your development environment run the following command  
`$ node setup.js`  
  
To start the server:  
`$ node main.js`  
  
A settings file (~/.remote/settings.json) will be created at first run  
Restart the server after direct modification  
  
direct your browser to http://localhost:8080  
  
### Frontend
The frontend is build on [Ember.js](emberjs.com)   
to build and test the frontend first make sure the backend is running  
then execute the following:  
`$ cd frontend`  
`$ ember server --proxy http://localhost:8080`  
  
The webapplication will now be accessible from http://localhost:4200
