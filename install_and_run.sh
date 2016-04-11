#!/bin/bash

platform="unix64"
if [ ! -z "$(uname -a | grep Darwin)" ];
then
  platform="osx"
fi
if [ ! -z "$(uname -a | grep arm)" ];
then
  platform="arm"
fi

echo "platform is $platform"

npm install
cd frontend
npm install
bower install
cd ../

if [ ! -f ffmpeg ];
then
  if [ "$platform" = "unix64" ];
  then
    wget http://johnvansickle.com/ffmpeg/releases/ffmpeg-release-64bit-static.tar.xz
    tar -xf ffmpeg-*.tar.xz
    cp -r ffmpeg-*/ffmpeg .
    cp -r ffmpeg-*/ffprobe .
    rm -r ffmpeg-*
    chmod +x ffmpeg ffprobe
  fi
  if [ "$platform" = "osx" ];
  then
    wget http://www.ffmpegmac.net/resources/SnowLeopard_Lion_Mountain_Lion_Mavericks_Yosemite_El-Captain_25.02.2016.zip
    unzip SnowLeopard_Lion_Mountain_Lion_Mavericks_Yosemite_El-Captain_25.02.2016.zip
    rm ffserver SnowLeopard_Lion_Mountain_Lion_Mavericks_Yosemite_El-Captain_25.02.2016.zip
  fi
  
  if [ "$platform" = "arm" ];
  then
    echo "!!!!!! Please install ffmpeg & ffprobe manually via your package manager"
  fi
fi

echo "running node"
node main.js &

cd frontend
echo "running ember"
ember server --proxy http://localhost:8080/
