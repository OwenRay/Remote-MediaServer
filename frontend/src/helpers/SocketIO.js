/* global io */
const connection = typeof io !== 'undefined' ? io() : null;

class SocketIO {
  static onMessage(event, func) {
    if (!connection) return false;
    return connection.on(event, func);
  }
}

export default SocketIO;
