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

// Start the HTTP server on all interfaces (0.0.0.0)
const httpServer = app.listen(PORT, '0.0.0.0', () => {
  console.log(`HTTP server running on http://0.0.0.0:${PORT}`);
  console.log(`Access from other devices: http://<your-server-ip>:${PORT}`);
});

// Start the RTSP client (converts RTSP to WebSocket stream)
const rtspClient = new RTSPClient(9999);
try {
  rtspClient.start();
} catch (error) {
  console.error('Failed to start RTSP client:', error);
  console.log('The server will continue running, but RTSP streaming is unavailable.');
  console.log('Please check your RTSP URL in config.json');
}

// Start the WebRTC signaling server
const signalingServer = new SignalingServer(WS_PORT);

// Graceful shutdown
const shutdown = () => {
  console.log('\nShutting down gracefully...');

  // Close HTTP server
  httpServer.close(() => {
    console.log('HTTP server closed');
  });

  // Stop RTSP client
  rtspClient.stop();

  // Stop signaling server
  signalingServer.stop();

  // Give services time to close
  setTimeout(() => {
    process.exit(0);
  }, 1000);
};

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
