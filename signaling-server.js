const WebSocket = require('ws');
const port = process.env.PORT || 8080;  // Renderの環境変数PORTを使用
const server = new WebSocket.Server({ port: port });

const clients = {};

server.on('connection', ws => {
  ws.on('message', message => {
    const data = JSON.parse(message);

    if (data.type === 'register') {
      clients[data.clientId] = ws;
    } else if (data.type === 'offer' || data.type === 'answer' || data.type === 'candidate') {
      if (clients[data.targetId]) {
        clients[data.targetId].send(JSON.stringify(data));
      }
    }
  });

  ws.on('close', () => {
    for (let clientId in clients) {
      if (clients[clientId] === ws) {
        delete clients[clientId];
        break;
      }
    }
  });
});
