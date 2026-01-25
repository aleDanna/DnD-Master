import { VoiceService } from '@/lib/services/voice.service';
import { DEFAULT_DM_VOICE, VOICE_PRESETS } from '@/types/voice.types';
import type { VoiceSession, VoiceParticipant, TTSResponse, STTResponse } from '@/types/voice.types';

// Mock fetch
const mockFetch = jest.fn();
global.fetch = mockFetch;

describe('VoiceService', () => {
  let voiceService: VoiceService;

  beforeEach(() => {
    jest.clearAllMocks();
    voiceService = new VoiceService(
      { apiKey: 'test-openai-key' },
      { apiKey: 'test-elevenlabs-key' }
    );
  });

  describe('transcribeAudio', () => {
    it('should transcribe audio successfully', async () => {
      const mockTranscription: STTResponse = {
        text: 'I attack the goblin with my sword',
        language: 'en',
        duration: 2.5,
        segments: [
          { id: 0, start: 0, end: 2.5, text: 'I attack the goblin with my sword', confidence: 0.95 },
        ],
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockTranscription),
      });

      const audioBlob = new Blob(['audio data'], { type: 'audio/webm' });
      const result = await voiceService.transcribeAudio({ audio: audioBlob });

      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.openai.com/v1/audio/transcriptions',
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            Authorization: 'Bearer test-openai-key',
          }),
        })
      );

      expect(result.text).toBe('I attack the goblin with my sword');
      expect(result.duration).toBe(2.5);
    });

    it('should throw error when API key is missing', async () => {
      const serviceNoKey = new VoiceService({ apiKey: '' });
      const audioBlob = new Blob(['audio data'], { type: 'audio/webm' });

      await expect(serviceNoKey.transcribeAudio({ audio: audioBlob })).rejects.toMatchObject({
        code: 'STT_ERROR',
        message: 'OpenAI API key is not configured',
      });
    });

    it('should handle rate limiting', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 429,
      });

      const audioBlob = new Blob(['audio data'], { type: 'audio/webm' });

      await expect(voiceService.transcribeAudio({ audio: audioBlob })).rejects.toMatchObject({
        code: 'RATE_LIMIT',
        retryable: true,
      });
    });

    it('should handle API errors', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        text: () => Promise.resolve('Invalid audio format'),
      });

      const audioBlob = new Blob(['audio data'], { type: 'audio/webm' });

      await expect(voiceService.transcribeAudio({ audio: audioBlob })).rejects.toMatchObject({
        code: 'STT_ERROR',
      });
    });

    it('should handle ArrayBuffer input', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ text: 'Test transcription' }),
      });

      const audioBuffer = new ArrayBuffer(100);
      const result = await voiceService.transcribeAudio({ audio: audioBuffer });

      expect(result.text).toBe('Test transcription');
    });
  });

  describe('synthesizeSpeech', () => {
    it('should synthesize speech successfully', async () => {
      const mockAudioBuffer = new ArrayBuffer(1000);
      mockFetch.mockResolvedValueOnce({
        ok: true,
        arrayBuffer: () => Promise.resolve(mockAudioBuffer),
      });

      const result = await voiceService.synthesizeSpeech({
        text: 'You see a dark cave entrance before you.',
      });

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('https://api.elevenlabs.io/v1/text-to-speech/'),
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'xi-api-key': 'test-elevenlabs-key',
          }),
        })
      );

      expect(result.audio).toBe(mockAudioBuffer);
      expect(result.contentType).toBe('audio/mpeg');
      expect(result.characterCount).toBe(40); // "You see a dark cave entrance before you."
    });

    it('should throw error when API key is missing', async () => {
      const serviceNoKey = new VoiceService({}, { apiKey: '' });

      await expect(
        serviceNoKey.synthesizeSpeech({ text: 'Test' })
      ).rejects.toMatchObject({
        code: 'TTS_ERROR',
        message: 'ElevenLabs API key is not configured',
      });
    });

    it('should use custom voice ID', async () => {
      const mockAudioBuffer = new ArrayBuffer(1000);
      mockFetch.mockResolvedValueOnce({
        ok: true,
        arrayBuffer: () => Promise.resolve(mockAudioBuffer),
      });

      const customVoiceId = 'custom-voice-123';
      await voiceService.synthesizeSpeech({
        text: 'Test',
        voiceId: customVoiceId,
      });

      expect(mockFetch).toHaveBeenCalledWith(
        `https://api.elevenlabs.io/v1/text-to-speech/${customVoiceId}`,
        expect.anything()
      );
    });

    it('should handle rate limiting', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 429,
      });

      await expect(
        voiceService.synthesizeSpeech({ text: 'Test' })
      ).rejects.toMatchObject({
        code: 'RATE_LIMIT',
        retryable: true,
      });
    });
  });

  describe('synthesizeWithEmotion', () => {
    it('should apply emotion modifiers to voice settings', async () => {
      const mockAudioBuffer = new ArrayBuffer(1000);
      mockFetch.mockResolvedValueOnce({
        ok: true,
        arrayBuffer: () => Promise.resolve(mockAudioBuffer),
      });

      await voiceService.synthesizeWithEmotion(
        'You shall not pass!',
        DEFAULT_DM_VOICE,
        'angry'
      );

      const callBody = JSON.parse(mockFetch.mock.calls[0][1].body);
      // Angry emotion should reduce stability and increase style
      expect(callBody.voice_settings.stability).toBeLessThanOrEqual(0.3);
    });

    it('should use default settings when no emotion specified', async () => {
      const mockAudioBuffer = new ArrayBuffer(1000);
      mockFetch.mockResolvedValueOnce({
        ok: true,
        arrayBuffer: () => Promise.resolve(mockAudioBuffer),
      });

      await voiceService.synthesizeWithEmotion('Normal narration', DEFAULT_DM_VOICE);

      const callBody = JSON.parse(mockFetch.mock.calls[0][1].body);
      expect(callBody.voice_settings.stability).toBe(DEFAULT_DM_VOICE.settings.stability);
    });
  });

  describe('Voice Session Management', () => {
    describe('createVoiceSession', () => {
      it('should create a new voice session', () => {
        const session = voiceService.createVoiceSession('game-session-1');

        expect(session.id).toContain('voice-game-session-1');
        expect(session.gameSessionId).toBe('game-session-1');
        expect(session.status).toBe('initializing');
        expect(session.participants).toEqual([]);
        expect(session.settings.sttEnabled).toBe(true);
        expect(session.settings.ttsEnabled).toBe(true);
      });

      it('should apply custom settings', () => {
        const session = voiceService.createVoiceSession('game-session-1', {
          pushToTalk: true,
          silenceThreshold: 0.02,
        });

        expect(session.settings.pushToTalk).toBe(true);
        expect(session.settings.silenceThreshold).toBe(0.02);
      });
    });

    describe('startVoiceSession', () => {
      it('should start a voice session', () => {
        const session = voiceService.createVoiceSession('game-session-1');
        const started = voiceService.startVoiceSession(session.id);

        expect(started.status).toBe('active');
      });

      it('should throw error for non-existent session', () => {
        expect(() => voiceService.startVoiceSession('non-existent')).toThrow();
      });
    });

    describe('pauseVoiceSession', () => {
      it('should pause a voice session', () => {
        const session = voiceService.createVoiceSession('game-session-1');
        voiceService.startVoiceSession(session.id);
        const paused = voiceService.pauseVoiceSession(session.id);

        expect(paused.status).toBe('paused');
      });
    });

    describe('endVoiceSession', () => {
      it('should end a voice session and finalize transcript', () => {
        const session = voiceService.createVoiceSession('game-session-1');
        voiceService.startVoiceSession(session.id);

        const ended = voiceService.endVoiceSession(session.id);

        expect(ended.status).toBe('ended');
        expect(ended.endedAt).toBeDefined();
      });
    });

    describe('getVoiceSession', () => {
      it('should return the session if it exists', () => {
        const session = voiceService.createVoiceSession('game-session-1');
        const retrieved = voiceService.getVoiceSession(session.id);

        expect(retrieved).toEqual(session);
      });

      it('should return undefined for non-existent session', () => {
        const retrieved = voiceService.getVoiceSession('non-existent');
        expect(retrieved).toBeUndefined();
      });
    });
  });

  describe('Participant Management', () => {
    let session: VoiceSession;

    beforeEach(() => {
      session = voiceService.createVoiceSession('game-session-1');
    });

    describe('addParticipant', () => {
      it('should add a participant to the session', () => {
        const participant = voiceService.addParticipant(session.id, {
          id: 'player-1',
          name: 'John',
          type: 'player',
          characterId: 'char-1',
        });

        expect(participant.id).toBe('player-1');
        expect(participant.isMuted).toBe(false);
        expect(participant.isDeafened).toBe(false);

        const updatedSession = voiceService.getVoiceSession(session.id);
        expect(updatedSession?.participants).toHaveLength(1);
      });
    });

    describe('removeParticipant', () => {
      it('should remove a participant from the session', () => {
        voiceService.addParticipant(session.id, {
          id: 'player-1',
          name: 'John',
          type: 'player',
        });

        voiceService.removeParticipant(session.id, 'player-1');

        const updatedSession = voiceService.getVoiceSession(session.id);
        expect(updatedSession?.participants).toHaveLength(0);
      });
    });

    describe('toggleMute', () => {
      it('should toggle participant mute status', () => {
        voiceService.addParticipant(session.id, {
          id: 'player-1',
          name: 'John',
          type: 'player',
        });

        const isMuted = voiceService.toggleMute(session.id, 'player-1');
        expect(isMuted).toBe(true);

        const isUnmuted = voiceService.toggleMute(session.id, 'player-1');
        expect(isUnmuted).toBe(false);
      });

      it('should throw error for non-existent participant', () => {
        expect(() => voiceService.toggleMute(session.id, 'non-existent')).toThrow();
      });
    });

    describe('toggleDeafen', () => {
      it('should toggle participant deafen status and auto-mute', () => {
        voiceService.addParticipant(session.id, {
          id: 'player-1',
          name: 'John',
          type: 'player',
        });

        const isDeafened = voiceService.toggleDeafen(session.id, 'player-1');
        expect(isDeafened).toBe(true);

        const updatedSession = voiceService.getVoiceSession(session.id);
        const participant = updatedSession?.participants.find((p) => p.id === 'player-1');
        expect(participant?.isMuted).toBe(true); // Should also be muted
      });
    });
  });

  describe('Voice Queue Management', () => {
    let session: VoiceSession;

    beforeEach(() => {
      session = voiceService.createVoiceSession('game-session-1');
    });

    describe('queueNarration', () => {
      it('should add narration to the queue', () => {
        const item = voiceService.queueNarration(session.id, 'The cave echoes with distant sounds.');

        expect(item.type).toBe('narration');
        expect(item.text).toBe('The cave echoes with distant sounds.');
        expect(item.priority).toBe(0);
      });

      it('should respect priority ordering', () => {
        voiceService.queueNarration(session.id, 'Low priority', undefined, 0);
        voiceService.queueNarration(session.id, 'High priority', undefined, 10);
        voiceService.queueNarration(session.id, 'Medium priority', undefined, 5);

        const queue = voiceService.getQueueStatus(session.id);
        expect(queue?.items[0].text).toBe('High priority');
        expect(queue?.items[1].text).toBe('Medium priority');
        expect(queue?.items[2].text).toBe('Low priority');
      });
    });

    describe('queueNPCDialogue', () => {
      it('should add NPC dialogue to the queue', () => {
        const item = voiceService.queueNPCDialogue(
          session.id,
          'npc-1',
          'Yeemik',
          'You not welcome here!',
          'angry'
        );

        expect(item.type).toBe('npc_dialogue');
        expect(item.metadata?.npcId).toBe('npc-1');
        expect(item.metadata?.npcName).toBe('Yeemik');
        expect(item.metadata?.emotion).toBe('angry');
      });
    });

    describe('processQueue', () => {
      it('should process the next item in queue', async () => {
        const mockAudioBuffer = new ArrayBuffer(1000);
        mockFetch.mockResolvedValueOnce({
          ok: true,
          arrayBuffer: () => Promise.resolve(mockAudioBuffer),
        });

        voiceService.queueNarration(session.id, 'Test narration');
        const result = await voiceService.processQueue(session.id);

        expect(result).toBeDefined();
        expect(result?.audio).toBe(mockAudioBuffer);

        // Queue should be empty after processing
        const queue = voiceService.getQueueStatus(session.id);
        expect(queue?.items).toHaveLength(0);
      });

      it('should return null for empty queue', async () => {
        const result = await voiceService.processQueue(session.id);
        expect(result).toBeNull();
      });

      it('should not process when queue is paused', async () => {
        voiceService.queueNarration(session.id, 'Test');
        voiceService.pauseQueue(session.id);

        const result = await voiceService.processQueue(session.id);
        expect(result).toBeNull();
      });
    });

    describe('clearQueue', () => {
      it('should clear all items from the queue', () => {
        voiceService.queueNarration(session.id, 'Item 1');
        voiceService.queueNarration(session.id, 'Item 2');

        voiceService.clearQueue(session.id);

        const queue = voiceService.getQueueStatus(session.id);
        expect(queue?.items).toHaveLength(0);
      });
    });
  });

  describe('Voice Profile Management', () => {
    describe('setCharacterVoice', () => {
      it('should set a voice profile for a character', () => {
        const voiceProfile = VOICE_PRESETS.warrior;
        voiceService.setCharacterVoice('char-1', 'Thorin', voiceProfile);

        const mapping = voiceService.getCharacterVoice('char-1');
        expect(mapping?.characterName).toBe('Thorin');
        expect(mapping?.voiceProfile).toBe(voiceProfile);
      });
    });

    describe('setNPCVoice', () => {
      it('should set a voice profile for an NPC', () => {
        const voiceProfile = VOICE_PRESETS.villain;
        voiceService.setNPCVoice('npc-1', 'Dark Lord', voiceProfile);

        const mapping = voiceService.getNPCVoice('npc-1');
        expect(mapping?.npcName).toBe('Dark Lord');
        expect(mapping?.voiceProfile).toBe(voiceProfile);
      });
    });

    describe('getVoicePresets', () => {
      it('should return all voice presets', () => {
        const presets = voiceService.getVoicePresets();

        expect(presets.narrator).toBeDefined();
        expect(presets.villain).toBeDefined();
        expect(presets.merchant).toBeDefined();
        expect(presets.elderly).toBeDefined();
      });
    });
  });

  describe('Transcript Management', () => {
    let session: VoiceSession;

    beforeEach(() => {
      session = voiceService.createVoiceSession('game-session-1');
    });

    describe('addTranscriptEntry', () => {
      it('should add an entry to the transcript', () => {
        const entry = voiceService.addTranscriptEntry(session.id, {
          timestamp: new Date(),
          speaker: 'Thorin',
          speakerType: 'player',
          text: 'I search the room',
        });

        expect(entry.id).toBeDefined();
        expect(entry.speaker).toBe('Thorin');

        const transcript = voiceService.getTranscript(session.id);
        expect(transcript?.entries).toHaveLength(1);
      });
    });

    describe('getTranscript', () => {
      it('should return the transcript for a session', () => {
        const transcript = voiceService.getTranscript(session.id);

        expect(transcript).toBeDefined();
        expect(transcript?.sessionId).toBe(session.id);
        expect(transcript?.entries).toEqual([]);
      });

      it('should return undefined for non-existent session', () => {
        const transcript = voiceService.getTranscript('non-existent');
        expect(transcript).toBeUndefined();
      });
    });

    describe('exportTranscript', () => {
      beforeEach(() => {
        voiceService.addTranscriptEntry(session.id, {
          timestamp: new Date(),
          speaker: 'DM',
          speakerType: 'dm',
          text: 'You enter the cave',
        });
        voiceService.addTranscriptEntry(session.id, {
          timestamp: new Date(),
          speaker: 'Thorin',
          speakerType: 'player',
          text: 'I light my torch',
        });
      });

      it('should export transcript as text', () => {
        const text = voiceService.exportTranscript(session.id, 'text');

        expect(text).toContain('[DM]: You enter the cave');
        expect(text).toContain('[Thorin]: I light my torch');
      });

      it('should export transcript as JSON', () => {
        const json = voiceService.exportTranscript(session.id, 'json');
        const parsed = JSON.parse(json);

        expect(parsed.entries).toHaveLength(2);
        expect(parsed.sessionId).toBe(session.id);
      });

      it('should export transcript as SRT', () => {
        const srt = voiceService.exportTranscript(session.id, 'srt');

        expect(srt).toContain('1\n');
        expect(srt).toContain('-->');
        expect(srt).toContain('DM: You enter the cave');
      });

      it('should throw error for non-existent session', () => {
        expect(() => voiceService.exportTranscript('non-existent')).toThrow();
      });
    });
  });

  describe('processPlayerSpeech', () => {
    let session: VoiceSession;

    beforeEach(() => {
      session = voiceService.createVoiceSession('game-session-1');
      voiceService.addParticipant(session.id, {
        id: 'player-1',
        name: 'John',
        type: 'player',
        characterId: 'char-1',
      });
    });

    it('should transcribe player speech and add to transcript', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          text: 'I attack the goblin',
          language: 'en',
          duration: 1.5,
        }),
      });

      const audioBlob = new Blob(['audio data'], { type: 'audio/webm' });
      const result = await voiceService.processPlayerSpeech(session.id, 'player-1', audioBlob);

      expect(result.text).toBe('I attack the goblin');
      expect(result.entry.speaker).toBe('John');
      expect(result.entry.speakerType).toBe('player');

      const transcript = voiceService.getTranscript(session.id);
      expect(transcript?.entries).toHaveLength(1);
    });

    it('should throw error when participant is muted', async () => {
      voiceService.toggleMute(session.id, 'player-1');
      const audioBlob = new Blob(['audio data'], { type: 'audio/webm' });

      await expect(
        voiceService.processPlayerSpeech(session.id, 'player-1', audioBlob)
      ).rejects.toMatchObject({
        code: 'PERMISSION_DENIED',
      });
    });

    it('should throw error for non-existent session', async () => {
      const audioBlob = new Blob(['audio data'], { type: 'audio/webm' });

      await expect(
        voiceService.processPlayerSpeech('non-existent', 'player-1', audioBlob)
      ).rejects.toMatchObject({
        code: 'SESSION_ERROR',
      });
    });

    it('should throw error for non-existent participant', async () => {
      const audioBlob = new Blob(['audio data'], { type: 'audio/webm' });

      await expect(
        voiceService.processPlayerSpeech(session.id, 'non-existent', audioBlob)
      ).rejects.toMatchObject({
        code: 'SESSION_ERROR',
      });
    });
  });

  describe('DEFAULT_DM_VOICE and VOICE_PRESETS', () => {
    it('should have valid default DM voice', () => {
      expect(DEFAULT_DM_VOICE.id).toBe('dm-default');
      expect(DEFAULT_DM_VOICE.voiceId).toBeDefined();
      expect(DEFAULT_DM_VOICE.settings.stability).toBeGreaterThan(0);
      expect(DEFAULT_DM_VOICE.settings.similarityBoost).toBeGreaterThan(0);
    });

    it('should have various voice presets', () => {
      expect(Object.keys(VOICE_PRESETS).length).toBeGreaterThan(0);
      expect(VOICE_PRESETS.narrator).toBeDefined();
      expect(VOICE_PRESETS.villain).toBeDefined();
      expect(VOICE_PRESETS.merchant).toBeDefined();
    });
  });
});
