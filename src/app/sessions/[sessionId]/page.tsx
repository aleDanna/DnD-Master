'use client';

import { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  Play,
  Pause,
  StopCircle,
  Swords,
  MessageSquare,
  Users,
  Scroll,
  Map,
  Dices,
  Send,
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  ChevronRight,
  Settings,
  BookOpen,
} from 'lucide-react';
import { AppLayout } from '@/components/layout';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { cn } from '@/lib/utils';

// Types for the session
interface Player {
  id: string;
  name: string;
  characterName: string;
  avatarUrl?: string;
  isReady: boolean;
  isConnected: boolean;
}

interface ChatMessage {
  id: string;
  sender: string;
  senderType: 'player' | 'dm' | 'system';
  content: string;
  type: 'ic' | 'ooc' | 'system' | 'roll';
  timestamp: Date;
}

interface NarrativeEvent {
  id: string;
  text: string;
  type: 'narration' | 'dialogue' | 'action' | 'roll';
  timestamp: Date;
}

// Mock data
const mockPlayers: Player[] = [
  { id: '1', name: 'Alice', characterName: 'Thorin Ironforge', isReady: true, isConnected: true },
  { id: '2', name: 'Bob', characterName: 'Elara Moonwhisper', isReady: true, isConnected: true },
  { id: '3', name: 'Charlie', characterName: 'Grimlock the Brave', isReady: false, isConnected: true },
  { id: '4', name: 'Diana', characterName: 'Zara Shadowstep', isReady: true, isConnected: false },
];

const mockNarrative: NarrativeEvent[] = [
  { id: '1', text: 'The party enters the dimly lit tavern. The smell of ale and woodsmoke fills the air.', type: 'narration', timestamp: new Date() },
  { id: '2', text: '"Welcome, travelers! What brings ye to the Rusty Dragon this fine evening?" The barkeep, a stout dwarf with a braided beard, calls out from behind the counter.', type: 'dialogue', timestamp: new Date() },
  { id: '3', text: 'Thorin steps forward and places a gold coin on the bar.', type: 'action', timestamp: new Date() },
];

const mockChat: ChatMessage[] = [
  { id: '1', sender: 'Alice', senderType: 'player', content: 'I want to talk to the barkeep', type: 'ic', timestamp: new Date() },
  { id: '2', sender: 'DM', senderType: 'dm', content: 'Roll a Persuasion check', type: 'system', timestamp: new Date() },
  { id: '3', sender: 'Alice', senderType: 'player', content: 'Persuasion: 18 (d20: 14 + 4)', type: 'roll', timestamp: new Date() },
];

type Tab = 'narrative' | 'chat' | 'combat' | 'quests' | 'map';

