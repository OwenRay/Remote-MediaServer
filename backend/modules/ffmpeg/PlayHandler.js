const httpServer = require('../../core/http');
const RequestHandler = require('../../core/http/RequestHandler');
const fs = require('fs');
const Mpeg4Container = require('./Mpeg4Container.js');
const HLSContainer = require('./HLSContainer.js');

const containers = {
  mpeg4: Mpeg4Container,
  hls: HLSContainer,
};

// read all the profiles, parse their json and add remember the filename for reference
const profileDir = `${__dirname}/profiles/`;
const profiles = fs.readdirSync(profileDir)
  .map(filename => ({
    name: filename.split('.')[0],
    ...(JSON.parse(fs.readFileSync(`${profileDir}${filename}`))),
  }))
  .sort((a, b) => b.priority - a.priority);

class PlayHandler extends RequestHandler {
  handleRequest() {
    const { query } = this.context;

    const ua = this.request.headers['user-agent'];
    let profile;
    if (query.profile) {
      profile = profiles.find(p => p.name === query.profile);
    }
    if (!profile) {
      profile = profiles.find(p => p.useragent && ua.match(new RegExp(p.useragent)));
    }

    const Container = containers[profile.container];
    const container = new Container(this.context, this.method, this.path);
    return container.handleRequest(profile);
  }
}

httpServer.registerRoute('get', '/ply/:id', PlayHandler, false, 0);
httpServer.registerRoute('get', '/ply/:id/:offset', PlayHandler, false, 0);
