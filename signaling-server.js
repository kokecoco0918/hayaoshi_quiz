const WebSocket = require('ws');
const wss = new WebSocket.Server({ port: process.env.PORT });

let clientCount = 0;
let buzzerLocked = false;

wss.on('connection', (ws) => {
    clientCount++;
    const clientId = clientCount;
    ws.send(JSON.stringify({ type: 'clientId', id: clientId }));

    ws.on('message', (message) => {
        const data = JSON.parse(message);
        if (data.type === 'buzzer' && !buzzerLocked) {
            buzzerLocked = true;
            // 他の全クライアントに誰が早押ししたかを通知
            wss.clients.forEach(client => {
                if (client.readyState === WebSocket.OPEN) {
                    client.send(JSON.stringify({ type: 'buzzer', name: data.name }));
                }
            });
        } else if (data.type === 'reset') {
            buzzerLocked = false;
            // 全クライアントにリセットを通知
            wss.clients.forEach(client => {
                if (client.readyState === WebSocket.OPEN) {
                    client.send(JSON.stringify({ type: 'reset' }));
                }
            });
        }
    });

    ws.on('close', () => {
        console.log(`Client ${clientId} disconnected`);
    });
});
