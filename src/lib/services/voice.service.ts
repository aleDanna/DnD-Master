import type {
  STTConfig,
  STTRequest,
  STTResponse,
  TTSConfig,
  TTSRequest,
  TTSResponse,
  VoiceProfile,
  VoiceSettings,
  VoiceSession,
  VoiceSessionStatus,
  VoiceParticipant,
  VoiceSessionSettings,
  VoiceQueue,
  VoiceQueueItem,
  Transcript,
  TranscriptEntry,
  VoiceError,
  VoiceErrorCode,
  CharacterVoiceMapping,
  NPCVoiceMapping,
} from '@/types/voice.types';
import { DEFAULT_DM_VOICE, VOICE_PRESETS } from '@/types/voice.types';

// ============================================
// Default Configurations
// ============================================

const DEFAULT_STT_CONFIG: STTConfig = {
  apiKey: process.env.OPENAI_API_KEY || '',
  model: 'whisper-1',
  language: 'en',
  responseFormat: 'verbose_json',
  temperature: 0,
};

const DEFAULT_TTS_CONFIG: TTSConfig = {
  apiKey: process.env.ELEVENLABS_API_KEY || '',
  voiceId: DEFAULT_DM_VOICE.voiceId,
  modelId: 'eleven_multilingual_v2',
  stability: 0.5,
  similarityBoost: 0.75,
  outputFormat: 'mp3_44100_128',
};

// ============================================
// Voice Service Class
// ============================================

export class VoiceService {
  private sttConfig: STTConfig;
  private ttsConfig: TTSConfig;
  private activeSessions: Map<string, VoiceSession> = new Map();
  private voiceQueues: Map<string, VoiceQueue> = new Map();
  private transcripts: Map<string, Transcript> = new Map();
  private characterVoices: Map<string, CharacterVoiceMapping> = new Map();
  private npcVoices: Map<string, NPCVoiceMapping> = new Map();

  constructor(sttConfig: Partial<STTConfig> = {}, ttsConfig: Partial<TTSConfig> = {}) {
    this.sttConfig = { ...DEFAULT_STT_CONFIG, ...sttConfig };
    this.ttsConfig = { ...DEFAULT_TTS_CONFIG, ...ttsConfig };
  }

  // ============================================
  // Speech-to-Text Methods
  // ============================================

