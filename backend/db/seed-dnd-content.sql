-- =============================================================================
-- D&D Master - Content Seed Data
-- =============================================================================
-- This file contains the D&D 5th Edition content data
-- Run this AFTER init.sql to populate the database with game content
-- =============================================================================

-- =============================================================================
-- SECTION 1: Rule Categories
-- =============================================================================

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

-- =============================================================================
-- SECTION 2: Rules
-- =============================================================================

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
-- SECTION 3: Classes
-- =============================================================================

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

-- =============================================================================
-- SECTION 4: Races
-- =============================================================================

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

-- =============================================================================
-- SECTION 5: Backgrounds
-- =============================================================================

INSERT INTO backgrounds (name, slug, description, skill_proficiencies, tool_proficiencies, languages, equipment, feature_name, feature_description, source_document, source_page) VALUES
('Acolyte', 'acolyte', 'You have spent your life in the service of a temple to a specific god or pantheon of gods. You act as an intermediary between the realm of the holy and the mortal world, performing sacred rites and offering sacrifices in order to conduct worshipers into the presence of the divine.', ARRAY['Insight', 'Religion'], NULL, 2, 'A holy symbol, a prayer book or prayer wheel, 5 sticks of incense, vestments, a set of common clothes, and a pouch containing 15 gp', 'Shelter of the Faithful', 'As an acolyte, you command the respect of those who share your faith, and you can perform the religious ceremonies of your deity. You and your adventuring companions can expect to receive free healing and care at a temple, shrine, or other established presence of your faith.', 'rules.txt', 37),

('Criminal', 'criminal', 'You are an experienced criminal with a history of breaking the law. You have spent a lot of time among other criminals and still have contacts within the criminal underworld.', ARRAY['Deception', 'Stealth'], ARRAY['One type of gaming set', 'Thieves'' tools'], 0, 'A crowbar, a set of dark common clothes including a hood, and a pouch containing 15 gp', 'Criminal Contact', 'You have a reliable and trustworthy contact who acts as your liaison to a network of other criminals. You know how to get messages to and from your contact, even over great distances.', 'rules.txt', 38),

('Folk Hero', 'folk-hero', 'You come from a humble social rank, but you are destined for so much more. Already the people of your home village regard you as their champion, and your destiny calls you to stand against the tyrants and monsters that threaten the common folk everywhere.', ARRAY['Animal Handling', 'Survival'], ARRAY['One type of artisan''s tools', 'Vehicles (land)'], 0, 'A set of artisan''s tools (one of your choice), a shovel, an iron pot, a set of common clothes, and a pouch containing 10 gp', 'Rustic Hospitality', 'Since you come from the ranks of the common folk, you fit in among them with ease. You can find a place to hide, rest, or recuperate among other commoners, unless you have shown yourself to be a danger to them.', 'rules.txt', 38),

('Noble', 'noble', 'You understand wealth, power, and privilege. You carry a noble title, and your family owns land, collects taxes, and wields significant political influence.', ARRAY['History', 'Persuasion'], ARRAY['One type of gaming set'], 1, 'A set of fine clothes, a signet ring, a scroll of pedigree, and a purse containing 25 gp', 'Position of Privilege', 'Thanks to your noble birth, people are inclined to think the best of you. You are welcome in high society, and people assume you have the right to be wherever you are. Common folk make every effort to accommodate you and avoid your displeasure.', 'rules.txt', 39),

('Sage', 'sage', 'You spent years learning the lore of the multiverse. You scoured manuscripts, studied scrolls, and listened to the greatest experts on the subjects that interest you.', ARRAY['Arcana', 'History'], NULL, 2, 'A bottle of black ink, a quill, a small knife, a letter from a dead colleague posing a question you have not yet been able to answer, a set of common clothes, and a pouch containing 10 gp', 'Researcher', 'When you attempt to learn or recall a piece of lore, if you do not know that information, you often know where and from whom you can obtain it. Usually, this information comes from a library, scriptorium, university, or a sage or other learned person or creature.', 'rules.txt', 39),

