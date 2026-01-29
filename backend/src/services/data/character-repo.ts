/**
 * Character Repository
 * Handles all database operations for characters
 */

import { db, query } from '../../config/database.js';
import type {
  Character,
  CreateCharacterInput,
  UpdateCharacterInput,
} from '../../models/character.js';

export class CharacterRepository {
  /**
   * Create a new character
   */
  async create(input: CreateCharacterInput, userId: string): Promise<Character> {
    const data = await db.insert<any>('characters', {
      campaign_id: input.campaign_id,
      user_id: userId,
      name: input.name,
      race: input.race,
      class: input.class,
      level: input.level ?? 1,
      max_hp: input.max_hp,
      current_hp: input.current_hp,
      armor_class: input.armor_class,
      speed: input.speed ?? 30,
      strength: input.strength,
      dexterity: input.dexterity,
      constitution: input.constitution,
      intelligence: input.intelligence,
      wisdom: input.wisdom,
      charisma: input.charisma,
      skills: JSON.stringify(input.skills ?? {}),
      proficiencies: JSON.stringify(input.proficiencies ?? []),
      equipment: JSON.stringify(input.equipment ?? []),
      spells: JSON.stringify(input.spells ?? []),
      features: JSON.stringify(input.features ?? []),
      notes: input.notes ?? null,
      created_at: new Date(),
      updated_at: new Date(),
    });

    if (!data) {
      throw new Error('Failed to create character');
    }

    return this.mapToCharacter(data);
  }

  /**
   * Get a character by ID
   */
  async getById(id: string): Promise<Character | null> {
    const data = await db.findOne<any>('characters', { id });
    if (!data) return null;
    return this.mapToCharacter(data);
  }

  /**
   * Get all characters in a campaign
   */
  async listByCampaign(campaignId: string): Promise<Character[]> {
    const data = await db.findMany<any>(
      'characters',
      { campaign_id: campaignId },
      { orderBy: 'created_at ASC' }
    );
    return data.map(this.mapToCharacter);
  }

  /**
   * Get all characters owned by a user
   */
  async listByUser(userId: string): Promise<Character[]> {
    const data = await db.findMany<any>(
      'characters',
      { user_id: userId },
      { orderBy: 'created_at DESC' }
    );
    return data.map(this.mapToCharacter);
  }

  /**
   * Get a user's character in a specific campaign
   */
  async getByUserAndCampaign(userId: string, campaignId: string): Promise<Character | null> {
    const result = await query<any>(
      'SELECT * FROM characters WHERE user_id = $1 AND campaign_id = $2 LIMIT 1',
      [userId, campaignId]
    );
    if (result.rows.length === 0) return null;
    return this.mapToCharacter(result.rows[0]);
  }

  /**
   * Update a character
   */
  async update(id: string, input: UpdateCharacterInput): Promise<Character> {
    const updateData: Record<string, any> = {
      updated_at: new Date(),
    };

    // Only include fields that are provided
    if (input.name !== undefined) updateData.name = input.name;
    if (input.race !== undefined) updateData.race = input.race;
    if (input.class !== undefined) updateData.class = input.class;
    if (input.level !== undefined) updateData.level = input.level;
    if (input.max_hp !== undefined) updateData.max_hp = input.max_hp;
    if (input.current_hp !== undefined) updateData.current_hp = input.current_hp;
    if (input.armor_class !== undefined) updateData.armor_class = input.armor_class;
    if (input.speed !== undefined) updateData.speed = input.speed;
    if (input.strength !== undefined) updateData.strength = input.strength;
    if (input.dexterity !== undefined) updateData.dexterity = input.dexterity;
    if (input.constitution !== undefined) updateData.constitution = input.constitution;
    if (input.intelligence !== undefined) updateData.intelligence = input.intelligence;
    if (input.wisdom !== undefined) updateData.wisdom = input.wisdom;
    if (input.charisma !== undefined) updateData.charisma = input.charisma;
    if (input.skills !== undefined) updateData.skills = JSON.stringify(input.skills);
    if (input.proficiencies !== undefined) updateData.proficiencies = JSON.stringify(input.proficiencies);
    if (input.equipment !== undefined) updateData.equipment = JSON.stringify(input.equipment);
    if (input.spells !== undefined) updateData.spells = JSON.stringify(input.spells);
    if (input.features !== undefined) updateData.features = JSON.stringify(input.features);
    if (input.notes !== undefined) updateData.notes = input.notes;

    const data = await db.update<any>('characters', updateData, { id });

    if (!data) {
      throw new Error('Failed to update character');
    }

    return this.mapToCharacter(data);
  }

  /**
   * Delete a character
   */
  async delete(id: string): Promise<void> {
    await db.delete('characters', { id });
  }

  /**
   * Check if a user owns a character
   */
  async isOwner(characterId: string, userId: string): Promise<boolean> {
    const character = await this.getById(characterId);
    return character?.user_id === userId;
  }

  /**
   * Update character HP
   */
  async updateHp(id: string, currentHp: number, maxHp?: number): Promise<Character> {
    const updateData: Record<string, any> = {
      current_hp: currentHp,
      updated_at: new Date(),
    };

    if (maxHp !== undefined) {
      updateData.max_hp = maxHp;
    }

    const data = await db.update<any>('characters', updateData, { id });

    if (!data) {
      throw new Error('Failed to update character HP');
    }

    return this.mapToCharacter(data);
  }

  /**
   * Level up a character
   */
  async levelUp(id: string, newLevel: number, hpIncrease: number): Promise<Character> {
    const character = await this.getById(id);
    if (!character) {
      throw new Error('Character not found');
    }

    const data = await db.update<any>('characters', {
      level: newLevel,
      max_hp: character.max_hp + hpIncrease,
      current_hp: character.current_hp + hpIncrease,
      updated_at: new Date(),
    }, { id });

    if (!data) {
      throw new Error('Failed to level up character');
    }

    return this.mapToCharacter(data);
  }

  /**
   * Map database row to Character type
   */
  private mapToCharacter(data: any): Character {
    const parseJson = (val: any) => typeof val === 'string' ? JSON.parse(val) : val;

    return {
      id: data.id,
      campaign_id: data.campaign_id,
      user_id: data.user_id,
      name: data.name,
      race: data.race,
      class: data.class,
      level: data.level,
      max_hp: data.max_hp,
      current_hp: data.current_hp,
      armor_class: data.armor_class,
      speed: data.speed,
      strength: data.strength,
      dexterity: data.dexterity,
      constitution: data.constitution,
      intelligence: data.intelligence,
      wisdom: data.wisdom,
      charisma: data.charisma,
      skills: parseJson(data.skills) ?? {},
      proficiencies: parseJson(data.proficiencies) ?? [],
      equipment: parseJson(data.equipment) ?? [],
      spells: parseJson(data.spells) ?? [],
      features: parseJson(data.features) ?? [],
      notes: data.notes,
      created_at: data.created_at instanceof Date ? data.created_at.toISOString() : data.created_at,
      updated_at: data.updated_at instanceof Date ? data.updated_at.toISOString() : data.updated_at,
    };
  }
}

/**
 * Factory function to create a character repository
 */
export function createCharacterRepository(): CharacterRepository {
  return new CharacterRepository();
}
