import WebSocket, { WebSocketServer } from 'ws';
import http from 'http';
import { getRedis } from '../config/redis';

interface Client {
  ws: WebSocket;
  assignmentId?: string;
}

const clients = new Map<string, Set<WebSocket>>();
let wss: WebSocketServer;

export function setupWebSocket(server: http.Server): void {
  wss = new WebSocketServer({ server, path: '/ws' });

  wss.on('connection', (ws: WebSocket) => {
    let clientAssignmentId: string | undefined;

    ws.on('message', (data: Buffer) => {
      try {
        const msg = JSON.parse(data.toString()) as { type: string; assignmentId?: string };

        if (msg.type === 'subscribe' && msg.assignmentId) {
          clientAssignmentId = msg.assignmentId;
          if (!clients.has(clientAssignmentId)) {
            clients.set(clientAssignmentId, new Set());
          }
          clients.get(clientAssignmentId)!.add(ws);

          ws.send(JSON.stringify({ type: 'subscribed', assignmentId: clientAssignmentId }));
        }
      } catch {
        // ignore bad messages
      }
    });

    ws.on('close', () => {
      if (clientAssignmentId) {
        clients.get(clientAssignmentId)?.delete(ws);
        if (clients.get(clientAssignmentId)?.size === 0) {
          clients.delete(clientAssignmentId);
        }
      }
    });

    ws.on('error', console.error);
  });

  // Setup Redis Pub/Sub so workers can broadcast to connected clients
  try {
    const subClient = getRedis().duplicate();
    subClient.subscribe('ws_broadcast', (err) => {
      if (err) console.error('Redis WS Subscribe Error:', err);
    });

    subClient.on('message', (channel, message) => {
      if (channel === 'ws_broadcast') {
        try {
          const data = JSON.parse(message);
          const subs = clients.get(data.assignmentId);
          if (subs) {
            const payloadStr = JSON.stringify(data.payload);
            subs.forEach((clientWs) => {
              if (clientWs.readyState === WebSocket.OPEN) {
                clientWs.send(payloadStr);
              }
            });
          }
        } catch (e) {
          console.error('Error handling WS broadcast message:', e);
        }
      }
    });
  } catch (err) {
    console.error('Failed to setup Redis WS subscriber:', err);
  }

  console.log('✅ WebSocket server ready on /ws');
}

export function broadcastToAssignment(
  assignmentId: string,
  payload: Record<string, unknown>
): void {
  try {
    getRedis().publish('ws_broadcast', JSON.stringify({ assignmentId, payload }));
  } catch (e) {
    console.error('Failed to publish WS message to Redis', e);
  }
}
