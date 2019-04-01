const core = require('../../core');
const httpServer = require('../../core/http');
const Log = require('../../core/Log');
const io = require('socket.io')();


class SocketIO {
  static emit(event, message) {
    io.emit(event, message);
  }

  static onLog(type, message) {
    if (type !== Log.LEVEL.NOTIFY_USER) return;
    SocketIO.emit(message[0], message.slice(1).join(' '));
  }

  static init() {
    io.attach(httpServer.getHttpServer());
    if (httpServer.getHttpsServer()) io.attach(httpServer.getHttpsServer());
  }
}

Log.addListener(SocketIO.onLog);

core.addAfterStartListener(SocketIO.init);


module.exports = SocketIO;