  async transcribeAudio(request: STTRequest): Promise<STTResponse> {
    const config = { ...this.sttConfig, ...request.config };

    if (!config.apiKey) {
      throw this.createError('STT_ERROR', 'OpenAI API key is not configured');
    }

    try {
      const formData = new FormData();

      // Handle different audio input types
      if (request.audio instanceof Blob) {
        formData.append('file', request.audio, 'audio.webm');
      } else if (request.audio instanceof File) {
        formData.append('file', request.audio);
      } else {
        // ArrayBuffer - convert to Blob
        const blob = new Blob([request.audio], { type: 'audio/webm' });
        formData.append('file', blob, 'audio.webm');
      }

      formData.append('model', config.model);
      if (config.language) formData.append('language', config.language);
      if (config.prompt) formData.append('prompt', config.prompt);
      if (config.temperature !== undefined) formData.append('temperature', config.temperature.toString());
      formData.append('response_format', config.responseFormat || 'verbose_json');

      const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${config.apiKey}`,
        },
        body: formData,
      });

      if (!response.ok) {
        if (response.status === 429) {
          throw this.createError('RATE_LIMIT', 'Rate limit exceeded', undefined, true);
        }
        const errorText = await response.text();
        throw this.createError('STT_ERROR', `Transcription failed: ${errorText}`);
      }

      const data = await response.json();

      return {
        text: data.text,
        language: data.language,
        duration: data.duration,
        segments: data.segments?.map((seg: any, idx: number) => ({
          id: idx,
          start: seg.start,
          end: seg.end,
          text: seg.text,
          confidence: seg.confidence,
        })),
      };
    } catch (error) {
      if ((error as VoiceError).code) {
        throw error;
      }
      throw this.createError('NETWORK_ERROR', `Network error: ${(error as Error).message}`, undefined, true);
    }
  }

  // ============================================
  // Text-to-Speech Methods
  // ============================================

  async synthesizeSpeech(request: TTSRequest): Promise<TTSResponse> {
    const voiceId = request.voiceId || this.ttsConfig.voiceId;
    const config = { ...this.ttsConfig, ...request.config, voiceId };

    if (!config.apiKey) {
      throw this.createError('TTS_ERROR', 'ElevenLabs API key is not configured');
    }

    try {
      const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'xi-api-key': config.apiKey,
          Accept: 'audio/mpeg',
        },
        body: JSON.stringify({
          text: request.text,
          model_id: config.modelId,
          voice_settings: {
            stability: config.stability,
            similarity_boost: config.similarityBoost,
            style: config.style,
            use_speaker_boost: config.useSpeakerBoost,
          },
        }),
      });

      if (!response.ok) {
        if (response.status === 429) {
          throw this.createError('RATE_LIMIT', 'Rate limit exceeded', undefined, true);
        }
        const errorText = await response.text();
        throw this.createError('TTS_ERROR', `Speech synthesis failed: ${errorText}`);
      }

      const audioBuffer = await response.arrayBuffer();

      return {
        audio: audioBuffer,
        contentType: 'audio/mpeg',
        characterCount: request.text.length,
        voiceId,
      };
    } catch (error) {
      if ((error as VoiceError).code) {
        throw error;
      }
      throw this.createError('NETWORK_ERROR', `Network error: ${(error as Error).message}`, undefined, true);
    }
  }

  async synthesizeWithEmotion(text: string, voiceProfile: VoiceProfile, emotion?: string): Promise<TTSResponse> {
    let settings = { ...voiceProfile.settings };

    // Apply emotion modifiers if available
    const emotionModifiers: Record<string, Partial<VoiceSettings>> = {
      angry: { stability: 0.3, style: 0.8 },
      sad: { stability: 0.7, similarityBoost: 0.6, style: 0.2 },
      excited: { stability: 0.4, similarityBoost: 0.8, style: 0.6 },
      fearful: { stability: 0.3, similarityBoost: 0.7, style: 0.5 },
      calm: { stability: 0.8, similarityBoost: 0.7, style: 0.1 },
      mysterious: { stability: 0.5, similarityBoost: 0.6, style: 0.4 },
    };

    if (emotion && emotionModifiers[emotion]) {
      settings = { ...settings, ...emotionModifiers[emotion] };
    }

    return this.synthesizeSpeech({
      text,
      voiceId: voiceProfile.voiceId,
      config: {
        stability: settings.stability,
        similarityBoost: settings.similarityBoost,
        style: settings.style,
        useSpeakerBoost: settings.useSpeakerBoost,
      },
    });
  }

  // ============================================
  // Voice Session Management
  // ============================================

  createVoiceSession(gameSessionId: string, settings: Partial<VoiceSessionSettings> = {}): VoiceSession {
    const sessionId = `voice-${gameSessionId}-${Date.now()}`;

    const session: VoiceSession = {
      id: sessionId,
      gameSessionId,
      status: 'initializing',
      participants: [],
      settings: {
        sttEnabled: true,
        ttsEnabled: true,
        dmVoiceProfile: DEFAULT_DM_VOICE,
        autoTranscribe: true,
        saveTranscripts: true,
        pushToTalk: false,
        silenceThreshold: 0.01,
        vadSensitivity: 0.5,
        ...settings,
      },
      startedAt: new Date(),
    };

    this.activeSessions.set(sessionId, session);

    // Initialize voice queue for this session
    this.voiceQueues.set(sessionId, {
      sessionId,
      items: [],
      isPlaying: false,
      isPaused: false,
    });

    // Initialize transcript
    this.transcripts.set(sessionId, {
      id: `transcript-${sessionId}`,
      sessionId,
      entries: [],
      startTime: new Date(),
    });

    return session;
  }

  startVoiceSession(sessionId: string): VoiceSession {
    const session = this.activeSessions.get(sessionId);
    if (!session) {
      throw this.createError('SESSION_ERROR', 'Voice session not found');
    }

    session.status = 'active';
    return session;
  }

  pauseVoiceSession(sessionId: string): VoiceSession {
    const session = this.activeSessions.get(sessionId);
    if (!session) {
      throw this.createError('SESSION_ERROR', 'Voice session not found');
    }

    session.status = 'paused';
    return session;
  }

  endVoiceSession(sessionId: string): VoiceSession {
    const session = this.activeSessions.get(sessionId);
    if (!session) {
      throw this.createError('SESSION_ERROR', 'Voice session not found');
    }

    session.status = 'ended';
    session.endedAt = new Date();

    // Finalize transcript
    const transcript = this.transcripts.get(sessionId);
    if (transcript) {
      transcript.endTime = new Date();
      transcript.metadata = {
        totalDuration: (transcript.endTime.getTime() - transcript.startTime.getTime()) / 1000,
        participantCount: session.participants.length,
        wordCount: transcript.entries.reduce((sum, e) => sum + e.text.split(/\s+/).length, 0),
      };
    }

    return session;
  }

  getVoiceSession(sessionId: string): VoiceSession | undefined {
    return this.activeSessions.get(sessionId);
  }

  // ============================================
  // Participant Management
  // ============================================

  addParticipant(sessionId: string, participant: Omit<VoiceParticipant, 'isMuted' | 'isDeafened'>): VoiceParticipant {
    const session = this.activeSessions.get(sessionId);
    if (!session) {
      throw this.createError('SESSION_ERROR', 'Voice session not found');
    }

    const newParticipant: VoiceParticipant = {
      ...participant,
      isMuted: false,
      isDeafened: false,
    };

    session.participants.push(newParticipant);
    return newParticipant;
  }

  removeParticipant(sessionId: string, participantId: string): void {
    const session = this.activeSessions.get(sessionId);
    if (!session) {
      throw this.createError('SESSION_ERROR', 'Voice session not found');
    }

    session.participants = session.participants.filter((p) => p.id !== participantId);
  }

  toggleMute(sessionId: string, participantId: string): boolean {
    const session = this.activeSessions.get(sessionId);
    if (!session) {
      throw this.createError('SESSION_ERROR', 'Voice session not found');
    }

    const participant = session.participants.find((p) => p.id === participantId);
    if (!participant) {
      throw this.createError('SESSION_ERROR', 'Participant not found');
    }

    participant.isMuted = !participant.isMuted;
    return participant.isMuted;
  }

  toggleDeafen(sessionId: string, participantId: string): boolean {
    const session = this.activeSessions.get(sessionId);
    if (!session) {
      throw this.createError('SESSION_ERROR', 'Voice session not found');
    }

    const participant = session.participants.find((p) => p.id === participantId);
    if (!participant) {
      throw this.createError('SESSION_ERROR', 'Participant not found');
    }

    participant.isDeafened = !participant.isDeafened;
    if (participant.isDeafened) {
      participant.isMuted = true; // Deafening also mutes
    }
    return participant.isDeafened;
  }

  // ============================================
  // Voice Queue Management
  // ============================================

  queueNarration(sessionId: string, text: string, voiceProfile?: VoiceProfile, priority = 0): VoiceQueueItem {
    const queue = this.voiceQueues.get(sessionId);
    if (!queue) {
      throw this.createError('SESSION_ERROR', 'Voice queue not found');
    }

    const session = this.activeSessions.get(sessionId);
    const profile = voiceProfile || session?.settings.dmVoiceProfile || DEFAULT_DM_VOICE;

    const item: VoiceQueueItem = {
      id: `queue-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type: 'narration',
      text,
      voiceProfile: profile,
      priority,
    };

    // Insert based on priority (higher priority first)
    const insertIndex = queue.items.findIndex((i) => i.priority < priority);
    if (insertIndex === -1) {
      queue.items.push(item);
    } else {
      queue.items.splice(insertIndex, 0, item);
    }

    return item;
  }

