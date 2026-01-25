// ============================================
// Voice System Types
// ============================================

// ============================================
// Speech-to-Text Types (Whisper)
// ============================================

export interface STTConfig {
  apiKey: string;
  model: 'whisper-1';
  language?: string;
  prompt?: string;
  temperature?: number;
  responseFormat?: 'json' | 'text' | 'srt' | 'verbose_json' | 'vtt';
}

export interface STTRequest {
  audio: Blob | ArrayBuffer | File;
  config?: Partial<STTConfig>;
  metadata?: {
    sessionId?: string;
    speakerId?: string;
    timestamp?: Date;
  };
}

export interface STTResponse {
  text: string;
  language?: string;
  duration?: number;
  segments?: STTSegment[];
  confidence?: number;
}

export interface STTSegment {
  id: number;
  start: number;
  end: number;
  text: string;
  confidence?: number;
  speaker?: string;
}

// ============================================
// Text-to-Speech Types (ElevenLabs)
// ============================================

export interface TTSConfig {
  apiKey: string;
  voiceId: string;
  modelId: string;
  stability: number;
  similarityBoost: number;
  style?: number;
  useSpeakerBoost?: boolean;
  outputFormat?: TTSOutputFormat;
}

export type TTSOutputFormat =
  | 'mp3_44100_128'
  | 'mp3_44100_192'
  | 'pcm_16000'
  | 'pcm_22050'
  | 'pcm_24000'
  | 'pcm_44100';

export interface TTSRequest {
  text: string;
  voiceId?: string;
  config?: Partial<TTSConfig>;
  metadata?: {
    sessionId?: string;
    characterId?: string;
    npcId?: string;
    emotion?: string;
  };
}

export interface TTSResponse {
  audio: ArrayBuffer;
  contentType: string;
  duration?: number;
  characterCount: number;
  voiceId: string;
}

// ============================================
// Voice Profile Types
// ============================================

export interface VoiceProfile {
  id: string;
  name: string;
  description?: string;
  voiceId: string; // ElevenLabs voice ID
  settings: VoiceSettings;
  previewUrl?: string;
  labels?: Record<string, string>;
}

export interface VoiceSettings {
  stability: number;
  similarityBoost: number;
  style?: number;
  useSpeakerBoost?: boolean;
}

export interface CharacterVoiceMapping {
  characterId: string;
  characterName: string;
  voiceProfile: VoiceProfile;
  emotionModifiers?: Record<string, Partial<VoiceSettings>>;
}

export interface NPCVoiceMapping {
  npcId: string;
  npcName: string;
  voiceProfile: VoiceProfile;
  emotionModifiers?: Record<string, Partial<VoiceSettings>>;
}

// ============================================
// Voice Session Types
// ============================================

export interface VoiceSession {
  id: string;
  gameSessionId: string;
  status: VoiceSessionStatus;
  participants: VoiceParticipant[];
  settings: VoiceSessionSettings;
  startedAt: Date;
  endedAt?: Date;
}

export type VoiceSessionStatus = 'initializing' | 'active' | 'paused' | 'ended' | 'error';

export interface VoiceParticipant {
  id: string;
  name: string;
  type: 'player' | 'dm' | 'system';
  characterId?: string;
  isMuted: boolean;
  isDeafened: boolean;
  inputDevice?: string;
  outputDevice?: string;
}

export interface VoiceSessionSettings {
  sttEnabled: boolean;
  ttsEnabled: boolean;
  dmVoiceProfile?: VoiceProfile;
  autoTranscribe: boolean;
  saveTranscripts: boolean;
  pushToTalk: boolean;
  silenceThreshold: number;
  vadSensitivity: number;
}

// ============================================
// Audio Processing Types
// ============================================

export interface AudioChunk {
  id: string;
  data: ArrayBuffer;
  timestamp: Date;
  duration: number;
  sampleRate: number;
  channels: number;
  speakerId?: string;
}

export interface AudioStream {
  id: string;
  participantId: string;
  chunks: AudioChunk[];
  isRecording: boolean;
  startTime: Date;
}

export interface VADEvent {
  type: 'speech_start' | 'speech_end';
  timestamp: Date;
  participantId: string;
  confidence: number;
}

// ============================================
// Voice Queue Types
// ============================================

