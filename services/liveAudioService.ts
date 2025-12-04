import { GoogleGenAI, LiveServerMessage, Modality } from "@google/genai";
import { SYSTEM_INSTRUCTION } from "../constants";

const apiKey = process.env.API_KEY || "";
const ai = new GoogleGenAI({ apiKey });

// Audio Configuration
const INPUT_SAMPLE_RATE = 16000;
const OUTPUT_SAMPLE_RATE = 24000;
const BUFFER_SIZE = 4096;

export class LiveAudioService {
  private inputAudioContext: AudioContext | null = null;
  private outputAudioContext: AudioContext | null = null;
  private mediaStream: MediaStream | null = null;
  private inputSource: MediaStreamAudioSourceNode | null = null;
  private processor: ScriptProcessorNode | null = null;
  private outputNode: GainNode | null = null;
  private session: any = null;
  private nextStartTime = 0;
  private isConnected = false;
  private sources = new Set<AudioBufferSourceNode>();
  
  // Callbacks for UI updates
  public onVolumeUpdate: ((volume: number) => void) | null = null;
  public onStatusChange: ((status: string) => void) | null = null;
  public onClose: (() => void) | null = null;

  constructor() {}

  async start() {
    if (this.isConnected) return;

    try {
      this.notifyStatus("Initializing audio...");
      
      // 1. Setup Audio Contexts
      this.inputAudioContext = new (window.AudioContext || (window as any).webkitAudioContext)({
        sampleRate: INPUT_SAMPLE_RATE,
      });
      this.outputAudioContext = new (window.AudioContext || (window as any).webkitAudioContext)({
        sampleRate: OUTPUT_SAMPLE_RATE,
      });
      
      this.outputNode = this.outputAudioContext.createGain();
      this.outputNode.connect(this.outputAudioContext.destination);

      // 2. Get Microphone Access
      this.mediaStream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      this.notifyStatus("Connecting to LearnBro...");

      // 3. Connect to Gemini Live
      const sessionPromise = ai.live.connect({
        model: 'gemini-2.5-flash-native-audio-preview-09-2025',
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Zephyr' } }, // Zephyr fits the "Bro/Friend" vibe
          },
          systemInstruction: SYSTEM_INSTRUCTION + "\n\nIMPORTANT: You are in Voice Mode. Keep responses shorter, more conversational, and punchy. Avoid long lists.",
        },
        callbacks: {
          onopen: () => {
            this.isConnected = true;
            this.notifyStatus("Connected");
            this.setupAudioInput(sessionPromise);
          },
          onmessage: (message: LiveServerMessage) => {
            this.handleServerMessage(message);
          },
          onclose: () => {
            this.notifyStatus("Disconnected");
            this.stop();
          },
          onerror: (err) => {
            console.error("Gemini Live Error:", err);
            this.notifyStatus("Error");
            this.stop();
          },
        },
      });