  queueNPCDialogue(
    sessionId: string,
    npcId: string,
    npcName: string,
    dialogue: string,
    emotion?: string
  ): VoiceQueueItem {
    const queue = this.voiceQueues.get(sessionId);
    if (!queue) {
      throw this.createError('SESSION_ERROR', 'Voice queue not found');
    }

    // Get NPC voice or use a default based on character type
    const npcMapping = this.npcVoices.get(npcId);
    const voiceProfile = npcMapping?.voiceProfile || VOICE_PRESETS.narrator;

    const item: VoiceQueueItem = {
      id: `queue-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type: 'npc_dialogue',
      text: dialogue,
      voiceProfile,
      priority: 1, // NPC dialogue has higher priority than narration
      metadata: {
        npcId,
        npcName,
        emotion,
      },
    };

    queue.items.push(item);
    return item;
  }

  async processQueue(sessionId: string): Promise<TTSResponse | null> {
    const queue = this.voiceQueues.get(sessionId);
    if (!queue || queue.items.length === 0) {
      return null;
    }

    if (queue.isPlaying || queue.isPaused) {
      return null;
    }

    const item = queue.items.shift();
    if (!item) {
      return null;
    }

    queue.currentItem = item;
    queue.isPlaying = true;

    try {
      const response = await this.synthesizeWithEmotion(item.text, item.voiceProfile, item.metadata?.emotion);

      // Add to transcript
      this.addTranscriptEntry(sessionId, {
        id: item.id,
        timestamp: new Date(),
        speaker: item.type === 'npc_dialogue' ? item.metadata?.npcName || 'NPC' : 'DM',
        speakerType: item.type === 'npc_dialogue' ? 'npc' : 'dm',
        text: item.text,
        duration: response.duration,
      });

      queue.isPlaying = false;
      queue.currentItem = undefined;

      return response;
    } catch (error) {
      queue.isPlaying = false;
      queue.currentItem = undefined;
      throw error;
    }
  }

  pauseQueue(sessionId: string): void {
    const queue = this.voiceQueues.get(sessionId);
    if (queue) {
      queue.isPaused = true;
    }
  }

  resumeQueue(sessionId: string): void {
    const queue = this.voiceQueues.get(sessionId);
    if (queue) {
      queue.isPaused = false;
    }
  }

  clearQueue(sessionId: string): void {
    const queue = this.voiceQueues.get(sessionId);
    if (queue) {
      queue.items = [];
      queue.currentItem = undefined;
    }
  }

  getQueueStatus(sessionId: string): VoiceQueue | undefined {
    return this.voiceQueues.get(sessionId);
  }

  // ============================================
  // Voice Profile Management
  // ============================================

  setCharacterVoice(characterId: string, characterName: string, voiceProfile: VoiceProfile): void {
    this.characterVoices.set(characterId, {
      characterId,
      characterName,
      voiceProfile,
    });
  }

  setNPCVoice(npcId: string, npcName: string, voiceProfile: VoiceProfile): void {
    this.npcVoices.set(npcId, {
      npcId,
      npcName,
      voiceProfile,
    });
  }

  getCharacterVoice(characterId: string): CharacterVoiceMapping | undefined {
    return this.characterVoices.get(characterId);
  }

  getNPCVoice(npcId: string): NPCVoiceMapping | undefined {
    return this.npcVoices.get(npcId);
  }

  getVoicePresets(): Record<string, VoiceProfile> {
    return VOICE_PRESETS;
  }

  // ============================================
  // Transcript Management
  // ============================================

  addTranscriptEntry(sessionId: string, entry: Omit<TranscriptEntry, 'id'>): TranscriptEntry {
    const transcript = this.transcripts.get(sessionId);
    if (!transcript) {
      throw this.createError('SESSION_ERROR', 'Transcript not found');
    }

    const fullEntry: TranscriptEntry = {
      ...entry,
      id: `entry-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    };

    transcript.entries.push(fullEntry);
    return fullEntry;
  }