export interface VoiceQueueItem {
  id: string;
  type: 'narration' | 'npc_dialogue' | 'system_message';
  text: string;
  voiceProfile: VoiceProfile;
  priority: number;
  metadata?: {
    npcId?: string;
    npcName?: string;
    emotion?: string;
    pauseAfter?: number;
  };
}

export interface VoiceQueue {
  sessionId: string;
  items: VoiceQueueItem[];
  currentItem?: VoiceQueueItem;
  isPlaying: boolean;
  isPaused: boolean;
}

// ============================================
// Voice Event Types
// ============================================

export interface VoiceEvent {
  type: VoiceEventType;
  timestamp: Date;
  sessionId: string;
  participantId?: string;
  data?: Record<string, unknown>;
}

export type VoiceEventType =
  | 'session_started'
  | 'session_ended'
  | 'participant_joined'
  | 'participant_left'
  | 'speech_detected'
  | 'transcription_complete'
  | 'synthesis_complete'
  | 'playback_started'
  | 'playback_ended'
  | 'mute_toggled'
  | 'error';

// ============================================
// Error Types
// ============================================

export interface VoiceError {
  code: VoiceErrorCode;
  message: string;
  details?: Record<string, unknown>;
  retryable: boolean;
}

export type VoiceErrorCode =
  | 'STT_ERROR'
  | 'TTS_ERROR'
  | 'AUDIO_ERROR'
  | 'NETWORK_ERROR'
  | 'RATE_LIMIT'
  | 'INVALID_FORMAT'
  | 'SESSION_ERROR'
  | 'PERMISSION_DENIED'
  | 'DEVICE_NOT_FOUND';

// ============================================
// Transcript Types
// ============================================

export interface Transcript {
  id: string;
  sessionId: string;
  entries: TranscriptEntry[];
  startTime: Date;
  endTime?: Date;
  metadata?: {
    totalDuration?: number;
    participantCount?: number;
    wordCount?: number;
  };
}

export interface TranscriptEntry {
  id: string;
  timestamp: Date;
  speaker: string;
  speakerType: 'player' | 'dm' | 'npc' | 'system';
  text: string;
  audioUrl?: string;
  confidence?: number;
  duration?: number;
}

// ============================================
// Built-in Voice Profiles
// ============================================

export const DEFAULT_DM_VOICE: VoiceProfile = {
  id: 'dm-default',
  name: 'Dungeon Master',
  description: 'Authoritative and engaging narrator voice',
  voiceId: 'pNInz6obpgDQGcFmaJgB', // Adam - deep narrative voice
  settings: {
    stability: 0.5,
    similarityBoost: 0.75,
    style: 0.3,
  },
};

export const VOICE_PRESETS: Record<string, VoiceProfile> = {
  narrator: {
    id: 'narrator',
    name: 'Narrator',
    description: 'Calm, authoritative narrator',
    voiceId: 'pNInz6obpgDQGcFmaJgB',
    settings: { stability: 0.6, similarityBoost: 0.8 },
  },
  villain: {
    id: 'villain',
    name: 'Villain',
    description: 'Menacing and dramatic',
    voiceId: 'VR6AewLTigWG4xSOukaG',
    settings: { stability: 0.3, similarityBoost: 0.9, style: 0.7 },
  },
  merchant: {
    id: 'merchant',
    name: 'Merchant',
    description: 'Friendly and persuasive',
    voiceId: 'EXAVITQu4vr4xnSDxMaL',
    settings: { stability: 0.5, similarityBoost: 0.7, style: 0.4 },
  },
  elderly: {
    id: 'elderly',
    name: 'Elderly Sage',
    description: 'Wise and weathered',
    voiceId: 'ODq5zmih8GrVes37Dizd',
    settings: { stability: 0.7, similarityBoost: 0.6, style: 0.2 },
  },
  child: {
    id: 'child',
    name: 'Young Child',
    description: 'High-pitched and innocent',
    voiceId: 'jsCqWAovK2LkecY7zXl4',
    settings: { stability: 0.6, similarityBoost: 0.7 },
  },
  warrior: {
    id: 'warrior',
    name: 'Battle-Hardened Warrior',
    description: 'Gruff and commanding',
    voiceId: 'N2lVS1w4EtoT3dr4eOWO',
    settings: { stability: 0.4, similarityBoost: 0.85, style: 0.5 },
  },
};
