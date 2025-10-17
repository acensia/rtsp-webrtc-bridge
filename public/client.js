class RTSPWebRTCClient {
    constructor() {
        this.canvas = document.getElementById('videoCanvas');
        this.player = null;
        this.startBtn = document.getElementById('startBtn');
        this.stopBtn = document.getElementById('stopBtn');
        this.statusEl = document.getElementById('status');
        this.wsStatusEl = document.getElementById('wsStatus');

        this.setupEventListeners();
    }

    setupEventListeners() {
        this.startBtn.addEventListener('click', () => this.start());
        this.stopBtn.addEventListener('click', () => this.stop());
    }

    updateStatus(message, type = 'info') {
        this.statusEl.textContent = `Status: ${message}`;
        this.statusEl.className = 'status';
        if (type === 'connected') {
            this.statusEl.classList.add('connected');
        } else if (type === 'error') {
            this.statusEl.classList.add('error');
        }
    }

    start() {
        try {
            this.updateStatus('Connecting...');
            this.startBtn.disabled = true;

            // Check if JSMpeg is loaded
            if (typeof JSMpeg === 'undefined') {
                this.updateStatus('JSMpeg library not loaded', 'error');
                this.startBtn.disabled = false;
                return;
            }

            // Initialize JSMpeg player
            this.player = new JSMpeg.Player('ws://localhost:9999', {
                canvas: this.canvas,
                autoplay: true,
                audio: true,
                videoBufferSize: 512 * 1024,
                audioBufferSize: 128 * 1024,
                onSourceEstablished: () => {
                    console.log('Stream connection established');
                    this.wsStatusEl.textContent = 'WebSocket: Connected';
                    this.updateStatus('Connected - Stream playing', 'connected');
                    this.stopBtn.disabled = false;
                },
                onSourceCompleted: () => {
                    console.log('Stream completed');
                    this.updateStatus('Stream ended');
                },
                onStalled: () => {
                    console.warn('Stream stalled');
                    this.updateStatus('Stream stalled - buffering...', 'error');
                },
                onPlay: () => {
                    console.log('Playing');
                    this.updateStatus('Playing', 'connected');
                },
                onVideoDecode: (decoder, time) => {
                    // Video is being decoded successfully
                },
                onAudioDecode: (decoder, time) => {
                    // Audio is being decoded successfully
                }
            });

            // Handle WebSocket errors
            if (this.player.source && this.player.source.socket) {
                this.player.source.socket.onerror = (error) => {
                    console.error('WebSocket error:', error);
                    this.updateStatus('Connection error', 'error');
                    this.wsStatusEl.textContent = 'WebSocket: Error';
                    this.startBtn.disabled = false;
                    this.stopBtn.disabled = true;
                };

                this.player.source.socket.onclose = () => {
                    console.log('WebSocket closed');
                    this.wsStatusEl.textContent = 'WebSocket: Disconnected';
                    this.updateStatus('Disconnected');
                    this.startBtn.disabled = false;
                    this.stopBtn.disabled = true;
                };
            }

        } catch (error) {
            console.error('Error starting stream:', error);
            this.updateStatus('Failed to start: ' + error.message, 'error');
            this.startBtn.disabled = false;
        }
    }

    stop() {
        if (this.player) {
            this.player.destroy();
            this.player = null;
        }

        this.updateStatus('Stopped');
        this.wsStatusEl.textContent = 'WebSocket: Disconnected';
        this.startBtn.disabled = false;
        this.stopBtn.disabled = true;

        // Clear canvas
        const ctx = this.canvas.getContext('2d');
        if (ctx) {
            ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        }
    }
}

// Initialize client when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    const client = new RTSPWebRTCClient();
});
