-- =============================================================================
-- D&D Master - Content Seed Data
-- =============================================================================
-- Version: 2.0
-- Purpose: Populate D&D 5th Edition content for AI Dungeon Master
--
-- IMPORTANT: Run init.sql FIRST to create the database schema.
-- This file contains only INSERT statements for populating content data.
--
-- Content includes:
-- - Abilities (6 core ability scores)
-- - Skills (18 skills linked to abilities)
-- - Conditions (15 status effects)
-- - Documents (source book references)
-- - Rule Categories and Rules
-- - Classes and Subclasses
-- - Class Features
-- - Races and Subraces
-- - Spells (cantrips through 9th level)
-- - Class-Spell relationships
-- - Monsters
-- - Items (weapons, armor, adventuring gear)
-- - Feats
-- - Backgrounds
-- =============================================================================


-- ---------------------------------------------------------------------------
-- 6.1 Abilities
-- ---------------------------------------------------------------------------

INSERT INTO abilities (name, abbreviation, description, slug) VALUES
('Strength', 'STR', 'Measures physical power, athletic training, and the extent to which you can exert raw physical force.', 'strength'),
('Dexterity', 'DEX', 'Measures agility, reflexes, balance, and coordination.', 'dexterity'),
('Constitution', 'CON', 'Measures health, stamina, and vital force.', 'constitution'),
('Intelligence', 'INT', 'Measures mental acuity, accuracy of recall, and the ability to reason.', 'intelligence'),
('Wisdom', 'WIS', 'Measures perception, intuition, and insight.', 'wisdom'),
('Charisma', 'CHA', 'Measures force of personality, persuasiveness, and leadership.', 'charisma');

-- ---------------------------------------------------------------------------
-- 6.2 Skills
-- ---------------------------------------------------------------------------

INSERT INTO skills (name, ability_id, description, slug)
SELECT 'Acrobatics', id, 'Your Dexterity (Acrobatics) check covers your attempt to stay on your feet in a tricky situation, such as when you''re trying to run across a sheet of ice, balance on a tightrope, or stay upright on a rocking ship''s deck.', 'acrobatics'
FROM abilities WHERE abbreviation = 'DEX';

INSERT INTO skills (name, ability_id, description, slug)
SELECT 'Animal Handling', id, 'When there is any question whether you can calm down a domesticated animal, keep a mount from getting spooked, or intuit an animal''s intentions, the DM might call for a Wisdom (Animal Handling) check.', 'animal-handling'
FROM abilities WHERE abbreviation = 'WIS';

INSERT INTO skills (name, ability_id, description, slug)
SELECT 'Arcana', id, 'Your Intelligence (Arcana) check measures your ability to recall lore about spells, magic items, eldritch symbols, magical traditions, the planes of existence, and the inhabitants of those planes.', 'arcana'
FROM abilities WHERE abbreviation = 'INT';

INSERT INTO skills (name, ability_id, description, slug)
SELECT 'Athletics', id, 'Your Strength (Athletics) check covers difficult situations you encounter while climbing, jumping, or swimming.', 'athletics'
FROM abilities WHERE abbreviation = 'STR';

INSERT INTO skills (name, ability_id, description, slug)
SELECT 'Deception', id, 'Your Charisma (Deception) check determines whether you can convincingly hide the truth, either verbally or through your actions.', 'deception'
FROM abilities WHERE abbreviation = 'CHA';

INSERT INTO skills (name, ability_id, description, slug)
SELECT 'History', id, 'Your Intelligence (History) check measures your ability to recall lore about historical events, legendary people, ancient kingdoms, past disputes, recent wars, and lost civilizations.', 'history'
FROM abilities WHERE abbreviation = 'INT';

INSERT INTO skills (name, ability_id, description, slug)
SELECT 'Insight', id, 'Your Wisdom (Insight) check decides whether you can determine the true intentions of a creature, such as when searching out a lie or predicting someone''s next move.', 'insight'
FROM abilities WHERE abbreviation = 'WIS';

INSERT INTO skills (name, ability_id, description, slug)
SELECT 'Intimidation', id, 'When you attempt to influence someone through overt threats, hostile actions, and physical violence, the DM might ask you to make a Charisma (Intimidation) check.', 'intimidation'
FROM abilities WHERE abbreviation = 'CHA';

INSERT INTO skills (name, ability_id, description, slug)
SELECT 'Investigation', id, 'When you look around for clues and make deductions based on those clues, you make an Intelligence (Investigation) check.', 'investigation'
FROM abilities WHERE abbreviation = 'INT';

INSERT INTO skills (name, ability_id, description, slug)
SELECT 'Medicine', id, 'A Wisdom (Medicine) check lets you try to stabilize a dying companion or diagnose an illness.', 'medicine'
FROM abilities WHERE abbreviation = 'WIS';

INSERT INTO skills (name, ability_id, description, slug)
SELECT 'Nature', id, 'Your Intelligence (Nature) check measures your ability to recall lore about terrain, plants and animals, the weather, and natural cycles.', 'nature'
FROM abilities WHERE abbreviation = 'INT';

INSERT INTO skills (name, ability_id, description, slug)
SELECT 'Perception', id, 'Your Wisdom (Perception) check lets you spot, hear, or otherwise detect the presence of something. It measures your general awareness of your surroundings and the keenness of your senses.', 'perception'
FROM abilities WHERE abbreviation = 'WIS';

INSERT INTO skills (name, ability_id, description, slug)
SELECT 'Performance', id, 'Your Charisma (Performance) check determines how well you can delight an audience with music, dance, acting, storytelling, or some other form of entertainment.', 'performance'
FROM abilities WHERE abbreviation = 'CHA';

INSERT INTO skills (name, ability_id, description, slug)
SELECT 'Persuasion', id, 'When you attempt to influence someone or a group of people with tact, social graces, or good nature, the DM might ask you to make a Charisma (Persuasion) check.', 'persuasion'
FROM abilities WHERE abbreviation = 'CHA';

INSERT INTO skills (name, ability_id, description, slug)
SELECT 'Religion', id, 'Your Intelligence (Religion) check measures your ability to recall lore about deities, rites and prayers, religious hierarchies, holy symbols, and the practices of secret cults.', 'religion'
FROM abilities WHERE abbreviation = 'INT';

INSERT INTO skills (name, ability_id, description, slug)
SELECT 'Sleight of Hand', id, 'Whenever you attempt an act of legerdemain or manual trickery, such as planting something on someone else or concealing an object on your person, make a Dexterity (Sleight of Hand) check.', 'sleight-of-hand'
FROM abilities WHERE abbreviation = 'DEX';

INSERT INTO skills (name, ability_id, description, slug)
SELECT 'Stealth', id, 'Make a Dexterity (Stealth) check when you attempt to conceal yourself from enemies, slink past guards, slip away without being noticed, or sneak up on someone without being seen or heard.', 'stealth'
FROM abilities WHERE abbreviation = 'DEX';

INSERT INTO skills (name, ability_id, description, slug)
SELECT 'Survival', id, 'The DM might ask you to make a Wisdom (Survival) check to follow tracks, hunt wild game, guide your group through frozen wastelands, identify signs that owlbears live nearby, predict the weather, or avoid quicksand.', 'survival'
FROM abilities WHERE abbreviation = 'WIS';

-- ---------------------------------------------------------------------------
-- 6.3 Conditions
-- ---------------------------------------------------------------------------

