/* global io */
const connection = io();

class SocketIO {
  static onMessage(event, func) {
    connection.on(event, func);
  }
}

export default SocketIO;
