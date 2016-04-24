# PREREQUISITES
- npm

# USING
###INSTALL
npm install -g https://s3-eu-west-1.amazonaws.com/remote-mediaserver/remote-mediaserver-0.0.1.tgz
###RUN
remote
open http://localhost:8080

# DEVELOPMENT
### Installing dependencies
To install execute:  
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
