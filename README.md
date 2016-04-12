# PREREQUISITES
- npm
- ffmpeg and ffprobe static binaries<br/>
(the download of ffmpeg binaries will be automated in the future)

# INSTALLATION
To install execute:<br/>
node setup.js<br/>

# RUNNING
To run execute:<br/>
node main.js

A settings file will be created at first run<br/>
Restart after modification

open http://localhost:8080

# DEVELOPING
##backend:
just run the server like normal node main.js
##frontend
cd frontend (got into the frontend directory)<br/>
ember server --proxy http://localhost:8080

# KNOWN ISSUES
Empty library will crash the server.