export default function SessionPage() {
  const params = useParams();
  const router = useRouter();
  const sessionId = params.sessionId as string;

  const [sessionStatus, setSessionStatus] = useState<'preparing' | 'active' | 'paused' | 'ended'>('preparing');
  const [activeTab, setActiveTab] = useState<Tab>('narrative');
  const [players, setPlayers] = useState<Player[]>(mockPlayers);
  const [narrative, setNarrative] = useState<NarrativeEvent[]>(mockNarrative);
  const [chat, setChat] = useState<ChatMessage[]>(mockChat);
  const [inputValue, setInputValue] = useState('');
  const [isMuted, setIsMuted] = useState(false);
  const [isDeafened, setIsDeafened] = useState(false);
  const [showPlayerPanel, setShowPlayerPanel] = useState(true);

  const narrativeEndRef = useRef<HTMLDivElement>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    narrativeEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [narrative]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chat]);

  const handleSendMessage = () => {
    if (!inputValue.trim()) return;

    const newMessage: ChatMessage = {
      id: `msg-${Date.now()}`,
      sender: 'You',
      senderType: 'player',
      content: inputValue,
      type: inputValue.startsWith('/') ? 'ooc' : 'ic',
      timestamp: new Date(),
    };

    setChat((prev) => [...prev, newMessage]);
    setInputValue('');
  };

  const handleStartSession = () => setSessionStatus('active');
  const handlePauseSession = () => setSessionStatus('paused');
  const handleResumeSession = () => setSessionStatus('active');
  const handleEndSession = () => {
    setSessionStatus('ended');
    router.push('/campaigns');
  };

  const renderTab = () => {
    switch (activeTab) {
      case 'narrative':
        return (
          <div className="h-full flex flex-col">
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {narrative.map((event) => (
                <div key={event.id} className={cn(
                  'p-4 rounded-lg',
                  event.type === 'narration' && 'bg-background-secondary italic',
                  event.type === 'dialogue' && 'bg-accent/10 border-l-4 border-accent',
                  event.type === 'action' && 'bg-warning/10 text-warning',
                  event.type === 'roll' && 'bg-info/10'
                )}>
                  <p>{event.text}</p>
                </div>
              ))}
              <div ref={narrativeEndRef} />
            </div>
          </div>
        );

      case 'chat':
        return (
          <div className="h-full flex flex-col">
            <div className="flex-1 overflow-y-auto p-4 space-y-2">
              {chat.map((message) => (
                <div key={message.id} className={cn(
                  'p-3 rounded-lg',
                  message.senderType === 'dm' && 'bg-accent/20',
                  message.senderType === 'player' && 'bg-background-secondary',
                  message.senderType === 'system' && 'bg-background-tertiary text-foreground-secondary text-sm',
                  message.type === 'roll' && 'font-mono bg-info/10'
                )}>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-semibold text-sm">{message.sender}</span>
                    {message.type === 'ooc' && (
                      <Badge variant="secondary">OOC</Badge>
                    )}
                  </div>
                  <p>{message.content}</p>
                </div>
              ))}
              <div ref={chatEndRef} />
            </div>
            <div className="p-4 border-t border-border">
              <div className="flex gap-2">
                <Input
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  placeholder="Type a message... (/ for OOC)"
                  onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                />
                <Button onClick={handleSendMessage}>
                  <Send className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        );

      case 'combat':
        return (
          <div className="h-full flex items-center justify-center text-foreground-tertiary">
            <div className="text-center">
              <Swords className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No active combat</p>
              <Button variant="outline" className="mt-4" onClick={() => router.push('/combat')}>
                Open Combat Tracker
              </Button>
            </div>
          </div>
        );

      case 'quests':
        return (
          <div className="h-full p-4">
            <div className="space-y-4">
              <Card className="p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="font-semibold">The Missing Merchant</h4>
                    <p className="text-sm text-foreground-secondary mt-1">
                      Find the merchant who disappeared on the road to Waterdeep.
                    </p>
                  </div>
                  <Badge variant="warning">Active</Badge>
                </div>
                <div className="mt-3 space-y-1">
                  <div className="flex items-center gap-2 text-sm">
                    <div className="w-4 h-4 rounded-full border-2 border-success bg-success/20" />
                    <span className="line-through text-foreground-tertiary">Speak with the merchant's wife</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <div className="w-4 h-4 rounded-full border-2 border-foreground-secondary" />
                    <span>Investigate the last known location</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <div className="w-4 h-4 rounded-full border-2 border-foreground-secondary" />
                    <span>Find evidence of foul play</span>
                  </div>
                </div>
              </Card>
              <Card className="p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="font-semibold">Goblin Raids</h4>
                    <p className="text-sm text-foreground-secondary mt-1">
                      Stop the goblin raids on the village outskirts.
                    </p>
                  </div>
                  <Badge>Available</Badge>
                </div>
              </Card>
            </div>
          </div>
        );

      case 'map':
        return (
          <div className="h-full flex items-center justify-center text-foreground-tertiary">
            <div className="text-center">
              <Map className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No map loaded</p>
              <p className="text-sm mt-2">The DM hasn't shared a map for this scene.</p>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <AppLayout
      title="Game Session"
      subtitle={sessionStatus === 'active' ? 'In Progress' : sessionStatus === 'paused' ? 'Paused' : sessionStatus === 'ended' ? 'Ended' : 'Preparing'}
      actions={
        <div className="flex items-center gap-2">
          {sessionStatus === 'preparing' && (
            <Button onClick={handleStartSession}>
              <Play className="w-4 h-4 mr-2" />
              Start Session
            </Button>
          )}
          {sessionStatus === 'active' && (
            <>
              <Button variant="outline" onClick={handlePauseSession}>
                <Pause className="w-4 h-4 mr-2" />
                Pause
              </Button>
              <Button variant="destructive" onClick={handleEndSession}>
                <StopCircle className="w-4 h-4 mr-2" />
                End Session
              </Button>
            </>
          )}
          {sessionStatus === 'paused' && (
            <>
              <Button onClick={handleResumeSession}>
                <Play className="w-4 h-4 mr-2" />
                Resume
              </Button>
              <Button variant="destructive" onClick={handleEndSession}>
                <StopCircle className="w-4 h-4 mr-2" />
                End Session
              </Button>
            </>
          )}
        </div>
      }
    >
      <div className="h-[calc(100vh-120px)] flex">
        {/* Main Content Area */}
        <div className="flex-1 flex flex-col">
          {/* Tab Navigation */}
          <div className="border-b border-border px-4">
            <div className="flex gap-1">
              {[
                { id: 'narrative', label: 'Story', icon: BookOpen },
                { id: 'chat', label: 'Chat', icon: MessageSquare },
                { id: 'combat', label: 'Combat', icon: Swords },
                { id: 'quests', label: 'Quests', icon: Scroll },
                { id: 'map', label: 'Map', icon: Map },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as Tab)}
                  className={cn(
                    'flex items-center gap-2 px-4 py-3 border-b-2 transition-colors',
                    activeTab === tab.id
                      ? 'border-accent text-accent'
                      : 'border-transparent text-foreground-secondary hover:text-foreground'
                  )}
                >
                  <tab.icon className="w-4 h-4" />
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* Tab Content */}
          <div className="flex-1 overflow-hidden">
            {renderTab()}
          </div>

          {/* Action Input (for narrative tab) */}
          {activeTab === 'narrative' && (
            <div className="p-4 border-t border-border">
              <div className="flex gap-2">
                <Input
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  placeholder="What do you want to do?"
                  className="flex-1"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && inputValue.trim()) {
                      const newEvent: NarrativeEvent = {
                        id: `event-${Date.now()}`,
                        text: `You: "${inputValue}"`,
                        type: 'action',
                        timestamp: new Date(),
                      };
                      setNarrative((prev) => [...prev, newEvent]);
                      setInputValue('');
                    }
                  }}
                />
                <Button variant="outline" onClick={() => router.push('/tools/dice')}>
                  <Dices className="w-4 h-4" />
                </Button>
                <Button
                  onClick={() => {
                    if (inputValue.trim()) {
                      const newEvent: NarrativeEvent = {
                        id: `event-${Date.now()}`,
                        text: `You: "${inputValue}"`,
                        type: 'action',
                        timestamp: new Date(),
                      };
                      setNarrative((prev) => [...prev, newEvent]);
                      setInputValue('');
                    }
                  }}
                >
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Right Sidebar - Players Panel */}
        {showPlayerPanel && (
          <div className="w-72 border-l border-border flex flex-col">
            {/* Voice Controls */}
            <div className="p-4 border-b border-border">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold">Voice</h3>
                <Button variant="ghost" size="sm">
                  <Settings className="w-4 h-4" />
                </Button>
              </div>
              <div className="flex gap-2">
                <Button
                  variant={isMuted ? 'destructive' : 'outline'}
                  size="sm"
                  className="flex-1"
                  onClick={() => setIsMuted(!isMuted)}
                >
                  {isMuted ? <MicOff className="w-4 h-4 mr-2" /> : <Mic className="w-4 h-4 mr-2" />}
                  {isMuted ? 'Muted' : 'Unmuted'}
                </Button>
                <Button
                  variant={isDeafened ? 'destructive' : 'outline'}
                  size="sm"
                  onClick={() => setIsDeafened(!isDeafened)}
                >
                  {isDeafened ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                </Button>
              </div>
            </div>

            {/* Players List */}
            <div className="flex-1 overflow-y-auto p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold">Players</h3>
                <Users className="w-4 h-4 text-foreground-secondary" />
              </div>
              <div className="space-y-2">
                {players.map((player) => (
                  <div
                    key={player.id}
                    className={cn(
                      'p-3 rounded-lg bg-background-secondary',
                      !player.isConnected && 'opacity-50'
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <div className="relative">
                        <div className="w-10 h-10 rounded-full bg-background-tertiary flex items-center justify-center">
                          <span className="text-sm font-semibold">
                            {player.name[0]}
                          </span>
                        </div>
                        <div
                          className={cn(
                            'absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-background-secondary',
                            player.isConnected ? 'bg-success' : 'bg-foreground-tertiary'
                          )}
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">
                          {player.characterName}
                        </p>
                        <p className="text-xs text-foreground-secondary truncate">
                          {player.name}
                        </p>
                      </div>
                      {player.isReady && (
                        <Badge variant="success" className="text-xs">Ready</Badge>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Quick Actions */}
            <div className="p-4 border-t border-border">
              <Button variant="outline" className="w-full" onClick={() => router.push('/tools/dice')}>
                <Dices className="w-4 h-4 mr-2" />
                Roll Dice
              </Button>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
