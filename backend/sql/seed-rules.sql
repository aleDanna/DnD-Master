-- Seed script for sample D&D rules
-- Run this after init.sql to populate the rules explorer with test data

-- Insert a sample source document
INSERT INTO source_documents (id, name, file_type, file_hash, total_pages, status)
VALUES (
  'a0000000-0000-0000-0000-000000000001',
  'Basic Rules',
  'pdf',
  'sample_basic_rules_hash_001',
  100,
  'completed'
) ON CONFLICT (file_hash) DO NOTHING;

-- Insert sample chapters
INSERT INTO rule_chapters (id, document_id, title, order_index, page_start, page_end) VALUES
  ('b0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001', 'Combat', 1, 1, 20),
  ('b0000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000001', 'Spellcasting', 2, 21, 40),
  ('b0000000-0000-0000-0000-000000000003', 'a0000000-0000-0000-0000-000000000001', 'Adventuring', 3, 41, 60),
  ('b0000000-0000-0000-0000-000000000004', 'a0000000-0000-0000-0000-000000000001', 'Equipment', 4, 61, 80)
ON CONFLICT DO NOTHING;

-- Insert sample sections
INSERT INTO rule_sections (id, chapter_id, title, order_index, page_start, page_end) VALUES
  -- Combat sections
  ('c0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', 'The Order of Combat', 1, 1, 5),
  ('c0000000-0000-0000-0000-000000000002', 'b0000000-0000-0000-0000-000000000001', 'Actions in Combat', 2, 6, 12),
  ('c0000000-0000-0000-0000-000000000003', 'b0000000-0000-0000-0000-000000000001', 'Making an Attack', 3, 13, 18),
  ('c0000000-0000-0000-0000-000000000004', 'b0000000-0000-0000-0000-000000000001', 'Damage and Healing', 4, 19, 20),
  -- Spellcasting sections
  ('c0000000-0000-0000-0000-000000000005', 'b0000000-0000-0000-0000-000000000002', 'What Is a Spell?', 1, 21, 25),
  ('c0000000-0000-0000-0000-000000000006', 'b0000000-0000-0000-0000-000000000002', 'Casting a Spell', 2, 26, 32),
  ('c0000000-0000-0000-0000-000000000007', 'b0000000-0000-0000-0000-000000000002', 'Spell Slots', 3, 33, 36),
  -- Adventuring sections
  ('c0000000-0000-0000-0000-000000000008', 'b0000000-0000-0000-0000-000000000003', 'Time', 1, 41, 42),
  ('c0000000-0000-0000-0000-000000000009', 'b0000000-0000-0000-0000-000000000003', 'Movement', 2, 43, 48),
  ('c0000000-0000-0000-0000-000000000010', 'b0000000-0000-0000-0000-000000000003', 'Resting', 3, 49, 52),
  -- Equipment sections
  ('c0000000-0000-0000-0000-000000000011', 'b0000000-0000-0000-0000-000000000004', 'Armor', 1, 61, 65),
  ('c0000000-0000-0000-0000-000000000012', 'b0000000-0000-0000-0000-000000000004', 'Weapons', 2, 66, 72)
ON CONFLICT DO NOTHING;

