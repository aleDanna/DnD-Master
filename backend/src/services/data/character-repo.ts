/**
 * Character Repository
 * Handles all database operations for characters
 */

import { query, DbClient } from '../../config/database.js';
import type { CharacterRow } from '../../models/database.types.js';
import type {
  Character,
  CreateCharacterInput,
  UpdateCharacterInput,
} from '../../models/character.js';

export class CharacterRepository {
  constructor(private client?: DbClient) {}

  private async executeQuery<T>(text: string, params?: any[]): Promise<{ rows: T[]; rowCount: number }> {
    if (this.client) {
      return this.client.query<T>(text, params);
    }
    return query<T>(text, params);
  }

  /**
   * Create a new character
   */
  async create(input: CreateCharacterInput, userId: string): Promise<Character> {
    const result = await this.executeQuery<CharacterRow>(
      `INSERT INTO characters (
        campaign_id, user_id, name, race, class, level, max_hp, current_hp,
        armor_class, speed, strength, dexterity, constitution, intelligence,
        wisdom, charisma, skills, proficiencies, equipment, spells, features, notes
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22)
      RETURNING *`,
      [
        input.campaign_id,
        userId,
        input.name,
        input.race,
        input.class,
        input.level ?? 1,
        input.max_hp,
        input.current_hp,
        input.armor_class,
        input.speed ?? 30,
        input.strength,
        input.dexterity,
        input.constitution,
        input.intelligence,
        input.wisdom,
        input.charisma,
        JSON.stringify(input.skills ?? {}),
        JSON.stringify(input.proficiencies ?? []),
        JSON.stringify(input.equipment ?? []),
        JSON.stringify(input.spells ?? []),
        JSON.stringify(input.features ?? []),
        input.notes ?? null,
      ]
    );

    if (result.rowCount === 0) {
      throw new Error('Failed to create character');
    }

    return this.mapToCharacter(result.rows[0]);
  }

  /**
   * Get a character by ID
   */
  async getById(id: string): Promise<Character | null> {
    const result = await this.executeQuery<CharacterRow>(
      'SELECT * FROM characters WHERE id = $1',
      [id]
    );

    if (result.rowCount === 0) {
      return null;
    }

    return this.mapToCharacter(result.rows[0]);
  }

  /**
   * Get all characters in a campaign
   */
  async listByCampaign(campaignId: string): Promise<Character[]> {
    const result = await this.executeQuery<CharacterRow>(
      'SELECT * FROM characters WHERE campaign_id = $1 ORDER BY created_at ASC',
      [campaignId]
    );

    return result.rows.map(this.mapToCharacter);
  }

  /**
   * Get all characters owned by a user
   */
  async listByUser(userId: string): Promise<Character[]> {
    const result = await this.executeQuery<CharacterRow>(
      'SELECT * FROM characters WHERE user_id = $1 ORDER BY created_at DESC',
      [userId]
    );

    return result.rows.map(this.mapToCharacter);
  }

  /**
   * Get a user's character in a specific campaign
   */
  async getByUserAndCampaign(userId: string, campaignId: string): Promise<Character | null> {
    const result = await this.executeQuery<CharacterRow>(
      'SELECT * FROM characters WHERE user_id = $1 AND campaign_id = $2',
      [userId, campaignId]
    );

    if (result.rowCount === 0) {
      return null;
    }

    return this.mapToCharacter(result.rows[0]);
  }

  /**
   * Update a character
   */
  async update(id: string, input: UpdateCharacterInput): Promise<Character> {
    // Build dynamic update query
    const updates: string[] = ['updated_at = NOW()'];
    const values: any[] = [];
    let paramIndex = 1;

    const fields: (keyof UpdateCharacterInput)[] = [
      'name', 'race', 'class', 'level', 'max_hp', 'current_hp', 'armor_class',
      'speed', 'strength', 'dexterity', 'constitution', 'intelligence', 'wisdom',
      'charisma', 'skills', 'proficiencies', 'equipment', 'spells', 'features', 'notes'
    ];

    for (const field of fields) {
      if (input[field] !== undefined) {
        updates.push(`${field} = $${paramIndex}`);
        const value = input[field];
        // JSON stringify objects and arrays
        if (typeof value === 'object' && value !== null) {
          values.push(JSON.stringify(value));
        } else {
          values.push(value);
        }
        paramIndex++;
      }
    }

    values.push(id);

    const result = await this.executeQuery<CharacterRow>(
      `UPDATE characters SET ${updates.join(', ')} WHERE id = $${paramIndex} RETURNING *`,
      values
    );

    if (result.rowCount === 0) {
      throw new Error('Character not found');
    }

    return this.mapToCharacter(result.rows[0]);
  }

  /**
   * Delete a character
   */
  async delete(id: string): Promise<void> {
    const result = await this.executeQuery(
      'DELETE FROM characters WHERE id = $1',
      [id]
    );

    if (result.rowCount === 0) {
      throw new Error('Character not found');
    }
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
    let queryText: string;
    let params: any[];

    if (maxHp !== undefined) {
      queryText = `UPDATE characters SET current_hp = $1, max_hp = $2, updated_at = NOW() WHERE id = $3 RETURNING *`;
      params = [currentHp, maxHp, id];
    } else {
      queryText = `UPDATE characters SET current_hp = $1, updated_at = NOW() WHERE id = $2 RETURNING *`;
      params = [currentHp, id];
    }

    const result = await this.executeQuery<CharacterRow>(queryText, params);

    if (result.rowCount === 0) {
      throw new Error('Character not found');
    }

    return this.mapToCharacter(result.rows[0]);
  }

  /**
   * Level up a character
   */
  async levelUp(id: string, newLevel: number, hpIncrease: number): Promise<Character> {
    const character = await this.getById(id);
    if (!character) {
      throw new Error('Character not found');
    }

    const result = await this.executeQuery<CharacterRow>(
      `UPDATE characters
       SET level = $1, max_hp = max_hp + $2, current_hp = current_hp + $2, updated_at = NOW()
       WHERE id = $3
       RETURNING *`,
      [newLevel, hpIncrease, id]
    );

    if (result.rowCount === 0) {
      throw new Error('Failed to level up character');
    }

    return this.mapToCharacter(result.rows[0]);
  }

  /**
   * Map database row to Character type
   */
  private mapToCharacter(data: CharacterRow): Character {
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
      skills: (typeof data.skills === 'string' ? JSON.parse(data.skills) : data.skills) ?? {},
      proficiencies: (typeof data.proficiencies === 'string' ? JSON.parse(data.proficiencies) : data.proficiencies) ?? [],
      equipment: (typeof data.equipment === 'string' ? JSON.parse(data.equipment) : data.equipment) ?? [],
      spells: (typeof data.spells === 'string' ? JSON.parse(data.spells) : data.spells) ?? [],
      features: (typeof data.features === 'string' ? JSON.parse(data.features) : data.features) ?? [],
      notes: data.notes,
      created_at: data.created_at,
      updated_at: data.updated_at,
    };
  }
}

/**
 * Factory function to create a character repository
 */
export function createCharacterRepository(client?: DbClient): CharacterRepository {
  return new CharacterRepository(client);
}