('Soldier', 'soldier', 'War has been your life for as long as you care to remember. You trained as a youth, studied the use of weapons and armor, learned basic survival techniques, including how to stay alive on the battlefield.', ARRAY['Athletics', 'Intimidation'], ARRAY['One type of gaming set', 'Vehicles (land)'], 0, 'An insignia of rank, a trophy taken from a fallen enemy, a set of bone dice or deck of cards, a set of common clothes, and a pouch containing 10 gp', 'Military Rank', 'You have a military rank from your career as a soldier. Soldiers loyal to your former military organization still recognize your authority and influence, and they defer to you if they are of a lower rank.', 'rules.txt', 40);

-- =============================================================================
-- SECTION 6: Spells
-- =============================================================================

INSERT INTO spells (name, slug, level, school, casting_time, range, components, duration, concentration, ritual, description, at_higher_levels, source_document, source_page) VALUES
('Fireball', 'fireball', 3, 'Evocation', '1 action', '150 feet', 'V, S, M', 'Instantaneous', false, false, 'A bright streak flashes from your pointing finger to a point you choose within range and then blossoms with a low roar into an explosion of flame. Each creature in a 20-foot-radius sphere centered on that point must make a Dexterity saving throw. A target takes 8d6 fire damage on a failed save, or half as much damage on a successful one. The fire spreads around corners. It ignites flammable objects in the area that aren''t being worn or carried.', 'When you cast this spell using a spell slot of 4th level or higher, the damage increases by 1d6 for each slot level above 3rd.', 'handbook.txt', 241),

('Magic Missile', 'magic-missile', 1, 'Evocation', '1 action', '120 feet', 'V, S', 'Instantaneous', false, false, 'You create three glowing darts of magical force. Each dart hits a creature of your choice that you can see within range. A dart deals 1d4 + 1 force damage to its target. The darts all strike simultaneously, and you can direct them to hit one creature or several.', 'When you cast this spell using a spell slot of 2nd level or higher, the spell creates one more dart for each slot level above 1st.', 'handbook.txt', 257),

('Cure Wounds', 'cure-wounds', 1, 'Evocation', '1 action', 'Touch', 'V, S', 'Instantaneous', false, false, 'A creature you touch regains a number of hit points equal to 1d8 + your spellcasting ability modifier. This spell has no effect on undead or constructs.', 'When you cast this spell using a spell slot of 2nd level or higher, the healing increases by 1d8 for each slot level above 1st.', 'handbook.txt', 230),

('Shield', 'shield', 1, 'Abjuration', '1 reaction', 'Self', 'V, S', '1 round', false, false, 'An invisible barrier of magical force appears and protects you. Until the start of your next turn, you have a +5 bonus to AC, including against the triggering attack, and you take no damage from magic missile.', NULL, 'handbook.txt', 275),

('Light', 'light', 0, 'Evocation', '1 action', 'Touch', 'V, M', '1 hour', false, false, 'You touch one object that is no larger than 10 feet in any dimension. Until the spell ends, the object sheds bright light in a 20-foot radius and dim light for an additional 20 feet. The light can be colored as you like. Completely covering the object with something opaque blocks the light. The spell ends if you cast it again or dismiss it as an action.', NULL, 'handbook.txt', 255),

('Mage Hand', 'mage-hand', 0, 'Conjuration', '1 action', '30 feet', 'V, S', '1 minute', false, false, 'A spectral, floating hand appears at a point you choose within range. The hand lasts for the duration or until you dismiss it as an action. The hand vanishes if it is ever more than 30 feet away from you or if you cast this spell again. You can use your action to control the hand. You can use the hand to manipulate an object, open an unlocked door or container, stow or retrieve an item from an open container, or pour the contents out of a vial.', NULL, 'handbook.txt', 256),

('Detect Magic', 'detect-magic', 1, 'Divination', '1 action', 'Self', 'V, S', '10 minutes', true, true, 'For the duration, you sense the presence of magic within 30 feet of you. If you sense magic in this way, you can use your action to see a faint aura around any visible creature or object in the area that bears magic, and you learn its school of magic, if any. The spell can penetrate most barriers, but it is blocked by 1 foot of stone, 1 inch of common metal, a thin sheet of lead, or 3 feet of wood or dirt.', NULL, 'handbook.txt', 231),

