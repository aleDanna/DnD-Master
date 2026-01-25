'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Sparkles,
  Users,
  Swords,
  BookOpen,
  ChevronRight,
  Plus,
  Play,
  Clock,
  User,
} from 'lucide-react';
import { AppLayout } from '@/components/layout';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';

interface Character {
  id: string;
  name: string;
  race: { name: string };
  classes: Array<{ name: string; level: number }>;
  level: number;
}

interface Campaign {
  id: string;
  name: string;
  description: string;
  lastPlayed?: Date;
}

export default function PlayPage() {
  const router = useRouter();
  const [characters, setCharacters] = useState<Character[]>([]);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [selectedCharacter, setSelectedCharacter] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isStarting, setIsStarting] = useState(false);

  useEffect(() => {
    async function fetchData() {
      try {
        // Fetch user's characters
        const charResponse = await fetch('/api/characters');
        if (charResponse.ok) {
          const charData = await charResponse.json();
          setCharacters(charData.characters || []);
          if (charData.characters?.length > 0) {
            setSelectedCharacter(charData.characters[0].id);
          }
        }

        // Fetch user's campaigns
        const campResponse = await fetch('/api/campaigns');
        if (campResponse.ok) {
          const campData = await campResponse.json();
          setCampaigns(campData.campaigns || []);
        }
      } catch (error) {
        console.error('Failed to fetch data:', error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchData();
  }, []);

  const handleQuickStart = async () => {
    setIsStarting(true);
    try {
      // Create a new quick session
      const response = await fetch('/api/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'quick',
          characterId: selectedCharacter,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        router.push(`/play/${data.session.id}`);
      } else {
        // Fallback: generate a session ID and proceed
        const sessionId = `quick-${Date.now()}`;
        router.push(`/play/${sessionId}?characterId=${selectedCharacter}`);
      }
    } catch {
      // Fallback on error
      const sessionId = `quick-${Date.now()}`;
      router.push(`/play/${sessionId}?characterId=${selectedCharacter}`);
    }
  };

  const handleJoinCampaign = (campaignId: string) => {
    router.push(`/campaigns/${campaignId}`);
  };

  return (
    <AppLayout
      title="Play with AI Dungeon Master"
      subtitle="Start an adventure with your AI DM"
    >
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Quick Start Section */}
        <Card className="p-6 border-2 border-accent/50 bg-gradient-to-br from-accent/5 to-transparent">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-full bg-accent/20 flex items-center justify-center">
              <Sparkles className="w-6 h-6 text-accent" />
            </div>
            <div className="flex-1">
              <h2 className="text-xl font-bold mb-2">Quick Start Adventure</h2>
              <p className="text-foreground-secondary mb-4">
                Jump right into a new adventure with your AI Dungeon Master.
                Perfect for solo play or quick sessions.
              </p>

              {/* Character Selection */}
              {characters.length > 0 ? (
                <div className="mb-4">
                  <label className="text-sm font-medium mb-2 block">Select Your Character</label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {characters.slice(0, 4).map((char) => (
                      <button
                        key={char.id}
                        onClick={() => setSelectedCharacter(char.id)}
                        className={`p-3 rounded-lg border text-left transition-all ${
                          selectedCharacter === char.id
                            ? 'border-accent bg-accent/10'
                            : 'border-border hover:border-accent/50'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-background-tertiary flex items-center justify-center">
                            <User className="w-5 h-5" />
                          </div>
                          <div>
                            <p className="font-medium">{char.name}</p>
                            <p className="text-xs text-foreground-secondary">
                              Level {char.level} {char.race?.name} {char.classes?.[0]?.name}
                            </p>
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="mb-4 p-4 rounded-lg bg-background-secondary">
                  <p className="text-foreground-secondary text-sm mb-2">
                    No characters found. Create one to start playing!
                  </p>
                  <Button variant="outline" size="sm" onClick={() => router.push('/characters/new')}>
                    <Plus className="w-4 h-4 mr-2" />
                    Create Character
                  </Button>
                </div>
              )}

              <Button
                size="lg"
                onClick={handleQuickStart}
                disabled={!selectedCharacter || isStarting}
                className="w-full sm:w-auto"
              >
                {isStarting ? (
                  <>Starting...</>
                ) : (
                  <>
                    <Play className="w-5 h-5 mr-2" />
                    Start Adventure
                  </>
                )}
              </Button>
            </div>
          </div>
        </Card>

        {/* Game Modes */}
        <div>
          <h3 className="text-lg font-semibold mb-4">Choose Your Adventure Style</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="p-4 hover:border-accent/50 transition-colors cursor-pointer" onClick={handleQuickStart}>
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-full bg-accent/20 flex items-center justify-center">
                  <Sparkles className="w-5 h-5 text-accent" />
                </div>
                <h4 className="font-semibold">Solo Adventure</h4>
              </div>
              <p className="text-sm text-foreground-secondary">
                Just you and the AI DM. Explore dungeons, fight monsters, and forge your own story.
              </p>
            </Card>

            <Card className="p-4 hover:border-accent/50 transition-colors cursor-pointer">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-full bg-info/20 flex items-center justify-center">
                  <Users className="w-5 h-5 text-info" />
                </div>
                <h4 className="font-semibold">Multiplayer</h4>
              </div>
              <p className="text-sm text-foreground-secondary">
                Play with friends. The AI DM handles everything while you focus on the adventure.
              </p>
              <Badge variant="secondary" className="mt-2">Coming Soon</Badge>
            </Card>

            <Card className="p-4 hover:border-accent/50 transition-colors cursor-pointer">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-full bg-warning/20 flex items-center justify-center">
                  <Swords className="w-5 h-5 text-warning" />
                </div>
                <h4 className="font-semibold">One-Shot</h4>
              </div>
              <p className="text-sm text-foreground-secondary">
                Pre-made adventures for quick play. Perfect for learning or limited time.
              </p>
              <Badge variant="secondary" className="mt-2">Coming Soon</Badge>
            </Card>
          </div>
        </div>

        {/* Recent Campaigns */}
        {campaigns.length > 0 && (
          <div>
            <h3 className="text-lg font-semibold mb-4">Continue a Campaign</h3>
            <div className="space-y-3">
              {campaigns.slice(0, 3).map((campaign) => (
                <Card
                  key={campaign.id}
                  className="p-4 hover:border-accent/50 transition-colors cursor-pointer"
                  onClick={() => handleJoinCampaign(campaign.id)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-lg bg-background-tertiary flex items-center justify-center">
                        <BookOpen className="w-6 h-6" />
                      </div>
                      <div>
                        <h4 className="font-semibold">{campaign.name}</h4>
                        <p className="text-sm text-foreground-secondary line-clamp-1">
                          {campaign.description || 'No description'}
                        </p>
                        {campaign.lastPlayed && (
                          <div className="flex items-center gap-1 text-xs text-foreground-tertiary mt-1">
                            <Clock className="w-3 h-3" />
                            Last played {new Date(campaign.lastPlayed).toLocaleDateString()}
                          </div>
                        )}
                      </div>
                    </div>
                    <ChevronRight className="w-5 h-5 text-foreground-tertiary" />
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* How it Works */}
        <Card className="p-6 bg-background-secondary">
          <h3 className="text-lg font-semibold mb-4">How AI Dungeon Master Works</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="w-12 h-12 rounded-full bg-accent/20 flex items-center justify-center mx-auto mb-3">
                <span className="text-xl font-bold text-accent">1</span>
              </div>
              <h4 className="font-medium mb-1">Describe Your Actions</h4>
              <p className="text-sm text-foreground-secondary">
                Type or speak what your character wants to do. Be creative!
              </p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 rounded-full bg-accent/20 flex items-center justify-center mx-auto mb-3">
                <span className="text-xl font-bold text-accent">2</span>
              </div>
              <h4 className="font-medium mb-1">AI Responds</h4>
              <p className="text-sm text-foreground-secondary">
                The AI DM narrates outcomes, controls NPCs, and manages the world.
              </p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 rounded-full bg-accent/20 flex items-center justify-center mx-auto mb-3">
                <span className="text-xl font-bold text-accent">3</span>
              </div>
              <h4 className="font-medium mb-1">Roll When Needed</h4>
              <p className="text-sm text-foreground-secondary">
                The AI calls for dice rolls automatically when outcomes are uncertain.
              </p>
            </div>
          </div>
        </Card>
      </div>
    </AppLayout>
  );
}
