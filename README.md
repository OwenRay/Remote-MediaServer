Production | Development
--- | ---
[![Build Status](https://travis-ci.com/OwenRay/remote.svg?token=uLVecMrGXxYbztvo1nvC&branch=master)](https://travis-ci.com/OwenRay/remote) | [![Build Status](https://travis-ci.com/OwenRay/remote.svg?token=uLVecMrGXxYbztvo1nvC&branch=dev)](https://travis-ci.com/OwenRay/remote)

# PREREQUISITES
- npm

# USING
###INSTALL
dev:  
$ npm install -g https://s3-eu-west-1.amazonaws.com/remote-mediaserver/dev/remote-mediaserver-0.0.1.tgz

prod:  
$ npm install -g https://s3-eu-west-1.amazonaws.com/remote-mediaserver/master/remote-mediaserver-0.0.1.tgz
###RUN
$ remote  
open http://localhost:8080

# DEVELOPMENT
### Installing dependencies
node setup.js  

### testing
To run execute:  
node main.js

A settings file will be created at first run  
Restart after modification

open http://localhost:8080

### frontend testing
cd frontend (got into the frontend directory)  
ember server --proxy http://localhost:8080