('Healing Word', 'healing-word', 1, 'Evocation', '1 bonus action', '60 feet', 'V', 'Instantaneous', false, false, 'A creature of your choice that you can see within range regains hit points equal to 1d4 + your spellcasting ability modifier. This spell has no effect on undead or constructs.', 'When you cast this spell using a spell slot of 2nd level or higher, the healing increases by 1d4 for each slot level above 1st.', 'handbook.txt', 250),

('Thunderwave', 'thunderwave', 1, 'Evocation', '1 action', 'Self (15-foot cube)', 'V, S', 'Instantaneous', false, false, 'A wave of thunderous force sweeps out from you. Each creature in a 15-foot cube originating from you must make a Constitution saving throw. On a failed save, a creature takes 2d8 thunder damage and is pushed 10 feet away from you. On a successful save, the creature takes half as much damage and isn''t pushed.', 'When you cast this spell using a spell slot of 2nd level or higher, the damage increases by 1d8 for each slot level above 1st.', 'handbook.txt', 282),

('Prestidigitation', 'prestidigitation', 0, 'Transmutation', '1 action', '10 feet', 'V, S', '1 hour', false, false, 'This spell is a minor magical trick that novice spellcasters use for practice. You create one of the following magical effects within range: a harmless sensory effect, light or snuff a small flame, clean or soil a small object, chill/warm/flavor material, make a small mark or symbol, or create a trinket or illusory image that fits in your hand.', NULL, 'handbook.txt', 267),

('Lightning Bolt', 'lightning-bolt', 3, 'Evocation', '1 action', 'Self (100-foot line)', 'V, S, M', 'Instantaneous', false, false, 'A stroke of lightning forming a line 100 feet long and 5 feet wide blasts out from you in a direction you choose. Each creature in the line must make a Dexterity saving throw. A creature takes 8d6 lightning damage on a failed save, or half as much damage on a successful one.', 'When you cast this spell using a spell slot of 4th level or higher, the damage increases by 1d6 for each slot level above 3rd.', 'handbook.txt', 255),

('Counterspell', 'counterspell', 3, 'Abjuration', '1 reaction', '60 feet', 'S', 'Instantaneous', false, false, 'You attempt to interrupt a creature in the process of casting a spell. If the creature is casting a spell of 3rd level or lower, its spell fails and has no effect. If it is casting a spell of 4th level or higher, make an ability check using your spellcasting ability. The DC equals 10 + the spell''s level. On a success, the creature''s spell fails and has no effect.', 'When you cast this spell using a spell slot of 4th level or higher, the interrupted spell has no effect if its level is less than or equal to the level of the spell slot you used.', 'handbook.txt', 228);

-- =============================================================================
-- SECTION 7: Monsters
-- =============================================================================

INSERT INTO monsters (name, slug, size, monster_type, alignment, armor_class, hit_points, hit_dice, speed, ability_scores, challenge_rating, experience_points, actions, description, source_document, source_page) VALUES
('Goblin', 'goblin', 'Small', 'Humanoid', 'Neutral Evil', 15, 7, '2d6', '{"walk": 30}', '{"strength": 8, "dexterity": 14, "constitution": 10, "intelligence": 10, "wisdom": 8, "charisma": 8}', '1/4', 50, '[{"name": "Scimitar", "desc": "Melee Weapon Attack: +4 to hit, reach 5 ft., one target. Hit: 5 (1d6 + 2) slashing damage."}, {"name": "Shortbow", "desc": "Ranged Weapon Attack: +4 to hit, range 80/320 ft., one target. Hit: 5 (1d6 + 2) piercing damage."}]', 'Goblins are small, black-hearted, selfish humanoids that lair in caves, abandoned mines, despoiled dungeons, and other dismal settings.', 'monster-manual.txt', 166),

