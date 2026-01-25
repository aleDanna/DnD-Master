'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  Plus,
  Search,
  Filter,
  Grid,
  List,
  MoreVertical,
  Heart,
  Shield,
  Zap,
  Edit,
  Trash2,
  Copy,
} from 'lucide-react';
import { AppLayout } from '@/components/layout';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { cn } from '@/lib/utils';

// Mock data
const characters = [
  {
    id: '1',
    name: 'Thorin Ironforge',
    race: 'Mountain Dwarf',
    class: 'Fighter',
    subclass: 'Champion',
    level: 5,
    hp: { current: 45, max: 52 },
    ac: 18,
    campaign: 'Lost Mines of Phandelver',
    status: 'active',
    portrait: null,
  },
  {
    id: '2',
    name: 'Elara Moonwhisper',
    race: 'High Elf',
    class: 'Wizard',
    subclass: 'Evocation',
    level: 5,
    hp: { current: 28, max: 28 },
    ac: 13,
    campaign: 'Lost Mines of Phandelver',
    status: 'active',
    portrait: null,
  },
  {
    id: '3',
    name: 'Grok the Mighty',
    race: 'Half-Orc',
    class: 'Barbarian',
    subclass: 'Berserker',
    level: 4,
    hp: { current: 52, max: 52 },
    ac: 14,
    campaign: 'Curse of Strahd',
    status: 'active',
    portrait: null,
  },
  {
    id: '4',
    name: 'Luna Silverstream',
    race: 'Tiefling',
    class: 'Warlock',
    subclass: 'Fiend',
    level: 4,
    hp: { current: 30, max: 32 },
    ac: 12,
    campaign: 'Lost Mines of Phandelver',
    status: 'active',
    portrait: null,
  },
  {
    id: '5',
    name: 'Brother Marcus',
    race: 'Human',
    class: 'Cleric',
    subclass: 'Life',
    level: 3,
    hp: { current: 24, max: 24 },
    ac: 16,
    campaign: null,
    status: 'inactive',
    portrait: null,
  },
];

const classColors: Record<string, string> = {
  Fighter: 'bg-red-500/10 text-red-400',
  Wizard: 'bg-blue-500/10 text-blue-400',
  Barbarian: 'bg-orange-500/10 text-orange-400',
  Warlock: 'bg-purple-500/10 text-purple-400',
  Cleric: 'bg-yellow-500/10 text-yellow-400',
  Rogue: 'bg-gray-500/10 text-gray-400',
  Paladin: 'bg-amber-500/10 text-amber-400',
  Ranger: 'bg-green-500/10 text-green-400',
  Bard: 'bg-pink-500/10 text-pink-400',
  Druid: 'bg-emerald-500/10 text-emerald-400',
  Monk: 'bg-cyan-500/10 text-cyan-400',
  Sorcerer: 'bg-indigo-500/10 text-indigo-400',
};

