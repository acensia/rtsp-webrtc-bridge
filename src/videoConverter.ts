import { spawn, ChildProcess } from 'child_process';
import { EventEmitter } from 'events';
import config from '../config.json';

interface VideoFrame {
  width: number;
  height: number;
  data: Uint8ClampedArray;
}

/**
 * Converts RTSP stream to raw I420 frames for WebRTC
 */
export class VideoConverter extends EventEmitter {
  private ffmpegProcess: ChildProcess | null = null;
  private width: number = 1280;
  private height: number = 720;
  private frameSize: number;
  private buffer: Buffer = Buffer.alloc(0);

  constructor(width: number = 1280, height: number = 720) {
    super();
    this.width = width;
    this.height = height;
    // I420 format: Y plane (width*height) + U plane (width*height/4) + V plane (width*height/4)
    this.frameSize = (width * height * 3) / 2;
  }

  start() {
    console.log(`Starting video converter (${this.width}x${this.height})...`);

    const ffmpegArgs = [
      '-rtsp_transport', 'tcp',
      '-i', config.rtsp.url,
      '-f', 'rawvideo',
      '-pix_fmt', 'yuv420p',
      '-s', `${this.width}x${this.height}`,
      '-r', '30',  // 30 fps
      '-'
    ];

    this.ffmpegProcess = spawn('ffmpeg', ffmpegArgs);

    this.ffmpegProcess.stdout?.on('data', (data: Buffer) => {
      this.handleVideoData(data);
    });

    this.ffmpegProcess.stderr?.on('data', (data: Buffer) => {
      const message = data.toString();
      if (message.includes('error') || message.includes('Error')) {
        console.error('FFmpeg error:', message);
      }
    });

    this.ffmpegProcess.on('close', (code: number | null) => {
      console.log(`FFmpeg video converter exited with code ${code}`);
      if (code !== 0 && code !== null) {
        console.error('FFmpeg failed. Restarting in 5 seconds...');
        setTimeout(() => this.start(), 5000);
      }
    });

    this.ffmpegProcess.on('error', (error: Error) => {
      console.error('FFmpeg process error:', error);
      this.emit('error', error);
    });

    console.log('Video converter started');
  }

  private handleVideoData(data: Buffer) {
    // Accumulate data in buffer
    this.buffer = Buffer.concat([this.buffer, data]);

    // Process complete frames
    while (this.buffer.length >= this.frameSize) {
      // Extract one frame
      const frameData = this.buffer.subarray(0, this.frameSize);
      this.buffer = this.buffer.subarray(this.frameSize);

      // Convert to Uint8ClampedArray for WebRTC
      const frame: VideoFrame = {
        width: this.width,
        height: this.height,
        data: new Uint8ClampedArray(frameData)
      };

      // Emit frame
      this.emit('frame', frame);
    }
  }

  stop() {
    console.log('Stopping video converter...');

    if (this.ffmpegProcess) {
      this.ffmpegProcess.kill('SIGINT');
      this.ffmpegProcess = null;
    }

    this.buffer = Buffer.alloc(0);
    console.log('Video converter stopped');
  }

  isRunning(): boolean {
    return this.ffmpegProcess !== null && !this.ffmpegProcess.killed;
  }
}
