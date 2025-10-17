import {
  RTCPeerConnection,
  RTCSessionDescription,
  RTCIceCandidate,
  nonstandard
} from '@roamhq/wrtc';
import config from '../config.json';
import { EventEmitter } from 'events';

const { RTCVideoSource } = nonstandard;

export interface WebRTCPeerEvents {
  'iceCandidate': (candidate: RTCIceCandidate) => void;
  'connectionStateChange': (state: string) => void;
  'error': (error: Error) => void;
}

export class WebRTCPeer extends EventEmitter {
  private peerConnection: RTCPeerConnection;
  private videoSource: any;
  private videoTrack: any;
  private isActive: boolean = false;

  constructor() {
    super();

    // Create RTCPeerConnection with ICE servers from config
    this.peerConnection = new RTCPeerConnection({
      iceServers: config.webrtc.iceServers
    });

    // Create video source for feeding frames
    this.videoSource = new RTCVideoSource();
    this.videoTrack = this.videoSource.createTrack();

    // Add video track to peer connection
    this.peerConnection.addTrack(this.videoTrack);

    this.setupEventHandlers();
  }

  private setupEventHandlers() {
    // Handle ICE candidates
    this.peerConnection.onicecandidate = (event: any) => {
      if (event.candidate) {
        console.log('Generated ICE candidate:', event.candidate.candidate);
        this.emit('iceCandidate', event.candidate);
      }
    };

    // Handle connection state changes
    this.peerConnection.onconnectionstatechange = () => {
      const state = this.peerConnection.connectionState;
      console.log('Connection state changed:', state);
      this.emit('connectionStateChange', state);

      if (state === 'connected') {
        this.isActive = true;
        console.log('WebRTC peer connected successfully');
      } else if (state === 'failed' || state === 'closed') {
        this.isActive = false;
      }
    };

    // Handle ICE connection state
    this.peerConnection.oniceconnectionstatechange = () => {
      console.log('ICE connection state:', this.peerConnection.iceConnectionState);
    };

    // Handle signaling state
    this.peerConnection.onsignalingstatechange = () => {
      console.log('Signaling state:', this.peerConnection.signalingState);
    };
  }

  /**
   * Handle incoming offer from client and create answer
   */
  async handleOffer(offer: any): Promise<any> {
    try {
      console.log('Received offer, creating answer...');

      // Set remote description (client's offer)
      await this.peerConnection.setRemoteDescription(new RTCSessionDescription(offer));

      // Create answer
      const answer = await this.peerConnection.createAnswer();

      // Set local description (our answer)
      await this.peerConnection.setLocalDescription(answer);

      console.log('Answer created successfully');
      return answer;
    } catch (error) {
      console.error('Error handling offer:', error);
      this.emit('error', error as Error);
      throw error;
    }
  }

  /**
   * Add ICE candidate received from client
   */
  async addIceCandidate(candidate: any): Promise<void> {
    try {
      if (candidate && candidate.candidate) {
        await this.peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
        console.log('Added ICE candidate from client');
      }
    } catch (error) {
      console.error('Error adding ICE candidate:', error);
      // Don't throw - ICE candidates can fail gracefully
    }
  }

  /**
   * Feed video frame to WebRTC
   * @param frame - Video frame data (I420 format)
   * @param width - Frame width
   * @param height - Frame height
   */
  sendVideoFrame(frame: { width: number; height: number; data: Uint8ClampedArray }) {
    if (!this.isActive || !this.videoSource) {
      return;
    }

    try {
      this.videoSource.onFrame(frame);
    } catch (error) {
      console.error('Error sending video frame:', error);
    }
  }

  /**
   * Get current connection state
   */
  getConnectionState(): string {
    return this.peerConnection.connectionState;
  }

  /**
   * Close the peer connection
   */
  close() {
    console.log('Closing WebRTC peer connection');
    this.isActive = false;

    if (this.videoTrack) {
      this.videoTrack.stop();
    }

    if (this.peerConnection) {
      this.peerConnection.close();
    }
  }

  /**
   * Check if peer is ready to receive frames
   */
  isReady(): boolean {
    return this.isActive && this.peerConnection.connectionState === 'connected';
  }
}
