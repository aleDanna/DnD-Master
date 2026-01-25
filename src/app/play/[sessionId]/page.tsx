'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import {
  Send,
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  Dices,
  Swords,
  Heart,
  Shield,
  Loader2,
  Settings,
  RotateCcw,
  Sparkles,
} from 'lucide-react';
import { AppLayout } from '@/components/layout';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { cn } from '@/lib/utils';

interface NarrativeMessage {
  id: string;
  role: 'dm' | 'player' | 'system';
  content: string;
  type: 'narration' | 'dialogue' | 'action' | 'roll' | 'combat' | 'system';
  timestamp: Date;
  diceRoll?: {
    expression: string;
    result: number;
    rolls: number[];
    success?: boolean;
  };
}

interface Character {
  id: string;
  name: string;
  race: { name: string };
  classes: Array<{ name: string; level: number }>;
  level: number;
  currentHitPoints: number;
  maxHitPoints: number;
  armorClass: number;
  abilityScores: {
    strength: number;
    dexterity: number;
    constitution: number;
    intelligence: number;
    wisdom: number;
    charisma: number;
  };
}

interface CombatState {
  active: boolean;
  round: number;
  currentTurn: string;
  enemies: Array<{ name: string; hp: number; maxHp: number }>;
}

export default function AIPlaySessionPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const sessionId = params.sessionId as string;
  const characterId = searchParams.get('characterId');

  // State
  const [messages, setMessages] = useState<NarrativeMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [character, setCharacter] = useState<Character | null>(null);
  const [combat, setCombat] = useState<CombatState | null>(null);

  // Refs
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Load character data
  useEffect(() => {
    async function loadCharacter() {
      if (!characterId) return;
      try {
        const response = await fetch(`/api/characters/${characterId}`);
        if (response.ok) {
          const data = await response.json();
          setCharacter(data.character);
        }
      } catch (error) {
        console.error('Failed to load character:', error);
      }
    }
    loadCharacter();
  }, [characterId]);

  // Initialize session with welcome message
  useEffect(() => {
    const welcomeMessage: NarrativeMessage = {
      id: 'welcome',
      role: 'dm',
      content: character
        ? `Welcome, ${character.name}! You find yourself at the entrance of a mysterious dungeon. The air is thick with the smell of moss and ancient stone. Torchlight flickers from somewhere deep within, casting dancing shadows on the walls.\n\nWhat would you like to do?`
        : `Welcome, adventurer! A new journey awaits you. The road stretches before you, leading to unknown dangers and untold treasures.\n\nWhat would you like to do?`,
      type: 'narration',
      timestamp: new Date(),
    };
    setMessages([welcomeMessage]);
  }, [character]);

  // Setup speech recognition
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const SpeechRecognitionAPI = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (SpeechRecognitionAPI) {
        const recognition = new SpeechRecognitionAPI();
        recognition.continuous = false;
        recognition.interimResults = true;

        recognition.onresult = (event: SpeechRecognitionEvent) => {
          let transcript = '';
          for (let i = 0; i < event.results.length; i++) {
            transcript += event.results[i][0].transcript;
          }
          setInputValue(transcript);
        };

        recognition.onend = () => {
          setIsListening(false);
        };

        recognitionRef.current = recognition;
      }
    }
  }, []);

  // Toggle voice input
  const toggleListening = useCallback(() => {
    if (!recognitionRef.current) {
      alert('Speech recognition is not supported in your browser.');
      return;
    }

    if (isListening) {
      recognitionRef.current.stop();
    } else {
      recognitionRef.current.start();
      setIsListening(true);
    }
  }, [isListening]);

  // Send message to AI DM
  const sendMessage = useCallback(async () => {
    if (!inputValue.trim() || isLoading) return;

    const playerMessage: NarrativeMessage = {
      id: `player-${Date.now()}`,
      role: 'player',
      content: inputValue,
      type: 'action',
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, playerMessage]);
    setInputValue('');
    setIsLoading(true);

    try {
      // Call AI service for DM response
      const response = await fetch('/api/ai/dm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId,
          characterId,
          action: inputValue,
          context: {
            character,
            recentMessages: messages.slice(-10),
            combat,
          },
        }),
      });

      if (response.ok) {
        const data = await response.json();

        const dmMessage: NarrativeMessage = {
          id: `dm-${Date.now()}`,
          role: 'dm',
          content: data.narrative || data.response || 'The DM ponders your action...',
          type: data.type || 'narration',
          timestamp: new Date(),
          diceRoll: data.diceRoll,
        };

        setMessages(prev => [...prev, dmMessage]);

        // Handle combat state updates
        if (data.combat) {
          setCombat(data.combat);
        }

        // Speak response if not muted
        if (!isMuted && 'speechSynthesis' in window) {
          const utterance = new SpeechSynthesisUtterance(data.narrative || data.response);
          utterance.rate = 0.9;
          speechSynthesis.speak(utterance);
        }
      } else {
        // Fallback response
        const fallbackResponse = generateFallbackResponse(inputValue);
        const dmMessage: NarrativeMessage = {
          id: `dm-${Date.now()}`,
          role: 'dm',
          content: fallbackResponse,
          type: 'narration',
          timestamp: new Date(),
        };
        setMessages(prev => [...prev, dmMessage]);
      }
    } catch (error) {
      console.error('AI DM error:', error);
      // Provide offline fallback
      const fallbackResponse = generateFallbackResponse(inputValue);
      const dmMessage: NarrativeMessage = {
        id: `dm-${Date.now()}`,
        role: 'dm',
        content: fallbackResponse,
        type: 'narration',
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, dmMessage]);
    } finally {
      setIsLoading(false);
      inputRef.current?.focus();
    }
  }, [inputValue, isLoading, sessionId, characterId, character, messages, combat, isMuted]);

  // Generate fallback response when AI is unavailable
  function generateFallbackResponse(action: string): string {
    const actionLower = action.toLowerCase();

    if (actionLower.includes('look') || actionLower.includes('examine')) {
      return "You carefully examine your surroundings. The dungeon walls are covered in ancient runes, their meaning lost to time. A faint draft suggests there may be passages ahead.";
    }
    if (actionLower.includes('attack') || actionLower.includes('fight')) {
      return "You ready your weapon! Roll for initiative. (Type 'roll d20' to roll)";
    }
    if (actionLower.includes('roll')) {
      const diceMatch = action.match(/(\d*)d(\d+)/i);
      if (diceMatch) {
        const count = parseInt(diceMatch[1]) || 1;
        const sides = parseInt(diceMatch[2]);
        const rolls = Array.from({ length: count }, () => Math.floor(Math.random() * sides) + 1);
        const total = rolls.reduce((a, b) => a + b, 0);
        return `Rolling ${count}d${sides}... [${rolls.join(', ')}] = ${total}`;
      }
    }
    if (actionLower.includes('move') || actionLower.includes('go') || actionLower.includes('walk')) {
      return "You carefully make your way forward. The passage twists and turns, but you press on. After a moment, you come to a fork in the path.";
    }
    if (actionLower.includes('talk') || actionLower.includes('speak')) {
      return "You call out, your voice echoing through the stone corridors. For a moment, there is only silence... then, a distant sound responds.";
    }

    return "You attempt to " + action.toLowerCase() + ". The dungeon seems to shift around you, ancient magic responding to your presence. What do you do next?";
  }

  // Roll dice
  const rollDice = useCallback((expression: string = '1d20') => {
    const match = expression.match(/(\d*)d(\d+)([+-]\d+)?/i);
    if (!match) return;

    const count = parseInt(match[1]) || 1;
    const sides = parseInt(match[2]);
    const modifier = parseInt(match[3]) || 0;

    const rolls = Array.from({ length: count }, () => Math.floor(Math.random() * sides) + 1);
    const total = rolls.reduce((a, b) => a + b, 0) + modifier;

    const rollMessage: NarrativeMessage = {
      id: `roll-${Date.now()}`,
      role: 'system',
      content: `Rolling ${expression}: [${rolls.join(', ')}]${modifier ? ` + ${modifier}` : ''} = ${total}`,
      type: 'roll',
      timestamp: new Date(),
      diceRoll: { expression, result: total, rolls },
    };

    setMessages(prev => [...prev, rollMessage]);
  }, []);

  return (
    <AppLayout
      title="AI Dungeon Master"
      subtitle={character ? `Playing as ${character.name}` : 'Adventure awaits'}
      actions={
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => rollDice('1d20')}>
            <Dices className="w-4 h-4 mr-2" />
            Roll d20
          </Button>
          <Button variant="ghost" size="sm">
            <Settings className="w-4 h-4" />
          </Button>
        </div>
      }
    >
      <div className="h-[calc(100vh-140px)] flex gap-4">
        {/* Main Narrative Area */}
        <div className="flex-1 flex flex-col">
          {/* Messages */}
          <Card className="flex-1 overflow-hidden flex flex-col">
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={cn(
                    'p-4 rounded-lg max-w-[85%]',
                    message.role === 'dm' && 'bg-accent/10 border-l-4 border-accent',
                    message.role === 'player' && 'bg-background-secondary ml-auto',
                    message.role === 'system' && 'bg-info/10 text-center mx-auto max-w-md',
                    message.type === 'roll' && 'font-mono bg-warning/10 border border-warning/30'
                  )}
                >
                  {message.role === 'dm' && (
                    <div className="flex items-center gap-2 mb-2">
                      <Sparkles className="w-4 h-4 text-accent" />
                      <span className="text-sm font-semibold text-accent">Dungeon Master</span>
                    </div>
                  )}
                  {message.role === 'player' && (
                    <div className="flex items-center gap-2 mb-2 justify-end">
                      <span className="text-sm font-semibold text-foreground-secondary">
                        {character?.name || 'You'}
                      </span>
                    </div>
                  )}
                  <p className="whitespace-pre-wrap">{message.content}</p>
                  {message.diceRoll && (
                    <div className="mt-2 p-2 rounded bg-background-tertiary flex items-center gap-2">
                      <Dices className="w-4 h-4" />
                      <span className="font-mono">
                        {message.diceRoll.expression}: [{message.diceRoll.rolls.join(', ')}] = {message.diceRoll.result}
                      </span>
                    </div>
                  )}
                </div>
              ))}
              {isLoading && (
                <div className="p-4 rounded-lg bg-accent/10 border-l-4 border-accent max-w-[85%]">
                  <div className="flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin text-accent" />
                    <span className="text-sm text-foreground-secondary">The DM is thinking...</span>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="p-4 border-t border-border">
              <div className="flex gap-2">
                <Button
                  variant={isListening ? 'destructive' : 'outline'}
                  size="icon"
                  onClick={toggleListening}
                  title={isListening ? 'Stop listening' : 'Voice input'}
                >
                  {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                </Button>
                <Input
                  ref={inputRef}
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  placeholder="What do you do? (e.g., 'I search the room for traps')"
                  className="flex-1"
                  onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && sendMessage()}
                  disabled={isLoading}
                />
                <Button onClick={() => sendMessage()} disabled={isLoading || !inputValue.trim()}>
                  {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                </Button>
              </div>
              <div className="flex gap-2 mt-2">
                <Button variant="ghost" size="sm" onClick={() => setInputValue('I look around')}>
                  Look around
                </Button>
                <Button variant="ghost" size="sm" onClick={() => setInputValue('I search for traps')}>
                  Search
                </Button>
                <Button variant="ghost" size="sm" onClick={() => setInputValue('I move forward carefully')}>
                  Move forward
                </Button>
                <Button variant="ghost" size="sm" onClick={() => rollDice('1d20')}>
                  <Dices className="w-3 h-3 mr-1" />
                  Roll d20
                </Button>
              </div>
            </div>
          </Card>
        </div>

        {/* Right Sidebar - Character & Controls */}
        <div className="w-72 flex flex-col gap-4">
          {/* Character Stats */}
          {character && (
            <Card className="p-4">
              <h3 className="font-semibold mb-3">{character.name}</h3>
              <p className="text-sm text-foreground-secondary mb-3">
                Level {character.level} {character.race?.name} {character.classes?.[0]?.name}
              </p>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Heart className="w-4 h-4 text-danger" />
                    <span className="text-sm">HP</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-24 h-2 bg-background-tertiary rounded-full overflow-hidden">
                      <div
                        className="h-full bg-danger"
                        style={{ width: `${(character.currentHitPoints / character.maxHitPoints) * 100}%` }}
                      />
                    </div>
                    <span className="text-sm font-mono">
                      {character.currentHitPoints}/{character.maxHitPoints}
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Shield className="w-4 h-4 text-info" />
                    <span className="text-sm">AC</span>
                  </div>
                  <span className="font-mono">{character.armorClass}</span>
                </div>
              </div>

              {/* Ability Scores */}
              <div className="grid grid-cols-3 gap-2 mt-4">
                {character.abilityScores && Object.entries(character.abilityScores).map(([ability, score]) => (
                  <div key={ability} className="text-center p-2 bg-background-secondary rounded">
                    <div className="text-xs text-foreground-tertiary uppercase">{ability.slice(0, 3)}</div>
                    <div className="font-bold">{score}</div>
                    <div className="text-xs text-foreground-secondary">
                      {Math.floor((score - 10) / 2) >= 0 ? '+' : ''}{Math.floor((score - 10) / 2)}
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* Combat Status */}
          {combat?.active && (
            <Card className="p-4 border-danger/50">
              <div className="flex items-center gap-2 mb-3">
                <Swords className="w-4 h-4 text-danger" />
                <h3 className="font-semibold text-danger">Combat!</h3>
                <Badge variant="danger">Round {combat.round}</Badge>
              </div>
              <div className="space-y-2">
                {combat.enemies.map((enemy, i) => (
                  <div key={i} className="flex items-center justify-between text-sm">
                    <span>{enemy.name}</span>
                    <span className="font-mono">{enemy.hp}/{enemy.maxHp}</span>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* Voice Controls */}
          <Card className="p-4">
            <h3 className="font-semibold mb-3">Voice Controls</h3>
            <div className="flex gap-2">
              <Button
                variant={isListening ? 'destructive' : 'outline'}
                className="flex-1"
                onClick={toggleListening}
              >
                {isListening ? <MicOff className="w-4 h-4 mr-2" /> : <Mic className="w-4 h-4 mr-2" />}
                {isListening ? 'Stop' : 'Speak'}
              </Button>
              <Button
                variant={isMuted ? 'destructive' : 'outline'}
                onClick={() => setIsMuted(!isMuted)}
              >
                {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
              </Button>
            </div>
            {isListening && (
              <p className="text-xs text-foreground-secondary mt-2 text-center">
                Listening... Speak your action
              </p>
            )}
          </Card>

          {/* Quick Dice */}
          <Card className="p-4">
            <h3 className="font-semibold mb-3">Quick Dice</h3>
            <div className="grid grid-cols-4 gap-2">
              {['d4', 'd6', 'd8', 'd10', 'd12', 'd20', 'd100', '2d6'].map((die) => (
                <Button
                  key={die}
                  variant="outline"
                  size="sm"
                  onClick={() => rollDice(die.startsWith('d') ? `1${die}` : die)}
                >
                  {die}
                </Button>
              ))}
            </div>
          </Card>

          {/* Session Controls */}
          <Card className="p-4 mt-auto">
            <Button variant="outline" className="w-full" onClick={() => window.location.reload()}>
              <RotateCcw className="w-4 h-4 mr-2" />
              New Adventure
            </Button>
          </Card>
        </div>
      </div>
    </AppLayout>
  );
}

// Type declarations for Web Speech API
interface SpeechRecognitionEvent extends Event {
  results: SpeechRecognitionResultList;
}

interface SpeechRecognitionResultList {
  length: number;
  item(index: number): SpeechRecognitionResult;
  [index: number]: SpeechRecognitionResult;
}

interface SpeechRecognitionResult {
  length: number;
  item(index: number): SpeechRecognitionAlternative;
  [index: number]: SpeechRecognitionAlternative;
  isFinal: boolean;
}

interface SpeechRecognitionAlternative {
  transcript: string;
  confidence: number;
}

interface SpeechRecognitionInstance extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start(): void;
  stop(): void;
  abort(): void;
  onresult: ((event: SpeechRecognitionEvent) => void) | null;
  onend: (() => void) | null;
  onerror: ((event: Event) => void) | null;
}

interface SpeechRecognitionConstructor {
  new (): SpeechRecognitionInstance;
}

declare global {
  interface Window {
    SpeechRecognition?: SpeechRecognitionConstructor;
    webkitSpeechRecognition?: SpeechRecognitionConstructor;
  }
}
