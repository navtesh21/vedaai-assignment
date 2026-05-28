'use client';

import { useEffect, useRef, useCallback } from 'react';
import { useAssignmentStore, QuestionPaper } from './store';

const WS_URL = typeof window !== 'undefined' 
  ? `${window.location.protocol === 'https:' ? 'wss:' : 'ws:'}//${window.location.host}/ws`
  : (process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:5000/ws');

interface WsMessage {
  type: 'subscribed' | 'processing' | 'complete' | 'failed';
  assignmentId: string;
  message?: string;
  paper?: QuestionPaper;
}

let wsInstance: WebSocket | null = null;
let reconnectTimer: ReturnType<typeof setTimeout> | null = null;

export function useWebSocket(assignmentId: string | null) {
  const wsRef = useRef<WebSocket | null>(null);
  const { setJobStatus, setPaper } = useAssignmentStore();

  const connect = useCallback(() => {
    if (!assignmentId) return;
    if (wsRef.current?.readyState === WebSocket.OPEN) return;

    try {
      const ws = new WebSocket(WS_URL);
      wsRef.current = ws;
      wsInstance = ws;

      ws.onopen = () => {
        ws.send(JSON.stringify({ type: 'subscribe', assignmentId }));
      };

      ws.onmessage = (event: MessageEvent<string>) => {
        try {
          const msg = JSON.parse(event.data) as WsMessage;

          switch (msg.type) {
            case 'subscribed':
              console.log('WS: Subscribed to', msg.assignmentId);
              break;
            case 'processing':
              setJobStatus('processing', msg.message || 'Generating your question paper...');
              break;
            case 'complete':
              if (msg.paper) {
                setPaper(msg.paper);
              }
              break;
            case 'failed':
              setJobStatus('failed', msg.message || 'Generation failed. Please try again.');
              break;
          }
        } catch {
          // ignore bad messages
        }
      };

      ws.onerror = () => {
        setJobStatus('failed', 'Connection error. Retrying...');
      };

      ws.onclose = () => {
        // Auto-reconnect after 3s if still processing
        const { jobStatus } = useAssignmentStore.getState();
        if (jobStatus === 'processing' || jobStatus === 'pending') {
          reconnectTimer = setTimeout(connect, 3000);
        }
      };
    } catch (err) {
      console.warn('WS connection failed:', err);
    }
  }, [assignmentId, setJobStatus, setPaper]);

  useEffect(() => {
    connect();

    return () => {
      if (reconnectTimer) clearTimeout(reconnectTimer);
      wsRef.current?.close();
    };
  }, [connect]);

  return { reconnect: connect };
}

export function closeWebSocket() {
  wsInstance?.close();
  wsInstance = null;
}
