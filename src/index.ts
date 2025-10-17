import express from 'express';
import path from 'path';
import { RTSPClient } from './rtspClient';
import { SignalingServer } from './signalingServer';
import config from '../config.json';

const app = express();
const PORT = config.server.port;
const WS_PORT = config.server.wsPort;

// Serve static files from public directory
app.use(express.static(path.join(__dirname, '../public')));

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'Server is running' });
});

// Start the HTTP server
app.listen(PORT, () => {
  console.log(`HTTP server running on http://localhost:${PORT}`);
});

// Start the RTSP client (converts RTSP to WebSocket stream)
const rtspClient = new RTSPClient(9999);
rtspClient.start();

// Start the WebRTC signaling server
const signalingServer = new SignalingServer(WS_PORT);

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\nShutting down gracefully...');
  rtspClient.stop();
  signalingServer.stop();
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\nShutting down gracefully...');
  rtspClient.stop();
  signalingServer.stop();
  process.exit(0);
});