('Orc', 'orc', 'Medium', 'Humanoid', 'Chaotic Evil', 13, 15, '2d8+6', '{"walk": 30}', '{"strength": 16, "dexterity": 12, "constitution": 16, "intelligence": 7, "wisdom": 11, "charisma": 10}', '1/2', 100, '[{"name": "Greataxe", "desc": "Melee Weapon Attack: +5 to hit, reach 5 ft., one target. Hit: 9 (1d12 + 3) slashing damage."}, {"name": "Javelin", "desc": "Melee or Ranged Weapon Attack: +5 to hit, reach 5 ft. or range 30/120 ft., one target. Hit: 6 (1d6 + 3) piercing damage."}]', 'Orcs are savage raiders and pillagers with stooped postures, low foreheads, and piggish faces with prominent lower canines that resemble tusks.', 'monster-manual.txt', 246),

('Dragon, Young Red', 'young-red-dragon', 'Large', 'Dragon', 'Chaotic Evil', 18, 178, '17d10+85', '{"walk": 40, "climb": 40, "fly": 80}', '{"strength": 23, "dexterity": 10, "constitution": 21, "intelligence": 14, "wisdom": 11, "charisma": 19}', '10', 5900, '[{"name": "Multiattack", "desc": "The dragon makes three attacks: one with its bite and two with its claws."}, {"name": "Bite", "desc": "Melee Weapon Attack: +10 to hit, reach 10 ft., one target. Hit: 17 (2d10 + 6) piercing damage plus 3 (1d6) fire damage."}, {"name": "Fire Breath (Recharge 5-6)", "desc": "The dragon exhales fire in a 30-foot cone. Each creature in that area must make a DC 17 Dexterity saving throw, taking 56 (16d6) fire damage on a failed save, or half as much damage on a successful one."}]', 'The most covetous of the true dragons, red dragons tirelessly seek to increase their treasure hoards. They lair in high mountains and use their powerful fire breath to devastating effect.', 'monster-manual.txt', 98),

('Skeleton', 'skeleton', 'Medium', 'Undead', 'Lawful Evil', 13, 13, '2d8+4', '{"walk": 30}', '{"strength": 10, "dexterity": 14, "constitution": 15, "intelligence": 6, "wisdom": 8, "charisma": 5}', '1/4', 50, '[{"name": "Shortsword", "desc": "Melee Weapon Attack: +4 to hit, reach 5 ft., one target. Hit: 5 (1d6 + 2) piercing damage."}, {"name": "Shortbow", "desc": "Ranged Weapon Attack: +4 to hit, range 80/320 ft., one target. Hit: 5 (1d6 + 2) piercing damage."}]', 'Skeletons arise when animated by dark magic. They obey the orders of their creators and do not tire.', 'monster-manual.txt', 272),

('Zombie', 'zombie', 'Medium', 'Undead', 'Neutral Evil', 8, 22, '3d8+9', '{"walk": 20}', '{"strength": 13, "dexterity": 6, "constitution": 16, "intelligence": 3, "wisdom": 6, "charisma": 5}', '1/4', 50, '[{"name": "Slam", "desc": "Melee Weapon Attack: +3 to hit, reach 5 ft., one target. Hit: 4 (1d6 + 1) bludgeoning damage."}]', 'From somewhere in the darkness, a horrible stench wafts on the air. Rotting flesh hangs in shreds from bone, and dead eyes burn with hatred for the living.', 'monster-manual.txt', 316),

('Owlbear', 'owlbear', 'Large', 'Monstrosity', 'Unaligned', 13, 59, '7d10+21', '{"walk": 40}', '{"strength": 20, "dexterity": 12, "constitution": 17, "intelligence": 3, "wisdom": 12, "charisma": 7}', '3', 700, '[{"name": "Multiattack", "desc": "The owlbear makes two attacks: one with its beak and one with its claws."}, {"name": "Beak", "desc": "Melee Weapon Attack: +7 to hit, reach 5 ft., one creature. Hit: 10 (1d10 + 5) piercing damage."}, {"name": "Claws", "desc": "Melee Weapon Attack: +7 to hit, reach 5 ft., one target. Hit: 14 (2d8 + 5) slashing damage."}]', 'An owlbear is a monstrous cross between a giant owl and a bear. It has a bear''s body with an owl''s head, and it is known for its savage ferocity.', 'monster-manual.txt', 249),