      this.session = sessionPromise;

    } catch (error) {
      console.error("Failed to start live session:", error);
      this.notifyStatus("Failed to connect");
      this.stop();
    }
  }

  private setupAudioInput(sessionPromise: Promise<any>) {
    if (!this.inputAudioContext || !this.mediaStream) return;

    this.inputSource = this.inputAudioContext.createMediaStreamSource(this.mediaStream);
    this.processor = this.inputAudioContext.createScriptProcessor(BUFFER_SIZE, 1, 1);

    this.processor.onaudioprocess = (e) => {
      const inputData = e.inputBuffer.getChannelData(0);
      
      // Calculate volume for UI visualization
      if (this.onVolumeUpdate) {
        let sum = 0;
        for (let i = 0; i < inputData.length; i++) {
          sum += inputData[i] * inputData[i];
        }
        const rms = Math.sqrt(sum / inputData.length);
        this.onVolumeUpdate(rms);
      }

      // Create PCM Blob and send
      const pcmBlob = this.createBlob(inputData);
      
      sessionPromise.then((session) => {
        if (this.isConnected) {
            session.sendRealtimeInput({ media: pcmBlob });
        }
      });
    };

    this.inputSource.connect(this.processor);
    this.processor.connect(this.inputAudioContext.destination);
  }

  private async handleServerMessage(message: LiveServerMessage) {
    // Handle Audio Output
    const base64Audio = message.serverContent?.modelTurn?.parts[0]?.inlineData?.data;
    
    if (base64Audio && this.outputAudioContext && this.outputNode) {
      const audioData = this.base64ToUint8Array(base64Audio);
      const audioBuffer = await this.decodeAudioData(audioData, this.outputAudioContext);
      
      // Schedule playback
      this.nextStartTime = Math.max(this.outputAudioContext.currentTime, this.nextStartTime);
      
      const source = this.outputAudioContext.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(this.outputNode);
      source.start(this.nextStartTime);
      
      this.nextStartTime += audioBuffer.duration;
      this.sources.add(source);
      
      source.onended = () => {
        this.sources.delete(source);
      };
    }

    // Handle Interruption
    if (message.serverContent?.interrupted) {
      this.sources.forEach(source => source.stop());
      this.sources.clear();
      this.nextStartTime = 0;
    }
  }

  async stop() {
    this.isConnected = false;
    
    // Close Session
    if (this.session) {
        try {
            const s = await this.session;
            s.close();
        } catch (e) {
            console.error("Error closing session:", e);
        }
        this.session = null;
    }

    // Stop Inputs
    if (this.mediaStream) {
      this.mediaStream.getTracks().forEach(track => track.stop());
      this.mediaStream = null;
    }
    if (this.inputSource) {
        this.inputSource.disconnect();
        this.inputSource = null;
    }
    if (this.processor) {
        this.processor.disconnect();
        this.processor = null;
    }
    
    if (this.inputAudioContext) {
      if (this.inputAudioContext.state !== 'closed') {
        try {
            await this.inputAudioContext.close();
        } catch (e) {
            console.error("Error closing inputAudioContext:", e);
        }
      }
      this.inputAudioContext = null;
    }

    // Stop Outputs
    this.sources.forEach(source => source.stop());
    this.sources.clear();
    
    if (this.outputAudioContext) {
      if (this.outputAudioContext.state !== 'closed') {
         try {
            await this.outputAudioContext.close();
         } catch (e) {
             console.error("Error closing outputAudioContext:", e);
         }
      }
      this.outputAudioContext = null;
    }

    if (this.onClose) this.onClose();
  }

  private notifyStatus(status: string) {
    if (this.onStatusChange) this.onStatusChange(status);
  }

  // --- Helpers ---

  private createBlob(data: Float32Array): { data: string, mimeType: string } {
    const l = data.length;
    const int16 = new Int16Array(l);
    for (let i = 0; i < l; i++) {
      // Clamp values between -1 and 1 and scale to 16-bit integer
      const s = Math.max(-1, Math.min(1, data[i]));
      int16[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
    }
    
    // Convert to binary string then btoa
    let binary = '';
    const bytes = new Uint8Array(int16.buffer);
    const len = bytes.byteLength;
    for (let i = 0; i < len; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    
    return {
      data: btoa(binary),
      mimeType: 'audio/pcm;rate=' + INPUT_SAMPLE_RATE,
    };
  }

  private base64ToUint8Array(base64: string): Uint8Array {
    const binaryString = atob(base64);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes;
  }

  private async decodeAudioData(data: Uint8Array, ctx: AudioContext): Promise<AudioBuffer> {
    // 16-bit PCM, 24kHz, 1 channel
    const inputSampleRate = 24000;
    const numChannels = 1;
    
    const dataInt16 = new Int16Array(data.buffer);
    const frameCount = dataInt16.length;
    const audioBuffer = ctx.createBuffer(numChannels, frameCount, inputSampleRate);
    
    const channelData = audioBuffer.getChannelData(0);
    for (let i = 0; i < frameCount; i++) {
      channelData[i] = dataInt16[i] / 32768.0;
    }
    
    return audioBuffer;
  }
}