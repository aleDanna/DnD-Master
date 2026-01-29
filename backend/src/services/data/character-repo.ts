/**
 * Character Repository
 * Handles all database operations for characters
 */

import { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '../../models/database.types.js';
import type {
  Character,
  CreateCharacterInput,
  UpdateCharacterInput,
} from '../../models/character.js';

type DbClient = SupabaseClient<Database>;

export class CharacterRepository {
  constructor(private client: DbClient) {}

  /**
   * Create a new character
   */
  async create(input: CreateCharacterInput, userId: string): Promise<Character> {
    const { data, error } = await this.client
      .from('characters')
      .insert({
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
        skills: input.skills ?? {},
        proficiencies: input.proficiencies ?? [],
        equipment: input.equipment ?? [],
        spells: input.spells ?? [],
        features: input.features ?? [],
        notes: input.notes ?? null,
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create character: ${error.message}`);
    }

    return this.mapToCharacter(data);
  }

  /**
   * Get a character by ID
   */
  async getById(id: string): Promise<Character | null> {
    const { data, error } = await this.client
      .from('characters')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null;
      throw new Error(`Failed to get character: ${error.message}`);
    }

    return this.mapToCharacter(data);
  }

  /**
   * Get all characters in a campaign
   */
  async listByCampaign(campaignId: string): Promise<Character[]> {
    const { data, error } = await this.client
      .from('characters')
      .select('*')
      .eq('campaign_id', campaignId)
      .order('created_at', { ascending: true });

    if (error) {
      throw new Error(`Failed to list characters: ${error.message}`);
    }

    return (data || []).map(this.mapToCharacter);
  }

  /**
   * Get all characters owned by a user
   */
  async listByUser(userId: string): Promise<Character[]> {
    const { data, error } = await this.client
      .from('characters')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(`Failed to list user characters: ${error.message}`);
    }

    return (data || []).map(this.mapToCharacter);
  }

  /**
   * Get a user's character in a specific campaign
   */
  async getByUserAndCampaign(userId: string, campaignId: string): Promise<Character | null> {
    const { data, error } = await this.client
      .from('characters')
      .select('*')
      .eq('user_id', userId)
      .eq('campaign_id', campaignId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null;
      throw new Error(`Failed to get character: ${error.message}`);
    }

    return this.mapToCharacter(data);
  }

  /**
   * Update a character
   */
  async update(id: string, input: UpdateCharacterInput): Promise<Character> {
    const updateData: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
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
    if (input.skills !== undefined) updateData.skills = input.skills;
    if (input.proficiencies !== undefined) updateData.proficiencies = input.proficiencies;
    if (input.equipment !== undefined) updateData.equipment = input.equipment;
    if (input.spells !== undefined) updateData.spells = input.spells;
    if (input.features !== undefined) updateData.features = input.features;
    if (input.notes !== undefined) updateData.notes = input.notes;

    const { data, error } = await this.client
      .from('characters')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to update character: ${error.message}`);
    }

    return this.mapToCharacter(data);
  }

  /**
   * Delete a character
   */
  async delete(id: string): Promise<void> {
    const { error } = await this.client
      .from('characters')
      .delete()
      .eq('id', id);

    if (error) {
      throw new Error(`Failed to delete character: ${error.message}`);
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
    const updateData: Record<string, unknown> = {
      current_hp: currentHp,
      updated_at: new Date().toISOString(),
    };

    if (maxHp !== undefined) {
      updateData.max_hp = maxHp;
    }

    const { data, error } = await this.client
      .from('characters')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to update character HP: ${error.message}`);
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

    const { data, error } = await this.client
      .from('characters')
      .update({
        level: newLevel,
        max_hp: character.max_hp + hpIncrease,
        current_hp: character.current_hp + hpIncrease,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to level up character: ${error.message}`);
    }

    return this.mapToCharacter(data);
  }

  /**
   * Map database row to Character type
   */
  private mapToCharacter(data: Database['public']['Tables']['characters']['Row']): Character {
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
      skills: (data.skills as Character['skills']) ?? {},
      proficiencies: (data.proficiencies as string[]) ?? [],
      equipment: (data.equipment as Character['equipment']) ?? [],
      spells: (data.spells as Character['spells']) ?? [],
      features: (data.features as Character['features']) ?? [],
      notes: data.notes,
      created_at: data.created_at,
      updated_at: data.updated_at,
    };
  }
}

/**
 * Factory function to create a character repository
 */
export function createCharacterRepository(client: DbClient): CharacterRepository {
  return new CharacterRepository(client);
}
