// Type declarations for @roamhq/wrtc-linux-arm64
declare module '@roamhq/wrtc-linux-arm64' {
  export interface RTCIceServer {
    urls: string | string[];
    username?: string;
    credential?: string;
  }

  export interface RTCConfiguration {
    iceServers?: RTCIceServer[];
    iceTransportPolicy?: 'all' | 'relay';
    bundlePolicy?: 'balanced' | 'max-compat' | 'max-bundle';
    rtcpMuxPolicy?: 'negotiate' | 'require';
  }

  export interface RTCSessionDescriptionInit {
    type: 'offer' | 'answer' | 'pranswer' | 'rollback';
    sdp?: string;
  }

  export interface RTCIceCandidateInit {
    candidate?: string;
    sdpMid?: string | null;
    sdpMLineIndex?: number | null;
    usernameFragment?: string | null;
  }

  export class RTCPeerConnection {
    constructor(configuration?: RTCConfiguration);

    localDescription: RTCSessionDescription | null;
    remoteDescription: RTCSessionDescription | null;
    signalingState: string;
    iceConnectionState: string;
    connectionState: string;
    iceGatheringState: string;

    onicecandidate: ((event: { candidate: RTCIceCandidate | null }) => void) | null;
    ontrack: ((event: any) => void) | null;
    ondatachannel: ((event: any) => void) | null;
    onconnectionstatechange: (() => void) | null;
    oniceconnectionstatechange: (() => void) | null;
    onsignalingstatechange: (() => void) | null;
    onicegatheringstatechange: (() => void) | null;

    createOffer(options?: any): Promise<RTCSessionDescriptionInit>;
    createAnswer(options?: any): Promise<RTCSessionDescriptionInit>;
    setLocalDescription(description: RTCSessionDescriptionInit): Promise<void>;
    setRemoteDescription(description: RTCSessionDescriptionInit): Promise<void>;
    addIceCandidate(candidate: RTCIceCandidateInit): Promise<void>;
    addTrack(track: any, ...streams: any[]): any;
    removeTrack(sender: any): void;
    getSenders(): any[];
    getReceivers(): any[];
    getTransceivers(): any[];
    close(): void;
    createDataChannel(label: string, options?: any): any;
  }

  export class RTCSessionDescription {
    constructor(descriptionInitDict: RTCSessionDescriptionInit);
    type: 'offer' | 'answer' | 'pranswer' | 'rollback';
    sdp: string;
  }

  export class RTCIceCandidate {
    constructor(candidateInitDict?: RTCIceCandidateInit);
    candidate: string;
    sdpMid: string | null;
    sdpMLineIndex: number | null;
    usernameFragment: string | null;
  }

  export namespace nonstandard {
    export class RTCVideoSource {
      constructor();
      createTrack(): any;
      onFrame(frame: { width: number; height: number; data: Uint8ClampedArray }): void;
    }

    export class RTCAudioSource {
      constructor();
      createTrack(): any;
      onData(data: any): void;
    }
  }
}
