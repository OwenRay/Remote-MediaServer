# PREREQUISITES
- npm
- ffmpeg and ffprobe static binaries  
(the download of ffmpeg binaries will be automated in the future)

# INSTALLATION
To install execute:  
node setup.js  

# RUNNING
To run execute:  
node main.js

A settings file will be created at first run  
Restart after modification

open http://localhost:8080

# DEVELOPING
##backend:
just run the server like normal node main.js
##frontend
cd frontend (got into the frontend directory)  
ember server --proxy http://localhost:8080

# KNOWN ISSUES
Empty library will crash the server.