INSERT INTO conditions (name, description, slug, source_document, source_page) VALUES
('Blinded', 'A blinded creature can''t see and automatically fails any ability check that requires sight.
The creature''s attack rolls have disadvantage, and attack rolls against the creature have advantage.', 'blinded', 'rules.txt', 290),

('Charmed', 'A charmed creature can''t attack the charmer or target the charmer with harmful abilities or magical effects.
The charmer has advantage on any ability check to interact socially with the creature.', 'charmed', 'rules.txt', 290),

('Deafened', 'A deafened creature can''t hear and automatically fails any ability check that requires hearing.', 'deafened', 'rules.txt', 290),

('Exhaustion', 'Some special abilities and environmental hazards, such as starvation and the long-term effects of freezing or scorching temperatures, can lead to a special condition called exhaustion. Exhaustion is measured in six levels.

Level 1: Disadvantage on ability checks
Level 2: Speed halved
Level 3: Disadvantage on attack rolls and saving throws
Level 4: Hit point maximum halved
Level 5: Speed reduced to 0
Level 6: Death

If an already exhausted creature suffers another effect that causes exhaustion, its current level of exhaustion increases by the amount specified in the effect''s description.

A creature suffers the effect of its current level of exhaustion as well as all lower levels.

An effect that removes exhaustion reduces its level as specified in the effect''s description, with all exhaustion effects ending if a creature''s exhaustion level is reduced below 1.

Finishing a long rest reduces a creature''s exhaustion level by 1, provided that the creature has also ingested some food and drink.', 'exhaustion', 'rules.txt', 291),

('Frightened', 'A frightened creature has disadvantage on ability checks and attack rolls while the source of its fear is within line of sight.
The creature can''t willingly move closer to the source of its fear.', 'frightened', 'rules.txt', 290),

('Grappled', 'A grappled creature''s speed becomes 0, and it can''t benefit from any bonus to its speed.
The condition ends if the grappler is incapacitated.
The condition also ends if an effect removes the grappled creature from the reach of the grappler or grappling effect, such as when a creature is hurled away by the thunderwave spell.', 'grappled', 'rules.txt', 290),

('Incapacitated', 'An incapacitated creature can''t take actions or reactions.', 'incapacitated', 'rules.txt', 290),

('Invisible', 'An invisible creature is impossible to see without the aid of magic or a special sense. For the purpose of hiding, the creature is heavily obscured. The creature''s location can be detected by any noise it makes or any tracks it leaves.
Attack rolls against the creature have disadvantage, and the creature''s attack rolls have advantage.', 'invisible', 'rules.txt', 291),

('Paralyzed', 'A paralyzed creature is incapacitated and can''t move or speak.
The creature automatically fails Strength and Dexterity saving throws.
Attack rolls against the creature have advantage.
Any attack that hits the creature is a critical hit if the attacker is within 5 feet of the creature.', 'paralyzed', 'rules.txt', 291),

('Petrified', 'A petrified creature is transformed, along with any nonmagical object it is wearing or carrying, into a solid inanimate substance (usually stone). Its weight increases by a factor of ten, and it ceases aging.
The creature is incapacitated, can''t move or speak, and is unaware of its surroundings.
Attack rolls against the creature have advantage.
The creature automatically fails Strength and Dexterity saving throws.
The creature has resistance to all damage.
The creature is immune to poison and disease, although a poison or disease already in its system is suspended, not neutralized.', 'petrified', 'rules.txt', 291),

('Poisoned', 'A poisoned creature has disadvantage on attack rolls and ability checks.', 'poisoned', 'rules.txt', 292),

('Prone', 'A prone creature''s only movement option is to crawl, unless it stands up and thereby ends the condition.
The creature has disadvantage on attack rolls.
An attack roll against the creature has advantage if the attacker is within 5 feet of the creature. Otherwise, the attack roll has disadvantage.', 'prone', 'rules.txt', 292),

('Restrained', 'A restrained creature''s speed becomes 0, and it can''t benefit from any bonus to its speed.
Attack rolls against the creature have advantage, and the creature''s attack rolls have disadvantage.
The creature has disadvantage on Dexterity saving throws.', 'restrained', 'rules.txt', 292),

('Stunned', 'A stunned creature is incapacitated, can''t move, and can speak only falteringly.
The creature automatically fails Strength and Dexterity saving throws.
Attack rolls against the creature have advantage.', 'stunned', 'rules.txt', 292),

('Unconscious', 'An unconscious creature is incapacitated, can''t move or speak, and is unaware of its surroundings.
The creature drops whatever it''s holding and falls prone.
The creature automatically fails Strength and Dexterity saving throws.
Attack rolls against the creature have advantage.
Any attack that hits the creature is a critical hit if the attacker is within 5 feet of the creature.', 'unconscious', 'rules.txt', 292);

-- ---------------------------------------------------------------------------
-- 6.4 Documents
-- ---------------------------------------------------------------------------

INSERT INTO documents (filename, doc_type, title, description, version, publication_date) VALUES
('rules.txt', 'rules', 'D&D Basic Rules', 'The Basic Rules for Dungeons & Dragons is a free PDF that covers the core of the tabletop game. It includes information on the four main classes (Cleric, Fighter, Rogue, Wizard), the four most common races (Dwarf, Elf, Halfling, Human), and the equipment, spells, and monsters needed to run a game.', 'v1.0', '2018-11-01'),
('handbook.txt', 'handbook', 'Player''s Handbook', 'The Player''s Handbook is the essential reference for every Dungeons & Dragons roleplayer. It contains rules for character creation and advancement, backgrounds and skills, exploration and combat, equipment, spells, and much more.', '5th Edition', '2014-08-19');

-- =============================================================================
-- SECTION 7: Rules Content
-- =============================================================================

-- ---------------------------------------------------------------------------
-- 7.1 Rule Categories
-- ---------------------------------------------------------------------------

INSERT INTO rule_categories (name, slug, description, parent_id, sort_order) VALUES
('Using Ability Scores', 'using-ability-scores', 'Rules for ability checks, skills, saving throws, and contests', NULL, 1),
('Adventuring', 'adventuring', 'Rules for travel, exploration, and the environment', NULL, 2),
('Combat', 'combat', 'Rules for combat encounters, actions, and damage', NULL, 3),
('Spellcasting', 'spellcasting', 'Rules for casting spells and magical effects', NULL, 4);

-- Sub-categories for Ability Scores
INSERT INTO rule_categories (name, slug, description, parent_id, sort_order)
SELECT 'Ability Checks', 'ability-checks', 'Rules for making ability checks and determining difficulty', id, 1
FROM rule_categories WHERE slug = 'using-ability-scores';

INSERT INTO rule_categories (name, slug, description, parent_id, sort_order)
SELECT 'Skills', 'skills', 'Using skill proficiencies with ability checks', id, 2
FROM rule_categories WHERE slug = 'using-ability-scores';

INSERT INTO rule_categories (name, slug, description, parent_id, sort_order)
SELECT 'Saving Throws', 'saving-throws', 'Resisting spells, traps, and harmful effects', id, 3
FROM rule_categories WHERE slug = 'using-ability-scores';

-- Sub-categories for Adventuring
INSERT INTO rule_categories (name, slug, description, parent_id, sort_order)
SELECT 'Movement', 'movement', 'Rules for travel pace, climbing, swimming, and jumping', id, 1
FROM rule_categories WHERE slug = 'adventuring';

INSERT INTO rule_categories (name, slug, description, parent_id, sort_order)
SELECT 'Environment', 'environment', 'Rules for vision, light, hazards, and survival', id, 2
FROM rule_categories WHERE slug = 'adventuring';

INSERT INTO rule_categories (name, slug, description, parent_id, sort_order)
SELECT 'Resting', 'resting', 'Rules for short and long rests', id, 3
FROM rule_categories WHERE slug = 'adventuring';

-- Sub-categories for Combat
INSERT INTO rule_categories (name, slug, description, parent_id, sort_order)
SELECT 'Actions in Combat', 'actions-in-combat', 'Standard actions available during combat', id, 1
FROM rule_categories WHERE slug = 'combat';

INSERT INTO rule_categories (name, slug, description, parent_id, sort_order)
SELECT 'Making an Attack', 'making-an-attack', 'Rules for attack rolls, modifiers, and critical hits', id, 2
FROM rule_categories WHERE slug = 'combat';

INSERT INTO rule_categories (name, slug, description, parent_id, sort_order)
SELECT 'Cover', 'cover', 'Rules for half, three-quarters, and total cover', id, 3
FROM rule_categories WHERE slug = 'combat';

INSERT INTO rule_categories (name, slug, description, parent_id, sort_order)
SELECT 'Damage and Healing', 'damage-and-healing', 'Rules for damage types, hit points, and healing', id, 4
FROM rule_categories WHERE slug = 'combat';

-- ---------------------------------------------------------------------------
-- 7.2 Rules
-- ---------------------------------------------------------------------------

-- Ability Check Rules
INSERT INTO rules (category_id, title, slug, content, summary, keywords, source_document, source_chapter, source_page)
SELECT id, 'Ability Checks', 'ability-checks',
'An ability check tests a character''s or monster''s innate talent and training in an effort to overcome a challenge. The DM calls for an ability check when a character or monster attempts an action (other than an attack) that has a chance of failure. When the outcome is uncertain, the dice determine the results.

For every ability check, the DM decides which of the six abilities is relevant to the task at hand and the difficulty of the task, represented by a Difficulty Class. The more difficult a task, the higher its DC.

To make an ability check, roll a d20 and add the relevant ability modifier. As with other d20 rolls, apply bonuses and penalties, and compare the total to the DC. If the total equals or exceeds the DC, the ability check is a success—the creature overcomes the challenge at hand. Otherwise, it''s a failure, which means the character or monster makes no progress toward the objective or makes progress combined with a setback determined by the DM.

Typical Difficulty Classes:
- Very Easy: DC 5
- Easy: DC 10
- Medium: DC 15
- Hard: DC 20
- Very Hard: DC 25
- Nearly Impossible: DC 30',
'Roll d20 + ability modifier vs DC to determine success or failure',
ARRAY['ability check', 'dc', 'difficulty class', 'd20'],
'rules.txt', 'Chapter 7', 60
FROM rule_categories WHERE slug = 'ability-checks';

INSERT INTO rules (category_id, title, slug, content, summary, keywords, source_document, source_chapter, source_page)
SELECT id, 'Passive Checks', 'passive-checks',
'A passive check is a special kind of ability check that doesn''t involve any die rolls. Such a check can represent the average result for a task done repeatedly, such as searching for secret doors over and over again, or can be used when the DM wants to secretly determine whether the characters succeed at something without rolling dice, such as noticing a hidden monster.

Here''s how to determine a character''s total for a passive check:

10 + all modifiers that normally apply to the check

If the character has advantage on the check, add 5. For disadvantage, subtract 5. The game refers to a passive check total as a score.

For example, if a 1st-level character has a Wisdom of 15 and proficiency in Perception, he or she has a passive Wisdom (Perception) score of 14.',
'Passive check = 10 + modifiers; +5 for advantage, -5 for disadvantage',
ARRAY['passive check', 'perception', 'passive perception'],
'rules.txt', 'Chapter 7', 62
FROM rule_categories WHERE slug = 'ability-checks';

-- Saving Throw Rules
INSERT INTO rules (category_id, title, slug, content, summary, keywords, source_document, source_chapter, source_page)
SELECT id, 'Saving Throws', 'saving-throws-rule',
'A saving throw—also called a save—represents an attempt to resist a spell, a trap, a poison, a disease, or a similar threat. You don''t normally decide to make a saving throw; you are forced to make one because your character or monster is at risk of harm.

To make a saving throw, roll a d20 and add the appropriate ability modifier. For example, you use your Dexterity modifier for a Dexterity saving throw.

A saving throw can be modified by a situational bonus or penalty and can be affected by advantage and disadvantage, as determined by the DM.

Each class gives proficiency in at least two saving throws. The wizard, for example, is proficient in Intelligence saves. As with skill proficiencies, proficiency in a saving throw lets a character add his or her proficiency bonus to saving throws made using a particular ability score. Some monsters have saving throw proficiencies as well.

The Difficulty Class for a saving throw is determined by the effect that causes it. For example, the DC for a saving throw allowed by a spell is determined by the caster''s spellcasting ability and proficiency bonus.',
'Roll d20 + ability modifier to resist harmful effects',
ARRAY['saving throw', 'save', 'dc'],
'rules.txt', 'Chapter 7', 63
FROM rule_categories WHERE slug = 'saving-throws';

-- Combat Rules
INSERT INTO rules (category_id, title, slug, content, summary, keywords, source_document, source_chapter, source_page)
SELECT id, 'Attack Rolls', 'attack-rolls',
'When you make an attack, your attack roll determines whether the attack hits or misses. To make an attack roll, roll a d20 and add the appropriate modifiers. If the total of the roll plus modifiers equals or exceeds the target''s Armor Class (AC), the attack hits.

Modifiers to the Roll:
When a character makes an attack roll, the two most common modifiers to the roll are an ability modifier and the character''s proficiency bonus. When a monster makes an attack roll, it uses whatever modifier is provided in its stat block.

Ability Modifier: The ability modifier used for a melee weapon attack is Strength, and the ability modifier used for a ranged weapon attack is Dexterity. Weapons that have the finesse or thrown property break this rule.

Proficiency Bonus: You add your proficiency bonus to your attack roll when you attack using a weapon with which you have proficiency, as well as when you attack with a spell.

Rolling 1 or 20: If the d20 roll for an attack is a 20, the attack hits regardless of any modifiers or the target''s AC. This is called a critical hit. If the d20 roll for an attack is a 1, the attack misses regardless of any modifiers or the target''s AC.',
'd20 + ability modifier + proficiency bonus vs AC; 20 = critical hit, 1 = automatic miss',
ARRAY['attack roll', 'ac', 'armor class', 'critical hit', 'natural 20'],
'rules.txt', 'Chapter 9', 73
FROM rule_categories WHERE slug = 'making-an-attack';

INSERT INTO rules (category_id, title, slug, content, summary, keywords, source_document, source_chapter, source_page)
SELECT id, 'Opportunity Attacks', 'opportunity-attacks',
'In a fight, everyone is constantly watching for a chance to strike an enemy who is fleeing or passing by. Such a strike is called an opportunity attack.

You can make an opportunity attack when a hostile creature that you can see moves out of your reach. To make the opportunity attack, you use your reaction to make one melee attack against the provoking creature. The attack occurs right before the creature leaves your reach.

You can avoid provoking an opportunity attack by taking the Disengage action. You also don''t provoke an opportunity attack when you teleport or when someone or something moves you without using your movement, action, or reaction. For example, you don''t provoke an opportunity attack if an explosion hurls you out of a foe''s reach or if gravity causes you to fall past an enemy.',
'Use reaction to make melee attack when hostile creature leaves your reach',
ARRAY['opportunity attack', 'reaction', 'disengage'],
'rules.txt', 'Chapter 9', 74
FROM rule_categories WHERE slug = 'actions-in-combat';

INSERT INTO rules (category_id, title, slug, content, summary, keywords, source_document, source_chapter, source_page)
SELECT id, 'Cover', 'cover-rule',
'Walls, trees, creatures, and other obstacles can provide cover during combat, making a target more difficult to harm with an attack. A target can benefit from cover only when an attack or other effect originates on the opposite side of the cover.

There are three degrees of cover:

Half Cover: A target with half cover has a +2 bonus to AC and Dexterity saving throws. A target has half cover if an obstacle blocks at least half of its body. The obstacle might be a low wall, a large piece of furniture, a narrow tree trunk, or a creature, whether that creature is an enemy or a friend.

Three-Quarters Cover: A target with three-quarters cover has a +5 bonus to AC and Dexterity saving throws. A target has three-quarters cover if about three-quarters of it is covered by an obstacle. The obstacle might be a portcullis, an arrow slit, or a thick tree trunk.

Total Cover: A target with total cover can''t be targeted directly by an attack or a spell, although some spells can reach such a target by including it in an area of effect. A target has total cover if it is completely concealed by an obstacle.',
'Half cover: +2 AC/DEX saves; Three-quarters: +5 AC/DEX saves; Total: cannot be targeted',
ARRAY['cover', 'half cover', 'three-quarters cover', 'total cover', 'ac bonus'],
'rules.txt', 'Chapter 9', 75
FROM rule_categories WHERE slug = 'cover';

INSERT INTO rules (category_id, title, slug, content, summary, keywords, source_document, source_chapter, source_page)
SELECT id, 'Damage and Healing', 'damage-and-healing-rule',
'Injury and the risk of death are constant companions of those who explore the worlds of D&D. The thrust of a sword, a well-placed arrow, or a blast of flame from a fireball spell all have the potential to damage, or even kill, the hardiest of creatures.

Hit Points: Hit points represent a combination of physical and mental durability, the will to live, and luck. Creatures with more hit points are more difficult to kill. Those with fewer hit points are more fragile.

A creature''s current hit points (usually just called hit points) can be any number from the creature''s hit point maximum down to 0. This number changes frequently as a creature takes damage or receives healing.

Whenever a creature takes damage, that damage is subtracted from its hit points. The loss of hit points has no effect on a creature''s capabilities until the creature drops to 0 hit points.

Damage Rolls: Each weapon, spell, and harmful monster ability specifies the damage it deals. You roll the damage die or dice, add any modifiers, and apply the damage to your target. Magic weapons, special abilities, and other factors can grant a bonus to damage.

Critical Hits: When you score a critical hit, you get to roll extra dice for the attack''s damage against the target. Roll all of the attack''s damage dice twice and add them together. Then add any relevant modifiers as normal.',
'Hit points represent durability; critical hits roll damage dice twice',
ARRAY['damage', 'hit points', 'hp', 'healing', 'critical hit', 'damage roll'],
'rules.txt', 'Chapter 9', 76
FROM rule_categories WHERE slug = 'damage-and-healing';

-- Movement and Environment Rules
INSERT INTO rules (category_id, title, slug, content, summary, keywords, source_document, source_chapter, source_page)
SELECT id, 'Travel Pace', 'travel-pace',
'While traveling, a group of adventurers can move at a normal, fast, or slow pace. A fast pace makes characters less perceptive, while a slow pace makes it possible to sneak around and to search an area more carefully.

Travel Pace:
- Fast: 400 feet per minute, 4 miles per hour, 30 miles per day. Effect: −5 penalty to passive Wisdom (Perception) scores.
- Normal: 300 feet per minute, 3 miles per hour, 24 miles per day. Effect: —
- Slow: 200 feet per minute, 2 miles per hour, 18 miles per day. Effect: Able to use stealth.

Difficult Terrain: The travel speeds given assume relatively simple terrain: roads, open plains, or clear dungeon corridors. But adventurers often face dense forests, deep swamps, rubble-filled ruins, steep mountains, and ice-covered ground—all considered difficult terrain. You move at half speed in difficult terrain—moving 1 foot in difficult terrain costs 2 feet of speed.',
'Fast: 4 mph, -5 Perception; Normal: 3 mph; Slow: 2 mph, can stealth. Difficult terrain = half speed.',
ARRAY['travel pace', 'movement', 'difficult terrain', 'speed'],
'rules.txt', 'Chapter 8', 66
FROM rule_categories WHERE slug = 'movement';

INSERT INTO rules (category_id, title, slug, content, summary, keywords, source_document, source_chapter, source_page)
SELECT id, 'Jumping', 'jumping',
'Your Strength determines how far you can jump.

Long Jump: When you make a long jump, you cover a number of feet up to your Strength score if you move at least 10 feet on foot immediately before the jump. When you make a standing long jump, you can leap only half that distance. Either way, each foot you clear on the jump costs a foot of movement.

This rule assumes that the height of your jump doesn''t matter, such as a jump across a stream or chasm. At your DM''s option, you must succeed on a DC 10 Strength (Athletics) check to clear a low obstacle (no taller than a quarter of the jump''s distance), such as a hedge or low wall. Otherwise, you hit it.

When you land in difficult terrain, you must succeed on a DC 10 Dexterity (Acrobatics) check to land on your feet. Otherwise, you land prone.

High Jump: When you make a high jump, you leap into the air a number of feet equal to 3 + your Strength modifier if you move at least 10 feet on foot immediately before the jump. When you make a standing high jump, you can jump only half that distance. Either way, each foot you clear on the jump costs a foot of movement.',
'Long jump = Strength score in feet (with 10 ft running start). High jump = 3 + STR modifier feet.',
ARRAY['jumping', 'long jump', 'high jump', 'athletics'],
'rules.txt', 'Chapter 8', 67
FROM rule_categories WHERE slug = 'movement';

INSERT INTO rules (category_id, title, slug, content, summary, keywords, source_document, source_chapter, source_page)
SELECT id, 'Falling', 'falling',
'A fall from a great height is one of the most common hazards facing an adventurer. At the end of a fall, a creature takes 1d6 bludgeoning damage for every 10 feet it fell, to a maximum of 20d6. The creature lands prone, unless it avoids taking damage from the fall.',
'1d6 bludgeoning damage per 10 feet fallen (max 20d6), land prone',
ARRAY['falling', 'fall damage', 'hazard'],
'rules.txt', 'Chapter 8', 69
FROM rule_categories WHERE slug = 'environment';

INSERT INTO rules (category_id, title, slug, content, summary, keywords, source_document, source_chapter, source_page)
SELECT id, 'Vision and Light', 'vision-and-light',
'The most fundamental tasks of adventuring—noticing danger, finding hidden objects, hitting an enemy in combat, and targeting a spell, to name just a few—rely heavily on a character''s ability to see.

Bright Light: Bright light lets most creatures see normally. Even gloomy days provide bright light, as do torches, lanterns, fires, and other sources of illumination within a specific radius.

Dim Light: Dim light, also called shadows, creates a lightly obscured area. An area of dim light is usually a boundary between a source of bright light, such as a torch, and surrounding darkness. The soft light of twilight and dawn also counts as dim light. A particularly brilliant full moon might bathe the land in dim light.

Darkness: Darkness creates a heavily obscured area. Characters face darkness outdoors at night (even most moonlit nights), within the confines of an unlit dungeon or a subterranean vault, or in an area of magical darkness.

A creature in a lightly obscured area has disadvantage on Wisdom (Perception) checks that rely on sight. A heavily obscured area—such as darkness, opaque fog, or dense foliage—blocks vision entirely. A creature effectively suffers from the blinded condition when trying to see something in that area.',
'Bright light = normal vision; Dim light = disadvantage on Perception; Darkness = blinded',
ARRAY['vision', 'light', 'darkness', 'bright light', 'dim light', 'obscured'],
'rules.txt', 'Chapter 8', 68
FROM rule_categories WHERE slug = 'environment';

INSERT INTO rules (category_id, title, slug, content, summary, keywords, source_document, source_chapter, source_page)
SELECT id, 'Resting', 'resting-rule',
'Heroic though they might be, adventurers can''t spend every hour of the day in the thick of exploration, social interaction, and combat. They need rest—time to sleep and eat, tend their wounds, refresh their minds and spirits for spellcasting, and brace themselves for further adventure.

Short Rest: A short rest is a period of downtime, at least 1 hour long, during which a character does nothing more strenuous than eating, drinking, reading, and tending to wounds. A character can spend one or more Hit Dice at the end of a short rest, up to the character''s maximum number of Hit Dice, which is equal to the character''s level. For each Hit Die spent in this way, the player rolls the die and adds the character''s Constitution modifier to it. The character regains hit points equal to the total. The player can decide to spend an additional Hit Die after each roll.

Long Rest: A long rest is a period of extended downtime, at least 8 hours long, during which a character sleeps for at least 6 hours and performs no more than 2 hours of light activity, such as reading, talking, eating, or standing watch. If the rest is interrupted by a period of strenuous activity—at least 1 hour of walking, fighting, casting spells, or similar adventuring activity—the characters must begin the rest again to gain any benefit from it. At the end of a long rest, a character regains all lost hit points. The character also regains spent Hit Dice, up to a number of dice equal to half of the character''s total number of them. A character can''t benefit from more than one long rest in a 24-hour period.',
'Short rest (1+ hr): spend Hit Dice to heal. Long rest (8 hrs): regain all HP and half Hit Dice.',
ARRAY['rest', 'short rest', 'long rest', 'hit dice', 'healing'],
'rules.txt', 'Chapter 8', 70
FROM rule_categories WHERE slug = 'resting';

-- =============================================================================
-- SECTION 8: Player Content
-- =============================================================================

-- ---------------------------------------------------------------------------
-- 8.1 Classes and Subclasses
-- ---------------------------------------------------------------------------

-- Core Classes from Basic Rules
INSERT INTO classes (name, slug, description, hit_die, primary_ability, saving_throw_proficiencies, armor_proficiencies, weapon_proficiencies, tool_proficiencies, skill_choices, skill_count, starting_equipment, source_document, source_page) VALUES
('Barbarian', 'barbarian', 'A fierce warrior of primitive background who can enter a battle rage. For some, their rage springs from a communion with fierce animal spirits. Others draw from a roiling reservoir of anger at a world full of pain.', 'd12', 'Strength', ARRAY['Strength', 'Constitution'], ARRAY['Light armor', 'Medium armor', 'Shields'], ARRAY['Simple weapons', 'Martial weapons'], NULL, ARRAY['Animal Handling', 'Athletics', 'Intimidation', 'Nature', 'Perception', 'Survival'], 2, 'A greataxe or any martial melee weapon, two handaxes or any simple weapon, an explorer''s pack and four javelins', 'handbook.txt', 46),

('Bard', 'bard', 'An inspiring magician whose power echoes the music of creation. Whether scholar, skald, or scoundrel, a bard weaves magic through words and music to inspire allies, demoralize foes, manipulate minds, create illusions, and even heal wounds.', 'd8', 'Charisma', ARRAY['Dexterity', 'Charisma'], ARRAY['Light armor'], ARRAY['Simple weapons', 'Hand crossbows', 'Longswords', 'Rapiers', 'Shortswords'], ARRAY['Three musical instruments of your choice'], ARRAY['Athletics', 'Acrobatics', 'Sleight of Hand', 'Stealth', 'Arcana', 'History', 'Investigation', 'Nature', 'Religion', 'Animal Handling', 'Insight', 'Medicine', 'Perception', 'Survival', 'Deception', 'Intimidation', 'Performance', 'Persuasion'], 3, 'A rapier or a longsword or any simple weapon, a diplomat''s pack or an entertainer''s pack, a lute or any other musical instrument, leather armor and a dagger', 'handbook.txt', 51),

('Cleric', 'cleric', 'A priestly champion who wields divine magic in service of a higher power. Clerics are intermediaries between the mortal world and the distant planes of the gods. As varied as the gods they serve, clerics strive to embody the handiwork of their deities.', 'd8', 'Wisdom', ARRAY['Wisdom', 'Charisma'], ARRAY['Light armor', 'Medium armor', 'Shields'], ARRAY['Simple weapons'], NULL, ARRAY['History', 'Insight', 'Medicine', 'Persuasion', 'Religion'], 2, 'A mace or warhammer, scale mail or leather armor or chain mail, a light crossbow and 20 bolts or any simple weapon, a priest''s pack or an explorer''s pack, a shield and a holy symbol', 'rules.txt', 20),

('Druid', 'druid', 'A priest of the Old Faith, wielding the powers of nature and adopting animal forms. Drawing on the divine essence of nature itself, you can cast spells to shape that essence to your will. The power of nature is yours to command.', 'd8', 'Wisdom', ARRAY['Intelligence', 'Wisdom'], ARRAY['Light armor (nonmetal)', 'Medium armor (nonmetal)', 'Shields (nonmetal)'], ARRAY['Clubs', 'Daggers', 'Darts', 'Javelins', 'Maces', 'Quarterstaffs', 'Scimitars', 'Sickles', 'Slings', 'Spears'], ARRAY['Herbalism kit'], ARRAY['Arcana', 'Animal Handling', 'Insight', 'Medicine', 'Nature', 'Perception', 'Religion', 'Survival'], 2, 'A wooden shield or any simple weapon, a scimitar or any simple melee weapon, leather armor, an explorer''s pack, and a druidic focus', 'handbook.txt', 64),

('Fighter', 'fighter', 'A master of martial combat, skilled with a variety of weapons and armor. Fighters learn the basics of all combat styles. Every fighter can swing an axe, fence with a rapier, wield a longsword or a greatsword, use a bow, and even trap foes in a net with some degree of skill.', 'd10', 'Strength or Dexterity', ARRAY['Strength', 'Constitution'], ARRAY['All armor', 'Shields'], ARRAY['Simple weapons', 'Martial weapons'], NULL, ARRAY['Acrobatics', 'Animal Handling', 'Athletics', 'History', 'Insight', 'Intimidation', 'Perception', 'Survival'], 2, 'Chain mail or leather armor with longbow and 20 arrows, a martial weapon and a shield or two martial weapons, a light crossbow and 20 bolts or two handaxes, a dungeoneer''s pack or an explorer''s pack', 'rules.txt', 24),

('Monk', 'monk', 'A master of martial arts, harnessing the power of the body in pursuit of physical and spiritual perfection. Monks make careful study of a magical energy that most monastic traditions call ki.', 'd8', 'Dexterity and Wisdom', ARRAY['Strength', 'Dexterity'], NULL, ARRAY['Simple weapons', 'Shortswords'], ARRAY['One type of artisan''s tools or one musical instrument'], ARRAY['Acrobatics', 'Athletics', 'History', 'Insight', 'Religion', 'Stealth'], 2, 'A shortsword or any simple weapon, a dungeoneer''s pack or an explorer''s pack, 10 darts', 'handbook.txt', 76),

('Paladin', 'paladin', 'A holy warrior bound to a sacred oath. Whatever their origin and their mission, paladins are united by their oaths to stand against the forces of evil. Whether sworn before a god''s altar, paladins are bound by an oath.', 'd10', 'Strength and Charisma', ARRAY['Wisdom', 'Charisma'], ARRAY['All armor', 'Shields'], ARRAY['Simple weapons', 'Martial weapons'], NULL, ARRAY['Athletics', 'Insight', 'Intimidation', 'Medicine', 'Persuasion', 'Religion'], 2, 'A martial weapon and a shield or two martial weapons, five javelins or any simple melee weapon, a priest''s pack or an explorer''s pack, chain mail and a holy symbol', 'handbook.txt', 82),

('Ranger', 'ranger', 'A warrior who combats threats on the edges of civilization. Far from the bustle of cities and towns, past the hedges that shelter the most distant farms from the terrors of the wild, amid the dense-packed trees of trackless forests.', 'd10', 'Dexterity and Wisdom', ARRAY['Strength', 'Dexterity'], ARRAY['Light armor', 'Medium armor', 'Shields'], ARRAY['Simple weapons', 'Martial weapons'], NULL, ARRAY['Animal Handling', 'Athletics', 'Insight', 'Investigation', 'Nature', 'Perception', 'Stealth', 'Survival'], 3, 'Scale mail or leather armor, two shortswords or two simple melee weapons, a dungeoneer''s pack or an explorer''s pack, a longbow and a quiver of 20 arrows', 'handbook.txt', 89),

('Rogue', 'rogue', 'A scoundrel who uses stealth and trickery to overcome obstacles and enemies. Rogues devote as much effort to mastering the use of a variety of skills as they do to perfecting their combat abilities, giving them a broad expertise that few other characters can match.', 'd8', 'Dexterity', ARRAY['Dexterity', 'Intelligence'], ARRAY['Light armor'], ARRAY['Simple weapons', 'Hand crossbows', 'Longswords', 'Rapiers', 'Shortswords'], ARRAY['Thieves'' tools'], ARRAY['Acrobatics', 'Athletics', 'Deception', 'Insight', 'Intimidation', 'Investigation', 'Perception', 'Performance', 'Persuasion', 'Sleight of Hand', 'Stealth'], 4, 'A rapier or a shortsword, a shortbow and quiver of 20 arrows or a shortsword, a burglar''s pack or a dungeoneer''s pack or an explorer''s pack, leather armor, two daggers, and thieves'' tools', 'rules.txt', 26),

('Sorcerer', 'sorcerer', 'A spellcaster who draws on inherent magic from a gift or bloodline. Magic is a part of every sorcerer, suffusing body, mind, and spirit with a latent power that waits to be tapped.', 'd6', 'Charisma', ARRAY['Constitution', 'Charisma'], NULL, ARRAY['Daggers', 'Darts', 'Slings', 'Quarterstaffs', 'Light crossbows'], NULL, ARRAY['Arcana', 'Deception', 'Insight', 'Intimidation', 'Persuasion', 'Religion'], 2, 'A light crossbow and 20 bolts or any simple weapon, a component pouch or an arcane focus, a dungeoneer''s pack or an explorer''s pack, two daggers', 'handbook.txt', 99),

('Warlock', 'warlock', 'A wielder of magic that is derived from a bargain with an extraplanar entity. Warlocks are seekers of the knowledge that lies hidden in the fabric of the multiverse. Through pacts made with mysterious beings.', 'd8', 'Charisma', ARRAY['Wisdom', 'Charisma'], ARRAY['Light armor'], ARRAY['Simple weapons'], NULL, ARRAY['Arcana', 'Deception', 'History', 'Intimidation', 'Investigation', 'Nature', 'Religion'], 2, 'A light crossbow and 20 bolts or any simple weapon, a component pouch or an arcane focus, a scholar''s pack or a dungeoneer''s pack, leather armor, any simple weapon, and two daggers', 'handbook.txt', 105),

('Wizard', 'wizard', 'A scholarly magic-user capable of manipulating the structures of reality. Drawing on the subtle weave of magic that permeates the cosmos, wizards cast spells of explosive fire, arcing lightning, subtle deception, and brute-force mind control.', 'd6', 'Intelligence', ARRAY['Intelligence', 'Wisdom'], NULL, ARRAY['Daggers', 'Darts', 'Slings', 'Quarterstaffs', 'Light crossbows'], NULL, ARRAY['Arcana', 'History', 'Insight', 'Investigation', 'Medicine', 'Religion'], 2, 'A quarterstaff or a dagger, a component pouch or an arcane focus, a scholar''s pack or an explorer''s pack, and a spellbook', 'rules.txt', 29);

-- Subclasses for All Classes

-- Barbarian Subclasses
INSERT INTO subclasses (class_id, name, slug, description, subclass_level, source_document, source_page)
SELECT c.id, 'Path of the Berserker', 'path-of-the-berserker', 'For some barbarians, rage is a means to an end—that end being violence. The Path of the Berserker is a path of untrammeled fury, slick with blood.', 3, 'handbook.txt', 49
FROM classes c WHERE c.slug = 'barbarian';

INSERT INTO subclasses (class_id, name, slug, description, subclass_level, source_document, source_page)
SELECT c.id, 'Path of the Totem Warrior', 'path-of-the-totem-warrior', 'The Path of the Totem Warrior is a spiritual journey, as the barbarian accepts a spirit animal as guide, protector, and inspiration.', 3, 'handbook.txt', 50
FROM classes c WHERE c.slug = 'barbarian';

-- Bard Subclasses
INSERT INTO subclasses (class_id, name, slug, description, subclass_level, source_document, source_page)
SELECT c.id, 'College of Lore', 'college-of-lore', 'Bards of the College of Lore know something about most things, collecting bits of knowledge from sources as diverse as scholarly tomes and peasant tales.', 3, 'handbook.txt', 54
FROM classes c WHERE c.slug = 'bard';

INSERT INTO subclasses (class_id, name, slug, description, subclass_level, source_document, source_page)
SELECT c.id, 'College of Valor', 'college-of-valor', 'Bards of the College of Valor are daring skalds whose tales keep alive the memory of the great heroes of the past.', 3, 'handbook.txt', 55
FROM classes c WHERE c.slug = 'bard';

-- Cleric Subclasses
INSERT INTO subclasses (class_id, name, slug, description, subclass_level, source_document, source_page)
SELECT c.id, 'Life Domain', 'life-domain', 'The Life domain focuses on the vibrant positive energy—one of the fundamental forces of the universe—that sustains all life. The gods of life promote vitality and health through healing the sick and wounded, caring for those in need, and driving away the forces of death and undeath.', 1, 'rules.txt', 21
FROM classes c WHERE c.slug = 'cleric';

INSERT INTO subclasses (class_id, name, slug, description, subclass_level, source_document, source_page)
SELECT c.id, 'Light Domain', 'light-domain', 'Gods of light promote the ideals of rebirth and renewal, truth, vigilance, and beauty, often using the symbol of the sun.', 1, 'handbook.txt', 60
FROM classes c WHERE c.slug = 'cleric';

INSERT INTO subclasses (class_id, name, slug, description, subclass_level, source_document, source_page)
SELECT c.id, 'Tempest Domain', 'tempest-domain', 'Gods whose portfolios include the Tempest domain govern storms, sea, and sky. They include gods of lightning and thunder, gods of earthquakes, some fire gods, and certain gods of violence.', 1, 'handbook.txt', 62
FROM classes c WHERE c.slug = 'cleric';

INSERT INTO subclasses (class_id, name, slug, description, subclass_level, source_document, source_page)
SELECT c.id, 'War Domain', 'war-domain', 'War has many manifestations. It can make heroes of ordinary people. It can be desperate and horrific, with acts of cruelty and cowardice eclipsing instances of excellence and courage.', 1, 'handbook.txt', 63
FROM classes c WHERE c.slug = 'cleric';

-- Druid Subclasses
INSERT INTO subclasses (class_id, name, slug, description, subclass_level, source_document, source_page)
SELECT c.id, 'Circle of the Land', 'circle-of-the-land', 'The Circle of the Land is made up of mystics and sages who safeguard ancient knowledge and rites through a vast oral tradition.', 2, 'handbook.txt', 68
FROM classes c WHERE c.slug = 'druid';

INSERT INTO subclasses (class_id, name, slug, description, subclass_level, source_document, source_page)
SELECT c.id, 'Circle of the Moon', 'circle-of-the-moon', 'Druids of the Circle of the Moon are fierce guardians of the wilds. Their order gathers under the full moon to share news and trade warnings.', 2, 'handbook.txt', 69
FROM classes c WHERE c.slug = 'druid';

-- Fighter Subclasses
INSERT INTO subclasses (class_id, name, slug, description, subclass_level, source_document, source_page)
SELECT c.id, 'Champion', 'champion', 'The archetypal Champion focuses on the development of raw physical power honed to deadly perfection. Those who model themselves on this archetype combine rigorous training with physical excellence to deal devastating blows.', 3, 'rules.txt', 25
FROM classes c WHERE c.slug = 'fighter';

INSERT INTO subclasses (class_id, name, slug, description, subclass_level, source_document, source_page)
SELECT c.id, 'Battle Master', 'battle-master', 'Those who emulate the archetypal Battle Master employ martial techniques passed down through generations. To a Battle Master, combat is an academic field.', 3, 'handbook.txt', 73
FROM classes c WHERE c.slug = 'fighter';

INSERT INTO subclasses (class_id, name, slug, description, subclass_level, source_document, source_page)
SELECT c.id, 'Eldritch Knight', 'eldritch-knight', 'The archetypal Eldritch Knight combines the martial mastery common to all fighters with a careful study of magic.', 3, 'handbook.txt', 74
FROM classes c WHERE c.slug = 'fighter';

-- Monk Subclasses
INSERT INTO subclasses (class_id, name, slug, description, subclass_level, source_document, source_page)
SELECT c.id, 'Way of the Open Hand', 'way-of-the-open-hand', 'Monks of the Way of the Open Hand are the ultimate masters of martial arts combat, whether armed or unarmed.', 3, 'handbook.txt', 79
FROM classes c WHERE c.slug = 'monk';

INSERT INTO subclasses (class_id, name, slug, description, subclass_level, source_document, source_page)
SELECT c.id, 'Way of Shadow', 'way-of-shadow', 'Monks of the Way of Shadow follow a tradition that values stealth and subterfuge. These monks serve as spies and assassins.', 3, 'handbook.txt', 80
FROM classes c WHERE c.slug = 'monk';

INSERT INTO subclasses (class_id, name, slug, description, subclass_level, source_document, source_page)
SELECT c.id, 'Way of the Four Elements', 'way-of-the-four-elements', 'You follow a monastic tradition that teaches you to harness the elements. Many monks of this tradition tattoo their bodies with representations of their ki powers.', 3, 'handbook.txt', 80
FROM classes c WHERE c.slug = 'monk';

-- Paladin Subclasses
INSERT INTO subclasses (class_id, name, slug, description, subclass_level, source_document, source_page)
SELECT c.id, 'Oath of Devotion', 'oath-of-devotion', 'The Oath of Devotion binds a paladin to the loftiest ideals of justice, virtue, and order. Sometimes called cavaliers, white knights, or holy warriors.', 3, 'handbook.txt', 85
FROM classes c WHERE c.slug = 'paladin';

INSERT INTO subclasses (class_id, name, slug, description, subclass_level, source_document, source_page)
SELECT c.id, 'Oath of the Ancients', 'oath-of-the-ancients', 'The Oath of the Ancients is as old as the race of elves and the rituals of the druids. Paladins who swear this oath cast their lot with the side of the light.', 3, 'handbook.txt', 86
FROM classes c WHERE c.slug = 'paladin';

INSERT INTO subclasses (class_id, name, slug, description, subclass_level, source_document, source_page)
SELECT c.id, 'Oath of Vengeance', 'oath-of-vengeance', 'The Oath of Vengeance is a solemn commitment to punish those who have committed a grievous sin. When evil forces slaughter helpless villagers, when an entire people turns against the will of the gods.', 3, 'handbook.txt', 87
FROM classes c WHERE c.slug = 'paladin';

-- Ranger Subclasses
INSERT INTO subclasses (class_id, name, slug, description, subclass_level, source_document, source_page)
SELECT c.id, 'Hunter', 'hunter', 'Emulating the Hunter archetype means accepting your place as a bulwark between civilization and the terrors of the wilderness.', 3, 'handbook.txt', 93
FROM classes c WHERE c.slug = 'ranger';

INSERT INTO subclasses (class_id, name, slug, description, subclass_level, source_document, source_page)
SELECT c.id, 'Beast Master', 'beast-master', 'The Beast Master archetype embodies a friendship between the civilized races and the beasts of the world.', 3, 'handbook.txt', 93
FROM classes c WHERE c.slug = 'ranger';

-- Rogue Subclasses
INSERT INTO subclasses (class_id, name, slug, description, subclass_level, source_document, source_page)
SELECT c.id, 'Thief', 'thief', 'You hone your skills in the larcenous arts. Burglars, bandits, cutpurses, and other criminals typically follow this archetype, but so do rogues who prefer to think of themselves as professional treasure seekers, explorers, delvers, and investigators.', 3, 'rules.txt', 27
FROM classes c WHERE c.slug = 'rogue';

INSERT INTO subclasses (class_id, name, slug, description, subclass_level, source_document, source_page)
SELECT c.id, 'Assassin', 'assassin', 'You focus your training on the grim art of death. Those who adhere to this archetype are diverse: hired killers, spies, bounty hunters, and even specially anointed priests.', 3, 'handbook.txt', 97
FROM classes c WHERE c.slug = 'rogue';

INSERT INTO subclasses (class_id, name, slug, description, subclass_level, source_document, source_page)
SELECT c.id, 'Arcane Trickster', 'arcane-trickster', 'Some rogues enhance their fine-honed skills of stealth and agility with magic, learning tricks of enchantment and illusion.', 3, 'handbook.txt', 97
FROM classes c WHERE c.slug = 'rogue';

-- Sorcerer Subclasses
INSERT INTO subclasses (class_id, name, slug, description, subclass_level, source_document, source_page)
SELECT c.id, 'Draconic Bloodline', 'draconic-bloodline', 'Your innate magic comes from draconic magic that was mingled with your blood or that of your ancestors.', 1, 'handbook.txt', 102
FROM classes c WHERE c.slug = 'sorcerer';

INSERT INTO subclasses (class_id, name, slug, description, subclass_level, source_document, source_page)
SELECT c.id, 'Wild Magic', 'wild-magic', 'Your innate magic comes from the wild forces of chaos that underlie the order of creation.', 1, 'handbook.txt', 103
FROM classes c WHERE c.slug = 'sorcerer';

-- Warlock Subclasses
INSERT INTO subclasses (class_id, name, slug, description, subclass_level, source_document, source_page)
SELECT c.id, 'The Archfey', 'the-archfey', 'Your patron is a lord or lady of the fey, a creature of legend who holds secrets that were forgotten before the mortal races were born.', 1, 'handbook.txt', 108
FROM classes c WHERE c.slug = 'warlock';

INSERT INTO subclasses (class_id, name, slug, description, subclass_level, source_document, source_page)
SELECT c.id, 'The Fiend', 'the-fiend', 'You have made a pact with a fiend from the lower planes of existence, a being whose aims are evil.', 1, 'handbook.txt', 109
FROM classes c WHERE c.slug = 'warlock';

INSERT INTO subclasses (class_id, name, slug, description, subclass_level, source_document, source_page)
SELECT c.id, 'The Great Old One', 'the-great-old-one', 'Your patron is a mysterious entity whose nature is utterly foreign to the fabric of reality.', 1, 'handbook.txt', 109
FROM classes c WHERE c.slug = 'warlock';

-- Wizard Subclasses
INSERT INTO subclasses (class_id, name, slug, description, subclass_level, source_document, source_page)
SELECT c.id, 'School of Abjuration', 'school-of-abjuration', 'The School of Abjuration emphasizes magic that blocks, banishes, or protects.', 2, 'handbook.txt', 115
FROM classes c WHERE c.slug = 'wizard';

INSERT INTO subclasses (class_id, name, slug, description, subclass_level, source_document, source_page)
SELECT c.id, 'School of Conjuration', 'school-of-conjuration', 'As a conjurer, you favor spells that produce objects and creatures out of thin air.', 2, 'handbook.txt', 116
FROM classes c WHERE c.slug = 'wizard';

INSERT INTO subclasses (class_id, name, slug, description, subclass_level, source_document, source_page)
SELECT c.id, 'School of Divination', 'school-of-divination', 'The counsel of a diviner is sought by royalty and commoners alike, for all seek a clearer understanding of the past, present, and future.', 2, 'handbook.txt', 116
FROM classes c WHERE c.slug = 'wizard';

INSERT INTO subclasses (class_id, name, slug, description, subclass_level, source_document, source_page)
SELECT c.id, 'School of Enchantment', 'school-of-enchantment', 'As a member of the School of Enchantment, you have honed your ability to magically entrance and beguile other people and monsters.', 2, 'handbook.txt', 117
FROM classes c WHERE c.slug = 'wizard';

INSERT INTO subclasses (class_id, name, slug, description, subclass_level, source_document, source_page)
SELECT c.id, 'School of Evocation', 'school-of-evocation', 'You focus your study on magic that creates powerful elemental effects such as bitter cold, searing flame, rolling thunder, crackling lightning, and burning acid. Some evokers find employment in military forces, serving as artillery to blast enemy armies from afar.', 2, 'rules.txt', 30
FROM classes c WHERE c.slug = 'wizard';

INSERT INTO subclasses (class_id, name, slug, description, subclass_level, source_document, source_page)
SELECT c.id, 'School of Illusion', 'school-of-illusion', 'You focus your studies on magic that dazzles the senses, befuddles the mind, and tricks even the wisest folk.', 2, 'handbook.txt', 118
FROM classes c WHERE c.slug = 'wizard';

INSERT INTO subclasses (class_id, name, slug, description, subclass_level, source_document, source_page)
SELECT c.id, 'School of Necromancy', 'school-of-necromancy', 'The School of Necromancy explores the cosmic forces of life, death, and undeath.', 2, 'handbook.txt', 118
FROM classes c WHERE c.slug = 'wizard';

INSERT INTO subclasses (class_id, name, slug, description, subclass_level, source_document, source_page)
SELECT c.id, 'School of Transmutation', 'school-of-transmutation', 'You are a student of spells that modify energy and matter. To you, the world is not a fixed thing, but eminently mutable.', 2, 'handbook.txt', 119
FROM classes c WHERE c.slug = 'wizard';

-- ---------------------------------------------------------------------------
-- 8.2 Class Features
-- ---------------------------------------------------------------------------

-- Fighter Class Features
INSERT INTO class_features (class_id, name, slug, level, description, source_document, source_page)
SELECT c.id, 'Fighting Style', 'fighter-fighting-style', 1, 'You adopt a particular style of fighting as your specialty. Choose one of the following options: Archery, Defense, Dueling, Great Weapon Fighting, Protection, or Two-Weapon Fighting. You can''t take a Fighting Style option more than once, even if you later get to choose again.', 'rules.txt', 24
FROM classes c WHERE c.slug = 'fighter';

INSERT INTO class_features (class_id, name, slug, level, description, source_document, source_page)
SELECT c.id, 'Second Wind', 'fighter-second-wind', 1, 'You have a limited well of stamina that you can draw on to protect yourself from harm. On your turn, you can use a bonus action to regain hit points equal to 1d10 + your fighter level. Once you use this feature, you must finish a short or long rest before you can use it again.', 'rules.txt', 24
FROM classes c WHERE c.slug = 'fighter';

INSERT INTO class_features (class_id, name, slug, level, description, source_document, source_page)
SELECT c.id, 'Action Surge', 'fighter-action-surge', 2, 'Starting at 2nd level, you can push yourself beyond your normal limits for a moment. On your turn, you can take one additional action on top of your regular action and a possible bonus action. Once you use this feature, you must finish a short or long rest before you can use it again. Starting at 17th level, you can use it twice before a rest, but only once on the same turn.', 'rules.txt', 25
FROM classes c WHERE c.slug = 'fighter';

INSERT INTO class_features (class_id, name, slug, level, description, source_document, source_page)
SELECT c.id, 'Extra Attack', 'fighter-extra-attack', 5, 'Beginning at 5th level, you can attack twice, instead of once, whenever you take the Attack action on your turn. The number of attacks increases to three when you reach 11th level in this class and to four when you reach 20th level in this class.', 'rules.txt', 25
FROM classes c WHERE c.slug = 'fighter';

-- Wizard Class Features
INSERT INTO class_features (class_id, name, slug, level, description, source_document, source_page)
SELECT c.id, 'Spellcasting', 'wizard-spellcasting', 1, 'As a student of arcane magic, you have a spellbook containing spells that show the first glimmerings of your true power. You know three cantrips of your choice from the wizard spell list. You learn additional wizard cantrips of your choice at higher levels. Your spellbook contains six 1st-level wizard spells of your choice.', 'rules.txt', 29
FROM classes c WHERE c.slug = 'wizard';

INSERT INTO class_features (class_id, name, slug, level, description, source_document, source_page)
SELECT c.id, 'Arcane Recovery', 'wizard-arcane-recovery', 1, 'You have learned to regain some of your magical energy by studying your spellbook. Once per day when you finish a short rest, you can choose expended spell slots to recover. The spell slots can have a combined level that is equal to or less than half your wizard level (rounded up), and none of the slots can be 6th level or higher.', 'rules.txt', 29
FROM classes c WHERE c.slug = 'wizard';

-- Rogue Class Features
INSERT INTO class_features (class_id, name, slug, level, description, source_document, source_page)
SELECT c.id, 'Expertise', 'rogue-expertise', 1, 'At 1st level, choose two of your skill proficiencies, or one of your skill proficiencies and your proficiency with thieves'' tools. Your proficiency bonus is doubled for any ability check you make that uses either of the chosen proficiencies. At 6th level, you can choose two more of your proficiencies to gain this benefit.', 'rules.txt', 26
FROM classes c WHERE c.slug = 'rogue';

INSERT INTO class_features (class_id, name, slug, level, description, source_document, source_page)
SELECT c.id, 'Sneak Attack', 'rogue-sneak-attack', 1, 'Beginning at 1st level, you know how to strike subtly and exploit a foe''s distraction. Once per turn, you can deal an extra 1d6 damage to one creature you hit with an attack if you have advantage on the attack roll. The attack must use a finesse or a ranged weapon. You don''t need advantage on the attack roll if another enemy of the target is within 5 feet of it, that enemy isn''t incapacitated, and you don''t have disadvantage on the attack roll. The amount of the extra damage increases as you gain levels in this class.', 'rules.txt', 26
FROM classes c WHERE c.slug = 'rogue';

INSERT INTO class_features (class_id, name, slug, level, description, source_document, source_page)
SELECT c.id, 'Cunning Action', 'rogue-cunning-action', 2, 'Starting at 2nd level, your quick thinking and agility allow you to move and act quickly. You can take a bonus action on each of your turns in combat. This action can be used only to take the Dash, Disengage, or Hide action.', 'rules.txt', 27
FROM classes c WHERE c.slug = 'rogue';

INSERT INTO class_features (class_id, name, slug, level, description, source_document, source_page)
SELECT c.id, 'Uncanny Dodge', 'rogue-uncanny-dodge', 5, 'Starting at 5th level, when an attacker that you can see hits you with an attack, you can use your reaction to halve the attack''s damage against you.', 'rules.txt', 27
FROM classes c WHERE c.slug = 'rogue';

-- Cleric Class Features
INSERT INTO class_features (class_id, name, slug, level, description, source_document, source_page)
SELECT c.id, 'Spellcasting', 'cleric-spellcasting', 1, 'As a conduit for divine power, you can cast cleric spells. You know three cantrips of your choice from the cleric spell list. You prepare the list of cleric spells that are available for you to cast, choosing from the cleric spell list. You can change your list of prepared spells when you finish a long rest.', 'rules.txt', 20
FROM classes c WHERE c.slug = 'cleric';

INSERT INTO class_features (class_id, name, slug, level, description, source_document, source_page)
SELECT c.id, 'Channel Divinity', 'cleric-channel-divinity', 2, 'At 2nd level, you gain the ability to channel divine energy directly from your deity, using that energy to fuel magical effects. You start with two such effects: Turn Undead and an effect determined by your domain. When you use your Channel Divinity, you choose which effect to create. You must then finish a short or long rest to use your Channel Divinity again.', 'rules.txt', 21
FROM classes c WHERE c.slug = 'cleric';

INSERT INTO class_features (class_id, name, slug, level, description, source_document, source_page)
SELECT c.id, 'Divine Intervention', 'cleric-divine-intervention', 10, 'Beginning at 10th level, you can call on your deity to intervene on your behalf when your need is great. Imploring your deity''s aid requires you to use your action. Describe the assistance you seek, and roll percentile dice. If you roll a number equal to or lower than your cleric level, your deity intervenes.', 'rules.txt', 22
FROM classes c WHERE c.slug = 'cleric';

-- ---------------------------------------------------------------------------
-- 8.3 Races and Subraces
-- ---------------------------------------------------------------------------

-- All Playable Races
INSERT INTO races (name, slug, description, ability_score_increase, age_description, alignment_description, size, size_description, speed, speed_description, languages, language_description, traits, source_document, source_page) VALUES
('Dragonborn', 'dragonborn', 'Born of dragons, as their name proclaims, the dragonborn walk proudly through a world that greets them with fearful incomprehension. Shaped by draconic gods or the dragons themselves, dragonborn originally hatched from dragon eggs as a unique race, combining the best attributes of dragons and humanoids.', '{"strength": 2, "charisma": 1}', 'Young dragonborn grow quickly. They walk hours after hatching, attain the size and development of a 10-year-old human child by the age of 3, and reach adulthood by 15. They live to be around 80.', 'Dragonborn tend to extremes, making a conscious choice for one side or the other in the cosmic war between good and evil. Most dragonborn are good, but those who side with evil can be terrible villains.', 'Medium', 'Dragonborn are taller and heavier than humans, standing well over 6 feet tall and averaging almost 250 pounds.', 30, 'Your base walking speed is 30 feet.', ARRAY['Common', 'Draconic'], 'You can speak, read, and write Common and Draconic.', '{"draconic_ancestry": "You have draconic ancestry. Choose one type of dragon from the Draconic Ancestry table. Your breath weapon and damage resistance are determined by the dragon type.", "breath_weapon": "You can use your action to exhale destructive energy. Your draconic ancestry determines the size, shape, and damage type of the exhalation.", "damage_resistance": "You have resistance to the damage type associated with your draconic ancestry."}', 'handbook.txt', 32),

('Dwarf', 'dwarf', 'Bold and hardy, dwarves are known as skilled warriors, miners, and workers of stone and metal. Kingdoms rich in ancient grandeur, halls carved into the roots of mountains, the echoing of picks and hammers in deep mines and blazing forges, a commitment to clan and tradition, and a burning hatred of goblins and orcs—these common threads unite all dwarves.', '{"constitution": 2}', 'Dwarves mature at the same rate as humans, but they''re considered young until they reach the age of 50. On average, they live about 350 years.', 'Most dwarves are lawful, believing firmly in the benefits of a well-ordered society. They tend toward good as well, with a strong sense of fair play and a belief that everyone deserves to share in the benefits of a just order.', 'Medium', 'Dwarves stand between 4 and 5 feet tall and average about 150 pounds.', 25, 'Your speed is not reduced by wearing heavy armor.', ARRAY['Common', 'Dwarvish'], 'You can speak, read, and write Common and Dwarvish.', '{"darkvision": "You can see in dim light within 60 feet of you as if it were bright light, and in darkness as if it were dim light.", "dwarven_resilience": "You have advantage on saving throws against poison, and you have resistance against poison damage.", "dwarven_combat_training": "You have proficiency with the battleaxe, handaxe, light hammer, and warhammer.", "stonecunning": "Whenever you make an Intelligence (History) check related to the origin of stonework, you are considered proficient in the History skill and add double your proficiency bonus to the check."}', 'rules.txt', 18),

('Elf', 'elf', 'Elves are a magical people of otherworldly grace, living in the world but not entirely part of it. They live in places of ethereal beauty, in the midst of ancient forests or in silvery spires glittering with faerie light, where soft music drifts through the air and gentle fragrances waft on the breeze.', '{"dexterity": 2}', 'Although elves reach physical maturity at about the same age as humans, the elven understanding of adulthood goes beyond physical growth to encompass worldly experience. An elf typically claims adulthood and an adult name around the age of 100 and can live to be 750 years old.', 'Elves love freedom, variety, and self-expression, so they lean strongly toward the gentler aspects of chaos. They value and protect others'' freedom as well as their own, and they are more often good than not.', 'Medium', 'Elves range from under 5 to over 6 feet tall and have slender builds.', 30, 'Your base walking speed is 30 feet.', ARRAY['Common', 'Elvish'], 'You can speak, read, and write Common and Elvish.', '{"darkvision": "You can see in dim light within 60 feet of you as if it were bright light, and in darkness as if it were dim light.", "keen_senses": "You have proficiency in the Perception skill.", "fey_ancestry": "You have advantage on saving throws against being charmed, and magic can''t put you to sleep.", "trance": "Elves don''t need to sleep. Instead, they meditate deeply, remaining semiconscious, for 4 hours a day."}', 'rules.txt', 15),

('Gnome', 'gnome', 'A constant hum of busy activity pervades the warrens and neighborhoods where gnomes form their close-knit communities. Louder sounds punctuate the hum: a crunch of grinding gears here, a minor explosion there, a yelp of surprise or triumph.', '{"intelligence": 2}', 'Gnomes mature at the same rate humans do, and most are expected to settle down into an adult life by around age 40. They can live 350 to almost 500 years.', 'Gnomes are most often good. Those who tend toward law are sages, engineers, researchers, scholars, investigators, or inventors. Those who tend toward chaos are minstrels, tricksters, wanderers, or fanciful jewelers.', 'Small', 'Gnomes are between 3 and 4 feet tall and average about 40 pounds.', 25, 'Your base walking speed is 25 feet.', ARRAY['Common', 'Gnomish'], 'You can speak, read, and write Common and Gnomish.', '{"darkvision": "Accustomed to life underground, you have superior vision in dark and dim conditions. You can see in dim light within 60 feet of you as if it were bright light, and in darkness as if it were dim light.", "gnome_cunning": "You have advantage on all Intelligence, Wisdom, and Charisma saving throws against magic."}', 'handbook.txt', 35),

('Half-Elf', 'half-elf', 'Walking in two worlds but truly belonging to neither, half-elves combine what some say are the best qualities of their elf and human parents: human curiosity, inventiveness, and ambition tempered by the refined senses, love of nature, and artistic tastes of the elves.', '{"charisma": 2}', 'Half-elves mature at the same rate humans do and reach adulthood around the age of 20. They live much longer than humans, however, often exceeding 180 years.', 'Half-elves share the chaotic bent of their elven heritage. They value both personal freedom and creative expression, demonstrating neither love of leaders nor desire for followers.', 'Medium', 'Half-elves are about the same size as humans, ranging from 5 to 6 feet tall.', 30, 'Your base walking speed is 30 feet.', ARRAY['Common', 'Elvish'], 'You can speak, read, and write Common, Elvish, and one extra language of your choice.', '{"darkvision": "Thanks to your elf blood, you have superior vision in dark and dim conditions. You can see in dim light within 60 feet of you as if it were bright light, and in darkness as if it were dim light.", "fey_ancestry": "You have advantage on saving throws against being charmed, and magic can''t put you to sleep.", "skill_versatility": "You gain proficiency in two skills of your choice."}', 'handbook.txt', 38),

('Half-Orc', 'half-orc', 'Whether united under the leadership of a mighty warlock or having fought to a standstill after years of conflict, orc and human tribes sometimes form alliances, joining forces into a larger horde to the terror of civilized lands nearby.', '{"strength": 2, "constitution": 1}', 'Half-orcs mature a little faster than humans, reaching adulthood around age 14. They age noticeably faster and rarely live longer than 75 years.', 'Half-orcs inherit a tendency toward chaos from their orc parents and are not strongly inclined toward good. Half-orcs raised among orcs and willing to live out their lives among them are usually evil.', 'Medium', 'Half-orcs are somewhat larger and bulkier than humans, and they range from 5 to well over 6 feet tall.', 30, 'Your base walking speed is 30 feet.', ARRAY['Common', 'Orc'], 'You can speak, read, and write Common and Orc.', '{"darkvision": "Thanks to your orc blood, you have superior vision in dark and dim conditions. You can see in dim light within 60 feet of you as if it were bright light, and in darkness as if it were dim light.", "menacing": "You gain proficiency in the Intimidation skill.", "relentless_endurance": "When you are reduced to 0 hit points but not killed outright, you can drop to 1 hit point instead. You can''t use this feature again until you finish a long rest.", "savage_attacks": "When you score a critical hit with a melee weapon attack, you can roll one of the weapon''s damage dice one additional time and add it to the extra damage of the critical hit."}', 'handbook.txt', 40),

('Halfling', 'halfling', 'The comforts of home are the goals of most halflings'' lives: a place to settle in peace and quiet, far from marauding monsters and clashing armies; a blazing fire and a generous meal; fine drink and fine conversation. Though some halflings live out their days in remote agricultural communities, others form nomadic bands that travel constantly.', '{"dexterity": 2}', 'A halfling reaches adulthood at the age of 20 and generally lives into the middle of his or her second century.', 'Most halflings are lawful good. As a rule, they are good-hearted and kind, hate to see others in pain, and have no tolerance for oppression. They are also very orderly and traditional, leaning heavily on the support of their community and the comfort of their old ways.', 'Small', 'Halflings average about 3 feet tall and weigh about 40 pounds.', 25, 'Your base walking speed is 25 feet.', ARRAY['Common', 'Halfling'], 'You can speak, read, and write Common and Halfling.', '{"lucky": "When you roll a 1 on an attack roll, ability check, or saving throw, you can reroll the die and must use the new roll.", "brave": "You have advantage on saving throws against being frightened.", "halfling_nimbleness": "You can move through the space of any creature that is of a size larger than yours."}', 'rules.txt', 16),

('Human', 'human', 'In the reckonings of most worlds, humans are the youngest of the common races, late to arrive on the world scene and short-lived in comparison to dwarves, elves, and dragons. Perhaps it is because of their shorter lives that they strive to achieve as much as they can in the years they are given. Or maybe they feel they have something to prove to the elder races, and that''s why they build their mighty empires on the foundation of conquest and trade.', '{"strength": 1, "dexterity": 1, "constitution": 1, "intelligence": 1, "wisdom": 1, "charisma": 1}', 'Humans reach adulthood in their late teens and live less than a century.', 'Humans tend toward no particular alignment. The best and the worst are found among them.', 'Medium', 'Humans vary widely in height and build, from barely 5 feet tall to well over 6 feet tall.', 30, 'Your base walking speed is 30 feet.', ARRAY['Common'], 'You can speak, read, and write Common and one extra language of your choice.', '{}', 'rules.txt', 17),

('Tiefling', 'tiefling', 'To be greeted with stares and whispers, to suffer violence and insult on the street, to see mistrust and fear in every eye: this is the lot of the tiefling. And to twist the knife, tieflings know that this is because a pact struck generations ago infused the essence of Asmodeus into their bloodline.', '{"intelligence": 1, "charisma": 2}', 'Tieflings mature at the same rate as humans but live a few years longer.', 'Tieflings might not have an innate tendency toward evil, but many of them end up there. Evil or not, an independent nature inclines many tieflings toward a chaotic alignment.', 'Medium', 'Tieflings are about the same size and build as humans.', 30, 'Your base walking speed is 30 feet.', ARRAY['Common', 'Infernal'], 'You can speak, read, and write Common and Infernal.', '{"darkvision": "Thanks to your infernal heritage, you have superior vision in dark and dim conditions. You can see in dim light within 60 feet of you as if it were bright light, and in darkness as if it were dim light.", "hellish_resistance": "You have resistance to fire damage.", "infernal_legacy": "You know the thaumaturgy cantrip. When you reach 3rd level, you can cast the hellish rebuke spell as a 2nd-level spell once per long rest. When you reach 5th level, you can also cast the darkness spell once per long rest. Charisma is your spellcasting ability for these spells."}', 'handbook.txt', 42);

-- All Subraces

-- Dwarf Subraces
INSERT INTO subraces (race_id, name, slug, description, ability_score_increase, traits, source_document, source_page)
SELECT r.id, 'Hill Dwarf', 'hill-dwarf', 'As a hill dwarf, you have keen senses, deep intuition, and remarkable resilience. The gold dwarves of Faerûn in their mighty southern kingdom are hill dwarves, as are the exiled Neidar and the debased Klar of Krynn in the Dragonlance setting.', '{"wisdom": 1}', '{"dwarven_toughness": "Your hit point maximum increases by 1, and it increases by 1 every time you gain a level."}', 'rules.txt', 18
FROM races r WHERE r.slug = 'dwarf';

INSERT INTO subraces (race_id, name, slug, description, ability_score_increase, traits, source_document, source_page)
SELECT r.id, 'Mountain Dwarf', 'mountain-dwarf', 'As a mountain dwarf, you''re strong and hardy, accustomed to a difficult life in rugged terrain. You''re probably on the tall side (for a dwarf), and tend toward lighter coloration.', '{"strength": 2}', '{"dwarven_armor_training": "You have proficiency with light and medium armor."}', 'handbook.txt', 20
FROM races r WHERE r.slug = 'dwarf';

-- Elf Subraces
INSERT INTO subraces (race_id, name, slug, description, ability_score_increase, traits, source_document, source_page)
SELECT r.id, 'High Elf', 'high-elf', 'As a high elf, you have a keen mind and a mastery of at least the basics of magic. In many of the worlds of D&D, there are two kinds of high elves. One type is haughty and reclusive, believing themselves to be superior to non-elves and even other elves. The other type is more common and more friendly, and often encountered among humans and other races.', '{"intelligence": 1}', '{"elf_weapon_training": "You have proficiency with the longsword, shortsword, shortbow, and longbow.", "cantrip": "You know one cantrip of your choice from the wizard spell list. Intelligence is your spellcasting ability for it.", "extra_language": "You can speak, read, and write one extra language of your choice."}', 'rules.txt', 15
FROM races r WHERE r.slug = 'elf';

INSERT INTO subraces (race_id, name, slug, description, ability_score_increase, traits, source_document, source_page)
SELECT r.id, 'Wood Elf', 'wood-elf', 'As a wood elf, you have keen senses and intuition, and your fleet feet carry you quickly and stealthily through your native forests. Wood elves tend to be reclusive and distrustful of non-elves.', '{"wisdom": 1}', '{"elf_weapon_training": "You have proficiency with the longsword, shortsword, shortbow, and longbow.", "fleet_of_foot": "Your base walking speed increases to 35 feet.", "mask_of_the_wild": "You can attempt to hide even when you are only lightly obscured by foliage, heavy rain, falling snow, mist, and other natural phenomena."}', 'handbook.txt', 24
FROM races r WHERE r.slug = 'elf';

INSERT INTO subraces (race_id, name, slug, description, ability_score_increase, traits, source_document, source_page)
SELECT r.id, 'Dark Elf (Drow)', 'dark-elf-drow', 'Descended from an earlier subrace of dark-skinned elves, the drow were banished from the surface world for following the goddess Lolth down the path to evil and corruption.', '{"charisma": 1}', '{"superior_darkvision": "Your darkvision has a radius of 120 feet.", "sunlight_sensitivity": "You have disadvantage on attack rolls and on Wisdom (Perception) checks that rely on sight when you, the target of your attack, or whatever you are trying to perceive is in direct sunlight.", "drow_magic": "You know the dancing lights cantrip. When you reach 3rd level, you can cast the faerie fire spell once per day. When you reach 5th level, you can also cast the darkness spell once per day. Charisma is your spellcasting ability for these spells.", "drow_weapon_training": "You have proficiency with rapiers, shortswords, and hand crossbows."}', 'handbook.txt', 24
FROM races r WHERE r.slug = 'elf';

-- Gnome Subraces
INSERT INTO subraces (race_id, name, slug, description, ability_score_increase, traits, source_document, source_page)
SELECT r.id, 'Forest Gnome', 'forest-gnome', 'As a forest gnome, you have a natural knack for illusion and inherent quickness and stealth. Forest gnomes are rare and secretive.', '{"dexterity": 1}', '{"natural_illusionist": "You know the minor illusion cantrip. Intelligence is your spellcasting ability for it.", "speak_with_small_beasts": "Through sounds and gestures, you can communicate simple ideas with Small or smaller beasts."}', 'handbook.txt', 37
FROM races r WHERE r.slug = 'gnome';

INSERT INTO subraces (race_id, name, slug, description, ability_score_increase, traits, source_document, source_page)
SELECT r.id, 'Rock Gnome', 'rock-gnome', 'As a rock gnome, you have a natural inventiveness and hardiness beyond that of other gnomes.', '{"constitution": 1}', '{"artificers_lore": "Whenever you make an Intelligence (History) check related to magic items, alchemical objects, or technological devices, you can add twice your proficiency bonus, instead of any proficiency bonus you normally apply.", "tinker": "You have proficiency with artisan''s tools (tinker''s tools). Using those tools, you can spend 1 hour and 10 gp worth of materials to construct a Tiny clockwork device."}', 'handbook.txt', 37
FROM races r WHERE r.slug = 'gnome';

-- Halfling Subraces
INSERT INTO subraces (race_id, name, slug, description, ability_score_increase, traits, source_document, source_page)
SELECT r.id, 'Lightfoot Halfling', 'lightfoot-halfling', 'As a lightfoot halfling, you can easily hide from notice, even using other people as cover. You''re inclined to be affable and get along well with others. Lightfoots are more prone to wanderlust than other halflings, and often dwell alongside other races or take up a nomadic life.', '{"charisma": 1}', '{"naturally_stealthy": "You can attempt to hide even when you are obscured only by a creature that is at least one size larger than you."}', 'rules.txt', 17
FROM races r WHERE r.slug = 'halfling';

INSERT INTO subraces (race_id, name, slug, description, ability_score_increase, traits, source_document, source_page)
SELECT r.id, 'Stout Halfling', 'stout-halfling', 'As a stout halfling, you''re hardier than average and have some resistance to poison. Some say that stouts have dwarven blood.', '{"constitution": 1}', '{"stout_resilience": "You have advantage on saving throws against poison, and you have resistance against poison damage."}', 'handbook.txt', 28
FROM races r WHERE r.slug = 'halfling';

-- ---------------------------------------------------------------------------
-- 8.4 Spells
-- ---------------------------------------------------------------------------

-- Cantrips (Level 0)
INSERT INTO spells (name, slug, level, school, casting_time, range, components, materials, duration, concentration, ritual, description, at_higher_levels, source_document, source_page) VALUES
('Acid Splash', 'acid-splash', 0, 'Conjuration', '1 action', '60 feet', 'V, S', NULL, 'Instantaneous', FALSE, FALSE, 'You hurl a bubble of acid. Choose one or two creatures you can see within range. If you choose two, they must be within 5 feet of each other. A target must succeed on a Dexterity saving throw or take 1d6 acid damage.', 'This spell''s damage increases by 1d6 when you reach 5th level (2d6), 11th level (3d6), and 17th level (4d6).', 'rules.txt', 86),

('Fire Bolt', 'fire-bolt', 0, 'Evocation', '1 action', '120 feet', 'V, S', NULL, 'Instantaneous', FALSE, FALSE, 'You hurl a mote of fire at a creature or object within range. Make a ranged spell attack against the target. On a hit, the target takes 1d10 fire damage. A flammable object hit by this spell ignites if it isn''t being worn or carried.', 'This spell''s damage increases by 1d10 when you reach 5th level (2d10), 11th level (3d10), and 17th level (4d10).', 'rules.txt', 91),

('Light', 'light', 0, 'Evocation', '1 action', 'Touch', 'V, M', 'a firefly or phosphorescent moss', '1 hour', FALSE, FALSE, 'You touch one object that is no larger than 10 feet in any dimension. Until the spell ends, the object sheds bright light in a 20-foot radius and dim light for an additional 20 feet. The light can be colored as you like. Completely covering the object with something opaque blocks the light. The spell ends if you cast it again or dismiss it as an action.', NULL, 'rules.txt', 95),

('Mage Hand', 'mage-hand', 0, 'Conjuration', '1 action', '30 feet', 'V, S', NULL, '1 minute', FALSE, FALSE, 'A spectral, floating hand appears at a point you choose within range. The hand lasts for the duration or until you dismiss it as an action. The hand vanishes if it is ever more than 30 feet away from you or if you cast this spell again. You can use your action to control the hand and use it to manipulate an object, open an unlocked door or container, stow or retrieve an item from an open container, or pour the contents out of a vial.', NULL, 'rules.txt', 96),

('Prestidigitation', 'prestidigitation', 0, 'Transmutation', '1 action', '10 feet', 'V, S', NULL, 'Up to 1 hour', FALSE, FALSE, 'This spell is a minor magical trick that novice spellcasters use for practice. You create one of the following magical effects within range: You create an instantaneous, harmless sensory effect, such as a shower of sparks, a puff of wind, faint musical notes, or an odd odor. You instantaneously light or snuff out a candle, a torch, or a small campfire. You instantaneously clean or soil an object no larger than 1 cubic foot. You chill, warm, or flavor up to 1 cubic foot of nonliving material for 1 hour. You make a color, a small mark, or a symbol appear on an object or a surface for 1 hour. You create a nonmagical trinket or an illusory image that can fit in your hand and that lasts until the end of your next turn.', NULL, 'rules.txt', 99),

('Sacred Flame', 'sacred-flame', 0, 'Evocation', '1 action', '60 feet', 'V, S', NULL, 'Instantaneous', FALSE, FALSE, 'Flame-like radiance descends on a creature that you can see within range. The target must succeed on a Dexterity saving throw or take 1d8 radiant damage. The target gains no benefit from cover for this saving throw.', 'This spell''s damage increases by 1d8 when you reach 5th level (2d8), 11th level (3d8), and 17th level (4d8).', 'rules.txt', 101),

('Ray of Frost', 'ray-of-frost', 0, 'Evocation', '1 action', '60 feet', 'V, S', NULL, 'Instantaneous', FALSE, FALSE, 'A frigid beam of blue-white light streaks toward a creature within range. Make a ranged spell attack against the target. On a hit, it takes 1d8 cold damage, and its speed is reduced by 10 feet until the start of your next turn.', 'This spell''s damage increases by 1d8 when you reach 5th level (2d8), 11th level (3d8), and 17th level (4d8).', 'rules.txt', 100),

('Dancing Lights', 'dancing-lights', 0, 'Evocation', '1 action', '120 feet', 'V, S, M', 'a bit of phosphorus or wychwood, or a glowworm', 'Up to 1 minute', TRUE, FALSE, 'You create up to four torch-sized lights within range, making them appear as torches, lanterns, or glowing orbs that hover in the air for the duration. You can also combine the four lights into one glowing vaguely humanoid form of Medium size. Whichever form you choose, each light sheds dim light in a 10-foot radius.', NULL, 'rules.txt', 89),

('Guidance', 'guidance', 0, 'Divination', '1 action', 'Touch', 'V, S', NULL, 'Up to 1 minute', TRUE, FALSE, 'You touch one willing creature. Once before the spell ends, the target can roll a d4 and add the number rolled to one ability check of its choice. It can roll the die before or after making the ability check. The spell then ends.', NULL, 'rules.txt', 92),

('Minor Illusion', 'minor-illusion', 0, 'Illusion', '1 action', '30 feet', 'S, M', 'a bit of fleece', '1 minute', FALSE, FALSE, 'You create a sound or an image of an object within range that lasts for the duration. The illusion also ends if you dismiss it as an action or cast this spell again.', NULL, 'rules.txt', 97),

('Poison Spray', 'poison-spray', 0, 'Conjuration', '1 action', '10 feet', 'V, S', NULL, 'Instantaneous', FALSE, FALSE, 'You extend your hand toward a creature you can see within range and project a puff of noxious gas from your palm. The creature must succeed on a Constitution saving throw or take 1d12 poison damage.', 'This spell''s damage increases by 1d12 when you reach 5th level (2d12), 11th level (3d12), and 17th level (4d12).', 'rules.txt', 99),

('Resistance', 'resistance', 0, 'Abjuration', '1 action', 'Touch', 'V, S, M', 'a miniature cloak', 'Up to 1 minute', TRUE, FALSE, 'You touch one willing creature. Once before the spell ends, the target can roll a d4 and add the number rolled to one saving throw of its choice. It can roll the die before or after making the saving throw. The spell then ends.', NULL, 'rules.txt', 100),

('Shocking Grasp', 'shocking-grasp', 0, 'Evocation', '1 action', 'Touch', 'V, S', NULL, 'Instantaneous', FALSE, FALSE, 'Lightning springs from your hand to deliver a shock to a creature you try to touch. Make a melee spell attack against the target. You have advantage on the attack roll if the target is wearing armor made of metal. On a hit, the target takes 1d8 lightning damage, and it can''t take reactions until the start of its next turn.', 'This spell''s damage increases by 1d8 when you reach 5th level (2d8), 11th level (3d8), and 17th level (4d8).', 'rules.txt', 103),

('Spare the Dying', 'spare-the-dying', 0, 'Necromancy', '1 action', 'Touch', 'V, S', NULL, 'Instantaneous', FALSE, FALSE, 'You touch a living creature that has 0 hit points. The creature becomes stable. This spell has no effect on undead or constructs.', NULL, 'rules.txt', 103),

('Thaumaturgy', 'thaumaturgy', 0, 'Transmutation', '1 action', '30 feet', 'V', NULL, 'Up to 1 minute', FALSE, FALSE, 'You manifest a minor wonder, a sign of supernatural power, within range. You create one of the following magical effects: Your voice booms up to three times as loud as normal for 1 minute. You cause flames to flicker, brighten, dim, or change color for 1 minute. You cause harmless tremors in the ground for 1 minute. You create an instantaneous sound.', NULL, 'rules.txt', 104),

('Chill Touch', 'chill-touch', 0, 'Necromancy', '1 action', '120 feet', 'V, S', NULL, '1 round', FALSE, FALSE, 'You create a ghostly, skeletal hand in the space of a creature within range. Make a ranged spell attack against the creature to assail it with the chill of the grave. On a hit, the target takes 1d8 necrotic damage, and it can''t regain hit points until the start of your next turn.', 'This spell''s damage increases by 1d8 when you reach 5th level (2d8), 11th level (3d8), and 17th level (4d8).', 'rules.txt', 88),

('Eldritch Blast', 'eldritch-blast', 0, 'Evocation', '1 action', '120 feet', 'V, S', NULL, 'Instantaneous', FALSE, FALSE, 'A beam of crackling energy streaks toward a creature within range. Make a ranged spell attack against the target. On a hit, the target takes 1d10 force damage.', 'The spell creates more than one beam when you reach higher levels: two beams at 5th level, three beams at 11th level, and four beams at 17th level. You can direct the beams at the same target or at different ones.', 'rules.txt', 90),

('True Strike', 'true-strike', 0, 'Divination', '1 action', '30 feet', 'S', NULL, 'Up to 1 round', TRUE, FALSE, 'You extend your hand and point a finger at a target in range. Your magic grants you a brief insight into the target''s defenses. On your next turn, you gain advantage on your first attack roll against the target, provided that this spell hasn''t ended.', NULL, 'rules.txt', 104),

('Vicious Mockery', 'vicious-mockery', 0, 'Enchantment', '1 action', '60 feet', 'V', NULL, 'Instantaneous', FALSE, FALSE, 'You unleash a string of insults laced with subtle enchantments at a creature you can see within range. If the target can hear you, it must succeed on a Wisdom saving throw or take 1d4 psychic damage and have disadvantage on the next attack roll it makes before the end of its next turn.', 'This spell''s damage increases by 1d4 when you reach 5th level (2d4), 11th level (3d4), and 17th level (4d4).', 'rules.txt', 105);

-- 1st Level Spells
INSERT INTO spells (name, slug, level, school, casting_time, range, components, materials, duration, concentration, ritual, description, at_higher_levels, source_document, source_page) VALUES
('Magic Missile', 'magic-missile', 1, 'Evocation', '1 action', '120 feet', 'V, S', NULL, 'Instantaneous', FALSE, FALSE, 'You create three glowing darts of magical force. Each dart hits a creature of your choice that you can see within range. A dart deals 1d4 + 1 force damage to its target. The darts all strike simultaneously, and you can direct them to hit one creature or several.', 'When you cast this spell using a spell slot of 2nd level or higher, the spell creates one more dart for each slot level above 1st.', 'rules.txt', 96),

('Shield', 'shield', 1, 'Abjuration', '1 reaction', 'Self', 'V, S', NULL, '1 round', FALSE, FALSE, 'An invisible barrier of magical force appears and protects you. Until the start of your next turn, you have a +5 bonus to AC, including against the triggering attack, and you take no damage from magic missile.', NULL, 'rules.txt', 102),

('Cure Wounds', 'cure-wounds', 1, 'Evocation', '1 action', 'Touch', 'V, S', NULL, 'Instantaneous', FALSE, FALSE, 'A creature you touch regains a number of hit points equal to 1d8 + your spellcasting ability modifier. This spell has no effect on undead or constructs.', 'When you cast this spell using a spell slot of 2nd level or higher, the healing increases by 1d8 for each slot level above 1st.', 'rules.txt', 89),

('Detect Magic', 'detect-magic', 1, 'Divination', '1 action', 'Self', 'V, S', NULL, 'Up to 10 minutes', TRUE, TRUE, 'For the duration, you sense the presence of magic within 30 feet of you. If you sense magic in this way, you can use your action to see a faint aura around any visible creature or object in the area that bears magic, and you learn its school of magic, if any.', NULL, 'rules.txt', 90),

('Sleep', 'sleep', 1, 'Enchantment', '1 action', '90 feet', 'V, S, M', 'a pinch of fine sand, rose petals, or a cricket', '1 minute', FALSE, FALSE, 'This spell sends creatures into a magical slumber. Roll 5d8; the total is how many hit points of creatures this spell can affect. Creatures within 20 feet of a point you choose within range are affected in ascending order of their current hit points (ignoring unconscious creatures). Starting with the creature that has the lowest current hit points, each creature affected by this spell falls unconscious until the spell ends, the sleeper takes damage, or someone uses an action to shake or slap the sleeper awake.', 'When you cast this spell using a spell slot of 2nd level or higher, roll an additional 2d8 for each slot level above 1st.', 'rules.txt', 103),

('Thunderwave', 'thunderwave', 1, 'Evocation', '1 action', 'Self (15-foot cube)', 'V, S', NULL, 'Instantaneous', FALSE, FALSE, 'A wave of thunderous force sweeps out from you. Each creature in a 15-foot cube originating from you must make a Constitution saving throw. On a failed save, a creature takes 2d8 thunder damage and is pushed 10 feet away from you. On a successful save, the creature takes half as much damage and isn''t pushed.', 'When you cast this spell using a spell slot of 2nd level or higher, the damage increases by 1d8 for each slot level above 1st.', 'rules.txt', 104),

('Bless', 'bless', 1, 'Enchantment', '1 action', '30 feet', 'V, S, M', 'a sprinkling of holy water', 'Up to 1 minute', TRUE, FALSE, 'You bless up to three creatures of your choice within range. Whenever a target makes an attack roll or a saving throw before the spell ends, the target can roll a d4 and add the number rolled to the attack roll or saving throw.', 'When you cast this spell using a spell slot of 2nd level or higher, you can target one additional creature for each slot level above 1st.', 'rules.txt', 87),

('Burning Hands', 'burning-hands', 1, 'Evocation', '1 action', 'Self (15-foot cone)', 'V, S', NULL, 'Instantaneous', FALSE, FALSE, 'As you hold your hands with thumbs touching and fingers spread, a thin sheet of flames shoots forth from your outstretched fingertips. Each creature in a 15-foot cone must make a Dexterity saving throw. A creature takes 3d6 fire damage on a failed save, or half as much damage on a successful one.', 'When you cast this spell using a spell slot of 2nd level or higher, the damage increases by 1d6 for each slot level above 1st.', 'rules.txt', 88),

('Charm Person', 'charm-person', 1, 'Enchantment', '1 action', '30 feet', 'V, S', NULL, '1 hour', FALSE, FALSE, 'You attempt to charm a humanoid you can see within range. It must make a Wisdom saving throw, and does so with advantage if you or your companions are fighting it. If it fails the saving throw, it is charmed by you until the spell ends or until you or your companions do anything harmful to it.', 'When you cast this spell using a spell slot of 2nd level or higher, you can target one additional creature for each slot level above 1st.', 'rules.txt', 88),

('Command', 'command', 1, 'Enchantment', '1 action', '60 feet', 'V', NULL, '1 round', FALSE, FALSE, 'You speak a one-word command to a creature you can see within range. The target must succeed on a Wisdom saving throw or follow the command on its next turn. The spell has no effect if the target is undead, if it doesn''t understand your language, or if your command is directly harmful to it.', 'When you cast this spell using a spell slot of 2nd level or higher, you can affect one additional creature for each slot level above 1st.', 'rules.txt', 88),

('Comprehend Languages', 'comprehend-languages', 1, 'Divination', '1 action', 'Self', 'V, S, M', 'a pinch of soot and salt', '1 hour', FALSE, TRUE, 'For the duration, you understand the literal meaning of any spoken language that you hear. You also understand any written language that you see, but you must be touching the surface on which the words are written.', NULL, 'rules.txt', 88),

('Disguise Self', 'disguise-self', 1, 'Illusion', '1 action', 'Self', 'V, S', NULL, '1 hour', FALSE, FALSE, 'You make yourself—including your clothing, armor, weapons, and other belongings on your person—look different until the spell ends or until you use your action to dismiss it. You can seem 1 foot shorter or taller and can appear thin, fat, or in between.', NULL, 'rules.txt', 90),

('Guiding Bolt', 'guiding-bolt', 1, 'Evocation', '1 action', '120 feet', 'V, S', NULL, '1 round', FALSE, FALSE, 'A flash of light streaks toward a creature of your choice within range. Make a ranged spell attack against the target. On a hit, the target takes 4d6 radiant damage, and the next attack roll made against this target before the end of your next turn has advantage.', 'When you cast this spell using a spell slot of 2nd level or higher, the damage increases by 1d6 for each slot level above 1st.', 'rules.txt', 92),

('Healing Word', 'healing-word', 1, 'Evocation', '1 bonus action', '60 feet', 'V', NULL, 'Instantaneous', FALSE, FALSE, 'A creature of your choice that you can see within range regains hit points equal to 1d4 + your spellcasting ability modifier. This spell has no effect on undead or constructs.', 'When you cast this spell using a spell slot of 2nd level or higher, the healing increases by 1d4 for each slot level above 1st.', 'rules.txt', 93),

('Identify', 'identify', 1, 'Divination', '1 minute', 'Touch', 'V, S, M', 'a pearl worth at least 100 gp and an owl feather', 'Instantaneous', FALSE, TRUE, 'You choose one object that you must touch throughout the casting of the spell. If it is a magic item or some other magic-imbued object, you learn its properties and how to use them, whether it requires attunement to use, and how many charges it has, if any.', NULL, 'rules.txt', 93),

('Inflict Wounds', 'inflict-wounds', 1, 'Necromancy', '1 action', 'Touch', 'V, S', NULL, 'Instantaneous', FALSE, FALSE, 'Make a melee spell attack against a creature you can reach. On a hit, the target takes 3d10 necrotic damage.', 'When you cast this spell using a spell slot of 2nd level or higher, the damage increases by 1d10 for each slot level above 1st.', 'rules.txt', 94),

('Mage Armor', 'mage-armor', 1, 'Abjuration', '1 action', 'Touch', 'V, S, M', 'a piece of cured leather', '8 hours', FALSE, FALSE, 'You touch a willing creature who isn''t wearing armor, and a protective magical force surrounds it until the spell ends. The target''s base AC becomes 13 + its Dexterity modifier. The spell ends if the target dons armor or if you dismiss the spell as an action.', NULL, 'rules.txt', 95),

('Sanctuary', 'sanctuary', 1, 'Abjuration', '1 bonus action', '30 feet', 'V, S, M', 'a small silver mirror', '1 minute', FALSE, FALSE, 'You ward a creature within range against attack. Until the spell ends, any creature who targets the warded creature with an attack or a harmful spell must first make a Wisdom saving throw. On a failed save, the creature must choose a new target or lose the attack or spell.', NULL, 'rules.txt', 101),

('Shield of Faith', 'shield-of-faith', 1, 'Abjuration', '1 bonus action', '60 feet', 'V, S, M', 'a small parchment with a bit of holy text written on it', 'Up to 10 minutes', TRUE, FALSE, 'A shimmering field appears and surrounds a creature of your choice within range, granting it a +2 bonus to AC for the duration.', NULL, 'rules.txt', 102),

('Silent Image', 'silent-image', 1, 'Illusion', '1 action', '60 feet', 'V, S, M', 'a bit of fleece', 'Up to 10 minutes', TRUE, FALSE, 'You create the image of an object, a creature, or some other visible phenomenon that is no larger than a 15-foot cube. The image appears at a spot within range and lasts for the duration. The image is purely visual; it isn''t accompanied by sound, smell, or other sensory effects.', NULL, 'rules.txt', 103),

('Witch Bolt', 'witch-bolt', 1, 'Evocation', '1 action', '30 feet', 'V, S, M', 'a twig from a tree that has been struck by lightning', 'Up to 1 minute', TRUE, FALSE, 'A beam of crackling, blue energy lances out toward a creature within range, forming a sustained arc of lightning between you and the target. Make a ranged spell attack against that creature. On a hit, the target takes 1d12 lightning damage, and on each of your turns for the duration, you can use your action to deal 1d12 lightning damage to the target automatically.', 'When you cast this spell using a spell slot of 2nd level or higher, the initial damage increases by 1d12 for each slot level above 1st.', 'rules.txt', 106),

('Faerie Fire', 'faerie-fire', 1, 'Evocation', '1 action', '60 feet', 'V', NULL, 'Up to 1 minute', TRUE, FALSE, 'Each object in a 20-foot cube within range is outlined in blue, green, or violet light (your choice). Any creature in the area when the spell is cast is also outlined in light if it fails a Dexterity saving throw. For the duration, objects and affected creatures shed dim light in a 10-foot radius. Any attack roll against an affected creature or object has advantage if the attacker can see it, and the affected creature or object can''t benefit from being invisible.', NULL, 'rules.txt', 91),

('Fog Cloud', 'fog-cloud', 1, 'Conjuration', '1 action', '120 feet', 'V, S', NULL, 'Up to 1 hour', TRUE, FALSE, 'You create a 20-foot-radius sphere of fog centered on a point within range. The sphere spreads around corners, and its area is heavily obscured. It lasts for the duration or until a wind of moderate or greater speed (at least 10 miles per hour) disperses it.', 'When you cast this spell using a spell slot of 2nd level or higher, the radius of the fog increases by 20 feet for each slot level above 1st.', 'rules.txt', 91),

('Entangle', 'entangle', 1, 'Conjuration', '1 action', '90 feet', 'V, S', NULL, 'Up to 1 minute', TRUE, FALSE, 'Grasping weeds and vines sprout from the ground in a 20-foot square starting from a point within range. For the duration, these plants turn the ground in the area into difficult terrain. A creature in the area when you cast the spell must succeed on a Strength saving throw or be restrained by the entangling plants until the spell ends.', NULL, 'rules.txt', 90),

('Hunter''s Mark', 'hunters-mark', 1, 'Divination', '1 bonus action', '90 feet', 'V', NULL, 'Up to 1 hour', TRUE, FALSE, 'You choose a creature you can see within range and mystically mark it as your quarry. Until the spell ends, you deal an extra 1d6 damage to the target whenever you hit it with a weapon attack, and you have advantage on any Wisdom (Perception) or Wisdom (Survival) check you make to find it.', 'When you cast this spell using a spell slot of 3rd or 4th level, you can maintain your concentration on the spell for up to 8 hours. When you use a spell slot of 5th level or higher, you can maintain your concentration on the spell for up to 24 hours.', 'rules.txt', 93),

('Hex', 'hex', 1, 'Enchantment', '1 bonus action', '90 feet', 'V, S, M', 'the petrified eye of a newt', 'Up to 1 hour', TRUE, FALSE, 'You place a curse on a creature that you can see within range. Until the spell ends, you deal an extra 1d6 necrotic damage to the target whenever you hit it with an attack. Also, choose one ability when you cast the spell. The target has disadvantage on ability checks made with the chosen ability.', 'When you cast this spell using a spell slot of 3rd or 4th level, you can maintain your concentration on the spell for up to 8 hours. When you use a spell slot of 5th level or higher, you can maintain your concentration on the spell for up to 24 hours.', 'rules.txt', 93),

('Color Spray', 'color-spray', 1, 'Illusion', '1 action', 'Self (15-foot cone)', 'V, S, M', 'a pinch of powder or sand that is colored red, yellow, and blue', '1 round', FALSE, FALSE, 'A dazzling array of flashing, colored light springs from your hand. Roll 6d10; the total is how many hit points of creatures this spell can affect. Creatures in a 15-foot cone originating from you are affected in ascending order of their current hit points.', 'When you cast this spell using a spell slot of 2nd level or higher, roll an additional 2d10 for each slot level above 1st.', 'rules.txt', 88);

-- 2nd Level Spells
INSERT INTO spells (name, slug, level, school, casting_time, range, components, materials, duration, concentration, ritual, description, at_higher_levels, source_document, source_page) VALUES
('Hold Person', 'hold-person', 2, 'Enchantment', '1 action', '60 feet', 'V, S, M', 'a small, straight piece of iron', 'Up to 1 minute', TRUE, FALSE, 'Choose a humanoid that you can see within range. The target must succeed on a Wisdom saving throw or be paralyzed for the duration. At the end of each of its turns, the target can make another Wisdom saving throw. On a success, the spell ends on the target.', 'When you cast this spell using a spell slot of 3rd level or higher, you can target one additional humanoid for each slot level above 2nd.', 'rules.txt', 93),

('Invisibility', 'invisibility', 2, 'Illusion', '1 action', 'Touch', 'V, S, M', 'an eyelash encased in gum arabic', 'Up to 1 hour', TRUE, FALSE, 'A creature you touch becomes invisible until the spell ends. Anything the target is wearing or carrying is invisible as long as it is on the target''s person. The spell ends for a target that attacks or casts a spell.', 'When you cast this spell using a spell slot of 3rd level or higher, you can target one additional creature for each slot level above 2nd.', 'rules.txt', 94),

('Misty Step', 'misty-step', 2, 'Conjuration', '1 bonus action', 'Self', 'V', NULL, 'Instantaneous', FALSE, FALSE, 'Briefly surrounded by silvery mist, you teleport up to 30 feet to an unoccupied space that you can see.', NULL, 'rules.txt', 97),

('Scorching Ray', 'scorching-ray', 2, 'Evocation', '1 action', '120 feet', 'V, S', NULL, 'Instantaneous', FALSE, FALSE, 'You create three rays of fire and hurl them at targets within range. You can hurl them at one target or several. Make a ranged spell attack for each ray. On a hit, the target takes 2d6 fire damage.', 'When you cast this spell using a spell slot of 3rd level or higher, you create one additional ray for each slot level above 2nd.', 'rules.txt', 102),

('Spiritual Weapon', 'spiritual-weapon', 2, 'Evocation', '1 bonus action', '60 feet', 'V, S', NULL, '1 minute', FALSE, FALSE, 'You create a floating, spectral weapon within range that lasts for the duration or until you cast this spell again. When you cast the spell, you can make a melee spell attack against a creature within 5 feet of the weapon. On a hit, the target takes force damage equal to 1d8 + your spellcasting ability modifier. As a bonus action on your turn, you can move the weapon up to 20 feet and repeat the attack against a creature within 5 feet of it.', 'When you cast this spell using a spell slot of 3rd level or higher, the damage increases by 1d8 for every two slot levels above 2nd.', 'rules.txt', 103),

('Aid', 'aid', 2, 'Abjuration', '1 action', '30 feet', 'V, S, M', 'a tiny strip of white cloth', '8 hours', FALSE, FALSE, 'Your spell bolsters your allies with toughness and resolve. Choose up to three creatures within range. Each target''s hit point maximum and current hit points increase by 5 for the duration.', 'When you cast this spell using a spell slot of 3rd level or higher, a target''s hit points increase by an additional 5 for each slot level above 2nd.', 'rules.txt', 86),

('Darkness', 'darkness', 2, 'Evocation', '1 action', '60 feet', 'V, M', 'bat fur and a drop of pitch or piece of coal', 'Up to 10 minutes', TRUE, FALSE, 'Magical darkness spreads from a point you choose within range to fill a 15-foot-radius sphere for the duration. The darkness spreads around corners. A creature with darkvision can''t see through this darkness, and nonmagical light can''t illuminate it.', NULL, 'rules.txt', 89),

('Flaming Sphere', 'flaming-sphere', 2, 'Conjuration', '1 action', '60 feet', 'V, S, M', 'a bit of tallow, a pinch of brimstone, and a dusting of powite iron', 'Up to 1 minute', TRUE, FALSE, 'A 5-foot-diameter sphere of fire appears in an unoccupied space of your choice within range and lasts for the duration. Any creature that ends its turn within 5 feet of the sphere must make a Dexterity saving throw. The creature takes 2d6 fire damage on a failed save, or half as much damage on a successful one.', 'When you cast this spell using a spell slot of 3rd level or higher, the damage increases by 1d6 for each slot level above 2nd.', 'rules.txt', 91),

('Knock', 'knock', 2, 'Transmutation', '1 action', '60 feet', 'V', NULL, 'Instantaneous', FALSE, FALSE, 'Choose an object that you can see within range. The object can be a door, a box, a chest, a set of manacles, a padlock, or another object that contains a mundane or magical means that prevents access. A target that is held shut by a mundane lock or that is stuck or barred becomes unlocked, unstuck, or unbarred.', NULL, 'rules.txt', 94),

('Lesser Restoration', 'lesser-restoration', 2, 'Abjuration', '1 action', 'Touch', 'V, S', NULL, 'Instantaneous', FALSE, FALSE, 'You touch a creature and can end either one disease or one condition afflicting it. The condition can be blinded, deafened, paralyzed, or poisoned.', NULL, 'rules.txt', 95),

('Levitate', 'levitate', 2, 'Transmutation', '1 action', '60 feet', 'V, S, M', 'either a small leather loop or a piece of golden wire bent into a cup shape with a long shank on one end', 'Up to 10 minutes', TRUE, FALSE, 'One creature or loose object of your choice that you can see within range rises vertically, up to 20 feet, and remains suspended there for the duration. The spell can levitate a target that weighs up to 500 pounds.', NULL, 'rules.txt', 95),

('Magic Weapon', 'magic-weapon', 2, 'Transmutation', '1 bonus action', 'Touch', 'V, S', NULL, 'Up to 1 hour', TRUE, FALSE, 'You touch a nonmagical weapon. Until the spell ends, that weapon becomes a magic weapon with a +1 bonus to attack rolls and damage rolls.', 'When you cast this spell using a spell slot of 4th level or higher, the bonus increases to +2. When you use a spell slot of 6th level or higher, the bonus increases to +3.', 'rules.txt', 96),

('Prayer of Healing', 'prayer-of-healing', 2, 'Evocation', '10 minutes', '30 feet', 'V', NULL, 'Instantaneous', FALSE, FALSE, 'Up to six creatures of your choice that you can see within range each regain hit points equal to 2d8 + your spellcasting ability modifier. This spell has no effect on undead or constructs.', 'When you cast this spell using a spell slot of 3rd level or higher, the healing increases by 1d8 for each slot level above 2nd.', 'rules.txt', 99),

('Shatter', 'shatter', 2, 'Evocation', '1 action', '60 feet', 'V, S, M', 'a chip of mica', 'Instantaneous', FALSE, FALSE, 'A sudden loud ringing noise, painfully intense, erupts from a point of your choice within range. Each creature in a 10-foot-radius sphere centered on that point must make a Constitution saving throw. A creature takes 3d8 thunder damage on a failed save, or half as much damage on a successful one.', 'When you cast this spell using a spell slot of 3rd level or higher, the damage increases by 1d8 for each slot level above 2nd.', 'rules.txt', 102),

('Spider Climb', 'spider-climb', 2, 'Transmutation', '1 action', 'Touch', 'V, S, M', 'a drop of bitumen and a spider', 'Up to 1 hour', TRUE, FALSE, 'Until the spell ends, one willing creature you touch gains the ability to move up, down, and across vertical surfaces and upside down along ceilings, while leaving its hands free. The target also gains a climbing speed equal to its walking speed.', NULL, 'rules.txt', 103),

('Suggestion', 'suggestion', 2, 'Enchantment', '1 action', '30 feet', 'V, M', 'a snake''s tongue and either a bit of honeycomb or a drop of sweet oil', 'Up to 8 hours', TRUE, FALSE, 'You suggest a course of activity (limited to a sentence or two) and magically influence a creature you can see within range that can hear and understand you. The suggestion must be worded in such a manner as to make the course of action sound reasonable.', NULL, 'rules.txt', 103),

('Web', 'web', 2, 'Conjuration', '1 action', '60 feet', 'V, S, M', 'a bit of spiderweb', 'Up to 1 hour', TRUE, FALSE, 'You conjure a mass of thick, sticky webbing at a point of your choice within range. The webs fill a 20-foot cube from that point for the duration. The webs are difficult terrain and lightly obscure their area.', NULL, 'rules.txt', 105),

('Blur', 'blur', 2, 'Illusion', '1 action', 'Self', 'V', NULL, 'Up to 1 minute', TRUE, FALSE, 'Your body becomes blurred, shifting and wavering to all who can see you. For the duration, any creature has disadvantage on attack rolls against you. An attacker is immune to this effect if it doesn''t rely on sight, as with blindsight, or can see through illusions, as with truesight.', NULL, 'rules.txt', 87),

('Mirror Image', 'mirror-image', 2, 'Illusion', '1 action', 'Self', 'V, S', NULL, '1 minute', FALSE, FALSE, 'Three illusory duplicates of yourself appear in your space. Until the spell ends, the duplicates move with you and mimic your actions, shifting position so it''s impossible to track which image is real.', NULL, 'rules.txt', 97),

('Moonbeam', 'moonbeam', 2, 'Evocation', '1 action', '120 feet', 'V, S, M', 'several seeds of any moonseed plant and a piece of opalescent feldspar', 'Up to 1 minute', TRUE, FALSE, 'A silvery beam of pale light shines down in a 5-foot-radius, 40-foot-high cylinder centered on a point within range. Until the spell ends, dim light fills the cylinder. When a creature enters the spell''s area for the first time on a turn or starts its turn there, it is engulfed in ghostly flames that cause searing pain, and it must make a Constitution saving throw. It takes 2d10 radiant damage on a failed save, or half as much damage on a successful one.', 'When you cast this spell using a spell slot of 3rd level or higher, the damage increases by 1d10 for each slot level above 2nd.', 'rules.txt', 97),

('Heat Metal', 'heat-metal', 2, 'Transmutation', '1 action', '60 feet', 'V, S, M', 'a piece of iron and a flame', 'Up to 1 minute', TRUE, FALSE, 'Choose a manufactured metal object, such as a metal weapon or a suit of heavy or medium metal armor, that you can see within range. You cause the object to glow red-hot. Any creature in physical contact with the object takes 2d8 fire damage when you cast the spell. Until the spell ends, you can use a bonus action on each of your subsequent turns to cause this damage again.', 'When you cast this spell using a spell slot of 3rd level or higher, the damage increases by 1d8 for each slot level above 2nd.', 'rules.txt', 93);

-- 3rd Level Spells
INSERT INTO spells (name, slug, level, school, casting_time, range, components, materials, duration, concentration, ritual, description, at_higher_levels, source_document, source_page) VALUES
('Fireball', 'fireball', 3, 'Evocation', '1 action', '150 feet', 'V, S, M', 'a tiny ball of bat guano and sulfur', 'Instantaneous', FALSE, FALSE, 'A bright streak flashes from your pointing finger to a point you choose within range and then blossoms with a low roar into an explosion of flame. Each creature in a 20-foot-radius sphere centered on that point must make a Dexterity saving throw. A target takes 8d6 fire damage on a failed save, or half as much damage on a successful one. The fire spreads around corners. It ignites flammable objects in the area that aren''t being worn or carried.', 'When you cast this spell using a spell slot of 4th level or higher, the damage increases by 1d6 for each slot level above 3rd.', 'rules.txt', 91),

('Lightning Bolt', 'lightning-bolt', 3, 'Evocation', '1 action', 'Self (100-foot line)', 'V, S, M', 'a bit of fur and a rod of amber, crystal, or glass', 'Instantaneous', FALSE, FALSE, 'A stroke of lightning forming a line 100 feet long and 5 feet wide blasts out from you in a direction you choose. Each creature in the line must make a Dexterity saving throw. A creature takes 8d6 lightning damage on a failed save, or half as much damage on a successful one. The lightning ignites flammable objects in the area that aren''t being worn or carried.', 'When you cast this spell using a spell slot of 4th level or higher, the damage increases by 1d6 for each slot level above 3rd.', 'rules.txt', 95),

('Counterspell', 'counterspell', 3, 'Abjuration', '1 reaction', '60 feet', 'S', NULL, 'Instantaneous', FALSE, FALSE, 'You attempt to interrupt a creature in the process of casting a spell. If the creature is casting a spell of 3rd level or lower, its spell fails and has no effect. If it is casting a spell of 4th level or higher, make an ability check using your spellcasting ability. The DC equals 10 + the spell''s level. On a success, the creature''s spell fails and has no effect.', 'When you cast this spell using a spell slot of 4th level or higher, the interrupted spell has no effect if its level is less than or equal to the level of the spell slot you used.', 'rules.txt', 89),

('Dispel Magic', 'dispel-magic', 3, 'Abjuration', '1 action', '120 feet', 'V, S', NULL, 'Instantaneous', FALSE, FALSE, 'Choose one creature, object, or magical effect within range. Any spell of 3rd level or lower on the target ends. For each spell of 4th level or higher on the target, make an ability check using your spellcasting ability. The DC equals 10 + the spell''s level. On a successful check, the spell ends.', 'When you cast this spell using a spell slot of 4th level or higher, you automatically end the effects of a spell on the target if the spell''s level is equal to or less than the level of the spell slot you used.', 'rules.txt', 90),

('Fly', 'fly', 3, 'Transmutation', '1 action', 'Touch', 'V, S, M', 'a wing feather from any bird', 'Up to 10 minutes', TRUE, FALSE, 'You touch a willing creature. The target gains a flying speed of 60 feet for the duration. When the spell ends, the target falls if it is still aloft, unless it can stop the fall.', 'When you cast this spell using a spell slot of 4th level or higher, you can target one additional creature for each slot level above 3rd.', 'rules.txt', 92),

('Haste', 'haste', 3, 'Transmutation', '1 action', '30 feet', 'V, S, M', 'a shaving of licorice root', 'Up to 1 minute', TRUE, FALSE, 'Choose a willing creature that you can see within range. Until the spell ends, the target''s speed is doubled, it gains a +2 bonus to AC, it has advantage on Dexterity saving throws, and it gains an additional action on each of its turns. That action can be used only to take the Attack (one weapon attack only), Dash, Disengage, Hide, or Use an Object action. When the spell ends, the target can''t move or take actions until after its next turn, as a wave of lethargy sweeps over it.', NULL, 'rules.txt', 92),

('Slow', 'slow', 3, 'Transmutation', '1 action', '120 feet', 'V, S, M', 'a drop of molasses', 'Up to 1 minute', TRUE, FALSE, 'You alter time around up to six creatures of your choice in a 40-foot cube within range. Each target must succeed on a Wisdom saving throw or be affected by this spell for the duration. An affected target''s speed is halved, it takes a −2 penalty to AC and Dexterity saving throws, and it can''t use reactions.', NULL, 'rules.txt', 103),

('Fear', 'fear', 3, 'Illusion', '1 action', 'Self (30-foot cone)', 'V, S, M', 'a white feather or the heart of a hen', 'Up to 1 minute', TRUE, FALSE, 'You project a phantasmal image of a creature''s worst fears. Each creature in a 30-foot cone must succeed on a Wisdom saving throw or drop whatever it is holding and become frightened for the duration.', NULL, 'rules.txt', 91),

('Hypnotic Pattern', 'hypnotic-pattern', 3, 'Illusion', '1 action', '120 feet', 'S, M', 'a glowing stick of incense or a crystal vial filled with phosphorescent material', 'Up to 1 minute', TRUE, FALSE, 'You create a twisting pattern of colors that weaves through the air inside a 30-foot cube within range. The pattern appears for a moment and vanishes. Each creature in the area who sees the pattern must make a Wisdom saving throw. On a failed save, the creature becomes charmed for the duration.', NULL, 'rules.txt', 93),

('Major Image', 'major-image', 3, 'Illusion', '1 action', '120 feet', 'V, S, M', 'a bit of fleece', 'Up to 10 minutes', TRUE, FALSE, 'You create the image of an object, a creature, or some other visible phenomenon that is no larger than a 20-foot cube. The image appears at a spot that you can see within range and lasts for the duration. It seems completely real, including sounds, smells, and temperature appropriate to the thing depicted.', 'When you cast this spell using a spell slot of 6th level or higher, the spell lasts until dispelled, without requiring your concentration.', 'rules.txt', 96),

('Protection from Energy', 'protection-from-energy', 3, 'Abjuration', '1 action', 'Touch', 'V, S', NULL, 'Up to 1 hour', TRUE, FALSE, 'For the duration, the willing creature you touch has resistance to one damage type of your choice: acid, cold, fire, lightning, or thunder.', NULL, 'rules.txt', 100),

('Revivify', 'revivify', 3, 'Necromancy', '1 action', 'Touch', 'V, S, M', 'diamonds worth 300 gp, which the spell consumes', 'Instantaneous', FALSE, FALSE, 'You touch a creature that has died within the last minute. That creature returns to life with 1 hit point. This spell can''t return to life a creature that has died of old age, nor can it restore any missing body parts.', NULL, 'rules.txt', 101),

('Spirit Guardians', 'spirit-guardians', 3, 'Conjuration', '1 action', 'Self (15-foot radius)', 'V, S, M', 'a holy symbol', 'Up to 10 minutes', TRUE, FALSE, 'You call forth spirits to protect you. They flit around you to a distance of 15 feet for the duration. If you are good or neutral, their spectral form appears angelic or fey. If you are evil, they appear fiendish.', 'When you cast this spell using a spell slot of 4th level or higher, the damage increases by 1d8 for each slot level above 3rd.', 'rules.txt', 103),

('Vampiric Touch', 'vampiric-touch', 3, 'Necromancy', '1 action', 'Self', 'V, S', NULL, 'Up to 1 minute', TRUE, FALSE, 'The touch of your shadow-wreathed hand can siphon life force from others to heal your wounds. Make a melee spell attack against a creature within your reach. On a hit, the target takes 3d6 necrotic damage, and you regain hit points equal to half the amount of necrotic damage dealt.', 'When you cast this spell using a spell slot of 4th level or higher, the damage increases by 1d6 for each slot level above 3rd.', 'rules.txt', 105),

('Animate Dead', 'animate-dead', 3, 'Necromancy', '1 minute', '10 feet', 'V, S, M', 'a drop of blood, a piece of flesh, and a pinch of bone dust', 'Instantaneous', FALSE, FALSE, 'This spell creates an undead servant. Choose a pile of bones or a corpse of a Medium or Small humanoid within range. Your spell imbues the target with a foul mimicry of life, raising it as an undead creature.', 'When you cast this spell using a spell slot of 4th level or higher, you animate or reassert control over two additional undead creatures for each slot level above 3rd.', 'rules.txt', 86),

('Call Lightning', 'call-lightning', 3, 'Conjuration', '1 action', '120 feet', 'V, S', NULL, 'Up to 10 minutes', TRUE, FALSE, 'A storm cloud appears in the shape of a cylinder that is 10 feet tall with a 60-foot radius, centered on a point you can see within range directly above you. The spell fails if you can''t see a point in the air where the storm cloud could appear.', 'When you cast this spell using a spell slot of 4th or higher level, the damage increases by 1d10 for each slot level above 3rd.', 'rules.txt', 88),

('Tongues', 'tongues', 3, 'Divination', '1 action', 'Touch', 'V, M', 'a small clay model of a ziggurat', '1 hour', FALSE, FALSE, 'This spell grants the creature you touch the ability to understand any spoken language it hears. Moreover, when the target speaks, any creature that knows at least one language and can hear the target understands what it says.', NULL, 'rules.txt', 104),

('Remove Curse', 'remove-curse', 3, 'Abjuration', '1 action', 'Touch', 'V, S', NULL, 'Instantaneous', FALSE, FALSE, 'At your touch, all curses affecting one creature or object end. If the object is a cursed magic item, its curse remains, but the spell breaks its owner''s attunement to the object so it can be removed or discarded.', NULL, 'rules.txt', 100);

-- 4th Level Spells
INSERT INTO spells (name, slug, level, school, casting_time, range, components, materials, duration, concentration, ritual, description, at_higher_levels, source_document, source_page) VALUES
('Banishment', 'banishment', 4, 'Abjuration', '1 action', '60 feet', 'V, S, M', 'an item distasteful to the target', 'Up to 1 minute', TRUE, FALSE, 'You attempt to send one creature that you can see within range to another plane of existence. The target must succeed on a Charisma saving throw or be banished.', 'When you cast this spell using a spell slot of 5th level or higher, you can target one additional creature for each slot level above 4th.', 'rules.txt', 87),

('Dimension Door', 'dimension-door', 4, 'Conjuration', '1 action', '500 feet', 'V', NULL, 'Instantaneous', FALSE, FALSE, 'You teleport yourself from your current location to any other spot within range. You arrive at exactly the spot desired. It can be a place you can see, one you can visualize, or one you can describe by stating distance and direction.', NULL, 'rules.txt', 90),

('Greater Invisibility', 'greater-invisibility', 4, 'Illusion', '1 action', 'Touch', 'V, S', NULL, 'Up to 1 minute', TRUE, FALSE, 'You or a creature you touch becomes invisible until the spell ends. Anything the target is wearing or carrying is invisible as long as it is on the target''s person.', NULL, 'rules.txt', 92),

('Polymorph', 'polymorph', 4, 'Transmutation', '1 action', '60 feet', 'V, S, M', 'a caterpillar cocoon', 'Up to 1 hour', TRUE, FALSE, 'This spell transforms a creature that you can see within range into a new form. An unwilling creature must make a Wisdom saving throw to avoid the effect. The spell has no effect on a shapechanger or a creature with 0 hit points.', NULL, 'rules.txt', 99),

('Ice Storm', 'ice-storm', 4, 'Evocation', '1 action', '300 feet', 'V, S, M', 'a pinch of dust and a few drops of water', 'Instantaneous', FALSE, FALSE, 'A hail of rock-hard ice pounds to the ground in a 20-foot-radius, 40-foot-high cylinder centered on a point within range. Each creature in the cylinder must make a Dexterity saving throw. A creature takes 2d8 bludgeoning damage and 4d6 cold damage on a failed save, or half as much damage on a successful one.', 'When you cast this spell using a spell slot of 5th level or higher, the bludgeoning damage increases by 1d8 for each slot level above 4th.', 'rules.txt', 93),

('Wall of Fire', 'wall-of-fire', 4, 'Evocation', '1 action', '120 feet', 'V, S, M', 'a small piece of phosphorus', 'Up to 1 minute', TRUE, FALSE, 'You create a wall of fire on a solid surface within range. You can make the wall up to 60 feet long, 20 feet high, and 1 foot thick, or a ringed wall up to 20 feet in diameter, 20 feet high, and 1 foot thick.', NULL, 'rules.txt', 105),

('Death Ward', 'death-ward', 4, 'Abjuration', '1 action', 'Touch', 'V, S', NULL, '8 hours', FALSE, FALSE, 'You touch a creature and grant it a measure of protection from death. The first time the target would drop to 0 hit points as a result of taking damage, the target instead drops to 1 hit point, and the spell ends.', NULL, 'rules.txt', 89),

('Freedom of Movement', 'freedom-of-movement', 4, 'Abjuration', '1 action', 'Touch', 'V, S, M', 'a leather strap, bound around the arm or a similar appendage', '1 hour', FALSE, FALSE, 'You touch a willing creature. For the duration, the target''s movement is unaffected by difficult terrain, and spells and other magical effects can neither reduce the target''s speed nor cause the target to be paralyzed or restrained.', NULL, 'rules.txt', 91),

('Stoneskin', 'stoneskin', 4, 'Abjuration', '1 action', 'Touch', 'V, S, M', 'diamond dust worth 100 gp, which the spell consumes', 'Up to 1 hour', TRUE, FALSE, 'This spell turns the flesh of a willing creature you touch as hard as stone. Until the spell ends, the target has resistance to nonmagical bludgeoning, piercing, and slashing damage.', NULL, 'rules.txt', 103),

('Blight', 'blight', 4, 'Necromancy', '1 action', '30 feet', 'V, S', NULL, 'Instantaneous', FALSE, FALSE, 'Necromantic energy washes over a creature of your choice that you can see within range, draining moisture and vitality from it. The target must make a Constitution saving throw. The target takes 8d8 necrotic damage on a failed save, or half as much damage on a successful one.', 'When you cast this spell using a spell slot of 5th level or higher, the damage increases by 1d8 for each slot level above 4th.', 'rules.txt', 87),

('Confusion', 'confusion', 4, 'Enchantment', '1 action', '90 feet', 'V, S, M', 'three nut shells', 'Up to 1 minute', TRUE, FALSE, 'This spell assaults and twists creatures'' minds, spawning delusions and provoking uncontrolled action. Each creature in a 10-foot-radius sphere centered on a point you choose within range must succeed on a Wisdom saving throw when you cast this spell or be affected by it.', 'When you cast this spell using a spell slot of 5th level or higher, the radius of the sphere increases by 5 feet for each slot level above 4th.', 'rules.txt', 88);

-- 5th Level Spells
INSERT INTO spells (name, slug, level, school, casting_time, range, components, materials, duration, concentration, ritual, description, at_higher_levels, source_document, source_page) VALUES
('Cone of Cold', 'cone-of-cold', 5, 'Evocation', '1 action', 'Self (60-foot cone)', 'V, S, M', 'a small crystal or glass cone', 'Instantaneous', FALSE, FALSE, 'A blast of cold air erupts from your hands. Each creature in a 60-foot cone must make a Constitution saving throw. A creature takes 8d8 cold damage on a failed save, or half as much damage on a successful one.', 'When you cast this spell using a spell slot of 6th level or higher, the damage increases by 1d8 for each slot level above 5th.', 'rules.txt', 88),

('Hold Monster', 'hold-monster', 5, 'Enchantment', '1 action', '90 feet', 'V, S, M', 'a small, straight piece of iron', 'Up to 1 minute', TRUE, FALSE, 'Choose a creature that you can see within range. The target must succeed on a Wisdom saving throw or be paralyzed for the duration. This spell has no effect on undead.', 'When you cast this spell using a spell slot of 6th level or higher, you can target one additional creature for each slot level above 5th.', 'rules.txt', 93),

('Wall of Stone', 'wall-of-stone', 5, 'Evocation', '1 action', '120 feet', 'V, S, M', 'a small block of granite', 'Up to 10 minutes', TRUE, FALSE, 'A nonmagical wall of solid stone springs into existence at a point you choose within range. The wall is 6 inches thick and is composed of ten 10-foot-by-10-foot panels.', NULL, 'rules.txt', 105),

('Cloudkill', 'cloudkill', 5, 'Conjuration', '1 action', '120 feet', 'V, S', NULL, 'Up to 10 minutes', TRUE, FALSE, 'You create a 20-foot-radius sphere of poisonous, yellow-green fog centered on a point you choose within range. The fog spreads around corners. It lasts for the duration or until strong wind disperses the fog, ending the spell.', 'When you cast this spell using a spell slot of 6th level or higher, the damage increases by 1d8 for each slot level above 5th.', 'rules.txt', 88),

('Wall of Force', 'wall-of-force', 5, 'Evocation', '1 action', '120 feet', 'V, S, M', 'a pinch of powder made by crushing a clear gemstone', 'Up to 10 minutes', TRUE, FALSE, 'An invisible wall of force springs into existence at a point you choose within range. The wall appears in any orientation you choose, as a horizontal or vertical barrier or at an angle. It can be free floating or resting on a solid surface. The wall is completely immune to damage of all types, and it cannot be dispelled by dispel magic. A disintegrate spell destroys the wall instantly, however. The wall also extends into the Ethereal Plane, blocking ethereal travel through the wall.', NULL, 'handbook.txt', 285),

('Dominate Person', 'dominate-person', 5, 'Enchantment', '1 action', '60 feet', 'V, S', NULL, 'Up to 1 minute', TRUE, FALSE, 'You attempt to beguile a humanoid that you can see within range. It must succeed on a Wisdom saving throw or be charmed by you for the duration.', 'When you cast this spell using a 6th-level spell slot, the duration is concentration, up to 10 minutes. Using a 7th-level slot, the duration is concentration, up to 1 hour. Using a slot of 8th level or higher, the duration is concentration, up to 8 hours.', 'rules.txt', 90),

('Greater Restoration', 'greater-restoration', 5, 'Abjuration', '1 action', 'Touch', 'V, S, M', 'diamond dust worth at least 100 gp, which the spell consumes', 'Instantaneous', FALSE, FALSE, 'You imbue a creature you touch with positive energy to undo a debilitating effect. You can reduce the target''s exhaustion level by one, or end one of the following effects on the target: one effect that charmed or petrified the target, one curse, any reduction to one of the target''s ability scores, or one effect reducing the target''s hit point maximum.', NULL, 'rules.txt', 92),

('Mass Cure Wounds', 'mass-cure-wounds', 5, 'Evocation', '1 action', '60 feet', 'V, S', NULL, 'Instantaneous', FALSE, FALSE, 'A wave of healing energy washes out from a point of your choice within range. Choose up to six creatures in a 30-foot-radius sphere centered on that point. Each target regains hit points equal to 3d8 + your spellcasting ability modifier.', 'When you cast this spell using a spell slot of 6th level or higher, the healing increases by 1d8 for each slot level above 5th.', 'rules.txt', 96),

('Raise Dead', 'raise-dead', 5, 'Necromancy', '1 hour', 'Touch', 'V, S, M', 'a diamond worth at least 500 gp, which the spell consumes', 'Instantaneous', FALSE, FALSE, 'You return a dead creature you touch to life, provided that it has been dead no longer than 10 days. If the creature''s soul is both willing and at liberty to rejoin the body, the creature returns to life with 1 hit point.', NULL, 'rules.txt', 100),

('Telekinesis', 'telekinesis', 5, 'Transmutation', '1 action', '60 feet', 'V, S', NULL, 'Up to 10 minutes', TRUE, FALSE, 'You gain the ability to move or manipulate creatures or objects by thought. When you cast the spell, and as your action each round for the duration, you can exert your will on one creature or object that you can see within range.', NULL, 'rules.txt', 104),

('Flame Strike', 'flame-strike', 5, 'Evocation', '1 action', '60 feet', 'V, S, M', 'pinch of sulfur', 'Instantaneous', FALSE, FALSE, 'A vertical column of divine fire roars down from the heavens in a location you specify. Each creature in a 10-foot-radius, 40-foot-high cylinder centered on a point within range must make a Dexterity saving throw. A creature takes 4d6 fire damage and 4d6 radiant damage on a failed save, or half as much damage on a successful one.', 'When you cast this spell using a spell slot of 6th level or higher, the fire damage or the radiant damage (your choice) increases by 1d6 for each slot level above 5th.', 'rules.txt', 91);

-- 6th Level Spells
INSERT INTO spells (name, slug, level, school, casting_time, range, components, materials, duration, concentration, ritual, description, at_higher_levels, source_document, source_page) VALUES
('Chain Lightning', 'chain-lightning', 6, 'Evocation', '1 action', '150 feet', 'V, S, M', 'a bit of fur; a piece of amber, glass, or a crystal rod; and three silver pins', 'Instantaneous', FALSE, FALSE, 'You create a bolt of lightning that arcs toward a target of your choice that you can see within range. Three bolts then leap from that target to as many as three other targets, each of which must be within 30 feet of the first target.', 'When you cast this spell using a spell slot of 7th level or higher, one additional bolt leaps from the first target to another target for each slot level above 6th.', 'rules.txt', 88),

('Disintegrate', 'disintegrate', 6, 'Transmutation', '1 action', '60 feet', 'V, S, M', 'a lodestone and a pinch of dust', 'Instantaneous', FALSE, FALSE, 'A thin green ray springs from your pointing finger to a target that you can see within range. The target can be a creature, an object, or a creation of magical force, such as the wall created by wall of force. A creature targeted by this spell must make a Dexterity saving throw. On a failed save, the target takes 10d6 + 40 force damage.', 'When you cast this spell using a spell slot of 7th level or higher, the damage increases by 3d6 for each slot level above 6th.', 'rules.txt', 90),

('Heal', 'heal', 6, 'Evocation', '1 action', '60 feet', 'V, S', NULL, 'Instantaneous', FALSE, FALSE, 'Choose a creature that you can see within range. A surge of positive energy washes through the creature, causing it to regain 70 hit points. This spell also ends blindness, deafness, and any diseases affecting the target.', 'When you cast this spell using a spell slot of 7th level or higher, the amount of healing increases by 10 for each slot level above 6th.', 'rules.txt', 92),

('True Seeing', 'true-seeing', 6, 'Divination', '1 action', 'Touch', 'V, S, M', 'an ointment for the eyes that costs 25 gp; is made from mushroom powder, saffron, and fat; and is consumed by the spell', '1 hour', FALSE, FALSE, 'This spell gives the willing creature you touch the ability to see things as they actually are. For the duration, the creature has truesight, notices secret doors hidden by magic, and can see into the Ethereal Plane, all out to a range of 120 feet.', NULL, 'rules.txt', 104),

('Sunbeam', 'sunbeam', 6, 'Evocation', '1 action', 'Self (60-foot line)', 'V, S, M', 'a magnifying glass', 'Up to 1 minute', TRUE, FALSE, 'A beam of brilliant light flashes out from your hand in a 5-foot-wide, 60-foot-long line. Each creature in the line must make a Constitution saving throw. On a failed save, a creature takes 6d8 radiant damage and is blinded until your next turn.', NULL, 'rules.txt', 103),

('Globe of Invulnerability', 'globe-of-invulnerability', 6, 'Abjuration', '1 action', 'Self (10-foot radius)', 'V, S, M', 'a glass or crystal bead that shatters when the spell ends', 'Up to 1 minute', TRUE, FALSE, 'An immobile, faintly shimmering barrier springs into existence in a 10-foot radius around you and remains for the duration. Any spell of 5th level or lower cast from outside the barrier can''t affect creatures or objects within it.', 'When you cast this spell using a spell slot of 7th level or higher, the barrier blocks spells of one level higher for each slot level above 6th.', 'rules.txt', 92);

-- 7th Level Spells
INSERT INTO spells (name, slug, level, school, casting_time, range, components, materials, duration, concentration, ritual, description, at_higher_levels, source_document, source_page) VALUES
('Delayed Blast Fireball', 'delayed-blast-fireball', 7, 'Evocation', '1 action', '150 feet', 'V, S, M', 'a tiny ball of bat guano and sulfur', 'Up to 1 minute', TRUE, FALSE, 'A beam of yellow light flashes from your pointing finger, then condenses to linger at a chosen point within range as a glowing bead for the duration. When the spell ends, either because your concentration is broken or because you decide to end it, the bead blossoms with a low roar into an explosion of flame that spreads around corners.', 'When you cast this spell using a spell slot of 8th level or higher, the base damage increases by 1d6 for each slot level above 7th.', 'rules.txt', 89),

('Finger of Death', 'finger-of-death', 7, 'Necromancy', '1 action', '60 feet', 'V, S', NULL, 'Instantaneous', FALSE, FALSE, 'You send negative energy coursing through a creature that you can see within range, causing it searing pain. The target must make a Constitution saving throw. It takes 7d8 + 30 necrotic damage on a failed save, or half as much damage on a successful one.', NULL, 'rules.txt', 91),

('Fire Storm', 'fire-storm', 7, 'Evocation', '1 action', '150 feet', 'V, S', NULL, 'Instantaneous', FALSE, FALSE, 'A storm made up of sheets of roaring flame appears in a location you choose within range. The area of the storm consists of up to ten 10-foot cubes, which you can arrange as you wish.', NULL, 'rules.txt', 91),

('Plane Shift', 'plane-shift', 7, 'Conjuration', '1 action', 'Touch', 'V, S, M', 'a forked, metal rod worth at least 250 gp, attuned to a particular plane of existence', 'Instantaneous', FALSE, FALSE, 'You and up to eight willing creatures who link hands in a circle are transported to a different plane of existence.', NULL, 'rules.txt', 98),

('Resurrection', 'resurrection', 7, 'Necromancy', '1 hour', 'Touch', 'V, S, M', 'a diamond worth at least 1,000 gp, which the spell consumes', 'Instantaneous', FALSE, FALSE, 'You touch a dead creature that has been dead for no more than a century, that didn''t die of old age, and that isn''t undead. If its soul is free and willing, the target returns to life with all its hit points.', NULL, 'rules.txt', 101),

('Teleport', 'teleport', 7, 'Conjuration', '1 action', '10 feet', 'V', NULL, 'Instantaneous', FALSE, FALSE, 'This spell instantly transports you and up to eight willing creatures of your choice that you can see within range, or a single object that you can see within range, to a destination you select.', NULL, 'rules.txt', 104),

('Etherealness', 'etherealness', 7, 'Transmutation', '1 action', 'Self', 'V, S', NULL, '8 hours', FALSE, FALSE, 'You step into the border regions of the Ethereal Plane, in the area where it overlaps with your current plane. You remain in the Border Ethereal for the duration or until you use your action to dismiss the spell. During this time, you can move in any direction. If you move up or down, every foot of movement costs an extra foot. You can see and hear the plane you originated from, but everything there looks gray, and you cannot see anything more than 60 feet away.', 'When you cast this spell using a spell slot of 8th level or higher, you can target up to three willing creatures (including you) for each slot level above 7th.', 'handbook.txt', 238),

('Regenerate', 'regenerate', 7, 'Transmutation', '1 minute', 'Touch', 'V, S, M', 'a prayer wheel and holy water', 'Up to 1 hour', FALSE, FALSE, 'You touch a creature and stimulate its natural healing ability. The target regains 4d8 + 15 hit points. For the duration of the spell, the target regains 1 hit point at the start of each of its turns (10 hit points each minute). The targets severed body members (fingers, legs, tails, and so on), if any, are restored after 2 minutes.', NULL, 'handbook.txt', 271),

('Reverse Gravity', 'reverse-gravity', 7, 'Transmutation', '1 action', '100 feet', 'V, S, M', 'a lodestone and iron filings', 'Up to 1 minute', TRUE, FALSE, 'This spell reverses gravity in a 50-foot-radius, 100-foot high cylinder centered on a point within range. All creatures and objects that are not somehow anchored to the ground in the area fall upward and reach the top of the area when you cast this spell.', NULL, 'handbook.txt', 272);

-- 8th Level Spells
INSERT INTO spells (name, slug, level, school, casting_time, range, components, materials, duration, concentration, ritual, description, at_higher_levels, source_document, source_page) VALUES
('Dominate Monster', 'dominate-monster', 8, 'Enchantment', '1 action', '60 feet', 'V, S', NULL, 'Up to 1 hour', TRUE, FALSE, 'You attempt to beguile a creature that you can see within range. It must succeed on a Wisdom saving throw or be charmed by you for the duration.', 'When you cast this spell with a 9th-level spell slot, the duration is concentration, up to 8 hours.', 'rules.txt', 90),

('Earthquake', 'earthquake', 8, 'Evocation', '1 action', '500 feet', 'V, S, M', 'a pinch of dirt, a piece of rock, and a lump of clay', 'Up to 1 minute', TRUE, FALSE, 'You create a seismic disturbance at a point on the ground that you can see within range. For the duration, an intense tremor rips through the ground in a 100-foot-radius circle centered on that point.', NULL, 'rules.txt', 90),

('Power Word Stun', 'power-word-stun', 8, 'Enchantment', '1 action', '60 feet', 'V', NULL, 'Instantaneous', FALSE, FALSE, 'You speak a word of power that can overwhelm the mind of one creature you can see within range, leaving it dumbfounded. If the target has 150 hit points or fewer, it is stunned. Otherwise, the spell has no effect.', NULL, 'rules.txt', 99),

('Sunburst', 'sunburst', 8, 'Evocation', '1 action', '150 feet', 'V, S, M', 'fire and a piece of sunstone', 'Instantaneous', FALSE, FALSE, 'Brilliant sunlight flashes in a 60-foot radius centered on a point you choose within range. Each creature in that light must make a Constitution saving throw. On a failed save, a creature takes 12d6 radiant damage and is blinded for 1 minute.', NULL, 'rules.txt', 104),

('Feeblemind', 'feeblemind', 8, 'Enchantment', '1 action', '150 feet', 'V, S, M', 'a handful of clay, crystal, glass, or mineral spheres', 'Instantaneous', FALSE, FALSE, 'You blast the mind of a creature that you can see within range, attempting to shatter its intellect and personality. The target takes 4d6 psychic damage and must make an Intelligence saving throw. On a failed save, the creatures Intelligence and Charisma scores become 1. The creature cannot cast spells, activate magic items, understand language, or communicate in any intelligible way. The creature can, however, identify its friends, follow them, and even protect them.', NULL, 'handbook.txt', 239),

('Maze', 'maze', 8, 'Conjuration', '1 action', '60 feet', 'V, S', NULL, 'Up to 10 minutes', TRUE, FALSE, 'You banish a creature that you can see within range into a labyrinthine demiplane. The target remains there for the duration or until it escapes the maze. The target can use its action to attempt to escape. When it does so, it makes a DC 20 Intelligence check. If it succeeds, it escapes, and the spell ends.', NULL, 'handbook.txt', 258),

('Mind Blank', 'mind-blank', 8, 'Abjuration', '1 action', 'Touch', 'V, S', NULL, '24 hours', FALSE, FALSE, 'Until the spell ends, one willing creature you touch is immune to psychic damage, any effect that would sense its emotions or read its thoughts, divination spells, and the charmed condition. The spell even foils wish spells and spells or effects of similar power used to affect the targets mind or to gain information about the target.', NULL, 'handbook.txt', 259);

-- 9th Level Spells
INSERT INTO spells (name, slug, level, school, casting_time, range, components, materials, duration, concentration, ritual, description, at_higher_levels, source_document, source_page) VALUES
('Meteor Swarm', 'meteor-swarm', 9, 'Evocation', '1 action', '1 mile', 'V, S', NULL, 'Instantaneous', FALSE, FALSE, 'Blazing orbs of fire plummet to the ground at four different points you can see within range. Each creature in a 40-foot-radius sphere centered on each point you choose must make a Dexterity saving throw. The sphere spreads around corners. A creature takes 20d6 fire damage and 20d6 bludgeoning damage on a failed save, or half as much damage on a successful one.', NULL, 'rules.txt', 97),

('Power Word Kill', 'power-word-kill', 9, 'Enchantment', '1 action', '60 feet', 'V', NULL, 'Instantaneous', FALSE, FALSE, 'You utter a word of power that can compel one creature you can see within range to die instantly. If the creature you choose has 100 hit points or fewer, it dies. Otherwise, the spell has no effect.', NULL, 'rules.txt', 99),

('Time Stop', 'time-stop', 9, 'Transmutation', '1 action', 'Self', 'V', NULL, 'Instantaneous', FALSE, FALSE, 'You briefly stop the flow of time for everyone but yourself. No time passes for other creatures, while you take 1d4 + 1 turns in a row, during which you can use actions and move as normal.', NULL, 'rules.txt', 104),

('True Resurrection', 'true-resurrection', 9, 'Necromancy', '1 hour', 'Touch', 'V, S, M', 'a sprinkle of holy water and diamonds worth at least 25,000 gp, which the spell consumes', 'Instantaneous', FALSE, FALSE, 'You touch a creature that has been dead for no longer than 200 years and that died for any reason except old age. If the creature''s soul is free and willing, the creature is restored to life with all its hit points.', NULL, 'rules.txt', 104),

('Wish', 'wish', 9, 'Conjuration', '1 action', 'Self', 'V', NULL, 'Instantaneous', FALSE, FALSE, 'Wish is the mightiest spell a mortal creature can cast. By simply speaking aloud, you can alter the very foundations of reality in accord with your desires. The basic use of this spell is to duplicate any other spell of 8th level or lower.', NULL, 'rules.txt', 106),

('Gate', 'gate', 9, 'Conjuration', '1 action', '60 feet', 'V, S, M', 'a diamond worth at least 5,000 gp', 'Up to 1 minute', TRUE, FALSE, 'You conjure a portal linking an unoccupied space you can see within range to a precise location on a different plane of existence. The portal is a circular opening, which you can make 5 to 20 feet in diameter.', NULL, 'rules.txt', 92),

('Foresight', 'foresight', 9, 'Divination', '1 minute', 'Touch', 'V, S, M', 'a hummingbird feather', '8 hours', FALSE, FALSE, 'You touch a willing creature and bestow a limited ability to see into the immediate future. For the duration, the target cannot be surprised and has advantage on attack rolls, ability checks, and saving throws. Additionally, other creatures have disadvantage on attack rolls against the target for the duration.', NULL, 'handbook.txt', 244),

('Mass Heal', 'mass-heal', 9, 'Evocation', '1 action', '60 feet', 'V, S', NULL, 'Instantaneous', FALSE, FALSE, 'A flood of healing energy flows from you into injured creatures around you. You restore up to 700 hit points, divided as you choose among any number of creatures that you can see within range. Creatures healed by this spell are also cured of all diseases and any effect making them blinded or deafened. This spell has no effect on undead or constructs.', NULL, 'handbook.txt', 258),

('True Polymorph', 'true-polymorph', 9, 'Transmutation', '1 action', '30 feet', 'V, S, M', 'a drop of mercury, a dollop of gum arabic, and a wisp of smoke', 'Up to 1 hour', TRUE, FALSE, 'Choose one creature or nonmagical object that you can see within range. You transform the creature into a different creature, the creature into a nonmagical object, or the object into a creature. The transformation lasts for the duration, or until the target drops to 0 hit points or dies. If you concentrate on this spell for the full duration, the transformation lasts until it is dispelled.', NULL, 'handbook.txt', 283),

('Shapechange', 'shapechange', 9, 'Transmutation', '1 action', 'Self', 'V, S, M', 'a jade circlet worth at least 1,500 gp, which you must place on your head before you cast the spell', 'Up to 1 hour', TRUE, FALSE, 'You assume the form of a different creature for the duration. The new form can be of any creature with a challenge rating equal to your level or lower. The creature cannot be a construct or an undead, and you must have seen the sort of creature at least once.', NULL, 'handbook.txt', 274);

-- Class-Spell Relationships
INSERT INTO class_spells (class_id, spell_id)
SELECT c.id, s.id FROM classes c, spells s
WHERE c.slug = 'wizard' AND s.slug IN ('acid-splash', 'fire-bolt', 'light', 'mage-hand', 'prestidigitation', 'ray-of-frost', 'magic-missile', 'shield', 'detect-magic', 'sleep', 'thunderwave', 'burning-hands', 'hold-person', 'invisibility', 'misty-step', 'scorching-ray', 'fireball', 'lightning-bolt', 'counterspell', 'dispel-magic', 'fly', 'haste');

INSERT INTO class_spells (class_id, spell_id)
SELECT c.id, s.id FROM classes c, spells s
WHERE c.slug = 'cleric' AND s.slug IN ('light', 'sacred-flame', 'cure-wounds', 'detect-magic', 'bless', 'spiritual-weapon', 'dispel-magic');

-- ---------------------------------------------------------------------------
-- 8.5 Monsters
-- ---------------------------------------------------------------------------

-- CR 0-1/4 Monsters
INSERT INTO monsters (name, slug, size, monster_type, subtype, alignment, armor_class, armor_type, hit_points, hit_dice, speed, ability_scores, saving_throws, skills, senses, languages, challenge_rating, experience_points, traits, actions, description, source_document, source_page) VALUES
('Goblin', 'goblin', 'Small', 'humanoid', 'goblinoid', 'neutral evil', 15, 'leather armor, shield', 7, '2d6', '{"walk": 30}', '{"strength": 8, "dexterity": 14, "constitution": 10, "intelligence": 10, "wisdom": 8, "charisma": 8}', NULL, '{"stealth": 6}', '{"darkvision": 60, "passive_perception": 9}', ARRAY['Common', 'Goblin'], '1/4', 50, '{"nimble_escape": "The goblin can take the Disengage or Hide action as a bonus action on each of its turns."}', '{"scimitar": {"type": "melee", "attack_bonus": 4, "reach": "5 ft.", "damage": "1d6 + 2", "damage_type": "slashing"}, "shortbow": {"type": "ranged", "attack_bonus": 4, "range": "80/320 ft.", "damage": "1d6 + 2", "damage_type": "piercing"}}', 'Goblins are small, black-hearted humanoids that lair in despoiled dungeons and other dismal settings. Individually weak, they gather in large numbers to torment other creatures.', 'rules.txt', 166),

('Kobold', 'kobold', 'Small', 'humanoid', 'kobold', 'lawful evil', 12, NULL, 5, '2d6 - 2', '{"walk": 30}', '{"strength": 7, "dexterity": 15, "constitution": 9, "intelligence": 8, "wisdom": 7, "charisma": 8}', NULL, NULL, '{"darkvision": 60, "passive_perception": 8}', ARRAY['Common', 'Draconic'], '1/8', 25, '{"sunlight_sensitivity": "While in sunlight, the kobold has disadvantage on attack rolls, as well as on Wisdom (Perception) checks that rely on sight.", "pack_tactics": "The kobold has advantage on an attack roll against a creature if at least one of the kobold''s allies is within 5 feet of the creature and the ally isn''t incapacitated."}', '{"dagger": {"type": "melee", "attack_bonus": 4, "reach": "5 ft.", "damage": "1d4 + 2", "damage_type": "piercing"}, "sling": {"type": "ranged", "attack_bonus": 4, "range": "30/120 ft.", "damage": "1d4 + 2", "damage_type": "bludgeoning"}}', 'Kobolds are craven reptilian humanoids that commonly infest dungeons. They make up for their physical ineptitude with a cleverness for trap making.', 'rules.txt', 170);

-- CR 1/2 - 1 Monsters
INSERT INTO monsters (name, slug, size, monster_type, subtype, alignment, armor_class, armor_type, hit_points, hit_dice, speed, ability_scores, saving_throws, skills, senses, languages, challenge_rating, experience_points, traits, actions, description, source_document, source_page) VALUES
('Orc', 'orc', 'Medium', 'humanoid', 'orc', 'chaotic evil', 13, 'hide armor', 15, '2d8 + 6', '{"walk": 30}', '{"strength": 16, "dexterity": 12, "constitution": 16, "intelligence": 7, "wisdom": 11, "charisma": 10}', NULL, '{"intimidation": 2}', '{"darkvision": 60, "passive_perception": 10}', ARRAY['Common', 'Orc'], '1/2', 100, '{"aggressive": "As a bonus action, the orc can move up to its speed toward a hostile creature that it can see."}', '{"greataxe": {"type": "melee", "attack_bonus": 5, "reach": "5 ft.", "damage": "1d12 + 3", "damage_type": "slashing"}, "javelin": {"type": "melee_or_ranged", "attack_bonus": 5, "reach": "5 ft.", "range": "30/120 ft.", "damage": "1d6 + 3", "damage_type": "piercing"}}', 'Orcs are savage raiders and pillagers with stooped postures, low foreheads, and piggish faces with prominent lower canines that resemble tusks.', 'rules.txt', 172),

('Skeleton', 'skeleton', 'Medium', 'undead', NULL, 'lawful evil', 13, 'armor scraps', 13, '2d8 + 4', '{"walk": 30}', '{"strength": 10, "dexterity": 14, "constitution": 15, "intelligence": 6, "wisdom": 8, "charisma": 5}', NULL, NULL, '{"darkvision": 60, "passive_perception": 9}', ARRAY['understands languages it knew in life'], '1/4', 50, '{}', '{"shortsword": {"type": "melee", "attack_bonus": 4, "reach": "5 ft.", "damage": "1d6 + 2", "damage_type": "piercing"}, "shortbow": {"type": "ranged", "attack_bonus": 4, "range": "80/320 ft.", "damage": "1d6 + 2", "damage_type": "piercing"}}', 'Skeletons arise when animated by dark magic. They heed the summons of spellcasters who call them from their stony tombs and ancient battlefields.', 'rules.txt', 178),

('Zombie', 'zombie', 'Medium', 'undead', NULL, 'neutral evil', 8, NULL, 22, '3d8 + 9', '{"walk": 20}', '{"strength": 13, "dexterity": 6, "constitution": 16, "intelligence": 3, "wisdom": 6, "charisma": 5}', '{"wisdom": 0}', NULL, '{"darkvision": 60, "passive_perception": 8}', ARRAY['understands languages it knew in life'], '1/4', 50, '{"undead_fortitude": "If damage reduces the zombie to 0 hit points, it must make a Constitution saving throw with a DC of 5 + the damage taken, unless the damage is radiant or from a critical hit. On a success, the zombie drops to 1 hit point instead."}', '{"slam": {"type": "melee", "attack_bonus": 3, "reach": "5 ft.", "damage": "1d6 + 1", "damage_type": "bludgeoning"}}', 'From somewhere in the darkness, a gurgling moan is heard. A form emerges from the shadows, dragging one foot as it raises bloated arms and broken hands.', 'rules.txt', 187);

-- CR 2-5 Monsters
INSERT INTO monsters (name, slug, size, monster_type, subtype, alignment, armor_class, armor_type, hit_points, hit_dice, speed, ability_scores, saving_throws, skills, senses, languages, challenge_rating, experience_points, traits, actions, description, source_document, source_page) VALUES
('Ogre', 'ogre', 'Large', 'giant', NULL, 'chaotic evil', 11, 'hide armor', 59, '7d10 + 21', '{"walk": 40}', '{"strength": 19, "dexterity": 8, "constitution": 16, "intelligence": 5, "wisdom": 7, "charisma": 7}', NULL, NULL, '{"darkvision": 60, "passive_perception": 8}', ARRAY['Common', 'Giant'], '2', 450, '{}', '{"greatclub": {"type": "melee", "attack_bonus": 6, "reach": "5 ft.", "damage": "2d8 + 4", "damage_type": "bludgeoning"}, "javelin": {"type": "melee_or_ranged", "attack_bonus": 6, "reach": "5 ft.", "range": "30/120 ft.", "damage": "2d6 + 4", "damage_type": "piercing"}}', 'Ogres are as lazy of mind as they are strong of body. They live by raiding, scavenging, and killing for food and pleasure.', 'rules.txt', 172),

('Owlbear', 'owlbear', 'Large', 'monstrosity', NULL, 'unaligned', 13, 'natural armor', 59, '7d10 + 21', '{"walk": 40}', '{"strength": 20, "dexterity": 12, "constitution": 17, "intelligence": 3, "wisdom": 12, "charisma": 7}', NULL, '{"perception": 3}', '{"darkvision": 60, "passive_perception": 13}', NULL, '3', 700, '{"keen_sight_and_smell": "The owlbear has advantage on Wisdom (Perception) checks that rely on sight or smell."}', '{"multiattack": "The owlbear makes two attacks: one with its beak and one with its claws.", "beak": {"type": "melee", "attack_bonus": 7, "reach": "5 ft.", "damage": "1d10 + 5", "damage_type": "piercing"}, "claws": {"type": "melee", "attack_bonus": 7, "reach": "5 ft.", "damage": "2d8 + 5", "damage_type": "slashing"}}', 'An owlbear''s screech echoes through dark valleys and benighted forests, striking fear into the hearts of those who hear it.', 'rules.txt', 173),

('Wight', 'wight', 'Medium', 'undead', NULL, 'neutral evil', 14, 'studded leather', 45, '6d8 + 18', '{"walk": 30}', '{"strength": 15, "dexterity": 14, "constitution": 16, "intelligence": 10, "wisdom": 13, "charisma": 15}', NULL, '{"perception": 3, "stealth": 4}', '{"darkvision": 60, "passive_perception": 13}', ARRAY['languages it knew in life'], '3', 700, '{"sunlight_sensitivity": "While in sunlight, the wight has disadvantage on attack rolls, as well as on Wisdom (Perception) checks that rely on sight."}', '{"multiattack": "The wight makes two longsword attacks or two longbow attacks. It can use its Life Drain in place of one longsword attack.", "life_drain": {"type": "melee", "attack_bonus": 4, "reach": "5 ft.", "damage": "1d6 + 2", "damage_type": "necrotic", "special": "The target must succeed on a DC 13 Constitution saving throw or its hit point maximum is reduced by an amount equal to the damage taken. This reduction lasts until the target finishes a long rest. The target dies if this effect reduces its hit point maximum to 0."}, "longsword": {"type": "melee", "attack_bonus": 4, "reach": "5 ft.", "damage": "1d8 + 2", "damage_type": "slashing"}, "longbow": {"type": "ranged", "attack_bonus": 4, "range": "150/600 ft.", "damage": "1d8 + 2", "damage_type": "piercing"}}', 'The word "wight" meant "person" in days of yore, but the name now refers to evil undead who were once combatants.', 'rules.txt', 186);

-- CR 6+ Monsters
INSERT INTO monsters (name, slug, size, monster_type, subtype, alignment, armor_class, armor_type, hit_points, hit_dice, speed, ability_scores, saving_throws, skills, senses, languages, challenge_rating, experience_points, traits, actions, legendary_actions, description, source_document, source_page) VALUES
('Young Black Dragon', 'young-black-dragon', 'Large', 'dragon', NULL, 'chaotic evil', 18, 'natural armor', 127, '15d10 + 45', '{"walk": 40, "fly": 80, "swim": 40}', '{"strength": 19, "dexterity": 14, "constitution": 17, "intelligence": 12, "wisdom": 11, "charisma": 15}', '{"dexterity": 5, "constitution": 6, "wisdom": 3, "charisma": 5}', '{"perception": 6, "stealth": 5}', '{"blindsight": 30, "darkvision": 120, "passive_perception": 16}', ARRAY['Common', 'Draconic'], '7', 2900, '{"amphibious": "The dragon can breathe air and water."}', '{"multiattack": "The dragon makes three attacks: one with its bite and two with its claws.", "bite": {"type": "melee", "attack_bonus": 7, "reach": "10 ft.", "damage": "2d10 + 4", "damage_type": "piercing", "extra_damage": "1d8 acid"}, "claw": {"type": "melee", "attack_bonus": 7, "reach": "5 ft.", "damage": "2d6 + 4", "damage_type": "slashing"}, "acid_breath": {"recharge": "5-6", "save_dc": 14, "save_type": "Dexterity", "damage": "11d8", "damage_type": "acid", "area": "30-foot line that is 5 feet wide"}}', NULL, 'Black dragons are the most evil-tempered and vile of the chromatic dragons. They lurk in swamps, often establishing lairs in crumbling ruins.', 'rules.txt', 159),

('Adult Red Dragon', 'adult-red-dragon', 'Huge', 'dragon', NULL, 'chaotic evil', 19, 'natural armor', 256, '19d12 + 133', '{"walk": 40, "climb": 40, "fly": 80}', '{"strength": 27, "dexterity": 10, "constitution": 25, "intelligence": 16, "wisdom": 13, "charisma": 21}', '{"dexterity": 6, "constitution": 13, "wisdom": 7, "charisma": 11}', '{"perception": 13, "stealth": 6}', '{"blindsight": 60, "darkvision": 120, "passive_perception": 23}', ARRAY['Common', 'Draconic'], '17', 18000, '{"legendary_resistance": "If the dragon fails a saving throw, it can choose to succeed instead. 3/day."}', '{"multiattack": "The dragon can use its Frightful Presence. It then makes three attacks: one with its bite and two with its claws.", "bite": {"type": "melee", "attack_bonus": 14, "reach": "10 ft.", "damage": "2d10 + 8", "damage_type": "piercing", "extra_damage": "2d6 fire"}, "claw": {"type": "melee", "attack_bonus": 14, "reach": "5 ft.", "damage": "2d6 + 8", "damage_type": "slashing"}, "tail": {"type": "melee", "attack_bonus": 14, "reach": "15 ft.", "damage": "2d8 + 8", "damage_type": "bludgeoning"}, "frightful_presence": {"save_dc": 19, "save_type": "Wisdom", "range": "120 feet", "effect": "frightened for 1 minute"}, "fire_breath": {"recharge": "5-6", "save_dc": 21, "save_type": "Dexterity", "damage": "18d6", "damage_type": "fire", "area": "60-foot cone"}}', '{"detect": "The dragon makes a Wisdom (Perception) check.", "tail_attack": "The dragon makes a tail attack.", "wing_attack": "The dragon beats its wings. Each creature within 10 feet must succeed on a DC 22 Dexterity saving throw or take 2d6 + 8 bludgeoning damage and be knocked prone. The dragon can then fly up to half its flying speed."}', 'Red dragons are the most covetous and greedy of all dragons, forever seeking to increase their treasure hoards.', 'rules.txt', 158);

-- ---------------------------------------------------------------------------
-- 8.6 Items (Weapons, Armor, Equipment)
-- ---------------------------------------------------------------------------

-- Weapons
INSERT INTO items (name, slug, item_type, description, cost, weight, damage, damage_type, weapon_properties, weapon_range, source_document, source_page) VALUES
('Dagger', 'dagger', 'weapon', 'A simple melee weapon useful for close quarters combat and throwing.', '2 gp', '1 lb.', '1d4', 'piercing', ARRAY['Finesse', 'Light', 'Thrown'], '20/60', 'rules.txt', 46),
('Club', 'club', 'weapon', 'A simple melee weapon - a length of wood used for bludgeoning.', '1 sp', '2 lb.', '1d4', 'bludgeoning', ARRAY['Light'], NULL, 'handbook.txt', 149),
('Greatclub', 'greatclub', 'weapon', 'A simple melee weapon - a larger, heavier club requiring two hands.', '2 sp', '10 lb.', '1d8', 'bludgeoning', ARRAY['Two-Handed'], NULL, 'handbook.txt', 149),
('Javelin', 'javelin', 'weapon', 'A simple melee weapon designed for throwing, commonly used by warriors.', '5 sp', '2 lb.', '1d6', 'piercing', ARRAY['Thrown'], '30/120', 'handbook.txt', 149),
('Light Hammer', 'light-hammer', 'weapon', 'A simple melee weapon - a small hammer that can be thrown.', '2 gp', '2 lb.', '1d4', 'bludgeoning', ARRAY['Light', 'Thrown'], '20/60', 'handbook.txt', 149),
('Mace', 'mace', 'weapon', 'A simple melee weapon with a heavy head on a solid shaft.', '5 gp', '4 lb.', '1d6', 'bludgeoning', NULL, NULL, 'handbook.txt', 149),
('Sickle', 'sickle', 'weapon', 'A simple melee weapon with a curved blade, originally an agricultural tool.', '1 gp', '2 lb.', '1d4', 'slashing', ARRAY['Light'], NULL, 'handbook.txt', 149),
('Spear', 'spear', 'weapon', 'A simple melee weapon with a pointed tip on a long shaft.', '1 gp', '3 lb.', '1d6', 'piercing', ARRAY['Thrown', 'Versatile (1d8)'], '20/60', 'handbook.txt', 149),
('Dart', 'dart', 'weapon', 'A simple ranged weapon - a small pointed missile thrown by hand.', '5 cp', '1/4 lb.', '1d4', 'piercing', ARRAY['Finesse', 'Thrown'], '20/60', 'handbook.txt', 149),
('Sling', 'sling', 'weapon', 'A simple ranged weapon that hurls stones using centrifugal force.', '1 sp', '-', '1d4', 'bludgeoning', ARRAY['Ammunition'], '30/120', 'handbook.txt', 149),
('Shortsword', 'shortsword', 'weapon', 'A martial melee weapon favored by rogues for its quick, precise strikes.', '10 gp', '2 lb.', '1d6', 'piercing', ARRAY['Finesse', 'Light'], NULL, 'rules.txt', 46),
('Longsword', 'longsword', 'weapon', 'A versatile martial weapon, the longsword is the quintessential knight''s blade.', '15 gp', '3 lb.', '1d8', 'slashing', ARRAY['Versatile (1d10)'], NULL, 'rules.txt', 46),
('Greatsword', 'greatsword', 'weapon', 'A massive two-handed sword capable of cleaving through multiple foes.', '50 gp', '6 lb.', '2d6', 'slashing', ARRAY['Heavy', 'Two-Handed'], NULL, 'rules.txt', 46),
('Longbow', 'longbow', 'weapon', 'A tall bow used for long-range attacks, requiring significant strength to draw.', '50 gp', '2 lb.', '1d8', 'piercing', ARRAY['Ammunition', 'Heavy', 'Two-Handed'], '150/600', 'rules.txt', 46),
('Shortbow', 'shortbow', 'weapon', 'A compact bow ideal for skirmishers and those who favor mobility.', '25 gp', '2 lb.', '1d6', 'piercing', ARRAY['Ammunition', 'Two-Handed'], '80/320', 'rules.txt', 46),
('Handaxe', 'handaxe', 'weapon', 'A simple weapon that can be used in melee or thrown at enemies.', '5 gp', '2 lb.', '1d6', 'slashing', ARRAY['Light', 'Thrown'], '20/60', 'rules.txt', 46),
('Greataxe', 'greataxe', 'weapon', 'A massive axe favored by barbarians for its devastating damage.', '30 gp', '7 lb.', '1d12', 'slashing', ARRAY['Heavy', 'Two-Handed'], NULL, 'rules.txt', 46),
('Quarterstaff', 'quarterstaff', 'weapon', 'A simple wooden staff, often used by monks and travelers.', '2 sp', '4 lb.', '1d6', 'bludgeoning', ARRAY['Versatile (1d8)'], NULL, 'rules.txt', 46),
('Light Crossbow', 'light-crossbow', 'weapon', 'A mechanical ranged weapon that fires bolts.', '25 gp', '5 lb.', '1d8', 'piercing', ARRAY['Ammunition', 'Loading', 'Two-Handed'], '80/320', 'rules.txt', 46),
('Rapier', 'rapier', 'weapon', 'A martial melee weapon with a thin, pointed blade used for thrusting attacks.', '25 gp', '2 lb.', '1d8', 'piercing', ARRAY['Finesse'], NULL, 'handbook.txt', 149),
('Scimitar', 'scimitar', 'weapon', 'A martial melee weapon with a curved blade optimized for slashing.', '25 gp', '3 lb.', '1d6', 'slashing', ARRAY['Finesse', 'Light'], NULL, 'handbook.txt', 149),
('Battleaxe', 'battleaxe', 'weapon', 'A martial melee weapon that can be wielded with one or two hands.', '10 gp', '4 lb.', '1d8', 'slashing', ARRAY['Versatile (1d10)'], NULL, 'handbook.txt', 149),
('Flail', 'flail', 'weapon', 'A martial melee weapon consisting of a spiked ball attached to a handle by a chain.', '10 gp', '2 lb.', '1d8', 'bludgeoning', NULL, NULL, 'handbook.txt', 149),
('Glaive', 'glaive', 'weapon', 'A martial melee weapon with a long reach, featuring a blade at the end of a pole.', '20 gp', '6 lb.', '1d10', 'slashing', ARRAY['Heavy', 'Reach', 'Two-Handed'], NULL, 'handbook.txt', 149),
('Halberd', 'halberd', 'weapon', 'A martial melee weapon combining an axe blade and a spike on a long shaft.', '20 gp', '6 lb.', '1d10', 'slashing', ARRAY['Heavy', 'Reach', 'Two-Handed'], NULL, 'handbook.txt', 149),
('Lance', 'lance', 'weapon', 'A martial melee weapon designed for mounted combat with exceptional reach.', '10 gp', '6 lb.', '1d12', 'piercing', ARRAY['Reach', 'Special'], NULL, 'handbook.txt', 149),
('Maul', 'maul', 'weapon', 'A martial melee weapon - a massive hammer used to deliver crushing blows.', '10 gp', '10 lb.', '2d6', 'bludgeoning', ARRAY['Heavy', 'Two-Handed'], NULL, 'handbook.txt', 149),
('Morningstar', 'morningstar', 'weapon', 'A martial melee weapon with a spiked ball on a shaft.', '15 gp', '4 lb.', '1d8', 'piercing', NULL, NULL, 'handbook.txt', 149),
('Pike', 'pike', 'weapon', 'A martial melee weapon - an extremely long spear used in formation fighting.', '5 gp', '18 lb.', '1d10', 'piercing', ARRAY['Heavy', 'Reach', 'Two-Handed'], NULL, 'handbook.txt', 149),
('Trident', 'trident', 'weapon', 'A martial melee weapon with a three-pronged spear head, often associated with the sea.', '5 gp', '4 lb.', '1d6', 'piercing', ARRAY['Thrown', 'Versatile (1d8)'], '20/60', 'handbook.txt', 149),
('War Pick', 'war-pick', 'weapon', 'A martial melee weapon with a pick head designed to pierce armor.', '5 gp', '2 lb.', '1d8', 'piercing', NULL, NULL, 'handbook.txt', 149),
('Warhammer', 'warhammer', 'weapon', 'A martial melee weapon - a hammer designed for combat.', '15 gp', '2 lb.', '1d8', 'bludgeoning', ARRAY['Versatile (1d10)'], NULL, 'handbook.txt', 149),
('Whip', 'whip', 'weapon', 'A martial melee weapon with reach, though dealing minimal damage.', '2 gp', '3 lb.', '1d4', 'slashing', ARRAY['Finesse', 'Reach'], NULL, 'handbook.txt', 149),
('Heavy Crossbow', 'heavy-crossbow', 'weapon', 'A martial ranged weapon that fires heavy bolts with great force.', '50 gp', '18 lb.', '1d10', 'piercing', ARRAY['Ammunition', 'Heavy', 'Loading', 'Two-Handed'], '100/400', 'handbook.txt', 149),
('Hand Crossbow', 'hand-crossbow', 'weapon', 'A martial ranged weapon small enough to fire with one hand.', '75 gp', '3 lb.', '1d6', 'piercing', ARRAY['Ammunition', 'Light', 'Loading'], '30/120', 'handbook.txt', 149),
('Blowgun', 'blowgun', 'weapon', 'A martial ranged weapon that fires tiny needles using breath.', '10 gp', '1 lb.', '1', 'piercing', ARRAY['Ammunition', 'Loading'], '25/100', 'handbook.txt', 149),
('Net', 'net', 'weapon', 'A martial ranged weapon used to restrain creatures.', '1 gp', '3 lb.', NULL, NULL, ARRAY['Special', 'Thrown'], '5/15', 'handbook.txt', 149);

-- Armor
INSERT INTO items (name, slug, item_type, description, cost, weight, armor_class, armor_type, strength_requirement, stealth_disadvantage, source_document, source_page) VALUES
('Padded Armor', 'padded-armor', 'armor', 'Padded armor consists of quilted layers of cloth and batting.', '5 gp', '8 lb.', '11 + Dex modifier', 'Light', NULL, TRUE, 'handbook.txt', 145),
('Leather Armor', 'leather-armor', 'armor', 'The breastplate and shoulder protectors of this armor are made of leather that has been stiffened by being boiled in oil.', '10 gp', '10 lb.', '11 + Dex modifier', 'Light', NULL, FALSE, 'rules.txt', 45),
('Studded Leather', 'studded-leather', 'armor', 'Made from tough but flexible leather, studded leather is reinforced with close-set rivets or spikes.', '45 gp', '13 lb.', '12 + Dex modifier', 'Light', NULL, FALSE, 'rules.txt', 45),
('Chain Shirt', 'chain-shirt', 'armor', 'Made of interlocking metal rings, a chain shirt is worn between layers of clothing or leather.', '50 gp', '20 lb.', '13 + Dex modifier (max 2)', 'Medium', NULL, FALSE, 'rules.txt', 45),
('Scale Mail', 'scale-mail', 'armor', 'This armor consists of a coat and leggings of leather covered with overlapping pieces of metal.', '50 gp', '45 lb.', '14 + Dex modifier (max 2)', 'Medium', NULL, TRUE, 'rules.txt', 45),
('Chain Mail', 'chain-mail', 'armor', 'Made of interlocking metal rings, chain mail includes a layer of quilted fabric worn underneath.', '75 gp', '55 lb.', '16', 'Heavy', 13, TRUE, 'rules.txt', 45),
('Plate Armor', 'plate-armor', 'armor', 'Plate consists of shaped, interlocking metal plates to cover the entire body.', '1,500 gp', '65 lb.', '18', 'Heavy', 15, TRUE, 'rules.txt', 45),
('Shield', 'shield', 'armor', 'A shield is made from wood or metal and is carried in one hand.', '10 gp', '6 lb.', '+2', 'Shield', NULL, FALSE, 'rules.txt', 45),
('Hide Armor', 'hide-armor', 'armor', 'This crude armor consists of thick furs and pelts. It is commonly worn by barbarian tribes, evil humanoids, and other folk who lack access to the tools and materials needed to create better armor.', '10 gp', '12 lb.', '12 + Dex modifier (max 2)', 'Medium', NULL, FALSE, 'handbook.txt', 145),
('Breastplate', 'breastplate', 'armor', 'This armor consists of a fitted metal chest piece worn with supple leather. Although it leaves the legs and arms relatively unprotected, this armor provides good protection for the wearers vital organs while leaving the wearer relatively unencumbered.', '400 gp', '20 lb.', '14 + Dex modifier (max 2)', 'Medium', NULL, FALSE, 'handbook.txt', 145),
('Half Plate', 'half-plate', 'armor', 'Half plate consists of shaped metal plates that cover most of the wearers body. It does not include leg protection beyond simple greaves that are attached with leather straps.', '750 gp', '40 lb.', '15 + Dex modifier (max 2)', 'Medium', NULL, TRUE, 'handbook.txt', 145),
('Ring Mail', 'ring-mail', 'armor', 'This armor is leather armor with heavy rings sewn into it. The rings help reinforce the armor against blows from swords and axes. Ring mail is inferior to chain mail, and is usually worn only by those who cannot afford better armor.', '30 gp', '40 lb.', '14', 'Heavy', NULL, TRUE, 'handbook.txt', 145),
('Splint Armor', 'splint-armor', 'armor', 'This armor is made of narrow vertical strips of metal riveted to a backing of leather that is worn over cloth padding. Flexible chain mail protects the joints.', '200 gp', '60 lb.', '17', 'Heavy', 15, TRUE, 'handbook.txt', 145);

-- Adventuring Gear
INSERT INTO items (name, slug, item_type, description, cost, weight, source_document, source_page) VALUES
('Backpack', 'backpack', 'adventuring_gear', 'A leather pack carried on the back, typically with drawstrings, buckles, or straps.', '2 gp', '5 lb.', 'rules.txt', 48),
('Rope (50 feet)', 'rope-50-feet', 'adventuring_gear', 'Rope, whether made of hemp or silk, has 2 hit points and can be burst with a DC 17 Strength check.', '1 gp', '10 lb.', 'rules.txt', 48),
('Torch', 'torch', 'adventuring_gear', 'A torch burns for 1 hour, providing bright light in a 20-foot radius and dim light for an additional 20 feet.', '1 cp', '1 lb.', 'rules.txt', 48),
('Rations (1 day)', 'rations', 'adventuring_gear', 'Rations consist of dry foods suitable for extended travel, including jerky, dried fruit, hardtack, and nuts.', '5 sp', '2 lb.', 'rules.txt', 48),
('Waterskin', 'waterskin', 'adventuring_gear', 'A waterskin can hold up to 4 pints of liquid.', '2 sp', '5 lb. (full)', 'rules.txt', 48),
('Bedroll', 'bedroll', 'adventuring_gear', 'A bedroll helps you sleep in comfort.', '1 gp', '7 lb.', 'rules.txt', 48),
('Tinderbox', 'tinderbox', 'adventuring_gear', 'This small container holds flint, fire steel, and tinder used to kindle a fire.', '5 sp', '1 lb.', 'rules.txt', 48),
('Healer''s Kit', 'healers-kit', 'adventuring_gear', 'This kit is a leather pouch containing bandages, salves, and splints. The kit has ten uses. You can use it to stabilize a creature that has 0 hit points without needing to make a Wisdom (Medicine) check.', '5 gp', '3 lb.', 'rules.txt', 48),
('Thieves'' Tools', 'thieves-tools', 'tool', 'This set of tools includes a small file, a set of lock picks, a small mirror mounted on a metal handle, a set of narrow-bladed scissors, and a pair of pliers.', '25 gp', '1 lb.', 'rules.txt', 48);

-- ---------------------------------------------------------------------------
-- 8.7 Feats
-- ---------------------------------------------------------------------------

INSERT INTO feats (name, slug, description, prerequisites, benefits, source_document, source_page) VALUES
('Alert', 'alert', 'Always on the lookout for danger, you gain the following benefits: You can''t be surprised while you are conscious. You gain a +5 bonus to initiative. Other creatures don''t gain advantage on attack rolls against you as a result of being unseen by you.', NULL, '{"initiative_bonus": 5, "no_surprise": true, "no_unseen_advantage": true}', 'handbook.txt', 165),

('Athlete', 'athlete', 'You have undergone extensive physical training to gain the following benefits: Increase your Strength or Dexterity score by 1, to a maximum of 20. When you are prone, standing up uses only 5 feet of your movement. Climbing doesn''t cost you extra movement. You can make a running long jump or a running high jump after moving only 5 feet on foot, rather than 10 feet.', NULL, '{"ability_increase": ["strength", "dexterity"], "prone_stand_cost": 5, "climbing_cost": "normal", "jump_run_up": 5}', 'handbook.txt', 165),

('Dual Wielder', 'dual-wielder', 'You master fighting with two weapons, gaining the following benefits: You gain a +1 bonus to AC while you are wielding a separate melee weapon in each hand. You can use two-weapon fighting even when the one-handed melee weapons you are wielding aren''t light. You can draw or stow two one-handed weapons when you would normally be able to draw or stow only one.', NULL, '{"ac_bonus": 1, "no_light_restriction": true, "draw_two_weapons": true}', 'handbook.txt', 165),

('Great Weapon Master', 'great-weapon-master', 'You''ve learned to put the weight of a weapon to your advantage, letting its momentum empower your strikes. On your turn, when you score a critical hit with a melee weapon or reduce a creature to 0 hit points with one, you can make one melee weapon attack as a bonus action. Before you make a melee attack with a heavy weapon that you are proficient with, you can choose to take a -5 penalty to the attack roll. If the attack hits, you add +10 to the attack''s damage.', NULL, '{"bonus_attack_on_crit_or_kill": true, "power_attack": {"attack_penalty": -5, "damage_bonus": 10}}', 'handbook.txt', 167),

('Lucky', 'lucky', 'You have inexplicable luck that seems to kick in at just the right moment. You have 3 luck points. Whenever you make an attack roll, an ability check, or a saving throw, you can spend one luck point to roll an additional d20. You can choose to spend one of your luck points after you roll the die, but before the outcome is determined. You choose which of the d20s is used for the attack roll, ability check, or saving throw. You can also spend one luck point when an attack roll is made against you. Roll a d20, and then choose whether the attack uses the attacker''s roll or yours. If more than one creature spends a luck point to influence the outcome of a roll, the points cancel each other out; no additional dice are rolled. You regain your expended luck points when you finish a long rest.', NULL, '{"luck_points": 3, "reroll_attacks": true, "reroll_checks": true, "reroll_saves": true, "enemy_reroll": true}', 'handbook.txt', 167),

('Sentinel', 'sentinel', 'You have mastered techniques to take advantage of every drop in any enemy''s guard, gaining the following benefits: When you hit a creature with an opportunity attack, the creature''s speed becomes 0 for the rest of the turn. Creatures provoke opportunity attacks from you even if they take the Disengage action before leaving your reach. When a creature within 5 feet of you makes an attack against a target other than you (and that target doesn''t have this feat), you can use your reaction to make a melee weapon attack against the attacking creature.', NULL, '{"opportunity_attack_stops_movement": true, "disengage_still_provokes": true, "protect_allies": true}', 'handbook.txt', 169),

('Sharpshooter', 'sharpshooter', 'You have mastered ranged weapons and can make shots that others find impossible. Attacking at long range doesn''t impose disadvantage on your ranged weapon attack rolls. Your ranged weapon attacks ignore half cover and three-quarters cover. Before you make an attack with a ranged weapon that you are proficient with, you can choose to take a -5 penalty to the attack roll. If the attack hits, you add +10 to the attack''s damage.', NULL, '{"ignore_long_range_disadvantage": true, "ignore_cover": true, "power_attack": {"attack_penalty": -5, "damage_bonus": 10}}', 'handbook.txt', 170),

('War Caster', 'war-caster', 'You have practiced casting spells in the midst of combat, learning techniques that grant you the following benefits: You have advantage on Constitution saving throws that you make to maintain your concentration on a spell when you take damage. You can perform the somatic components of spells even when you have weapons or a shield in one or both hands. When a hostile creature''s movement provokes an opportunity attack from you, you can use your reaction to cast a spell at the creature, rather than making an opportunity attack. The spell must have a casting time of 1 action and must target only that creature.', 'The ability to cast at least one spell', '{"concentration_advantage": true, "somatic_with_equipment": true, "spell_opportunity_attack": true}', 'handbook.txt', 170),

('Actor', 'actor', 'Skilled at mimicry and dramatics, you gain the following benefits: Increase your Charisma score by 1, to a maximum of 20. You have advantage on Charisma (Deception) and Charisma (Performance) checks when trying to pass yourself off as a different person. You can mimic the speech of another person or the sounds made by other creatures.', NULL, '{"ability_increase": ["charisma"], "deception_advantage": true, "performance_advantage": true, "mimicry": true}', 'handbook.txt', 165),

('Charger', 'charger', 'When you use your action to Dash, you can use a bonus action to make one melee weapon attack or to shove a creature. If you move at least 10 feet in a straight line immediately before taking this bonus action, you either gain a +5 bonus to the attacks damage roll or push the target up to 10 feet away from you.', NULL, '{"dash_bonus_attack": true, "charge_damage_bonus": 5, "charge_push": 10}', 'handbook.txt', 165),

('Crossbow Expert', 'crossbow-expert', 'Thanks to extensive practice with the crossbow, you gain the following benefits: You ignore the loading quality of crossbows with which you are proficient. Being within 5 feet of a hostile creature does not impose disadvantage on your ranged attack rolls. When you use the Attack action and attack with a one-handed weapon, you can use a bonus action to attack with a hand crossbow you are holding.', NULL, '{"ignore_loading": true, "no_close_range_disadvantage": true, "bonus_hand_crossbow_attack": true}', 'handbook.txt', 165),

('Defensive Duelist', 'defensive-duelist', 'When you are wielding a finesse weapon with which you are proficient and another creature hits you with a melee attack, you can use your reaction to add your proficiency bonus to your AC for that attack, potentially causing the attack to miss you.', 'Dexterity 13 or higher', '{"reaction_ac_bonus": "proficiency"}', 'handbook.txt', 165),

('Dungeon Delver', 'dungeon-delver', 'Alert to the hidden traps and secret doors found in many dungeons, you gain the following benefits: You have advantage on Wisdom (Perception) and Intelligence (Investigation) checks made to detect the presence of secret doors. You have advantage on saving throws made to avoid or resist traps. You have resistance to the damage dealt by traps. Traveling at a fast pace does not impose the normal penalty to your passive Wisdom (Perception) score.', NULL, '{"secret_door_advantage": true, "trap_save_advantage": true, "trap_resistance": true, "fast_pace_perception": true}', 'handbook.txt', 166),

('Durable', 'durable', 'Hardy and resilient, you gain the following benefits: Increase your Constitution score by 1, to a maximum of 20. When you roll a Hit Die to regain hit points, the minimum number of hit points you regain from the roll equals twice your Constitution modifier (minimum of 2).', NULL, '{"ability_increase": ["constitution"], "minimum_hit_die_healing": "2x_con_mod"}', 'handbook.txt', 166),

('Elemental Adept', 'elemental-adept', 'When you gain this feat, choose one of the following damage types: acid, cold, fire, lightning, or thunder. Spells you cast ignore resistance to damage of the chosen type. In addition, when you roll damage for a spell you cast that deals damage of that type, you can treat any 1 on a damage die as a 2.', 'The ability to cast at least one spell', '{"ignore_resistance": true, "minimum_damage_roll": 2}', 'handbook.txt', 166),

('Grappler', 'grappler', 'You have developed the skills necessary to hold your own in close-quarters grappling. You gain the following benefits: You have advantage on attack rolls against a creature you are grappling. You can use your action to try to pin a creature grappled by you. To do so, make another grapple check. If you succeed, you and the creature are both restrained until the grapple ends.', 'Strength 13 or higher', '{"grapple_attack_advantage": true, "pin_ability": true}', 'handbook.txt', 167),

('Healer', 'healer', 'You are an able physician, allowing you to mend wounds quickly and get your allies back in the fight. You gain the following benefits: When you use a healers kit to stabilize a dying creature, that creature also regains 1 hit point. As an action, you can spend one use of a healers kit to tend to a creature and restore 1d6 + 4 hit points to it, plus additional hit points equal to the creatures maximum number of Hit Dice. The creature cannot regain hit points from this feat again until it finishes a short or long rest.', NULL, '{"stabilize_heals": 1, "healers_kit_healing": "1d6+4+max_hit_dice"}', 'handbook.txt', 167),

('Heavily Armored', 'heavily-armored', 'You have trained to master the use of heavy armor, gaining the following benefits: Increase your Strength score by 1, to a maximum of 20. You gain proficiency with heavy armor.', 'Proficiency with medium armor', '{"ability_increase": ["strength"], "heavy_armor_proficiency": true}', 'handbook.txt', 167),

('Heavy Armor Master', 'heavy-armor-master', 'You can use your armor to deflect strikes that would kill others. You gain the following benefits: Increase your Strength score by 1, to a maximum of 20. While you are wearing heavy armor, bludgeoning, piercing, and slashing damage that you take from nonmagical weapons is reduced by 3.', 'Proficiency with heavy armor', '{"ability_increase": ["strength"], "damage_reduction": 3}', 'handbook.txt', 167),

('Inspiring Leader', 'inspiring-leader', 'You can spend 10 minutes inspiring your companions, shoring up their resolve to fight. When you do so, choose up to six friendly creatures (which can include yourself) within 30 feet of you who can see or hear you and who can understand you. Each creature can gain temporary hit points equal to your level + your Charisma modifier. A creature cannot gain temporary hit points from this feat again until it has finished a short or long rest.', 'Charisma 13 or higher', '{"temp_hp": "level+charisma_mod", "targets": 6}', 'handbook.txt', 167),

('Keen Mind', 'keen-mind', 'You have a mind that can track time, direction, and detail with uncanny precision. You gain the following benefits: Increase your Intelligence score by 1, to a maximum of 20. You always know which way is north. You always know the number of hours left before the next sunrise or sunset. You can accurately recall anything you have seen or heard within the past month.', NULL, '{"ability_increase": ["intelligence"], "know_north": true, "know_time": true, "perfect_recall": "1 month"}', 'handbook.txt', 167),

('Lightly Armored', 'lightly-armored', 'You have trained to master the use of light armor, gaining the following benefits: Increase your Strength or Dexterity score by 1, to a maximum of 20. You gain proficiency with light armor.', NULL, '{"ability_increase": ["strength", "dexterity"], "light_armor_proficiency": true}', 'handbook.txt', 167),

('Linguist', 'linguist', 'You have studied languages and codes, gaining the following benefits: Increase your Intelligence score by 1, to a maximum of 20. You learn three languages of your choice. You can ably create written ciphers. Others cannot decipher a code you create unless you teach them, they succeed on an Intelligence check (DC equal to your Intelligence score + your proficiency bonus), or they use magic to decipher it.', NULL, '{"ability_increase": ["intelligence"], "languages": 3, "cipher_creation": true}', 'handbook.txt', 167),

('Mage Slayer', 'mage-slayer', 'You have practiced techniques useful in melee combat against spellcasters, gaining the following benefits: When a creature within 5 feet of you casts a spell, you can use your reaction to make a melee weapon attack against that creature. When you damage a creature that is concentrating on a spell, that creature has disadvantage on the saving throw it makes to maintain its concentration. You have advantage on saving throws against spells cast by creatures within 5 feet of you.', NULL, '{"reaction_attack_on_cast": true, "concentration_disadvantage": true, "close_spell_save_advantage": true}', 'handbook.txt', 168),

('Magic Initiate', 'magic-initiate', 'Choose a class: bard, cleric, druid, sorcerer, warlock, or wizard. You learn two cantrips of your choice from that classs spell list. In addition, choose one 1st-level spell from that same list. You learn that spell and can cast it at its lowest level. Once you cast it, you must finish a long rest before you can cast it again using this feat. Your spellcasting ability for these spells depends on the class you chose.', NULL, '{"cantrips": 2, "first_level_spell": 1}', 'handbook.txt', 168),

('Martial Adept', 'martial-adept', 'You have martial training that allows you to perform special combat maneuvers. You gain the following benefits: You learn two maneuvers of your choice from among those available to the Battle Master archetype in the fighter class. If a maneuver you use requires your target to make a saving throw to resist the maneuvers effects, the saving throw DC equals 8 + your proficiency bonus + your Strength or Dexterity modifier (your choice). You gain one superiority die, which is a d6 (this die is added to any superiority dice you have from another source). This die is used to fuel your maneuvers. A superiority die is expended when you use it. You regain your expended superiority dice when you finish a short or long rest.', NULL, '{"maneuvers": 2, "superiority_dice": 1}', 'handbook.txt', 168),

('Medium Armor Master', 'medium-armor-master', 'You have practiced moving in medium armor to gain the following benefits: Wearing medium armor does not impose disadvantage on your Dexterity (Stealth) checks. When you wear medium armor, you can add 3, rather than 2, to your AC if you have a Dexterity of 16 or higher.', 'Proficiency with medium armor', '{"no_stealth_disadvantage": true, "max_dex_bonus": 3}', 'handbook.txt', 168),

('Mobile', 'mobile', 'You are exceptionally speedy and agile. You gain the following benefits: Your speed increases by 10 feet. When you use the Dash action, difficult terrain does not cost you extra movement on that turn. When you make a melee attack against a creature, you do not provoke opportunity attacks from that creature for the rest of the turn, whether you hit or not.', NULL, '{"speed_bonus": 10, "dash_ignores_difficult_terrain": true, "no_opportunity_attack_after_melee": true}', 'handbook.txt', 168),

('Moderately Armored', 'moderately-armored', 'You have trained to master the use of medium armor and shields, gaining the following benefits: Increase your Strength or Dexterity score by 1, to a maximum of 20. You gain proficiency with medium armor and shields.', 'Proficiency with light armor', '{"ability_increase": ["strength", "dexterity"], "medium_armor_proficiency": true, "shield_proficiency": true}', 'handbook.txt', 168),

('Mounted Combatant', 'mounted-combatant', 'You are a dangerous foe to face while mounted. While you are mounted and are not incapacitated, you gain the following benefits: You have advantage on melee attack rolls against any unmounted creature that is smaller than your mount. You can force an attack targeted at your mount to target you instead. If your mount is subjected to an effect that allows it to make a Dexterity saving throw to take only half damage, it instead takes no damage if it succeeds on the saving throw, and only half damage if it fails.', NULL, '{"advantage_vs_smaller": true, "redirect_attacks": true, "mount_evasion": true}', 'handbook.txt', 168),

('Observant', 'observant', 'Quick to notice details of your environment, you gain the following benefits: Increase your Intelligence or Wisdom score by 1, to a maximum of 20. If you can see a creatures mouth while it is speaking a language you understand, you can interpret what it is saying by reading its lips. You have a +5 bonus to your passive Wisdom (Perception) and passive Intelligence (Investigation) scores.', NULL, '{"ability_increase": ["intelligence", "wisdom"], "lip_reading": true, "passive_bonus": 5}', 'handbook.txt', 168),

('Polearm Master', 'polearm-master', 'You can keep your enemies at bay with reach weapons. You gain the following benefits: When you take the Attack action and attack with only a glaive, halberd, quarterstaff, or spear, you can use a bonus action to make a melee attack with the opposite end of the weapon. This attacks damage die is a d4, and the attack deals bludgeoning damage. While you are wielding a glaive, halberd, pike, quarterstaff, or spear, other creatures provoke an opportunity attack from you when they enter your reach.', NULL, '{"bonus_attack": true, "opportunity_attack_on_enter": true}', 'handbook.txt', 168),

('Resilient', 'resilient', 'Choose one ability score. You gain the following benefits: Increase the chosen ability score by 1, to a maximum of 20. You gain proficiency in saving throws using the chosen ability.', NULL, '{"ability_increase": 1, "save_proficiency": true}', 'handbook.txt', 169),

('Ritual Caster', 'ritual-caster', 'You have learned a number of spells that you can cast as rituals. These spells are written in a ritual book, which you must have in hand while casting one of them. When you choose this feat, you acquire a ritual book holding two 1st-level spells of your choice. Choose one of the following classes: bard, cleric, druid, sorcerer, warlock, or wizard. You must choose your spells from that classs spell list, and the spells you choose must have the ritual tag.', 'Intelligence or Wisdom 13 or higher', '{"ritual_spells": 2, "ritual_book": true}', 'handbook.txt', 169),

('Savage Attacker', 'savage-attacker', 'Once per turn when you roll damage for a melee weapon attack, you can reroll the weapons damage dice and use either total.', NULL, '{"reroll_melee_damage": true}', 'handbook.txt', 169),

('Shield Master', 'shield-master', 'You use shields not just for protection but also for offense. You gain the following benefits while you are wielding a shield: If you take the Attack action on your turn, you can use a bonus action to try to shove a creature within 5 feet of you with your shield. If you are not incapacitated, you can add your shields AC bonus to any Dexterity saving throw you make against a spell or other harmful effect that targets only you. If you are subjected to an effect that allows you to make a Dexterity saving throw to take only half damage, you can use your reaction to take no damage if you succeed on the saving throw, interposing your shield between yourself and the source of the effect.', NULL, '{"bonus_shove": true, "shield_dex_save_bonus": true, "shield_evasion": true}', 'handbook.txt', 170),

('Skilled', 'skilled', 'You gain proficiency in any combination of three skills or tools of your choice.', NULL, '{"proficiencies": 3}', 'handbook.txt', 170),

('Skulker', 'skulker', 'You are expert at slinking through shadows. You gain the following benefits: You can try to hide when you are lightly obscured from the creature from which you are hiding. When you are hidden from a creature and miss it with a ranged weapon attack, making the attack does not reveal your position. Dim light does not impose disadvantage on your Wisdom (Perception) checks relying on sight.', 'Dexterity 13 or higher', '{"hide_lightly_obscured": true, "missed_attack_no_reveal": true, "dim_light_perception": true}', 'handbook.txt', 170),

('Spell Sniper', 'spell-sniper', 'You have learned techniques to enhance your attacks with certain kinds of spells, gaining the following benefits: When you cast a spell that requires you to make an attack roll, the spells range is doubled. Your ranged spell attacks ignore half cover and three-quarters cover. You learn one cantrip that requires an attack roll. Choose the cantrip from the bard, cleric, druid, sorcerer, warlock, or wizard spell list. Your spellcasting ability for this cantrip depends on the spell list you chose from.', 'The ability to cast at least one spell', '{"double_spell_range": true, "ignore_cover": true, "cantrip": 1}', 'handbook.txt', 170),

('Tavern Brawler', 'tavern-brawler', 'Accustomed to rough-and-tumble fighting using whatever weapons happen to be at hand, you gain the following benefits: Increase your Strength or Constitution score by 1, to a maximum of 20. You are proficient with improvised weapons. Your unarmed strike uses a d4 for damage. When you hit a creature with an unarmed strike or an improvised weapon on your turn, you can use a bonus action to attempt to grapple the target.', NULL, '{"ability_increase": ["strength", "constitution"], "improvised_weapon_proficiency": true, "unarmed_damage": "d4", "bonus_grapple": true}', 'handbook.txt', 170),

('Tough', 'tough', 'Your hit point maximum increases by an amount equal to twice your level when you gain this feat. Whenever you gain a level thereafter, your hit point maximum increases by an additional 2 hit points.', NULL, '{"hp_bonus_per_level": 2}', 'handbook.txt', 170),

('Weapon Master', 'weapon-master', 'You have practiced extensively with a variety of weapons, gaining the following benefits: Increase your Strength or Dexterity score by 1, to a maximum of 20. You gain proficiency with four weapons of your choice. Each one must be a simple or a martial weapon.', NULL, '{"ability_increase": ["strength", "dexterity"], "weapon_proficiencies": 4}', 'handbook.txt', 170);

-- ---------------------------------------------------------------------------
-- 8.8 Backgrounds
-- ---------------------------------------------------------------------------

INSERT INTO backgrounds (name, slug, description, skill_proficiencies, tool_proficiencies, languages, equipment, feature_name, feature_description, source_document, source_page) VALUES
('Acolyte', 'acolyte', 'You have spent your life in the service of a temple to a specific god or pantheon of gods. You act as an intermediary between the realm of the holy and the mortal world, performing sacred rites and offering sacrifices in order to conduct worshipers into the presence of the divine.', ARRAY['Insight', 'Religion'], NULL, 2, 'A holy symbol, a prayer book or prayer wheel, 5 sticks of incense, vestments, a set of common clothes, and a pouch containing 15 gp', 'Shelter of the Faithful', 'As an acolyte, you command the respect of those who share your faith, and you can perform the religious ceremonies of your deity. You and your adventuring companions can expect to receive free healing and care at a temple, shrine, or other established presence of your faith.', 'rules.txt', 37),

('Criminal', 'criminal', 'You are an experienced criminal with a history of breaking the law. You have spent a lot of time among other criminals and still have contacts within the criminal underworld.', ARRAY['Deception', 'Stealth'], ARRAY['One type of gaming set', 'Thieves'' tools'], 0, 'A crowbar, a set of dark common clothes including a hood, and a pouch containing 15 gp', 'Criminal Contact', 'You have a reliable and trustworthy contact who acts as your liaison to a network of other criminals. You know how to get messages to and from your contact, even over great distances.', 'rules.txt', 38),

('Folk Hero', 'folk-hero', 'You come from a humble social rank, but you are destined for so much more. Already the people of your home village regard you as their champion, and your destiny calls you to stand against the tyrants and monsters that threaten the common folk everywhere.', ARRAY['Animal Handling', 'Survival'], ARRAY['One type of artisan''s tools', 'Vehicles (land)'], 0, 'A set of artisan''s tools (one of your choice), a shovel, an iron pot, a set of common clothes, and a pouch containing 10 gp', 'Rustic Hospitality', 'Since you come from the ranks of the common folk, you fit in among them with ease. You can find a place to hide, rest, or recuperate among other commoners, unless you have shown yourself to be a danger to them.', 'rules.txt', 38),

('Noble', 'noble', 'You understand wealth, power, and privilege. You carry a noble title, and your family owns land, collects taxes, and wields significant political influence.', ARRAY['History', 'Persuasion'], ARRAY['One type of gaming set'], 1, 'A set of fine clothes, a signet ring, a scroll of pedigree, and a purse containing 25 gp', 'Position of Privilege', 'Thanks to your noble birth, people are inclined to think the best of you. You are welcome in high society, and people assume you have the right to be wherever you are. Common folk make every effort to accommodate you and avoid your displeasure.', 'rules.txt', 39),

('Sage', 'sage', 'You spent years learning the lore of the multiverse. You scoured manuscripts, studied scrolls, and listened to the greatest experts on the subjects that interest you.', ARRAY['Arcana', 'History'], NULL, 2, 'A bottle of black ink, a quill, a small knife, a letter from a dead colleague posing a question you have not yet been able to answer, a set of common clothes, and a pouch containing 10 gp', 'Researcher', 'When you attempt to learn or recall a piece of lore, if you do not know that information, you often know where and from whom you can obtain it. Usually, this information comes from a library, scriptorium, university, or a sage or other learned person or creature.', 'rules.txt', 39),

('Soldier', 'soldier', 'War has been your life for as long as you care to remember. You trained as a youth, studied the use of weapons and armor, learned basic survival techniques, including how to stay alive on the battlefield.', ARRAY['Athletics', 'Intimidation'], ARRAY['One type of gaming set', 'Vehicles (land)'], 0, 'An insignia of rank, a trophy taken from a fallen enemy, a set of bone dice or deck of cards, a set of common clothes, and a pouch containing 10 gp', 'Military Rank', 'You have a military rank from your career as a soldier. Soldiers loyal to your former military organization still recognize your authority and influence, and they defer to you if they are of a lower rank.', 'rules.txt', 40),

('Charlatan', 'charlatan', 'You have always had a way with people. You know what makes them tick, you can tease out their hearts desires after a few minutes of conversation, and with a few leading questions you can read them like they were childrens books.', ARRAY['Deception', 'Sleight of Hand'], ARRAY['Disguise kit', 'Forgery kit'], 0, 'A set of fine clothes, a disguise kit, tools of the con of your choice (ten stoppered bottles filled with colored liquid, a set of weighted dice, a deck of marked cards, or a signet ring of an imaginary duke), and a pouch containing 15 gp', 'False Identity', 'You have created a second identity that includes documentation, established acquaintances, and disguises that allow you to assume that persona. Additionally, you can forge documents including official papers and personal letters, as long as you have seen an example of the kind of document or the handwriting you are trying to copy.', 'handbook.txt', 128),

('Entertainer', 'entertainer', 'You thrive in front of an audience. You know how to entrance them, entertain them, and even inspire them. Your poetics can stir the hearts of those who hear you, awakening grief or joy, laughter or anger.', ARRAY['Acrobatics', 'Performance'], ARRAY['Disguise kit', 'One type of musical instrument'], 0, 'A musical instrument (one of your choice), the favor of an admirer (love letter, lock of hair, or trinket), a costume, and a pouch containing 15 gp', 'By Popular Demand', 'You can always find a place to perform, usually in an inn or tavern but possibly with a circus, at a theater, or even in a noble court. At such a place, you receive free lodging and food of a modest or comfortable standard, as long as you perform each night.', 'handbook.txt', 130),

('Guild Artisan', 'guild-artisan', 'You are a member of an artisans guild, skilled in a particular field and closely associated with other artisans. You are a well-established part of the mercantile world, freed by talent and wealth from the constraints of a feudal social order.', ARRAY['Insight', 'Persuasion'], ARRAY['One type of artisans tools'], 1, 'A set of artisans tools (one of your choice), a letter of introduction from your guild, a set of travelers clothes, and a pouch containing 15 gp', 'Guild Membership', 'As an established and respected member of a guild, you can rely on certain benefits that membership provides. Your fellow guild members will provide you with lodging and food if necessary, and pay for your funeral if needed. In some cities and towns, a guildhall offers a central place to meet other members of your profession.', 'handbook.txt', 132),

('Hermit', 'hermit', 'You lived in seclusion—either in a sheltered community such as a monastery, or entirely alone—for a formative part of your life. In your time apart from the clamor of society, you found quiet, solitude, and perhaps some of the answers you were looking for.', ARRAY['Medicine', 'Religion'], ARRAY['Herbalism kit'], 1, 'A scroll case stuffed full of notes from your studies or prayers, a winter blanket, a set of common clothes, an herbalism kit, and 5 gp', 'Discovery', 'The quiet seclusion of your extended hermitage gave you access to a unique and powerful discovery. The exact nature of this revelation depends on the nature of your seclusion. It might be a great truth about the cosmos, the deities, the powerful beings of the outer planes, or the forces of nature.', 'handbook.txt', 134),

('Outlander', 'outlander', 'You grew up in the wilds, far from civilization and the comforts of town and technology. You have witnessed the migration of herds larger than forests, survived weather more extreme than any city-dweller could comprehend, and enjoyed the solitude of being the only thinking creature for miles in any direction.', ARRAY['Athletics', 'Survival'], ARRAY['One type of musical instrument'], 1, 'A staff, a hunting trap, a trophy from an animal you killed, a set of travelers clothes, and a pouch containing 10 gp', 'Wanderer', 'You have an excellent memory for maps and geography, and you can always recall the general layout of terrain, settlements, and other features around you. In addition, you can find food and fresh water for yourself and up to five other people each day, provided that the land offers berries, small game, water, and so forth.', 'handbook.txt', 136),

('Sailor', 'sailor', 'You sailed on a seagoing vessel for years. In that time, you faced down mighty storms, monsters of the deep, and those who wanted to sink your craft to the bottomless depths. Your first love is the distant line of the horizon, but the time has come to try your hand at something new.', ARRAY['Athletics', 'Perception'], ARRAY['Navigators tools', 'Vehicles (water)'], 0, 'A belaying pin (club), 50 feet of silk rope, a lucky charm such as a rabbit foot or a small stone with a hole in the center, a set of common clothes, and a pouch containing 10 gp', 'Ships Passage', 'When you need to, you can secure free passage on a sailing ship for yourself and your adventuring companions. You might sail on the ship you served on, or another ship you have good relations with. Because youre calling in a favor, you cant be certain of a schedule or route that will meet your every need.', 'handbook.txt', 139),

('Urchin', 'urchin', 'You grew up on the streets alone, orphaned, and poor. You had no one to watch over you or to provide for you, so you learned to provide for yourself. You fought fiercely over food and kept a constant watch out for other desperate souls who might steal from you.', ARRAY['Sleight of Hand', 'Stealth'], ARRAY['Disguise kit', 'Thieves tools'], 0, 'A small knife, a map of the city you grew up in, a pet mouse, a token to remember your parents by, a set of common clothes, and a pouch containing 10 gp', 'City Secrets', 'You know the secret patterns and flow to cities and can find passages through the urban sprawl that others would miss. When you are not in combat, you (and companions you lead) can travel between any two locations in the city twice as fast as your speed would normally allow.', 'handbook.txt', 141);

-- =============================================================================
-- SECTION 9: Additional Rules from Basic Rules
-- =============================================================================

-- ---------------------------------------------------------------------------
-- 9.1 Additional Rule Categories
-- ---------------------------------------------------------------------------

-- Character Creation category
INSERT INTO rule_categories (name, slug, description, parent_id, sort_order) VALUES
('Character Creation', 'character-creation', 'Rules for creating player characters', NULL, 5);

-- Customization category
INSERT INTO rule_categories (name, slug, description, parent_id, sort_order) VALUES
('Customization Options', 'customization-options', 'Optional rules for multiclassing and feats', NULL, 6);

-- Magic Items category
INSERT INTO rule_categories (name, slug, description, parent_id, sort_order) VALUES
('Magic Items', 'magic-items', 'Rules for using and attuning to magic items', NULL, 7);

-- Encounter Building category
INSERT INTO rule_categories (name, slug, description, parent_id, sort_order) VALUES
('Encounter Building', 'encounter-building', 'Rules for building combat encounters', NULL, 8);

-- Sub-categories for Spellcasting
INSERT INTO rule_categories (name, slug, description, parent_id, sort_order)
SELECT 'Spell Basics', 'spell-basics', 'Fundamental rules about spells and spell slots', id, 1
FROM rule_categories WHERE slug = 'spellcasting';

INSERT INTO rule_categories (name, slug, description, parent_id, sort_order)
SELECT 'Casting a Spell', 'casting-a-spell', 'Rules for casting time, range, components, and duration', id, 2
FROM rule_categories WHERE slug = 'spellcasting';

-- Sub-categories for Combat
INSERT INTO rule_categories (name, slug, description, parent_id, sort_order)
SELECT 'Order of Combat', 'order-of-combat', 'Initiative, surprise, and combat sequence', id, 5
FROM rule_categories WHERE slug = 'combat';

INSERT INTO rule_categories (name, slug, description, parent_id, sort_order)
SELECT 'Special Combat', 'special-combat', 'Grappling, shoving, mounted and underwater combat', id, 6
FROM rule_categories WHERE slug = 'combat';

-- ---------------------------------------------------------------------------
-- 9.2 Chapter 7: Additional Using Ability Scores Rules
-- ---------------------------------------------------------------------------

-- Advantage and Disadvantage
INSERT INTO rules (category_id, title, slug, content, summary, keywords, source_document, source_chapter, source_page)
SELECT id, 'Advantage and Disadvantage', 'advantage-and-disadvantage',
'Sometimes a special ability or spell tells you that you have advantage or disadvantage on an ability check, a saving throw, or an attack roll. When that happens, you roll a second d20 when you make the roll. Use the higher of the two rolls if you have advantage, and use the lower roll if you have disadvantage.

If multiple situations affect a roll and each one grants advantage or imposes disadvantage on it, you do not roll more than one additional d20. If two favorable situations grant advantage, for example, you still roll only one additional d20.

If circumstances cause a roll to have both advantage and disadvantage, you are considered to have neither of them, and you roll one d20. This is true even if multiple circumstances impose disadvantage and only one grants advantage or vice versa. In such a situation, you have neither advantage nor disadvantage.

When you have advantage or disadvantage and something in the game, such as the halfling Lucky trait, lets you reroll or replace the d20, you can reroll or replace only one of the dice. You choose which one.',
'Roll 2d20, take higher for advantage or lower for disadvantage; they cancel each other out',
ARRAY['advantage', 'disadvantage', 'd20', 'roll twice'],
'rules.txt', 'Chapter 7', 60
FROM rule_categories WHERE slug = 'ability-checks';

-- Working Together
INSERT INTO rules (category_id, title, slug, content, summary, keywords, source_document, source_chapter, source_page)
SELECT id, 'Working Together', 'working-together',
'Sometimes two or more characters team up to attempt a task. The character who is leading the effort—or the one with the highest ability modifier—can make an ability check with advantage, reflecting the help provided by the other characters. In combat, this requires the Help action.

A character can only provide help if the task is one that he or she could attempt alone. For example, trying to open a lock requires proficiency with thieves tools, so a character who lacks that proficiency cannot help another character in that task. Moreover, a character can help only when two or more individuals working together would actually be productive. Some tasks, such as threading a needle, are no easier with help.',
'Leader makes check with advantage when others help; helper must be capable of the task',
ARRAY['help', 'working together', 'advantage', 'cooperation'],
'rules.txt', 'Chapter 7', 62
FROM rule_categories WHERE slug = 'ability-checks';

-- Contests
INSERT INTO rules (category_id, title, slug, content, summary, keywords, source_document, source_chapter, source_page)
SELECT id, 'Contests', 'contests',
'Sometimes one character or monster efforts are directly opposed to another. This can occur when both of them are trying to do the same thing and only one can succeed, such as attempting to snatch up a magic ring that has fallen on the floor. This situation also applies when one of them is trying to prevent the other one from accomplishing a goal—for example, when a monster tries to force open a door that an adventurer is holding closed. In situations like these, the outcome is determined by a special form of ability check, called a contest.

Both participants in a contest make ability checks appropriate to their efforts. They apply all appropriate bonuses and penalties, but instead of comparing the total to a DC, they compare the totals of their two checks. The participant with the higher check total wins the contest. That character or monster either succeeds at the action or prevents the other one from succeeding.

If the contest results in a tie, the situation remains the same as it was before the contest. Thus, one contestant might win the contest by default. If two characters tie in a contest to snatch a ring off the floor, neither character grabs it. In a contest between a monster trying to open a door and an adventurer trying to keep the door closed, a tie means that the door remains shut.',
'Both sides roll ability checks; higher total wins; ties maintain status quo',
ARRAY['contest', 'opposed check', 'versus'],
'rules.txt', 'Chapter 7', 62
FROM rule_categories WHERE slug = 'ability-checks';

-- Using Each Ability - Strength
INSERT INTO rules (category_id, title, slug, content, summary, keywords, source_document, source_chapter, source_page)
SELECT id, 'Using Strength', 'using-strength',
'Strength measures bodily power, athletic training, and the extent to which you can exert raw physical force.

Strength Checks: A Strength check can model any attempt to lift, push, pull, or break something, to force your body through a space, or to otherwise apply brute force to a situation. The Athletics skill reflects aptitude in certain kinds of Strength checks.

Attack Rolls and Damage: You add your Strength modifier to your attack roll and your damage roll when attacking with a melee weapon such as a mace, a battleaxe, or a javelin. You use melee weapons to make melee attacks in hand-to-hand combat, and some of them can be thrown to make a ranged attack.

Lifting and Carrying: Your Strength score determines the amount of weight you can bear. The following terms define what you can lift or carry.
- Carrying Capacity: Your carrying capacity is your Strength score multiplied by 15. This is the weight (in pounds) that you can carry.
- Push, Drag, or Lift: You can push, drag, or lift a weight in pounds up to twice your carrying capacity (or 30 times your Strength score). While pushing or dragging weight in excess of your carrying capacity, your speed drops to 5 feet.
- Size and Strength: Larger creatures can bear more weight, whereas Tiny creatures can carry less. For each size category above Medium, double the creatures carrying capacity. For a Tiny creature, halve these weights.',
'Strength governs melee attacks, athletics, and carrying capacity (STR x 15 lbs)',
ARRAY['strength', 'athletics', 'carrying capacity', 'lift', 'push', 'drag'],
'rules.txt', 'Chapter 7', 62
FROM rule_categories WHERE slug = 'using-ability-scores';

-- ---------------------------------------------------------------------------
-- 9.3 Chapter 9: Additional Combat Rules
-- ---------------------------------------------------------------------------

-- Initiative
INSERT INTO rules (category_id, title, slug, content, summary, keywords, source_document, source_chapter, source_page)
SELECT id, 'Initiative', 'initiative',
'Initiative determines the order of turns during combat. When combat starts, every participant makes a Dexterity check to determine their place in the initiative order. The DM makes one roll for an entire group of identical creatures, so each member of the group acts at the same time.

The DM ranks the combatants in order from the one with the highest Dexterity check total to the one with the lowest. This is the order (called the initiative order) in which they act during each round. The initiative order remains the same from round to round.

If a tie occurs, the DM decides the order among tied DM-controlled creatures, and the players decide the order among their tied characters. The DM can decide the order if the tie is between a monster and a player character. Optionally, the DM can have the tied characters and monsters each roll a d20 to determine the order, highest roll going first.',
'Roll Dexterity check at combat start; higher rolls act first each round',
ARRAY['initiative', 'dexterity', 'combat order', 'turn order'],
'rules.txt', 'Chapter 9', 72
FROM rule_categories WHERE slug = 'order-of-combat';

-- Surprise
INSERT INTO rules (category_id, title, slug, content, summary, keywords, source_document, source_chapter, source_page)
SELECT id, 'Surprise', 'surprise',
'A band of adventurers sneaks up on a bandit camp, springing from the trees to attack them. A gelatinous cube glides down a dungeon passage, unnoticed by the adventurers until the cube engulfs one of them. In these situations, one side of the battle gains surprise over the other.

The DM determines who might be surprised. If neither side tries to be stealthy, they automatically notice each other. Otherwise, the DM compares the Dexterity (Stealth) checks of anyone hiding with the passive Wisdom (Perception) score of each creature on the opposing side. Any character or monster that does not notice a threat is surprised at the start of the encounter.

If you are surprised, you cannot move or take an action on your first turn of the combat, and you cannot take a reaction until that turn ends. A member of a group can be surprised even if the other members are not.',
'Surprised creatures cannot move, act, or react on first turn; Stealth vs passive Perception',
ARRAY['surprise', 'stealth', 'ambush', 'surprised'],
'rules.txt', 'Chapter 9', 72
FROM rule_categories WHERE slug = 'order-of-combat';

-- Your Turn
INSERT INTO rules (category_id, title, slug, content, summary, keywords, source_document, source_chapter, source_page)
SELECT id, 'Your Turn', 'your-turn',
'On your turn, you can move a distance up to your speed and take one action. You decide whether to move first or take your action first. Your speed—sometimes called your walking speed—is noted on your character sheet.

The most common actions you can take are described in the Actions in Combat section. Many class features and other abilities provide additional options for your action.

The Movement and Position section gives the rules for your move.

You can forgo moving, taking an action, or doing anything at all on your turn. If you cannot decide what to do on your turn, consider taking the Dodge or Ready action.

Bonus Actions: Various class features, spells, and other abilities let you take an additional action on your turn called a bonus action. You can take a bonus action only when a special ability, spell, or other feature of the game states that you can do something as a bonus action. You otherwise do not have a bonus action to take. You can take only one bonus action on your turn, so you must choose which bonus action to use when you have more than one available. You choose when to take a bonus action during your turn, unless the bonus actions timing is specified.

Other Activity on Your Turn: Your turn can include a variety of flourishes that require neither your action nor your move. You can communicate however you are able, through brief utterances and gestures, as you take your turn. You can also interact with one object or feature of the environment for free, during either your move or your action.',
'Move up to speed + one action per turn; bonus actions from special abilities; one free object interaction',
ARRAY['turn', 'action', 'bonus action', 'move', 'free action'],
'rules.txt', 'Chapter 9', 72
FROM rule_categories WHERE slug = 'order-of-combat';

-- Actions in Combat - Attack
INSERT INTO rules (category_id, title, slug, content, summary, keywords, source_document, source_chapter, source_page)
SELECT id, 'Attack Action', 'attack-action',
'The most common action to take in combat is the Attack action, whether you are swinging a sword, firing an arrow from a bow, or brawling with your fists.

With this action, you make one melee or ranged attack. See the Making an Attack section for the rules that govern attacks.

Certain features, such as the Extra Attack feature of the fighter, allow you to make more than one attack with this action.',
'Make one melee or ranged attack; Extra Attack feature allows multiple attacks',
ARRAY['attack', 'action', 'melee', 'ranged'],
'rules.txt', 'Chapter 9', 74
FROM rule_categories WHERE slug = 'actions-in-combat';

-- Actions in Combat - Dash
INSERT INTO rules (category_id, title, slug, content, summary, keywords, source_document, source_chapter, source_page)
SELECT id, 'Dash Action', 'dash-action',
'When you take the Dash action, you gain extra movement for the current turn. The increase equals your speed, after applying any modifiers. With a speed of 30 feet, for example, you can move up to 60 feet on your turn if you dash.

Any increase or decrease to your speed changes this additional movement by the same amount. If your speed of 30 feet is reduced to 15 feet, for instance, you can move up to 30 feet this turn if you dash.',
'Gain extra movement equal to your speed for the current turn',
ARRAY['dash', 'action', 'movement', 'speed'],
'rules.txt', 'Chapter 9', 74
FROM rule_categories WHERE slug = 'actions-in-combat';

-- Actions in Combat - Disengage
INSERT INTO rules (category_id, title, slug, content, summary, keywords, source_document, source_chapter, source_page)
SELECT id, 'Disengage Action', 'disengage-action',
'If you take the Disengage action, your movement does not provoke opportunity attacks for the rest of the turn.',
'Your movement does not provoke opportunity attacks for the rest of the turn',
ARRAY['disengage', 'action', 'opportunity attack', 'movement'],
'rules.txt', 'Chapter 9', 74
FROM rule_categories WHERE slug = 'actions-in-combat';

-- Actions in Combat - Dodge
INSERT INTO rules (category_id, title, slug, content, summary, keywords, source_document, source_chapter, source_page)
SELECT id, 'Dodge Action', 'dodge-action',
'When you take the Dodge action, you focus entirely on avoiding attacks. Until the start of your next turn, any attack roll made against you has disadvantage if you can see the attacker, and you make Dexterity saving throws with advantage. You lose this benefit if you are incapacitated or if your speed drops to 0.',
'Attacks against you have disadvantage; advantage on DEX saves until your next turn',
ARRAY['dodge', 'action', 'disadvantage', 'dexterity'],
'rules.txt', 'Chapter 9', 74
FROM rule_categories WHERE slug = 'actions-in-combat';

-- Actions in Combat - Help
INSERT INTO rules (category_id, title, slug, content, summary, keywords, source_document, source_chapter, source_page)
SELECT id, 'Help Action', 'help-action',
'You can lend your aid to another creature in the completion of a task. When you take the Help action, the creature you aid gains advantage on the next ability check it makes to perform the task you are helping with, provided that it makes the check before the start of your next turn.

Alternatively, you can aid a friendly creature in attacking a creature within 5 feet of you. You feint, distract the target, or in some other way team up to make your allies attack more effective. If your ally attacks the target before your next turn, the first attack roll is made with advantage.',
'Give ally advantage on next ability check or attack roll against creature within 5 feet',
ARRAY['help', 'action', 'advantage', 'assist'],
'rules.txt', 'Chapter 9', 74
FROM rule_categories WHERE slug = 'actions-in-combat';

-- Actions in Combat - Hide
INSERT INTO rules (category_id, title, slug, content, summary, keywords, source_document, source_chapter, source_page)
SELECT id, 'Hide Action', 'hide-action',
'When you take the Hide action, you make a Dexterity (Stealth) check in an attempt to hide, following the rules for hiding. If you succeed, you gain certain benefits, as described in the Unseen Attackers and Targets section.',
'Make Dexterity (Stealth) check to hide from enemies',
ARRAY['hide', 'action', 'stealth', 'unseen'],
'rules.txt', 'Chapter 9', 74
FROM rule_categories WHERE slug = 'actions-in-combat';

-- Actions in Combat - Ready
INSERT INTO rules (category_id, title, slug, content, summary, keywords, source_document, source_chapter, source_page)
SELECT id, 'Ready Action', 'ready-action',
'Sometimes you want to get the jump on a foe or wait for a particular circumstance before you act. To do so, you can take the Ready action on your turn, which lets you act using your reaction before the start of your next turn.

First, you decide what perceivable circumstance will trigger your reaction. Then, you choose the action you will take in response to that trigger, or you choose to move up to your speed in response to it. Examples include: If the cultist steps on the trapdoor, I will pull the lever that opens it, and If the goblin steps next to me, I move away.

When the trigger occurs, you can either take your reaction right after the trigger finishes or ignore the trigger. Remember that you can take only one reaction per round.

When you ready a spell, you cast it as normal but hold its energy, which you release with your reaction when the trigger occurs. To be readied, a spell must have a casting time of 1 action, and holding onto the spells magic requires concentration. If your concentration is broken, the spell dissipates without taking effect.',
'Prepare action or movement triggered by specific circumstance; uses reaction; readied spells require concentration',
ARRAY['ready', 'action', 'reaction', 'trigger', 'held action'],
'rules.txt', 'Chapter 9', 74
FROM rule_categories WHERE slug = 'actions-in-combat';

-- Actions in Combat - Search
INSERT INTO rules (category_id, title, slug, content, summary, keywords, source_document, source_chapter, source_page)
SELECT id, 'Search Action', 'search-action',
'When you take the Search action, you devote your attention to finding something. Depending on the nature of your search, the DM might have you make a Wisdom (Perception) check or an Intelligence (Investigation) check.',
'Make Perception or Investigation check to find something',
ARRAY['search', 'action', 'perception', 'investigation'],
'rules.txt', 'Chapter 9', 74
FROM rule_categories WHERE slug = 'actions-in-combat';

-- Actions in Combat - Use an Object
INSERT INTO rules (category_id, title, slug, content, summary, keywords, source_document, source_chapter, source_page)
SELECT id, 'Use an Object Action', 'use-an-object-action',
'You normally interact with an object while doing something else, such as when you draw a sword as part of an attack. When an object requires your action for its use, you take the Use an Object action. This action is also useful when you want to interact with more than one object on your turn.',
'Interact with objects that require an action or multiple objects on your turn',
ARRAY['use object', 'action', 'interact', 'item'],
'rules.txt', 'Chapter 9', 74
FROM rule_categories WHERE slug = 'actions-in-combat';

-- Death Saving Throws
INSERT INTO rules (category_id, title, slug, content, summary, keywords, source_document, source_chapter, source_page)
SELECT id, 'Death Saving Throws', 'death-saving-throws',
'Whenever you start your turn with 0 hit points, you must make a special saving throw, called a death saving throw, to determine whether you creep closer to death or hang onto life. Unlike other saving throws, this one is not tied to any ability score. You are in the hands of fate now.

Roll a d20. If the roll is 10 or higher, you succeed. Otherwise, you fail. A success or failure has no effect by itself. On your third success, you become stable. On your third failure, you die. The successes and failures do not need to be consecutive; keep track of both until you collect three of a kind. The number of both is reset to zero when you regain any hit points or become stable.

Rolling 1 or 20: When you make a death saving throw and roll a 1 on the d20, it counts as two failures. If you roll a 20 on the d20, you regain 1 hit point.

Damage at 0 Hit Points: If you take any damage while you have 0 hit points, you suffer a death saving throw failure. If the damage is from a critical hit, you suffer two failures instead. If the damage equals or exceeds your hit point maximum, you suffer instant death.',
'Roll d20: 10+ succeeds, below 10 fails; 3 successes = stable, 3 failures = death; 20 = regain 1 HP',
ARRAY['death saving throw', 'dying', '0 hit points', 'unconscious', 'stable'],
'rules.txt', 'Chapter 9', 79
FROM rule_categories WHERE slug = 'damage-and-healing';

-- Stabilizing a Creature
INSERT INTO rules (category_id, title, slug, content, summary, keywords, source_document, source_chapter, source_page)
SELECT id, 'Stabilizing a Creature', 'stabilizing-a-creature',
'The best way to save a creature with 0 hit points is to heal it. If healing is unavailable, the creature can at least be stabilized so that it is not killed by a failed death saving throw.

You can use your action to administer first aid to an unconscious creature and attempt to stabilize it, which requires a successful DC 10 Wisdom (Medicine) check.

A stable creature does not make death saving throws, even though it has 0 hit points, but it does remain unconscious. The creature stops being stable, and must start making death saving throws again, if it takes any damage. A stable creature that is not healed regains 1 hit point after 1d4 hours.',
'DC 10 Medicine check to stabilize; stable creatures regain 1 HP after 1d4 hours',
ARRAY['stabilize', 'medicine', 'dying', 'unconscious', 'first aid'],
'rules.txt', 'Chapter 9', 79
FROM rule_categories WHERE slug = 'damage-and-healing';

-- Two-Weapon Fighting
INSERT INTO rules (category_id, title, slug, content, summary, keywords, source_document, source_chapter, source_page)
SELECT id, 'Two-Weapon Fighting', 'two-weapon-fighting',
'When you take the Attack action and attack with a light melee weapon that you are holding in one hand, you can use a bonus action to attack with a different light melee weapon that you are holding in the other hand. You do not add your ability modifier to the damage of the bonus attack, unless that modifier is negative.

If either weapon has the thrown property, you can throw the weapon, instead of making a melee attack with it.',
'Bonus action attack with off-hand light weapon; no ability modifier to damage unless negative',
ARRAY['two-weapon fighting', 'dual wield', 'bonus action', 'light weapon', 'off-hand'],
'rules.txt', 'Chapter 9', 75
FROM rule_categories WHERE slug = 'making-an-attack';

-- Grappling
INSERT INTO rules (category_id, title, slug, content, summary, keywords, source_document, source_chapter, source_page)
SELECT id, 'Grappling', 'grappling',
'When you want to grab a creature or wrestle with it, you can use the Attack action to make a special melee attack, a grapple. If you are able to make multiple attacks with the Attack action, this attack replaces one of them.

The target of your grapple must be no more than one size larger than you and must be within your reach. Using at least one free hand, you try to seize the target by making a grapple check instead of an attack roll: a Strength (Athletics) check contested by the targets Strength (Athletics) or Dexterity (Acrobatics) check (the target chooses the ability to use). If you succeed, you subject the target to the grappled condition. The condition specifies the things that end it, and you can release the target whenever you like (no action required).

Escaping a Grapple: A grappled creature can use its action to escape. To do so, it must succeed on a Strength (Athletics) or Dexterity (Acrobatics) check contested by your Strength (Athletics) check.

Moving a Grappled Creature: When you move, you can drag or carry the grappled creature with you, but your speed is halved, unless the creature is two or more sizes smaller than you.',
'Athletics check vs Athletics or Acrobatics; target is grappled; speed halved when dragging',
ARRAY['grapple', 'grappled', 'athletics', 'acrobatics', 'grab', 'restrain'],
'rules.txt', 'Chapter 9', 74
FROM rule_categories WHERE slug = 'special-combat';

-- Shoving
INSERT INTO rules (category_id, title, slug, content, summary, keywords, source_document, source_chapter, source_page)
SELECT id, 'Shoving a Creature', 'shoving-a-creature',
'Using the Attack action, you can make a special melee attack to shove a creature, either to knock it prone or push it away from you. If you are able to make multiple attacks with the Attack action, this attack replaces one of them.

The target must be no more than one size larger than you and must be within your reach. Instead of making an attack roll, you make a Strength (Athletics) check contested by the targets Strength (Athletics) or Dexterity (Acrobatics) check (the target chooses the ability to use). If you win the contest, you either knock the target prone or push it 5 feet away from you.',
'Athletics check vs Athletics or Acrobatics; push 5 feet or knock prone',
ARRAY['shove', 'push', 'prone', 'athletics', 'acrobatics'],
'rules.txt', 'Chapter 9', 74
FROM rule_categories WHERE slug = 'special-combat';

-- Mounted Combat
INSERT INTO rules (category_id, title, slug, content, summary, keywords, source_document, source_chapter, source_page)
SELECT id, 'Mounted Combat', 'mounted-combat',
'A willing creature that is at least one size larger than you and that has an appropriate anatomy can serve as a mount. Once during your move, you can mount or dismount a creature within 5 feet of you (costs half your speed).

Controlling a Mount: While mounted, you have two options. You can either control the mount or allow it to act independently. Intelligent creatures act independently. You can control a mount only if it has been trained to accept a rider. A controlled mount can move and act on your turn, but can only Dash, Disengage, or Dodge. An independent mount retains its place in initiative and acts normally.

If your mount is knocked prone, you can use your reaction to dismount as it falls and land on your feet. Otherwise, you are dismounted and fall prone in a space within 5 feet of it.',
'Mount/dismount costs half movement; controlled mounts can Dash, Disengage, or Dodge',
ARRAY['mounted combat', 'mount', 'horse', 'ride', 'cavalry'],
'rules.txt', 'Chapter 9', 80
FROM rule_categories WHERE slug = 'special-combat';

-- Underwater Combat
INSERT INTO rules (category_id, title, slug, content, summary, keywords, source_document, source_chapter, source_page)
SELECT id, 'Underwater Combat', 'underwater-combat',
'When adventurers pursue sahuagin back to their undersea homes, fight off sharks in an ancient shipwreck, or find themselves in a flooded dungeon room, they must fight in a challenging environment. Underwater, the following rules apply:

When making a melee weapon attack, a creature that does not have a swimming speed (either natural or granted by magic) has disadvantage on the attack roll unless the weapon is a dagger, javelin, shortsword, spear, or trident.

A ranged weapon attack automatically misses a target beyond the weapons normal range. Even against a target within normal range, the attack roll has disadvantage unless the weapon is a crossbow, a net, or a weapon that is thrown like a javelin (including a spear, trident, or dart).

Creatures and objects that are fully immersed in water have resistance to fire damage.',
'Melee attacks have disadvantage without swim speed (except certain weapons); ranged attacks limited; fire resistance',
ARRAY['underwater', 'swimming', 'aquatic', 'water', 'fire resistance'],
'rules.txt', 'Chapter 9', 80
FROM rule_categories WHERE slug = 'special-combat';

-- ---------------------------------------------------------------------------
-- 9.4 Chapter 10: Spellcasting Rules
-- ---------------------------------------------------------------------------

-- Spell Slots
INSERT INTO rules (category_id, title, slug, content, summary, keywords, source_document, source_chapter, source_page)
SELECT id, 'Spell Slots', 'spell-slots',
'Regardless of how many spells a caster knows or prepares, he or she can cast only a limited number of spells before resting. Manipulating the fabric of magic and channeling its energy into even a simple spell is physically and mentally taxing, and higher-level spells are even more so. Thus, each spellcasting class description includes a table showing how many spell slots of each spell level a character can use at each character level.

When a character casts a spell, he or she expends a slot of that spells level or higher, effectively filling a slot with the spell. You can think of a spell slot as a groove of a certain size—small for a 1st-level slot, larger for a spell of higher level. A 1st-level spell fits into a slot of any size, but a 9th-level spell fits only in a 9th-level slot.

Some characters and monsters have special abilities that let them cast spells without using spell slots. Monks who follow the Way of the Four Elements, warlocks who choose certain eldritch invocations, and pit fiends from the Nine Hells can all cast spells in such a way.

Casting a Spell at a Higher Level: When a spellcaster casts a spell using a slot that is of a higher level than the spell, the spell assumes the higher level for that casting. For instance, if a wizard casts magic missile using one of her 2nd-level slots, that magic missile is 2nd level. Effectively, the spell expands to fill the slot it is put into. Some spells have more powerful effects when cast at a higher level.',
'Spell slots limit casting; higher slots can cast lower spells; some spells scale with slot level',
ARRAY['spell slot', 'spellcasting', 'spell level', 'higher level'],
'rules.txt', 'Chapter 10', 82
FROM rule_categories WHERE slug = 'spell-basics';

-- Cantrips
INSERT INTO rules (category_id, title, slug, content, summary, keywords, source_document, source_chapter, source_page)
SELECT id, 'Cantrips', 'cantrips',
'A cantrip is a spell that can be cast at will, without using a spell slot and without being prepared in advance. Repeated practice has fixed the spell in the casters mind and infused the caster with the magic needed to produce the effect over and over. A cantrips spell level is 0.',
'Level 0 spells cast at will without spell slots; always available',
ARRAY['cantrip', 'spell level 0', 'at will'],
'rules.txt', 'Chapter 10', 82
FROM rule_categories WHERE slug = 'spell-basics';

-- Rituals
INSERT INTO rules (category_id, title, slug, content, summary, keywords, source_document, source_chapter, source_page)
SELECT id, 'Rituals', 'rituals',
'Certain spells have a special tag: ritual. Such a spell can be cast following the normal rules for spellcasting, or the spell can be cast as a ritual. The ritual version of a spell takes 10 minutes longer to cast than normal. It also does not expend a spell slot, which means the ritual version of a spell cannot be cast at a higher level.

To cast a spell as a ritual, a spellcaster must have a feature that grants the ability to do so. The cleric and the druid, for example, have such a feature. The caster must also have the spell prepared or on his or her list of spells known, unless the characters ritual feature specifies otherwise, as the wizards does.',
'Ritual spells take 10 extra minutes but do not expend spell slots',
ARRAY['ritual', 'ritual casting', 'spell slot'],
'rules.txt', 'Chapter 10', 82
FROM rule_categories WHERE slug = 'spell-basics';

-- Casting Time
INSERT INTO rules (category_id, title, slug, content, summary, keywords, source_document, source_chapter, source_page)
SELECT id, 'Casting Time', 'casting-time',
'Most spells require a single action to cast, but some spells require a bonus action, a reaction, or much more time to cast.

Bonus Action: A spell cast with a bonus action is especially swift. You must use a bonus action on your turn to cast the spell, provided that you have not already taken a bonus action this turn. You cannot cast another spell during the same turn, except for a cantrip with a casting time of 1 action.

Reactions: Some spells can be cast as reactions. These spells take a fraction of a second to bring about and are cast in response to some event. If a spell can be cast as a reaction, the spell description tells you exactly when you can do so.

Longer Casting Times: Certain spells require more time to cast: minutes or even hours. When you cast a spell with a casting time longer than a single action or reaction, you must spend your action each turn casting the spell, and you must maintain your concentration while you do so. If your concentration is broken, the spell fails, but you do not expend a spell slot.',
'Most spells are 1 action; bonus action spells prevent other spells same turn; long casts need concentration',
ARRAY['casting time', 'action', 'bonus action', 'reaction', 'concentration'],
'rules.txt', 'Chapter 10', 83
FROM rule_categories WHERE slug = 'casting-a-spell';

-- Spell Range
INSERT INTO rules (category_id, title, slug, content, summary, keywords, source_document, source_chapter, source_page)
SELECT id, 'Spell Range', 'spell-range',
'The target of a spell must be within the spells range. For a spell like magic missile, the target is a creature. For a spell like fireball, the target is the point in space where the ball of fire erupts.

Most spells have ranges expressed in feet. Some spells can target only a creature (including you) that you touch. Other spells, such as the shield spell, affect only you. These spells have a range of self.

Spells that create cones or lines of effect that originate from you also have a range of self, indicating that the origin point of the spells effect must be you.

Once a spell is cast, its effects are not limited by its range, unless the spells description says otherwise.',
'Target must be within range; Self means caster only or origin point; Touch requires contact',
ARRAY['range', 'touch', 'self', 'feet', 'target'],
'rules.txt', 'Chapter 10', 83
FROM rule_categories WHERE slug = 'casting-a-spell';

-- Spell Components
INSERT INTO rules (category_id, title, slug, content, summary, keywords, source_document, source_chapter, source_page)
SELECT id, 'Spell Components', 'spell-components',
'A spells components are the physical requirements you must meet in order to cast it. Each spells description indicates whether it requires verbal (V), somatic (S), or material (M) components. If you cannot provide one or more of a spells components, you are unable to cast the spell.

Verbal (V): Most spells require the chanting of mystic words. The words themselves are not the source of the spells power; rather, the particular combination of sounds, with specific pitch and resonance, sets the threads of magic in motion. Thus, a character who is gagged or in an area of silence cannot cast a spell with a verbal component.

Somatic (S): Spellcasting gestures might include a forceful gesticulation or an intricate set of gestures. If a spell requires a somatic component, the caster must have free use of at least one hand to perform these gestures.

Material (M): Casting some spells requires particular objects, specified in parentheses in the component entry. A character can use a component pouch or a spellcasting focus in place of the components specified for a spell. But if a cost is indicated for a component, a character must have that specific component before he or she can cast the spell. If a spell states that a material component is consumed by the spell, the caster must provide this component for each casting of the spell.',
'V = verbal sounds; S = somatic gestures (free hand); M = material (focus can replace non-costed items)',
ARRAY['components', 'verbal', 'somatic', 'material', 'focus', 'component pouch'],
'rules.txt', 'Chapter 10', 83
FROM rule_categories WHERE slug = 'casting-a-spell';

-- Concentration
INSERT INTO rules (category_id, title, slug, content, summary, keywords, source_document, source_chapter, source_page)
SELECT id, 'Concentration', 'concentration',
'Some spells require you to maintain concentration in order to keep their magic active. If you lose concentration, such a spell ends. If a spell must be maintained with concentration, that fact appears in its Duration entry, and the spell specifies how long you can concentrate on it. You can end concentration at any time (no action required).

Normal activity, such as moving and attacking, does not interfere with concentration. The following factors can break concentration:
- Casting another spell that requires concentration. You lose concentration on a spell if you cast another spell that requires concentration.
- Taking damage. Whenever you take damage while you are concentrating on a spell, you must make a Constitution saving throw to maintain your concentration. The DC equals 10 or half the damage you take, whichever number is higher.
- Being incapacitated or killed. You lose concentration on a spell if you are incapacitated or if you die.
- The DM might also decide that certain environmental phenomena, such as a wave crashing over you while you are on a storm-tossed ship, require you to succeed on a DC 10 Constitution saving throw to maintain concentration.',
'Only one concentration spell at a time; CON save (DC 10 or half damage) when hit; ends if incapacitated',
ARRAY['concentration', 'maintain', 'constitution', 'saving throw', 'duration'],
'rules.txt', 'Chapter 10', 84
FROM rule_categories WHERE slug = 'casting-a-spell';

-- Areas of Effect
INSERT INTO rules (category_id, title, slug, content, summary, keywords, source_document, source_chapter, source_page)
SELECT id, 'Areas of Effect', 'areas-of-effect',
'Spells such as burning hands and cone of cold cover an area, allowing them to affect multiple creatures at once. A spells description specifies its area of effect, which typically has one of five different shapes: cone, cube, cylinder, line, or sphere.

Cone: A cone extends in a direction you choose from its point of origin. A cones width at a given point along its length is equal to that points distance from the point of origin. A cones area of effect specifies its maximum length.

Cube: You select a cubes point of origin, which lies anywhere on a face of the cubic effect. The cubes size is expressed as the length of each side.

Cylinder: A cylinders point of origin is the center of a circle of a particular radius. The circle must either be on the ground or at the height of the spell effect. The energy in a cylinder expands in straight lines from the point of origin to the perimeter of the circle, forming the base of the cylinder. The spells effect then shoots up from the base or down from the top, to a distance equal to the height of the cylinder.

Line: A line extends from its point of origin in a straight path up to its length and covers an area defined by its width.

Sphere: You select a spheres point of origin, and the sphere extends outward from that point. The spheres size is expressed as a radius in feet that extends from the point.',
'Cone, Cube, Cylinder, Line, Sphere - each has point of origin and defined dimensions',
ARRAY['area of effect', 'cone', 'cube', 'cylinder', 'line', 'sphere', 'aoe'],
'rules.txt', 'Chapter 10', 84
FROM rule_categories WHERE slug = 'casting-a-spell';

-- Spell Save DC and Attack
INSERT INTO rules (category_id, title, slug, content, summary, keywords, source_document, source_chapter, source_page)
SELECT id, 'Spell Save DC and Attack Rolls', 'spell-save-dc-and-attack-rolls',
'Many spells specify that a target can make a saving throw to avoid some or all of a spells effects. The spell specifies the ability that the target uses for the save and what happens on a success or failure.

The DC to resist one of your spells equals 8 + your spellcasting ability modifier + your proficiency bonus + any special modifiers.

Spell Attack Modifier: Some spells require the caster to make an attack roll to determine whether the spell effect hits the intended target. Your attack bonus with a spell attack equals your spellcasting ability modifier + your proficiency bonus.

Most spells that require attack rolls involve ranged attacks. Remember that you have disadvantage on a ranged attack roll if you are within 5 feet of a hostile creature that can see you and that is not incapacitated.',
'Spell Save DC = 8 + ability mod + proficiency; Spell Attack = ability mod + proficiency',
ARRAY['spell save dc', 'spell attack', 'spellcasting ability', 'proficiency bonus'],
'rules.txt', 'Chapter 10', 85
FROM rule_categories WHERE slug = 'casting-a-spell';

-- ---------------------------------------------------------------------------
-- 9.5 Chapter 1: Character Creation Rules
-- ---------------------------------------------------------------------------

-- Ability Score Modifiers
INSERT INTO rules (category_id, title, slug, content, summary, keywords, source_document, source_chapter, source_page)
SELECT id, 'Ability Score Modifiers', 'ability-score-modifiers',
'Each of a creatures abilities has a score, a number that defines the magnitude of that ability. An ability score is not just a measure of innate capabilities, but also encompasses a creatures training and competence in activities related to that ability.

A score of 10 or 11 is the normal human average, but adventurers and many monsters are a cut above average in most abilities. A score of 18 is the highest that a person usually reaches. Adventurers can have scores as high as 20, and monsters and divine beings can have scores as high as 30.

Each ability also has a modifier, derived from the score and ranging from -5 (for an ability score of 1) to +10 (for a score of 30). The Ability Scores and Modifiers table notes the ability modifiers for the range of possible ability scores, from 1 to 30.

To determine an ability modifier, subtract 10 from the ability score and then divide the total by 2 (round down).

Score 1: -5, Score 2-3: -4, Score 4-5: -3, Score 6-7: -2, Score 8-9: -1, Score 10-11: +0, Score 12-13: +1, Score 14-15: +2, Score 16-17: +3, Score 18-19: +4, Score 20-21: +5, Score 22-23: +6, Score 24-25: +7, Score 26-27: +8, Score 28-29: +9, Score 30: +10.',
'Modifier = (Score - 10) / 2 rounded down; ranges from -5 to +10',
ARRAY['ability score', 'modifier', 'ability modifier', 'score'],
'rules.txt', 'Chapter 1', 8
FROM rule_categories WHERE slug = 'character-creation';

-- Proficiency Bonus
INSERT INTO rules (category_id, title, slug, content, summary, keywords, source_document, source_chapter, source_page)
SELECT id, 'Proficiency Bonus', 'proficiency-bonus',
'Characters have a proficiency bonus determined by level. Monsters also have this bonus, which is incorporated in their stat blocks. The bonus is used in the rules on ability checks, saving throws, and attack rolls.

Your proficiency bonus cannot be added to a single die roll or other number more than once. For example, if two different rules say you can add your proficiency bonus to a Wisdom saving throw, you nevertheless add the bonus only once when you make the save.

Occasionally, your proficiency bonus might be multiplied or divided (doubled or halved, for example) before you apply it. If a circumstance suggests that your proficiency bonus applies more than once to the same roll, you still add it only once and multiply or divide it only once.

Level 1-4: +2, Level 5-8: +3, Level 9-12: +4, Level 13-16: +5, Level 17-20: +6.',
'Increases with level (+2 to +6); added to trained skills, saves, and attacks; never added twice',
ARRAY['proficiency bonus', 'proficiency', 'level', 'bonus'],
'rules.txt', 'Chapter 1', 12
FROM rule_categories WHERE slug = 'character-creation';

-- Hit Points and Hit Dice
INSERT INTO rules (category_id, title, slug, content, summary, keywords, source_document, source_chapter, source_page)
SELECT id, 'Hit Points and Hit Dice', 'hit-points-and-hit-dice',
'Your characters hit points define how tough your character is in combat and other dangerous situations. Your hit points are determined by your Hit Dice (short for Hit Point Dice).

At 1st level, your character has 1 Hit Die, and the die type is determined by your class. You start with hit points equal to the highest roll of that die, as indicated in your class description. (You also add your Constitution modifier.) This is also your hit point maximum.

Record your characters hit points on your character sheet. Also record the type of Hit Die your character uses and the number of Hit Dice you have. After you rest, you can spend Hit Dice to regain hit points.

Each time you gain a level, you gain 1 additional Hit Die. Roll that Hit Die, add your Constitution modifier to the roll, and add the total to your hit point maximum. Alternatively, you can use the fixed value shown in your class entry, which is the average result of the die roll (rounded up).',
'HP max = Hit Die max + CON mod at level 1; gain Hit Die roll + CON each level',
ARRAY['hit points', 'hit dice', 'hp', 'constitution', 'health'],
'rules.txt', 'Chapter 1', 10
FROM rule_categories WHERE slug = 'character-creation';

-- ---------------------------------------------------------------------------
-- 9.6 Chapter 6: Customization Rules
-- ---------------------------------------------------------------------------

-- Multiclassing
INSERT INTO rules (category_id, title, slug, content, summary, keywords, source_document, source_chapter, source_page)
SELECT id, 'Multiclassing', 'multiclassing',
'Multiclassing allows you to gain levels in multiple classes. Doing so lets you mix the abilities of those classes to realize a character concept that might not be reflected in one of the standard class options.

With this rule, you have the option of gaining a level in a new class whenever you advance in level, instead of gaining a level in your current class. Your levels in all your classes are added together to determine your character level.

Prerequisites: To qualify for a new class, you must meet the ability score prerequisites for both your current class and your new one. Without the full training that a beginning character receives, you must be a quick study in your new class, having a natural aptitude that is reflected by higher-than-average ability scores.

Experience Points: The experience point cost to gain a level is always based on your total character level, not your level in a particular class.

Hit Points and Hit Dice: You gain the hit points from your new class as described for levels after 1st. You gain the 1st-level hit points for a class only when you are a 1st-level character.',
'Gain levels in multiple classes; must meet ability prerequisites; XP based on total level',
ARRAY['multiclassing', 'multiclass', 'dual class', 'prerequisites'],
'rules.txt', 'Chapter 6', 58
FROM rule_categories WHERE slug = 'customization-options';

-- Feats Optional Rule
INSERT INTO rules (category_id, title, slug, content, summary, keywords, source_document, source_chapter, source_page)
SELECT id, 'Feats', 'feats-rule',
'A feat represents a talent or an area of expertise that gives a character special capabilities. It embodies training, experience, and abilities beyond what a class provides.

At certain levels, your class gives you the Ability Score Improvement feature. Using the optional feats rule, you can forgo taking that feature to take a feat of your choice instead. You can take each feat only once, unless the feats description says otherwise.

You must meet any prerequisite specified in a feat to take that feat. If you ever lose a feats prerequisite, you cannot use that feat until you regain the prerequisite.',
'Optional rule: take a feat instead of Ability Score Improvement; each feat taken only once',
ARRAY['feat', 'ability score improvement', 'optional rule', 'talent'],
'rules.txt', 'Chapter 6', 58
FROM rule_categories WHERE slug = 'customization-options';

-- ---------------------------------------------------------------------------
-- 9.7 Chapter 13: Encounter Building Rules
-- ---------------------------------------------------------------------------

-- Challenge Rating
INSERT INTO rules (category_id, title, slug, content, summary, keywords, source_document, source_chapter, source_page)
SELECT id, 'Challenge Rating', 'challenge-rating',
'A monsters challenge rating tells you how great a threat the monster is. An appropriately equipped and well-rested party of four adventurers should be able to defeat a monster that has a challenge rating equal to its level without suffering any deaths.

Monsters that are significantly weaker than 1st-level characters have a challenge rating lower than 1. Monsters with a challenge rating of 0 are insignificant except in large numbers.

Some monsters present a greater challenge than even a typical 20th-level party can handle. These monsters have a challenge rating of 21 or higher and are specifically designed to test player skill.',
'CR equals party level for a fair fight with 4 adventurers; CR 0 monsters are weak individually',
ARRAY['challenge rating', 'cr', 'monster', 'difficulty', 'encounter'],
'rules.txt', 'Chapter 13', 165
FROM rule_categories WHERE slug = 'encounter-building';

-- XP Thresholds
INSERT INTO rules (category_id, title, slug, content, summary, keywords, source_document, source_chapter, source_page)
SELECT id, 'XP Thresholds by Character Level', 'xp-thresholds',
'The XP Thresholds by Character Level table has four columns. Each column indicates the threshold for encounter difficulty for a single character of a given level.

Easy: An easy encounter does not tax the characters resources or put them in serious peril.

Medium: A medium encounter usually has one or two scary moments for the players, but the characters should emerge victorious with no casualties.

Hard: A hard encounter could go badly for the adventurers. Weaker characters might get taken out of the fight, and there is a slim chance that one or more characters might die.

Deadly: A deadly encounter could be lethal for one or more player characters. Survival often requires good tactics and quick thinking, and the party risks defeat.

Level 1: Easy 25, Medium 50, Hard 75, Deadly 100.
Level 5: Easy 250, Medium 500, Hard 750, Deadly 1100.
Level 10: Easy 600, Medium 1200, Hard 1900, Deadly 2800.
Level 15: Easy 1100, Medium 2100, Hard 3200, Deadly 4800.
Level 20: Easy 2800, Medium 5700, Hard 8500, Deadly 12700.',
'Easy/Medium/Hard/Deadly thresholds scale with level; compare total monster XP to party thresholds',
ARRAY['xp threshold', 'encounter difficulty', 'easy', 'medium', 'hard', 'deadly'],
'rules.txt', 'Chapter 13', 165
FROM rule_categories WHERE slug = 'encounter-building';

-- Encounter Multipliers
INSERT INTO rules (category_id, title, slug, content, summary, keywords, source_document, source_chapter, source_page)
SELECT id, 'Encounter Multipliers', 'encounter-multipliers',
'When there are multiple monsters in an encounter, the encounter is more difficult than the sum of the individual monsters XP values would suggest. To account for this, use the following multipliers:

1 monster: x1
2 monsters: x1.5
3-6 monsters: x2
7-10 monsters: x2.5
11-14 monsters: x3
15+ monsters: x4

For example, if an encounter includes four monsters worth a total of 500 XP, you would multiply the total by 2, for an adjusted value of 1000 XP. This adjusted value is used only for comparing the encounter against your XP thresholds; the actual XP the characters earn is based on the monsters actual XP values.

If the party contains fewer than three characters, apply the next higher multiplier. For parties of six or more characters, use the next lower multiplier.',
'Multiply total XP by factor based on monster count: 2 = x1.5, 3-6 = x2, 7-10 = x2.5, etc.',
ARRAY['encounter multiplier', 'multiple monsters', 'encounter building', 'xp'],
'rules.txt', 'Chapter 13', 166
FROM rule_categories WHERE slug = 'encounter-building';

-- ---------------------------------------------------------------------------
-- 9.8 Chapter 14: Magic Items Rules
-- ---------------------------------------------------------------------------

-- Attunement
INSERT INTO rules (category_id, title, slug, content, summary, keywords, source_document, source_chapter, source_page)
SELECT id, 'Attunement', 'attunement',
'Some magic items require a creature to form a bond with them before their magical properties can be used. This bond is called attunement, and certain items have prerequisites for it. If the prerequisite is a class, a creature must be a member of that class to attune to the item.

Without becoming attuned to an item that requires attunement, a creature gains only its nonmagical benefits, unless its description states otherwise. For example, a magic shield that requires attunement provides the benefits of a normal shield to a creature not attuned to it, but none of its magical properties.

Attuning to an item requires a creature to spend a short rest focused on only that item while being in physical contact with it. This cannot be the same short rest used to learn the items properties. If the item requires attunement by a character of a specific class, the character must also be that class.

A creatures attunement to an item ends if the creature no longer satisfies the prerequisites for attunement, if the item has been more than 100 feet away for at least 24 hours, if the creature dies, or if another creature attunes to the item.

A creature can be attuned to no more than three magic items at a time.',
'Short rest to attune; max 3 attuned items; ends at 100+ feet for 24 hours or death',
ARRAY['attunement', 'magic item', 'attune', 'bond', 'short rest'],
'rules.txt', 'Chapter 14', 168
FROM rule_categories WHERE slug = 'magic-items';

-- Wearing and Wielding Items
INSERT INTO rules (category_id, title, slug, content, summary, keywords, source_document, source_chapter, source_page)
SELECT id, 'Wearing and Wielding Items', 'wearing-and-wielding-items',
'Using a magic item properties might mean wearing or wielding it. A magic item meant to be worn must be donned in the intended fashion: boots go on the feet, gloves on the hands, hats and helmets on the head, and rings on the finger. Magic armor must be donned, a shield strapped to the arm, a cloak fastened about the shoulders. A weapon must be held.

In most cases, a magic item thats meant to be worn can fit a creature regardless of size or build. Many magic garments are made to be easily adjustable, or they magically adjust themselves to the wearer.

Multiple Items of the Same Kind: Use common sense to determine whether more than one of a given kind of magic item can be worn. A character cannot normally wear more than one pair of footwear, one pair of gloves or gauntlets, one pair of bracers, one suit of armor, one item of headwear, and one cloak. You can make exceptions; a character might be able to wear a circlet under a helmet, for example, or to layer two cloaks.',
'Items must be worn/wielded properly; usually only one of each type (boots, gloves, armor, etc.)',
ARRAY['wearing', 'wielding', 'magic item', 'equip', 'don'],
'rules.txt', 'Chapter 14', 168
FROM rule_categories WHERE slug = 'magic-items';

-- Activating an Item
INSERT INTO rules (category_id, title, slug, content, summary, keywords, source_document, source_chapter, source_page)
SELECT id, 'Activating an Item', 'activating-an-item',
'Activating some magic items requires a user to do something special, such as holding the item and uttering a command word. The description of each item category or individual item details how an item is activated. Certain items use one or more of the following rules for their activation.

If an item requires an action to activate, that action is not a function of the Use an Item action, so a feature such as the rogues Fast Hands cannot be used to activate the item.

Command Word: A command word is a word or phrase that must be spoken for an item to work. A magic item that requires a command word cannot be activated in an area where sound is prevented, as in the area of the silence spell.

Consumables: Some items are used up when they are activated. A potion or an elixir must be swallowed, or an oil applied to the body. The writing vanishes from a scroll when it is read. Once used, a consumable item loses its magic.

Spells: Some magic items allow the user to cast a spell from the item. The spell is cast at the lowest possible spell level, does not expend any of the users spell slots, and requires no components, unless the items description says otherwise.',
'Command words need speech; consumables are one-use; item spells use lowest level and no slots',
ARRAY['activate', 'command word', 'consumable', 'potion', 'scroll', 'magic item'],
'rules.txt', 'Chapter 14', 168
FROM rule_categories WHERE slug = 'magic-items';

-- ---------------------------------------------------------------------------
-- 9.9 Chapter 8: Additional Environment Rules
-- ---------------------------------------------------------------------------

-- Suffocating
INSERT INTO rules (category_id, title, slug, content, summary, keywords, source_document, source_chapter, source_page)
SELECT id, 'Suffocating', 'suffocating',
'A creature can hold its breath for a number of minutes equal to 1 + its Constitution modifier (minimum of 30 seconds).

When a creature runs out of breath or is choking, it can survive for a number of rounds equal to its Constitution modifier (minimum of 1 round). At the start of its next turn, it drops to 0 hit points and is dying, and it cannot regain hit points or be stabilized until it can breathe again.

For example, a creature with a Constitution of 14 can hold its breath for 3 minutes. If it starts suffocating, it has 2 rounds to reach air before it drops to 0 hit points.',
'Hold breath = 1 + CON mod minutes; suffocating = CON mod rounds then 0 HP',
ARRAY['suffocating', 'breath', 'drowning', 'choking', 'constitution'],
'rules.txt', 'Chapter 8', 69
FROM rule_categories WHERE slug = 'environment';

-- Special Senses
INSERT INTO rules (category_id, title, slug, content, summary, keywords, source_document, source_chapter, source_page)
SELECT id, 'Special Senses', 'special-senses',
'Darkvision: Many creatures in fantasy gaming worlds, especially those that dwell underground, have darkvision. Within a specified range, a creature with darkvision can see in darkness as if the darkness were dim light, so areas of darkness are only lightly obscured as far as that creature is concerned. However, the creature cannot discern color in darkness, only shades of gray.

Blindsight: A creature with blindsight can perceive its surroundings without relying on sight, within a specific radius. Creatures without eyes, such as oozes, and creatures with echolocation or heightened senses, such as bats and true dragons, have this sense.

Truesight: A creature with truesight can, out to a specific range, see in normal and magical darkness, see invisible creatures and objects, automatically detect visual illusions and succeed on saving throws against them, and perceive the original form of a shapechanger or a creature that is transformed by magic. Furthermore, the creature can see into the Ethereal Plane.',
'Darkvision sees in dark as dim light (grayscale); Blindsight perceives without sight; Truesight sees through magic',
ARRAY['darkvision', 'blindsight', 'truesight', 'special senses', 'vision'],
'rules.txt', 'Chapter 8', 68
FROM rule_categories WHERE slug = 'environment';

-- Food and Water
INSERT INTO rules (category_id, title, slug, content, summary, keywords, source_document, source_chapter, source_page)
SELECT id, 'Food and Water', 'food-and-water',
'Characters who do not eat or drink suffer the effects of exhaustion. Exhaustion caused by lack of food or water cannot be removed until the character eats and drinks the full required amount.

Food: A character needs one pound of food per day and can make food last longer by subsisting on half rations. Eating half a pound of food in a day counts as half a day without food. A character can go without food for a number of days equal to 3 + his or her Constitution modifier (minimum 1). At the end of each day beyond that limit, a character automatically suffers one level of exhaustion. A normal day of eating resets the count of days without food to zero.

Water: A character needs one gallon of water per day, or two gallons per day if the weather is hot. A character who drinks only half that much water must succeed on a DC 15 Constitution saving throw or suffer one level of exhaustion at the end of the day. A character with access to even less water automatically suffers one level of exhaustion at the end of the day. If the character already has one or more levels of exhaustion, the character takes two levels in either case.',
'Food: 1 lb/day, survive 3 + CON mod days; Water: 1 gallon/day (2 in heat), DC 15 CON save if half',
ARRAY['food', 'water', 'exhaustion', 'survival', 'starvation', 'dehydration'],
'rules.txt', 'Chapter 8', 69
FROM rule_categories WHERE slug = 'environment';

-- Climbing, Swimming, and Crawling
INSERT INTO rules (category_id, title, slug, content, summary, keywords, source_document, source_chapter, source_page)
SELECT id, 'Climbing, Swimming, and Crawling', 'climbing-swimming-crawling',
'While climbing or swimming, each foot of movement costs 1 extra foot (2 extra feet in difficult terrain), unless a creature has a climbing or swimming speed. At the DMs option, climbing a slippery vertical surface or one with few handholds requires a successful Strength (Athletics) check. Similarly, gaining any distance in rough water might require a successful Strength (Athletics) check.

While you are prone, you can crawl (move at half speed). Dropping prone costs no movement. Standing up from prone costs half your total movement for the turn.',
'Climbing/swimming costs double movement; crawling at half speed; stand from prone costs half movement',
ARRAY['climbing', 'swimming', 'crawling', 'prone', 'movement', 'athletics'],
'rules.txt', 'Chapter 8', 67
FROM rule_categories WHERE slug = 'movement';

-- ---------------------------------------------------------------------------
-- 9.10 Chapter 5: Equipment Rules from Handbook
-- ---------------------------------------------------------------------------

-- Weapon Properties
INSERT INTO rules (category_id, title, slug, content, summary, keywords, source_document, source_chapter, source_page)
SELECT id, 'Weapon Properties', 'weapon-properties',
'Many weapons have special properties related to their use, as shown in the Weapons table.

Ammunition: You can use a weapon that has the ammunition property to make a ranged attack only if you have ammunition to fire from the weapon. Each time you attack with the weapon, you expend one piece of ammunition. Drawing the ammunition from a quiver, case, or other container is part of the attack. At the end of the battle, you can recover half your expended ammunition by taking a minute to search the battlefield.

Finesse: When making an attack with a finesse weapon, you use your choice of your Strength or Dexterity modifier for the attack and damage rolls. You must use the same modifier for both rolls.

Heavy: Creatures that are Small or Tiny have disadvantage on attack rolls with heavy weapons. A heavy weapons size and bulk make it too large for a Small or Tiny creature to use effectively.

Light: A light weapon is small and easy to handle, making it ideal for use when fighting with two weapons.

Loading: Because of the time required to load this weapon, you can fire only one piece of ammunition from it when you use an action, bonus action, or reaction to fire it, regardless of the number of attacks you can normally make.

Range: A weapon that can be used to make a ranged attack has a range in parentheses after the ammunition or thrown property. The range lists two numbers. The first is the weapons normal range in feet, and the second indicates the weapons long range. When attacking a target beyond normal range, you have disadvantage on the attack roll. You cannot attack a target beyond the weapons long range.

Reach: This weapon adds 5 feet to your reach when you attack with it, as well as when determining your reach for opportunity attacks with it.

Special: A weapon with the special property has unusual rules governing its use, explained in the weapons description (see Lance and Net in the handbook).

Thrown: If a weapon has the thrown property, you can throw the weapon to make a ranged attack. If the weapon is a melee weapon, you use the same ability modifier for that attack roll and damage roll that you would use for a melee attack with the weapon.

Two-Handed: This weapon requires two hands when you attack with it.

Versatile: This weapon can be used with one or two hands. A damage value in parentheses appears with the property—the damage when the weapon is used with two hands to make a melee attack.',
'Ammunition, Finesse, Heavy, Light, Loading, Range, Reach, Special, Thrown, Two-Handed, Versatile',
ARRAY['weapon', 'properties', 'finesse', 'heavy', 'light', 'ammunition', 'versatile', 'thrown', 'reach'],
'handbook.txt', 'Chapter 5', 146
FROM rule_categories WHERE slug = 'equipment';

-- Donning and Doffing Armor
INSERT INTO rules (category_id, title, slug, content, summary, keywords, source_document, source_chapter, source_page)
SELECT id, 'Donning and Doffing Armor', 'donning-doffing-armor',
'The time it takes to don or doff armor depends on the armors category.

Don: This is the time it takes to put on armor. You benefit from the armors AC only if you take the full time to don the suit of armor.

Doff: This is the time it takes to take off armor. If you have help, reduce this time by half.

Light Armor: Don 1 minute, Doff 1 minute
Medium Armor: Don 5 minutes, Doff 1 minute
Heavy Armor: Don 10 minutes, Doff 5 minutes
Shield: Don 1 action, Doff 1 action',
'Light armor 1 min; Medium 5 min; Heavy 10 min; Shield 1 action',
ARRAY['armor', 'don', 'doff', 'equip', 'time'],
'handbook.txt', 'Chapter 5', 146
FROM rule_categories WHERE slug = 'equipment';

-- ---------------------------------------------------------------------------
-- 9.11 Chapter 8: Downtime Activities from Handbook
-- ---------------------------------------------------------------------------

-- Downtime Activities
INSERT INTO rules (category_id, title, slug, content, summary, keywords, source_document, source_chapter, source_page)
SELECT id, 'Downtime Activities', 'downtime-activities',
'Between adventures, the DM might ask you what your character is doing during his or her downtime. Periods of downtime can vary in duration, but each downtime activity requires a certain number of days to complete before you gain any benefit. The activities described below are available by default. Your DM might offer additional activities depending on the campaign setting.

Crafting: You can craft nonmagical objects, including adventuring equipment and works of art. You must be proficient with tools related to the object you are trying to create. You might also need access to special materials or locations necessary to create it. For every day of downtime you spend crafting, you can craft one or more items with a total market value not exceeding 5 gp, and you must expend raw materials worth half the total market value.

Practicing a Profession: You can work between adventures, allowing you to maintain a modest lifestyle without having to pay 1 gp per day. If you are a member of an organization that can provide gainful employment, such as a temple or a thieves guild, you earn enough to support a comfortable lifestyle instead.

Recuperating: You can use downtime between adventures to recover from a debilitating injury, disease, or poison. After three days of downtime spent recuperating, you can make a DC 15 Constitution saving throw. On a successful save, you can choose one of the following results: End one effect on you that prevents you from regaining hit points. For the next 24 hours, gain advantage on saving throws against one disease or poison currently affecting you.

Researching: The time between adventures is a great chance to perform research, gaining insight into mysteries that have unfurled over the course of the campaign. For each day of research, you must spend 1 gp to cover your expenses.

Training: You can spend time between adventures learning a new language or training with a set of tools. Your DM might allow additional training options. First, you must find an instructor willing to teach you. The DM determines how long it takes, and whether one or more ability checks are required. The training lasts for 250 days and costs 1 gp per day.',
'Crafting (5gp/day), Practicing a Profession, Recuperating, Researching (1gp/day), Training (250 days, 1gp/day)',
ARRAY['downtime', 'crafting', 'training', 'profession', 'research', 'recuperating'],
'handbook.txt', 'Chapter 8', 187
FROM rule_categories WHERE slug = 'adventuring';

-- Lifestyle Expenses
INSERT INTO rules (category_id, title, slug, content, summary, keywords, source_document, source_chapter, source_page)
SELECT id, 'Lifestyle Expenses', 'lifestyle-expenses',
'Lifestyle expenses provide you with a simple way to account for the cost of living in a fantasy world. They cover your accommodations, food and drink, and all your other necessities.

Wretched (Free): You live in inhumane conditions. With no place to call home, you shelter wherever you can, sneaking into barns, huddling in old crates, and relying on the good graces of people better off than you.

Squalid (1 sp/day): You live in a leaky stable, a mud-floored hut just outside town, or a vermin-infested boarding house in the worst part of town. You have shelter from the elements, but you live in a desperate and often violent environment.

Poor (2 sp/day): A poor lifestyle means going without the comforts available to most. Simple food, threadbare clothing, and unpredictable conditions. You might be housed in a flophouse or in a room above a tavern.

Modest (1 gp/day): A modest lifestyle keeps you out of the slums and ensures that you can maintain your equipment. You live in an older part of town, renting a room in a boarding house, inn, or temple.

Comfortable (2 gp/day): Choosing a comfortable lifestyle means that you can afford nicer clothing and can easily maintain your equipment. You live in a small cottage in a middle-class neighborhood or in a private room at a fine inn.

Wealthy (4 gp/day): Choosing a wealthy lifestyle means living a life of luxury, though you might not have achieved the social status associated with the old money of nobility or royalty. You live a lifestyle comparable to that of a highly successful merchant, a favored servant of the royalty, or the owner of a few small businesses.

Aristocratic (10+ gp/day): You live a life of plenty and comfort. You move in circles populated by the most powerful people in the community. You have excellent lodgings, perhaps a townhouse in the nicest part of town or rooms in the finest inn.',
'Wretched free, Squalid 1sp, Poor 2sp, Modest 1gp, Comfortable 2gp, Wealthy 4gp, Aristocratic 10+gp per day',
ARRAY['lifestyle', 'expenses', 'cost', 'living', 'accommodation'],
'handbook.txt', 'Chapter 5', 157
FROM rule_categories WHERE slug = 'adventuring';

-- Group Checks
INSERT INTO rules (category_id, title, slug, content, summary, keywords, source_document, source_chapter, source_page)
SELECT id, 'Group Checks', 'group-checks',
'When a number of individuals are trying to accomplish something as a group, the DM might ask for a group ability check. In such a situation, the characters who are skilled at a particular task help cover those who are not.

To make a group ability check, everyone in the group makes the ability check. If at least half the group succeeds, the whole group succeeds. Otherwise, the group fails.

Group checks do not come up very often, and they are most useful when all the characters succeed or fail as a group. For example, when adventurers are navigating a swamp, the DM might call for a group Wisdom (Survival) check to see if the characters can avoid the quicksand, sinkholes, and other natural hazards of the environment. If at least half the group succeeds, the successful characters are able to guide their companions out of danger. Otherwise, the group stumbles into one of these hazards.',
'Everyone rolls; if half succeed, group succeeds; otherwise group fails',
ARRAY['group check', 'ability check', 'group', 'party'],
'handbook.txt', 'Chapter 7', 175
FROM rule_categories WHERE slug = 'ability-checks';

-- Schools of Magic
INSERT INTO rules (category_id, title, slug, content, summary, keywords, source_document, source_chapter, source_page)
SELECT id, 'Schools of Magic', 'schools-of-magic',
'Academies of magic group spells into eight categories called schools of magic. Scholars, particularly wizards, apply these categories to all spells, believing that all magic functions in essentially the same way, whether it derives from rigorous study or is bestowed by a deity.

Abjuration: Spells that are protective in nature, though some of them have aggressive uses. They create magical barriers, negate harmful effects, harm trespassers, or banish creatures to other planes of existence.

Conjuration: Spells that involve the transportation of objects and creatures from one location to another. Some spells summon creatures or objects to the casters side, whereas others allow the caster to teleport to another location.

Divination: Spells that reveal information, whether in the form of secrets long forgotten, glimpses of the future, the locations of hidden things, the truth behind illusions, or visions of distant people or places.

Enchantment: Spells that affect the minds of others, influencing or controlling their behavior. Such spells can make enemies see the caster as a friend, force creatures to take a course of action, or even control another creature like a puppet.

Evocation: Spells that manipulate magical energy to produce a desired effect. Some call up blasts of fire or lightning. Others channel positive energy to heal wounds.

Illusion: Spells that deceive the senses or minds of others. They cause people to see things that are not there, to miss things that are there, to hear phantom noises, or to remember things that never happened.

Necromancy: Spells that manipulate the energies of life and death. Such spells can grant an extra reserve of life force, drain the life energy from another creature, create the undead, or even bring the dead back to life.

Transmutation: Spells that change the properties of a creature, object, or environment. They might turn an enemy into a harmless creature, bolster the strength of an ally, make an object move at the casters command, or enhance a creatures innate healing abilities.',
'Eight schools: Abjuration (protection), Conjuration (transport), Divination (knowledge), Enchantment (mind), Evocation (energy), Illusion (deception), Necromancy (life/death), Transmutation (change)',
ARRAY['school of magic', 'abjuration', 'conjuration', 'divination', 'enchantment', 'evocation', 'illusion', 'necromancy', 'transmutation'],
'handbook.txt', 'Chapter 10', 203
FROM rule_categories WHERE slug = 'spellcasting';

-- =============================================================================
-- END OF CONTENT SEED DATA
-- =============================================================================
