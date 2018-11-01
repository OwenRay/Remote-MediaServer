const crypto = require('crypto');
const Log = require('../helpers/Log');

class Crypt {
  static encrypt(stream, key, nonce) {
    const cypher = crypto.createCipheriv('aes192', key, nonce);
    cypher.on('error', (e) => {
      Log.debug('cypher emitted error', e);
    });
    return stream.pipe(cypher);
  }

  static decrypt(key, nonce) {
    const cypher = crypto.createDecipheriv('aes192', key, nonce);

    cypher.on('error', (e) => {
      Log.debug('cypher emitted error', e);
    });
    return cypher;
  }
}

module.exports = Crypt;
