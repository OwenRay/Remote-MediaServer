#!/bin/bash

mkdir -p /root/rms
arch="armv7l"
node=8.16.1
if [ $RAINBOW_ARCHITECTURE == "x86_64" ]; then
  arch="x64"
fi
#sed -i 's/ftp.us/archive/g' /etc/apt/sources.list

apt-get update
apt-get install -y rsync git wget
wget "https://nodejs.org/dist/v$node/node-v$node-linux-$arch.tar.gz"
ls -al *.tar.gz
tar xfzv *.tar.gz
rsync -a node*/* /usr/local/
rm -r node*

rsync -a /home/source/rms/package/* /rms

install -m 755 /home/source/rc.local /etc
install -m 755 /home/source/etc/default/remote-mediaserver /etc/default/
install -m 755 /home/source/etc/init.d/remote-mediaserver /etc/init.d/
mkdir -p /var/run/remote-mediaserver/
mkdir -p /usr/local/var/run

cd /rms
export PATH=$PATH:/usr/local/bin
npx nodeunit backend/core/tests/