  getTranscript(sessionId: string): Transcript | undefined {
    return this.transcripts.get(sessionId);
  }

  exportTranscript(sessionId: string, format: 'json' | 'text' | 'srt' = 'text'): string {
    const transcript = this.transcripts.get(sessionId);
    if (!transcript) {
      throw this.createError('SESSION_ERROR', 'Transcript not found');
    }

    switch (format) {
      case 'json':
        return JSON.stringify(transcript, null, 2);

      case 'srt':
        return transcript.entries
          .map((entry, index) => {
            const startTime = this.formatSRTTime(entry.timestamp.getTime() - transcript.startTime.getTime());
            const endTime = this.formatSRTTime(
              entry.timestamp.getTime() - transcript.startTime.getTime() + (entry.duration || 3) * 1000
            );
            return `${index + 1}\n${startTime} --> ${endTime}\n${entry.speaker}: ${entry.text}\n`;
          })
          .join('\n');

      case 'text':
      default:
        return transcript.entries.map((entry) => `[${entry.speaker}]: ${entry.text}`).join('\n\n');
    }
  }

  private formatSRTTime(ms: number): string {
    const hours = Math.floor(ms / 3600000);
    const minutes = Math.floor((ms % 3600000) / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    const milliseconds = ms % 1000;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')},${milliseconds.toString().padStart(3, '0')}`;
  }

  // ============================================
  // Player Speech Processing
  // ============================================

  async processPlayerSpeech(
    sessionId: string,
    participantId: string,
    audio: Blob | ArrayBuffer
  ): Promise<{ text: string; entry: TranscriptEntry }> {
    const session = this.activeSessions.get(sessionId);
    if (!session) {
      throw this.createError('SESSION_ERROR', 'Voice session not found');
    }

    const participant = session.participants.find((p) => p.id === participantId);
    if (!participant) {
      throw this.createError('SESSION_ERROR', 'Participant not found');
    }

    if (participant.isMuted) {
      throw this.createError('PERMISSION_DENIED', 'Participant is muted');
    }

    // Transcribe audio
    const transcription = await this.transcribeAudio({
      audio,
      metadata: {
        sessionId,
        speakerId: participantId,
        timestamp: new Date(),
      },
    });

    // Add to transcript
    const entry = this.addTranscriptEntry(sessionId, {
      timestamp: new Date(),
      speaker: participant.name,
      speakerType: participant.type,
      text: transcription.text,
      confidence: transcription.confidence,
      duration: transcription.duration,
    });

    return {
      text: transcription.text,
      entry,
    };
  }

  // ============================================
  // Error Handling
  // ============================================

  private createError(
    code: VoiceErrorCode,
    message: string,
    details?: Record<string, unknown>,
    retryable = false
  ): VoiceError {
    return {
      code,
      message,
      details,
      retryable,
    };
  }
}

// Export singleton instance
export const voiceService = new VoiceService();