-- Insert sample rule entries
INSERT INTO rule_entries (id, section_id, title, content, page_reference, order_index) VALUES
  -- Combat: Order of Combat
  ('d0000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000001', 'Initiative',
   'At the beginning of every combat, each participant makes a Dexterity check to determine their place in the initiative order. The DM makes one roll for an entire group of identical creatures, so each member of the group acts at the same time. The DM ranks the combatants in order from the one with the highest Dexterity check total to the one with the lowest. This is the order in which they act during each round.',
   'p. 2', 1),

  ('d0000000-0000-0000-0000-000000000002', 'c0000000-0000-0000-0000-000000000001', 'Surprise',
   'A band of adventurers sneaks up on a bandit camp. If neither side tries to be stealthy, they automatically notice each other. Otherwise, the DM compares the Dexterity (Stealth) checks of anyone hiding with the passive Wisdom (Perception) score of each creature on the opposing side. Any character or monster that doesn''t notice a threat is surprised at the start of the encounter. If you''re surprised, you can''t move or take an action on your first turn of the combat, and you can''t take a reaction until that turn ends.',
   'p. 3', 2),

  -- Combat: Actions in Combat
  ('d0000000-0000-0000-0000-000000000003', 'c0000000-0000-0000-0000-000000000002', 'Attack Action',
   'The most common action to take in combat is the Attack action, whether you are swinging a sword, firing an arrow from a bow, or brawling with your fists. With this action, you make one melee or ranged attack. Certain features, such as the Extra Attack feature of the fighter, allow you to make more than one attack with this action.',
   'p. 6', 1),

  ('d0000000-0000-0000-0000-000000000004', 'c0000000-0000-0000-0000-000000000002', 'Dodge Action',
   'When you take the Dodge action, you focus entirely on avoiding attacks. Until the start of your next turn, any attack roll made against you has disadvantage if you can see the attacker, and you make Dexterity saving throws with advantage. You lose this benefit if you are incapacitated or if your speed drops to 0.',
   'p. 7', 2),

  ('d0000000-0000-0000-0000-000000000005', 'c0000000-0000-0000-0000-000000000002', 'Disengage Action',
   'If you take the Disengage action, your movement doesn''t provoke opportunity attacks for the rest of the turn.',
   'p. 7', 3),

  ('d0000000-0000-0000-0000-000000000006', 'c0000000-0000-0000-0000-000000000002', 'Help Action',
   'You can lend your aid to another creature in the completion of a task. When you take the Help action, the creature you aid gains advantage on the next ability check it makes to perform the task you are helping with, provided that it makes the check before the start of your next turn. Alternatively, you can aid a friendly creature in attacking a creature within 5 feet of you. You feint, distract the target, or in some other way team up to make your ally''s attack more effective. If your ally attacks the target before your next turn, the first attack roll is made with advantage.',
   'p. 8', 4),

  ('d0000000-0000-0000-0000-000000000007', 'c0000000-0000-0000-0000-000000000002', 'Dash Action',
   'When you take the Dash action, you gain extra movement for the current turn. The increase equals your speed, after applying any modifiers. With a speed of 30 feet, for example, you can move up to 60 feet on your turn if you dash.',
   'p. 7', 5),

  -- Combat: Making an Attack
  ('d0000000-0000-0000-0000-000000000008', 'c0000000-0000-0000-0000-000000000003', 'Attack Rolls',
   'When you make an attack, your attack roll determines whether the attack hits or misses. To make an attack roll, roll a d20 and add the appropriate modifiers. If the total of the roll plus modifiers equals or exceeds the target''s Armor Class (AC), the attack hits.',
   'p. 13', 1),

  ('d0000000-0000-0000-0000-000000000009', 'c0000000-0000-0000-0000-000000000003', 'Critical Hits',
   'When you score a critical hit, you get to roll extra dice for the attack''s damage against the target. Roll all of the attack''s damage dice twice and add them together. Then add any relevant modifiers as normal. If the attack involves other damage dice, such as from the rogue''s Sneak Attack feature, you roll those dice twice as well.',
   'p. 14', 2),

  ('d0000000-0000-0000-0000-000000000010', 'c0000000-0000-0000-0000-000000000003', 'Opportunity Attacks',
   'In a fight, everyone is constantly watching for a chance to strike an enemy who is fleeing or passing by. Such a strike is called an opportunity attack. You can make an opportunity attack when a hostile creature that you can see moves out of your reach. To make the opportunity attack, you use your reaction to make one melee attack against the provoking creature. The attack occurs right before the creature leaves your reach.',
   'p. 15', 3),

  -- Combat: Damage and Healing
  ('d0000000-0000-0000-0000-000000000011', 'c0000000-0000-0000-0000-000000000004', 'Hit Points',
   'Hit points represent a combination of physical and mental durability, the will to live, and luck. Creatures with more hit points are more difficult to kill. Those with fewer hit points are more fragile. A creature''s current hit points can be any number from the creature''s hit point maximum down to 0.',
   'p. 19', 1),

  ('d0000000-0000-0000-0000-000000000012', 'c0000000-0000-0000-0000-000000000004', 'Death Saving Throws',
   'Whenever you start your turn with 0 hit points, you must make a special saving throw, called a death saving throw, to determine whether you creep closer to death or hang onto life. Roll a d20. If the roll is 10 or higher, you succeed. Otherwise, you fail. A success or failure has no effect by itself. On your third success, you become stable. On your third failure, you die.',
   'p. 20', 2),

  -- Spellcasting entries
  ('d0000000-0000-0000-0000-000000000013', 'c0000000-0000-0000-0000-000000000005', 'Spell Level',
   'Every spell has a level from 0 to 9. A spell''s level is a general indicator of how powerful it is, with the lowly (but still impressive) magic missile at 1st level and the earth-shaking wish at 9th. Cantrips—simple but powerful spells that characters can cast almost by rote—are level 0.',
   'p. 21', 1),

  ('d0000000-0000-0000-0000-000000000014', 'c0000000-0000-0000-0000-000000000006', 'Concentration',
   'Some spells require you to maintain concentration in order to keep their magic active. If you lose concentration, such a spell ends. You lose concentration on a spell if you cast another spell that requires concentration, take damage (must make Constitution saving throw DC 10 or half the damage taken, whichever is higher), or are incapacitated or killed.',
   'p. 28', 1),

  ('d0000000-0000-0000-0000-000000000015', 'c0000000-0000-0000-0000-000000000007', 'Spell Slots',
   'Regardless of how many spells a caster knows or prepares, he or she can cast only a limited number of spells before resting. Manipulating the fabric of magic and channeling its energy into even a simple spell is physically and mentally taxing. When a character casts a spell, he or she expends a slot of that spell''s level or higher, effectively "filling" a slot with the spell.',
   'p. 33', 1),

  -- Adventuring entries
  ('d0000000-0000-0000-0000-000000000016', 'c0000000-0000-0000-0000-000000000009', 'Speed',
   'Every character and monster has a speed, which is the distance in feet that the character or monster can walk in 1 round. This number assumes short bursts of energetic movement in the midst of a life-threatening situation. A character''s speed is determined by race and armor worn.',
   'p. 43', 1),

  ('d0000000-0000-0000-0000-000000000017', 'c0000000-0000-0000-0000-000000000009', 'Difficult Terrain',
   'Combat rarely takes place in bare rooms or on featureless plains. Moving through difficult terrain costs 1 extra foot for every foot of movement. This rule is true even if multiple things in a space count as difficult terrain.',
   'p. 44', 2),

  ('d0000000-0000-0000-0000-000000000018', 'c0000000-0000-0000-0000-000000000010', 'Short Rest',
   'A short rest is a period of downtime, at least 1 hour long, during which a character does nothing more strenuous than eating, drinking, reading, and tending to wounds. A character can spend one or more Hit Dice at the end of a short rest, up to the character''s maximum number of Hit Dice. For each Hit Die spent in this way, the player rolls the die and adds the character''s Constitution modifier to it. The character regains hit points equal to the total.',
   'p. 49', 1),

  ('d0000000-0000-0000-0000-000000000019', 'c0000000-0000-0000-0000-000000000010', 'Long Rest',
   'A long rest is a period of extended downtime, at least 8 hours long, during which a character sleeps for at least 6 hours and performs no more than 2 hours of light activity. At the end of a long rest, a character regains all lost hit points and spent Hit Dice, up to a number of dice equal to half of the character''s total number of them.',
   'p. 50', 2),

  -- Equipment entries
  ('d0000000-0000-0000-0000-000000000020', 'c0000000-0000-0000-0000-000000000011', 'Armor Class',
   'Armor protects its wearer from attacks. The armor (and shield) you wear determines your base Armor Class. Heavy armor doesn''t let you add your Dexterity modifier to your Armor Class, but it also doesn''t penalize you if your Dexterity modifier is negative. Light armor lets you add your Dexterity modifier to your AC. Medium armor lets you add your Dexterity modifier, to a maximum of +2.',
   'p. 61', 1),

  ('d0000000-0000-0000-0000-000000000021', 'c0000000-0000-0000-0000-000000000012', 'Weapon Properties',
   'Many weapons have special properties related to their use. Finesse weapons let you use either Strength or Dexterity for attack and damage rolls. Heavy weapons give Small creatures disadvantage on attack rolls. Light weapons are ideal for two-weapon fighting. Reach weapons add 5 feet to your reach. Thrown weapons can be thrown to make a ranged attack. Two-handed weapons require two hands to use.',
   'p. 66', 1),

  ('d0000000-0000-0000-0000-000000000022', 'c0000000-0000-0000-0000-000000000012', 'Two-Weapon Fighting',
   'When you take the Attack action and attack with a light melee weapon that you''re holding in one hand, you can use a bonus action to attack with a different light melee weapon that you''re holding in the other hand. You don''t add your ability modifier to the damage of the bonus attack, unless that modifier is negative.',
   'p. 68', 2)
