const WebSocket = require('ws');
const http = require('http');

// サーバーのポート設定（Renderでは環境変数 PORT を使用）
const port = process.env.PORT || 8080;

// HTTPサーバーを作成
const server = http.createServer();
const wss = new WebSocket.Server({ server });

wss.on('connection', (ws) => {
  console.log('Client connected');

  ws.on('message', (message) => {
    console.log(`Received message: ${message}`);

    // 他のクライアントにメッセージをブロードキャスト
    wss.clients.forEach((client) => {
      if (client !== ws && client.readyState === WebSocket.OPEN) {
        client.send(message);
      }
    });
  });

  ws.on('close', () => {
    console.log('Client disconnected');
  });
});

// サーバーをポートでリッスン
server.listen(port, () => {
  console.log(`Signaling server is running on port ${port}`);
});
