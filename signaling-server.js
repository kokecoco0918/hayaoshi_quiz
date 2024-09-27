const WebSocket = require('ws');

const port = process.env.PORT || 8080;
const wss = new WebSocket.Server({ port: port });

let clientCount = 0;   // クライアントの接続番号を管理
let clients = new Set(); // クライアントを管理
let firstBuzzerTimestamp = null; // 最初に押されたタイムスタンプを保存

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

        // JSONデータに変換してメッセージを処理
        const data = JSON.parse(message);

        // タイプが "buzzer" のときだけタイムスタンプの比較を行う
        if (data.type === 'buzzer') {
            const currentTimestamp = data.timestamp;

            // 最初の押下タイミングかどうかを判定
            if (firstBuzzerTimestamp === null || currentTimestamp < firstBuzzerTimestamp) {
                firstBuzzerTimestamp = currentTimestamp;

                // 最初に押したクライアントを他の全クライアントにブロードキャスト
                clients.forEach(function each(client) {
                    if (client.readyState === WebSocket.OPEN) {
                        client.send(JSON.stringify(data)); // JSONに変換して送信
                    }
                });
            } else {
                console.log(`Client ${ws.clientId}'s buzzer was ignored due to a later timestamp.`);
            }
        } else if (data.type === 'reset') {
            // クイズのリセット時にタイムスタンプをリセット
            firstBuzzerTimestamp = null;

            // リセットメッセージをすべてのクライアントに送信
            clients.forEach(function each(client) {
                if (client.readyState === WebSocket.OPEN) {
                    client.send(JSON.stringify(data)); // JSONに変換して送信
                }
            });
        } else if (data.type === 'clientId') {
            // クライアントIDの処理は既に行っているので無視
            console.log(`Client ${ws.clientId} received its ID.`);
        } else {
            // buzzer, reset, clientId のどれでもない場合はブロードキャスト
            clients.forEach(function each(client) {
                if (client.readyState === WebSocket.OPEN) {
                    client.send(JSON.stringify(data)); // 他のクライアントにそのまま送信
                }
            });
        }
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