ON CONFLICT DO NOTHING;

-- Link entries to categories
INSERT INTO rule_entry_categories (entry_id, category_id)
SELECT e.id, c.id
FROM rule_entries e
CROSS JOIN rule_categories c
WHERE
  (e.section_id IN (
    SELECT id FROM rule_sections WHERE chapter_id = 'b0000000-0000-0000-0000-000000000001'
  ) AND c.name = 'Combat')
  OR
  (e.section_id IN (
    SELECT id FROM rule_sections WHERE chapter_id = 'b0000000-0000-0000-0000-000000000002'
  ) AND c.name = 'Spellcasting')
  OR
  (e.section_id = 'c0000000-0000-0000-0000-000000000009' AND c.name = 'Movement')
  OR
  (e.section_id = 'c0000000-0000-0000-0000-000000000010' AND c.name = 'Rest')
  OR
  (e.section_id IN (
    SELECT id FROM rule_sections WHERE chapter_id = 'b0000000-0000-0000-0000-000000000004'
  ) AND c.name = 'Equipment')
ON CONFLICT DO NOTHING;

-- Output summary
DO $$
DECLARE
  doc_count INT;
  chapter_count INT;
  section_count INT;
  entry_count INT;
BEGIN
  SELECT COUNT(*) INTO doc_count FROM source_documents;
  SELECT COUNT(*) INTO chapter_count FROM rule_chapters;
  SELECT COUNT(*) INTO section_count FROM rule_sections;
  SELECT COUNT(*) INTO entry_count FROM rule_entries;

  RAISE NOTICE '';
  RAISE NOTICE '====================================================';
  RAISE NOTICE 'Rules Seed Data Loaded Successfully!';
  RAISE NOTICE '====================================================';
  RAISE NOTICE 'Documents: %', doc_count;
  RAISE NOTICE 'Chapters: %', chapter_count;
  RAISE NOTICE 'Sections: %', section_count;
  RAISE NOTICE 'Rule Entries: %', entry_count;
  RAISE NOTICE '====================================================';
  RAISE NOTICE 'Try searching for: "initiative", "attack", "spell slots"';
  RAISE NOTICE '====================================================';
END $$;
