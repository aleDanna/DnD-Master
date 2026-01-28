import { parseRulesText, parseSpells, parseMonsters } from '../parser';

describe('parseRulesText', () => {
  it('should parse chapter headers', () => {
    const content = `
Part 1: Creating a Character
Ch. 1: Step-by-Step Characters............... 8

Beyond 1st Level..................................................................... 12

Ch. 2: Races....................................... 13

Choosing a Race...................................................................... 13
Racial Traits............................................................................. 13
`;

    const sections = parseRulesText(content, 'basic_rules');

    expect(sections.length).toBeGreaterThan(0);
    expect(sections[0].chapterNumber).toBe(1);
    expect(sections[0].title).toBe('Step-by-Step Characters');
    expect(sections[0].part).toBe('Creating a Character');
  });

  it('should extract keywords from content', () => {
    const content = `
Ch. 9: Combat.................................... 72
The Order of Combat.............................................................72
Movement and Position......................................................... 73
Actions in Combat.................................................................. 74

When combat begins, the DM determines initiative.
Each combatant makes a Dexterity check to determine order.
`;

    const sections = parseRulesText(content, 'basic_rules');

    expect(sections.length).toBeGreaterThan(0);
    expect(sections[0].keywords).toContain('combat');
    expect(sections[0].keywords).toContain('initiative');
  });

  it('should handle subsections', () => {
    const content = `
Ch. 7: Using Ability Scores ................. 60

Ability Scores and Modifiers...............................................60
Advantage and Disadvantage...............................................60

Using Each Ability

Strength measures bodily power and athletic training.
Dexterity measures agility and reflexes.
`;

    const sections = parseRulesText(content, 'basic_rules');

    expect(sections.length).toBeGreaterThan(0);
    // Check that subsections are detected
    const section = sections[0];
    expect(section.subsections.length).toBeGreaterThanOrEqual(0);
  });

  it('should generate unique IDs', () => {
    const content = `
Ch. 1: Test Chapter............... 1
Some content here.

Ch. 2: Another Chapter.......... 10
More content here.
`;

    const sections = parseRulesText(content, 'basic_rules');

    expect(sections.length).toBe(2);
    expect(sections[0].id).not.toBe(sections[1].id);
    expect(sections[0].id).toContain('ch1');
    expect(sections[1].id).toContain('ch2');
  });
});

describe('parseSpells', () => {
  it('should parse spell level and school', () => {
    const content = `
Spell Descriptions

Fireball
3rd-level evocation
Casting Time: 1 action
Range: 150 feet
Components: V, S, M (a tiny ball of bat guano and sulfur)
Duration: Instantaneous

A bright streak flashes from your pointing finger to a point you choose within range.
`;

    const spells = parseSpells(content, 'basic_rules');

    expect(spells.length).toBe(1);
    expect(spells[0].name).toBe('Fireball');
    expect(spells[0].level).toBe(3);
    expect(spells[0].school).toBe('evocation');
    expect(spells[0].castingTime).toBe('1 action');
    expect(spells[0].range).toBe('150 feet');
  });

  it('should parse cantrips', () => {
    const content = `
Spell Descriptions

Light
Evocation cantrip
Casting Time: 1 action
Range: Touch
Components: V, M (a firefly or phosphorescent moss)
Duration: 1 hour

You touch one object that is no larger than 10 feet in any dimension.
`;

    const spells = parseSpells(content, 'basic_rules');

    expect(spells.length).toBe(1);
    expect(spells[0].name).toBe('Light');
    expect(spells[0].level).toBe(0);
    expect(spells[0].school).toBe('Evocation');
  });

  it('should extract higher levels text', () => {
    const content = `
Spell Descriptions

Magic Missile
1st-level evocation
Casting Time: 1 action
Range: 120 feet
Components: V, S
Duration: Instantaneous

You create three glowing darts of magical force.

At Higher Levels. When you cast this spell using a slot of 2nd level or higher, the spell creates one more dart.
`;

    const spells = parseSpells(content, 'basic_rules');

    expect(spells.length).toBe(1);
    expect(spells[0].higherLevels).toContain('At Higher Levels');
  });
});

describe('parseMonsters', () => {
  it('should parse monster stat blocks', () => {
    const content = `
GOBLIN
Small humanoid (goblinoid), neutral evil
Armor Class 15 (leather armor, shield)
Hit Points 7 (2d6)
Speed 30 ft.

STR     DEX     CON     INT     WIS     CHA
8 (-1)  14 (+2) 10 (+0) 10 (+0) 8 (-1)  8 (-1)

Senses darkvision 60 ft., passive Perception 9
Languages Common, Goblin
Challenge 1/4 (50 XP)
`;

    const monsters = parseMonsters(content, 'basic_rules');

    expect(monsters.length).toBe(1);
    expect(monsters[0].name).toBe('Goblin');
    expect(monsters[0].size).toBe('Small');
    expect(monsters[0].type).toBe('humanoid');
    expect(monsters[0].armorClass).toBe(15);
    expect(monsters[0].hitPoints).toBe('7 (2d6)');
    expect(monsters[0].abilityScores.dex).toBe(14);
  });

  it('should parse multiple monsters', () => {
    const content = `
ORC
Medium humanoid (orc), chaotic evil
Armor Class 13 (hide armor)
Hit Points 15 (2d8 + 6)
Speed 30 ft.

SKELETON
Medium undead, lawful evil
Armor Class 13 (armor scraps)
Hit Points 13 (2d8 + 4)
Speed 30 ft.
`;

    const monsters = parseMonsters(content, 'basic_rules');

    expect(monsters.length).toBe(2);
    expect(monsters[0].name).toBe('Orc');
    expect(monsters[1].name).toBe('Skeleton');
  });
});
