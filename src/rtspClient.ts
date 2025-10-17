import { spawn, ChildProcess } from 'child_process';
import WebSocket from 'ws';
import config from '../config.json';

export class RTSPClient {
  private ffmpegProcess: ChildProcess | null = null;
  private wsServer: WebSocket.Server | null = null;
  private wsPort: number;
  private clients: Set<WebSocket> = new Set();

  constructor(wsPort: number = 9999) {
    this.wsPort = wsPort;
  }

  start() {
    try {
      // Create WebSocket server for streaming
      this.wsServer = new WebSocket.Server({ port: this.wsPort });

      this.wsServer.on('connection', (socket: WebSocket) => {
        console.log('Stream client connected');
        this.clients.add(socket);

        socket.on('close', () => {
          console.log('Stream client disconnected');
          this.clients.delete(socket);
        });
      });

      // Start FFmpeg process to convert RTSP to MPEG1
      this.startFFmpeg();

      console.log(`RTSP stream WebSocket server started on port ${this.wsPort}`);
      console.log(`Streaming from: ${config.rtsp.url}`);
    } catch (error) {
      console.error('Error starting RTSP stream:', error);
      throw error;
    }
  }

  private startFFmpeg() {
    const ffmpegArgs = [
      '-rtsp_transport', 'tcp',
      '-i', config.rtsp.url,
      '-f', 'mpegts',
      '-codec:v', 'mpeg1video',
      '-s', '1920x1080',
      '-b:v', '2000k',
      '-bf', '0',
      '-r', '30',
      '-codec:a', 'mp2',
      '-ar', '44100',
      '-ac', '1',
      '-b:a', '128k',
      '-muxdelay', '0.001',
      '-'
    ];

    this.ffmpegProcess = spawn('ffmpeg', ffmpegArgs);

    this.ffmpegProcess.stdout?.on('data', (data: Buffer) => {
      // Broadcast video data to all connected WebSocket clients
      this.clients.forEach((client) => {
        if (client.readyState === WebSocket.OPEN) {
          client.send(data, { binary: true });
        }
      });
    });

    this.ffmpegProcess.stderr?.on('data', (data: Buffer) => {
      // FFmpeg outputs logs to stderr
      const message = data.toString();
      if (message.includes('error') || message.includes('Error')) {
        console.error('FFmpeg error:', message);
      }
    });

    this.ffmpegProcess.on('close', (code: number | null) => {
      console.log(`FFmpeg process exited with code ${code}`);
      if (code !== 0 && code !== null) {
        console.error('FFmpeg process failed. Restarting in 5 seconds...');
        setTimeout(() => this.startFFmpeg(), 5000);
      }
    });

    this.ffmpegProcess.on('error', (error: Error) => {
      console.error('FFmpeg process error:', error);
    });
  }

  stop() {
    console.log('Stopping RTSP stream...');

    // Close all WebSocket connections
    this.clients.forEach((client) => client.close());
    this.clients.clear();

    // Close WebSocket server
    if (this.wsServer) {
      this.wsServer.close();
      this.wsServer = null;
    }

    // Kill FFmpeg process
    if (this.ffmpegProcess) {
      this.ffmpegProcess.kill('SIGINT');
      this.ffmpegProcess = null;
    }

    console.log('RTSP stream stopped');
  }

  isRunning(): boolean {
    return this.ffmpegProcess !== null && !this.ffmpegProcess.killed;
  }
}
