#!/bin/bash

npx yarn pack
mkdir -p platform_scripts/nasos/source/rms
tar -xvzf remote-mediaserver-v*.tgz -C platform_scripts/nasos/source/rms
cd platform_scripts/nasos/source/rms/package

npx yarn install
cd ../../../
rainbow --arch $1 --build .
rainbow --arch $1 --pack .