('Beholder', 'beholder', 'Large', 'Aberration', 'Lawful Evil', 18, 180, '19d10+76', '{"fly": 20}', '{"strength": 10, "dexterity": 14, "constitution": 18, "intelligence": 17, "wisdom": 15, "charisma": 17}', '13', 10000, '[{"name": "Bite", "desc": "Melee Weapon Attack: +5 to hit, reach 5 ft., one target. Hit: 14 (4d6) piercing damage."}, {"name": "Eye Rays", "desc": "The beholder shoots three of its magical eye rays at random, choosing one to three targets it can see within 120 feet of it."}]', 'One glance at a beholder is enough to assess its foul and otherworldly nature. Aggressive, hateful, and greedy, beholders are among the most feared creatures of the Underdark.', 'monster-manual.txt', 28),

('Giant Spider', 'giant-spider', 'Large', 'Beast', 'Unaligned', 14, 26, '4d10+4', '{"walk": 30, "climb": 30}', '{"strength": 14, "dexterity": 16, "constitution": 12, "intelligence": 2, "wisdom": 11, "charisma": 4}', '1', 200, '[{"name": "Bite", "desc": "Melee Weapon Attack: +5 to hit, reach 5 ft., one creature. Hit: 7 (1d8 + 3) piercing damage, and the target must make a DC 11 Constitution saving throw, taking 9 (2d8) poison damage on a failed save, or half as much damage on a successful one."}, {"name": "Web (Recharge 5-6)", "desc": "Ranged Weapon Attack: +5 to hit, range 30/60 ft., one creature. Hit: The target is restrained by webbing."}]', 'To snare its prey, a giant spider spins elaborate webs or shoots sticky strands of webbing from its abdomen.', 'monster-manual.txt', 328);

-- =============================================================================
-- SECTION 8: Items
-- =============================================================================

INSERT INTO items (name, slug, item_type, rarity, description, cost, weight, weapon_properties, damage, damage_type, source_document, source_page) VALUES
('Longsword', 'longsword', 'weapon', 'common', 'A versatile slashing weapon favored by warriors.', '15 gp', '3 lb', ARRAY['Versatile (1d10)'], '1d8', 'slashing', 'handbook.txt', 149),

('Shortbow', 'shortbow', 'weapon', 'common', 'A simple ranged weapon made from flexible wood.', '25 gp', '2 lb', ARRAY['Ammunition (range 80/320)', 'Two-Handed'], '1d6', 'piercing', 'handbook.txt', 149),

('Chain Mail', 'chain-mail', 'armor', 'common', 'Made of interlocking metal rings, chain mail includes a layer of quilted fabric worn underneath to prevent chafing.', '75 gp', '55 lb', NULL, NULL, NULL, 'handbook.txt', 145),

('Leather Armor', 'leather-armor', 'armor', 'common', 'The breastplate and shoulder protectors of this armor are made of leather that has been stiffened by being boiled in oil.', '10 gp', '10 lb', NULL, NULL, NULL, 'handbook.txt', 145),

('Healing Potion', 'healing-potion', 'magic_item', 'common', 'You regain 2d4 + 2 hit points when you drink this potion. The potion''s red liquid glimmers when agitated.', '50 gp', '0.5 lb', NULL, NULL, NULL, 'handbook.txt', 187),

('Rope, Hempen (50 feet)', 'hempen-rope', 'adventuring_gear', 'common', 'Rope has 2 hit points and can be burst with a DC 17 Strength check.', '1 gp', '10 lb', NULL, NULL, NULL, 'handbook.txt', 153),

('Torch', 'torch', 'adventuring_gear', 'common', 'A torch burns for 1 hour, providing bright light in a 20-foot radius and dim light for an additional 20 feet. If you make a melee attack with a burning torch and hit, it deals 1 fire damage.', '1 cp', '1 lb', NULL, NULL, NULL, 'handbook.txt', 153),