export default function CharactersPage() {
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);

  const filteredCharacters = characters.filter(
    (char) =>
      char.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      char.class.toLowerCase().includes(searchQuery.toLowerCase()) ||
      char.race.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <AppLayout
      title="Characters"
      subtitle={`${characters.length} characters`}
      actions={
        <Link href="/characters/new">
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            New Character
          </Button>
        </Link>
      }
    >
      <div className="p-6">
        {/* Toolbar */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3 flex-1">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-foreground-tertiary" />
              <Input
                placeholder="Search characters..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button variant="outline" size="sm">
              <Filter className="w-4 h-4 mr-2" />
              Filters
            </Button>
          </div>
          <div className="flex items-center gap-1 bg-background-secondary rounded-lg p-1">
            <button
              onClick={() => setViewMode('grid')}
              className={cn(
                'p-2 rounded-md transition-colors',
                viewMode === 'grid'
                  ? 'bg-background text-foreground'
                  : 'text-foreground-secondary hover:text-foreground'
              )}
            >
              <Grid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={cn(
                'p-2 rounded-md transition-colors',
                viewMode === 'list'
                  ? 'bg-background text-foreground'
                  : 'text-foreground-secondary hover:text-foreground'
              )}
            >
              <List className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Characters Grid/List */}
        {viewMode === 'grid' ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredCharacters.map((character) => (
              <Card key={character.id} className="relative group">
                <Link href={`/characters/${character.id}`}>
                  <div className="p-4">
                    {/* Portrait/Avatar */}
                    <div className="relative mb-4">
                      <div className="w-full aspect-square rounded-lg bg-background-secondary flex items-center justify-center">
                        <span className="text-4xl font-bold text-foreground-tertiary">
                          {character.name[0]}
                        </span>
                      </div>
                      <div className="absolute bottom-2 right-2 px-2 py-1 rounded-full bg-background/80 backdrop-blur-sm text-xs font-medium">
                        Lvl {character.level}
                      </div>
                    </div>

                    {/* Info */}
                    <h3 className="font-semibold mb-1">{character.name}</h3>
                    <p className="text-sm text-foreground-secondary mb-3">
                      {character.race}
                    </p>

                    {/* Class Badge */}
                    <div className="flex items-center gap-2 mb-3">
                      <span
                        className={cn(
                          'px-2 py-1 rounded-full text-xs font-medium',
                          classColors[character.class] || 'bg-accent/10 text-accent'
                        )}
                      >
                        {character.class}
                        {character.subclass && ` (${character.subclass})`}
                      </span>
                    </div>

                    {/* Stats */}
                    <div className="flex items-center gap-4 text-sm">
                      <div className="flex items-center gap-1">
                        <Heart className="w-4 h-4 text-error" />
                        <span>
                          {character.hp.current}/{character.hp.max}
                        </span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Shield className="w-4 h-4 text-info" />
                        <span>{character.ac}</span>
                      </div>
                    </div>

                    {/* Campaign */}
                    {character.campaign && (
                      <p className="text-xs text-foreground-tertiary mt-3 truncate">
                        {character.campaign}
                      </p>
                    )}
                  </div>
                </Link>

                {/* Menu Button */}
                <div className="absolute top-3 right-3">
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      setOpenMenuId(openMenuId === character.id ? null : character.id);
                    }}
                    className="p-1.5 rounded-md hover:bg-background-secondary opacity-0 group-hover:opacity-100 transition-all"
                  >
                    <MoreVertical className="w-4 h-4" />
                  </button>
                  {openMenuId === character.id && (
                    <>
                      <div
                        className="fixed inset-0 z-10"
                        onClick={() => setOpenMenuId(null)}
                      />
                      <div className="absolute right-0 mt-1 w-40 bg-background border border-border rounded-lg shadow-lg z-20">
                        <div className="p-1">
                          <Link
                            href={`/characters/${character.id}/edit`}
                            className="flex items-center gap-2 px-3 py-2 text-sm rounded-md hover:bg-background-secondary"
                          >
                            <Edit className="w-4 h-4" />
                            Edit
                          </Link>
                          <button className="flex items-center gap-2 px-3 py-2 text-sm rounded-md hover:bg-background-secondary w-full text-left">
                            <Copy className="w-4 h-4" />
                            Duplicate
                          </button>
                          <button className="flex items-center gap-2 px-3 py-2 text-sm rounded-md hover:bg-background-secondary w-full text-left text-error">
                            <Trash2 className="w-4 h-4" />
                            Delete
                          </button>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </Card>
            ))}

            {/* New Character Card */}
            <Link href="/characters/new">
              <Card className="h-full min-h-[300px] flex flex-col items-center justify-center gap-3 border-dashed hover:border-accent/50 hover:bg-background-secondary transition-all cursor-pointer">
                <div className="w-12 h-12 rounded-full bg-background-secondary flex items-center justify-center">
                  <Plus className="w-6 h-6 text-foreground-secondary" />
                </div>
                <span className="text-foreground-secondary">Create Character</span>
              </Card>
            </Link>
          </div>
        ) : (
          <Card>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left p-4 text-sm font-medium text-foreground-secondary">
                      Character
                    </th>
                    <th className="text-left p-4 text-sm font-medium text-foreground-secondary">
                      Class
                    </th>
                    <th className="text-left p-4 text-sm font-medium text-foreground-secondary">
                      Level
                    </th>
                    <th className="text-left p-4 text-sm font-medium text-foreground-secondary">
                      HP
                    </th>
                    <th className="text-left p-4 text-sm font-medium text-foreground-secondary">
                      AC
                    </th>
                    <th className="text-left p-4 text-sm font-medium text-foreground-secondary">
                      Campaign
                    </th>
                    <th className="text-right p-4 text-sm font-medium text-foreground-secondary">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredCharacters.map((character) => (
                    <tr
                      key={character.id}
                      className="border-b border-border last:border-0 hover:bg-background-secondary transition-colors"
                    >
                      <td className="p-4">
                        <Link
                          href={`/characters/${character.id}`}
                          className="flex items-center gap-3"
                        >
                          <div className="w-10 h-10 rounded-lg bg-background-tertiary flex items-center justify-center">
                            <span className="font-medium">{character.name[0]}</span>
                          </div>
                          <div>
                            <p className="font-medium">{character.name}</p>
                            <p className="text-sm text-foreground-secondary">
                              {character.race}
                            </p>
                          </div>
                        </Link>
                      </td>
                      <td className="p-4">
                        <span
                          className={cn(
                            'px-2 py-1 rounded-full text-xs font-medium',
                            classColors[character.class] || 'bg-accent/10 text-accent'
                          )}
                        >
                          {character.class}
                        </span>
                      </td>
                      <td className="p-4">{character.level}</td>
                      <td className="p-4">
                        <div className="flex items-center gap-1">
                          <Heart className="w-4 h-4 text-error" />
                          {character.hp.current}/{character.hp.max}
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-1">
                          <Shield className="w-4 h-4 text-info" />
                          {character.ac}
                        </div>
                      </td>
                      <td className="p-4 text-foreground-secondary">
                        {character.campaign || '—'}
                      </td>
                      <td className="p-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Link href={`/characters/${character.id}/edit`}>
                            <Button variant="ghost" size="sm">
                              <Edit className="w-4 h-4" />
                            </Button>
                          </Link>
                          <Button variant="ghost" size="sm">
                            <Trash2 className="w-4 h-4 text-error" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        )}
      </div>
    </AppLayout>
  );
}
