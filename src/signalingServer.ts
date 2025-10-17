import WebSocket from 'ws';
import { WebRTCPeer } from './webrtcPeer';

interface SignalingMessage {
  type: 'offer' | 'answer' | 'ice-candidate';
  sdp?: any;
  candidate?: any;
}

export class SignalingServer {
  private wss: WebSocket.Server;
  private webrtcPeer: WebRTCPeer | null = null;
  private client: WebSocket | null = null;

  constructor(port: number) {
    this.wss = new WebSocket.Server({
      port,
      host: '0.0.0.0'  // Listen on all interfaces
    });
    this.setupServer();
  }

  private setupServer() {
    this.wss.on('connection', (ws: WebSocket) => {
      console.log('New WebRTC client connected');

      // Support single peer for now
      if (this.client) {
        console.log('Already have a connected client, closing new connection');
        ws.close();
        return;
      }

      this.client = ws;

      // Create WebRTC peer for this client
      this.webrtcPeer = new WebRTCPeer();

      // Forward ICE candidates from peer to client
      this.webrtcPeer.on('iceCandidate', (candidate) => {
        this.sendToClient({
          type: 'ice-candidate',
          candidate: candidate.toJSON()
        });
      });

      // Handle connection state changes
      this.webrtcPeer.on('connectionStateChange', (state) => {
        console.log('WebRTC connection state:', state);
      });

      // Handle errors
      this.webrtcPeer.on('error', (error) => {
        console.error('WebRTC peer error:', error);
      });

      ws.on('message', async (message: string) => {
        try {
          const data: SignalingMessage = JSON.parse(message.toString());
          console.log('Received signaling message:', data.type);

          await this.handleSignalingMessage(data);
        } catch (error) {
          console.error('Error handling message:', error);
        }
      });

      ws.on('close', () => {
        console.log('Client disconnected');
        this.cleanup();
      });

      ws.on('error', (error) => {
        console.error('WebSocket error:', error);
        this.cleanup();
      });
    });

    console.log(`WebSocket signaling server started on 0.0.0.0:${this.wss.options.port}`);
  }

  private async handleSignalingMessage(message: SignalingMessage) {
    if (!this.webrtcPeer) {
      console.error('No WebRTC peer available');
      return;
    }

    switch (message.type) {
      case 'offer':
        if (message.sdp) {
          console.log('Received offer from client');
          const answer = await this.webrtcPeer.handleOffer(message.sdp);

          // Send answer back to client
          this.sendToClient({
            type: 'answer',
            sdp: answer
          });
        }
        break;

      case 'ice-candidate':
        if (message.candidate) {
          console.log('Received ICE candidate from client');
          await this.webrtcPeer.addIceCandidate(message.candidate);
        }
        break;

      default:
        console.log('Unknown message type:', message.type);
    }
  }

  private sendToClient(message: SignalingMessage) {
    if (this.client && this.client.readyState === WebSocket.OPEN) {
      this.client.send(JSON.stringify(message));
      console.log('Sent message to client:', message.type);
    }
  }

  private cleanup() {
    console.log('Cleaning up WebRTC connection');

    if (this.webrtcPeer) {
      this.webrtcPeer.close();
      this.webrtcPeer = null;
    }

    this.client = null;
  }

  /**
   * Get the current WebRTC peer (if any)
   */
  getWebRTCPeer(): WebRTCPeer | null {
    return this.webrtcPeer;
  }

  stop() {
    this.cleanup();
    this.wss.close();
    console.log('Signaling server stopped');
  }
}
