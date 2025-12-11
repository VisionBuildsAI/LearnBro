import { GoogleGenAI, LiveServerMessage, Modality } from "@google/genai";
import { SYSTEM_INSTRUCTION } from "../constants";

// Audio Configuration
const INPUT_SAMPLE_RATE = 16000;
const OUTPUT_SAMPLE_RATE = 24000;
const BUFFER_SIZE = 4096;

export type VoiceLanguage = 'English' | 'Hindi' | 'Bengali';

export class LiveAudioService {
  private inputAudioContext: AudioContext | null = null;
  private outputAudioContext: AudioContext | null = null;
  private mediaStream: MediaStream | null = null;
  private inputSource: MediaStreamAudioSourceNode | null = null;
  private processor: ScriptProcessorNode | null = null;
  private outputNode: GainNode | null = null;
  private session: Promise<any> | null = null;
  private nextStartTime = 0;
  private isConnected = false;
  private sources = new Set<AudioBufferSourceNode>();
  
  // Callbacks for UI updates
  public onVolumeUpdate: ((volume: number) => void) | null = null;
  public onStatusChange: ((status: string) => void) | null = null;
  public onClose: (() => void) | null = null;

  constructor() {}

  async start(language: VoiceLanguage = 'English') {
    // Ensure clean state
    await this.stop();

    try {
      this.notifyStatus("Initializing audio...");
      
      // Initialize AI Client here to ensure we get the latest API Key
      const apiKey = process.env.API_KEY || "";
      if (!apiKey) {
        throw new Error("API Key not found");
      }
      const ai = new GoogleGenAI({ apiKey });

      // 1. Setup Audio Contexts
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      this.inputAudioContext = new AudioContextClass({ sampleRate: INPUT_SAMPLE_RATE });
      this.outputAudioContext = new AudioContextClass({ sampleRate: OUTPUT_SAMPLE_RATE });
      
      // Resume contexts immediately (fixes autoplay policy issues)
      if (this.inputAudioContext.state === 'suspended') await this.inputAudioContext.resume();
      if (this.outputAudioContext.state === 'suspended') await this.outputAudioContext.resume();

      this.outputNode = this.outputAudioContext.createGain();
      this.outputNode.connect(this.outputAudioContext.destination);

      // 2. Get Microphone Access
      this.mediaStream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true,
            sampleRate: INPUT_SAMPLE_RATE
        } 
      });
      
      this.notifyStatus("Connecting...");

      // Determine Language Instruction
      let langInstruction = "You must speak in English.";
      if (language === 'Hindi') {
        langInstruction = "You must speak in Hindi. You can use Hinglish for technical terms if needed, but keep the conversation natural and in Hindi.";
      } else if (language === 'Bengali') {
        langInstruction = "You must speak in Bengali. Keep the tone natural, friendly, and use Bengali for all responses.";
      }

      const fullInstruction = `${SYSTEM_INSTRUCTION}\n\n[CRITICAL INSTRUCTION: VOICE MODE ACTIVE]\n1. ${langInstruction}\n2. Keep responses concise, spoken-word friendly (no markdown, no bullets).\n3. Be energetic and act like a real tutor on a call.`;

      // 3. Connect to Gemini Live
      const sessionPromise = ai.live.connect({
        model: 'gemini-2.5-flash-native-audio-preview-09-2025',
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Zephyr' } },
          },
          systemInstruction: fullInstruction,
        },
        callbacks: {
          onopen: () => {
            this.isConnected = true;
            this.notifyStatus("Connected");
            // Only setup input after connection is confirmed
            this.setupAudioInput(sessionPromise);
          },
          onmessage: (message: LiveServerMessage) => {
            this.handleServerMessage(message);
          },
          onclose: () => {
            if (this.isConnected) {
                this.notifyStatus("Disconnected");
                this.stop();
            }
          },
          onerror: (err) => {
            console.error("Gemini Live Error:", err);
            this.notifyStatus("Error occurred");
            // Do not immediately stop on all errors, but Network error usually requires restart
            if (err.message && err.message.includes("Network error")) {
                this.stop();
            }
          },
        },
      });

      this.session = sessionPromise;

    } catch (error) {
      console.error("Failed to start live session:", error);
      this.notifyStatus("Connection Failed");
      this.stop();
    }
  }

  private setupAudioInput(sessionPromise: Promise<any>) {
    if (!this.inputAudioContext || !this.mediaStream) return;

    this.inputSource = this.inputAudioContext.createMediaStreamSource(this.mediaStream);
    this.processor = this.inputAudioContext.createScriptProcessor(BUFFER_SIZE, 1, 1);

    this.processor.onaudioprocess = (e) => {
      if (!this.isConnected) return;

      const inputData = e.inputBuffer.getChannelData(0);
      
      // Calculate volume for UI
      if (this.onVolumeUpdate) {
        let sum = 0;
        for (let i = 0; i < inputData.length; i++) {
          sum += inputData[i] * inputData[i];
        }
        const rms = Math.sqrt(sum / inputData.length);
        this.onVolumeUpdate(rms);
      }

      // Convert to PCM and Send
      const pcmBlob = this.createBlob(inputData);
      
      sessionPromise.then((session) => {
        if (this.isConnected) {
            session.sendRealtimeInput({ media: pcmBlob });
        }
      }).catch(err => {
          console.error("Error sending audio:", err);
      });
    };

    this.inputSource.connect(this.processor);
    this.processor.connect(this.inputAudioContext.destination);
  }

  private async handleServerMessage(message: LiveServerMessage) {
    if (!this.outputAudioContext || !this.outputNode) return;

    // Handle Audio Output
    const base64Audio = message.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data;
    
    if (base64Audio) {
      try {
        const audioData = this.base64ToUint8Array(base64Audio);
        const audioBuffer = await this.decodeAudioData(audioData, this.outputAudioContext);
        
        // Ensure seamless playback by scheduling next chunk
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
      } catch (e) {
        console.error("Error processing audio chunk:", e);
      }
    }

    // Handle Interruption
    if (message.serverContent?.interrupted) {
      this.sources.forEach(source => {
          try { source.stop(); } catch(e) {}
      });
      this.sources.clear();
      this.nextStartTime = this.outputAudioContext.currentTime;
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
            // Ignore session close errors
        }
        this.session = null;
    }

    // Stop Inputs
    if (this.mediaStream) {
      this.mediaStream.getTracks().forEach(track => track.stop());
      this.mediaStream = null;
    }
    if (this.inputSource) {
        try { this.inputSource.disconnect(); } catch(e) {}
        this.inputSource = null;
    }
    if (this.processor) {
        try { this.processor.disconnect(); } catch(e) {}
        this.processor = null;
    }
    
    if (this.inputAudioContext) {
      if (this.inputAudioContext.state !== 'closed') {
        try { await this.inputAudioContext.close(); } catch (e) {}
      }
      this.inputAudioContext = null;
    }

    // Stop Outputs
    this.sources.forEach(source => {
        try { source.stop(); } catch(e) {}
    });
    this.sources.clear();
    
    if (this.outputAudioContext) {
      if (this.outputAudioContext.state !== 'closed') {
         try { await this.outputAudioContext.close(); } catch (e) {}
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
      const s = Math.max(-1, Math.min(1, data[i]));
      int16[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
    }
    
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