('+1 Longsword', 'longsword-plus-one', 'weapon', 'uncommon', 'You have a +1 bonus to attack and damage rolls made with this magic weapon.', NULL, '3 lb', ARRAY['Versatile (1d10)'], '1d8+1', 'slashing', 'dungeon-masters-guide.txt', 213),

('Bag of Holding', 'bag-of-holding', 'magic_item', 'uncommon', 'This bag has an interior space considerably larger than its outside dimensions, roughly 2 feet in diameter at the mouth and 4 feet deep. The bag can hold up to 500 pounds, not exceeding a volume of 64 cubic feet.', NULL, '15 lb', NULL, NULL, NULL, 'dungeon-masters-guide.txt', 153),

('Ring of Protection', 'ring-of-protection', 'magic_item', 'rare', 'You gain a +1 bonus to AC and saving throws while wearing this ring.', NULL, '0 lb', NULL, NULL, NULL, 'dungeon-masters-guide.txt', 191);

-- =============================================================================
-- SECTION 9: Feats
-- =============================================================================

INSERT INTO feats (name, slug, prerequisites, description, benefits, source_document, source_page) VALUES
('Alert', 'alert', NULL, 'Always on the lookout for danger, you gain the following benefits.', '{"benefits": ["+5 bonus to initiative", "Cannot be surprised while conscious", "Other creatures do not gain advantage on attack rolls against you as a result of being hidden from you"]}', 'handbook.txt', 165),

('Great Weapon Master', 'great-weapon-master', NULL, 'You''ve learned to put the weight of a weapon to your advantage, letting its momentum empower your strikes.', '{"benefits": ["On your turn, when you score a critical hit with a melee weapon or reduce a creature to 0 hit points with one, you can make one melee weapon attack as a bonus action.", "Before you make a melee attack with a heavy weapon that you are proficient with, you can choose to take a -5 penalty to the attack roll. If the attack hits, you add +10 to the attack''s damage."]}', 'handbook.txt', 167),

('Sharpshooter', 'sharpshooter', NULL, 'You have mastered ranged weapons and can make shots that others find impossible.', '{"benefits": ["Attacking at long range doesn''t impose disadvantage on your ranged weapon attack rolls.", "Your ranged weapon attacks ignore half cover and three-quarters cover.", "Before you make an attack with a ranged weapon that you are proficient with, you can choose to take a -5 penalty to the attack roll. If the attack hits, you add +10 to the attack''s damage."]}', 'handbook.txt', 170),

('Lucky', 'lucky', NULL, 'You have inexplicable luck that seems to kick in at just the right moment.', '{"benefits": ["You have 3 luck points. Whenever you make an attack roll, ability check, or saving throw, you can spend one luck point to roll an additional d20.", "You regain expended luck points when you finish a long rest."]}', 'handbook.txt', 167),

('Sentinel', 'sentinel', NULL, 'You have mastered techniques to take advantage of every drop in any enemy''s guard.', '{"benefits": ["When you hit a creature with an opportunity attack, the creature''s speed becomes 0 for the rest of the turn.", "Creatures provoke opportunity attacks from you even if they take the Disengage action before leaving your reach.", "When a creature within 5 feet of you makes an attack against a target other than you, you can use your reaction to make a melee weapon attack against the attacking creature."]}', 'handbook.txt', 169),

('War Caster', 'war-caster', 'The ability to cast at least one spell', 'You have practiced casting spells in the midst of combat, learning techniques that grant you the following benefits.', '{"benefits": ["You have advantage on Constitution saving throws that you make to maintain your concentration on a spell when you take damage.", "You can perform the somatic components of spells even when you have weapons or a shield in one or both hands.", "When a hostile creature''s movement provokes an opportunity attack from you, you can use your reaction to cast a spell at the creature, rather than making an opportunity attack."]}', 'handbook.txt', 170);

-- =============================================================================
-- NOTE: Conditions and Skills are already seeded by init.sql
-- Do not add them here to avoid duplicate key errors
-- =============================================================================

-- =============================================================================
-- END OF SEED FILE
-- =============================================================================
