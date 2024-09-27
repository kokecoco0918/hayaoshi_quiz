const WebSocket = require('ws');

const port = process.env.PORT || 8080;
const wss = new WebSocket.Server({ port: port });

let clientCount = 0;   // クライアントの接続番号を管理
let clients = new Set(); // クライアントを管理

// WebSocketサーバーへの接続イベント
wss.on('connection', function connection(ws) {
    clientCount++;
    clients.add(ws);
    ws.clientId = clientCount;
    
    console.log(`Client ${ws.clientId} connected.`);
    
    // クライアントに接続された番号を送信
    ws.send(JSON.stringify({ type: 'clientId', id: ws.clientId }));

    // メッセージ受信イベント
    ws.on('message', function incoming(message) {
        console.log('received: %s', message);
        
        // 他のすべてのクライアントにメッセージをブロードキャスト
        clients.forEach(function each(client) {
            if (client !== ws && client.readyState === WebSocket.OPEN) {
                client.send(message);
            }
        });
    });

    // クライアント切断時のイベント
    ws.on('close', function close() {
        clients.delete(ws); // クライアント削除
        console.log(`Client ${ws.clientId} disconnected.`);
        
        // すべてのクライアントが切断されたときにclientCountをリセット
        if (clients.size === 0) {
            clientCount = 0;
            console.log('All clients disconnected. Resetting client count.');
        }
    });
});

console.log(`WebSocket server is running on port ${port}`);
