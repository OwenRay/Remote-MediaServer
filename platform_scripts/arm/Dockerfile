FROM multiarch/ubuntu-core:armhf-focal

CMD ["/bin/bash"]

RUN apt update
RUN apt install -y curl patch build-essential
RUN curl -fsSL https://deb.nodesource.com/setup_16.x | bash -
RUN apt install -y nodejs

WORKDIR /src
RUN npm init -y

RUN npm install -g pkg
RUN > index.js
RUN npx pkg --targets node16-linux-armv7 index.js
RUN chmod -R 777 /root
