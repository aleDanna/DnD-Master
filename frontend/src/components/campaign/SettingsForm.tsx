'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/Button';

export interface CampaignSettings {
  name: string;
  description?: string;
  dice_mode: 'rng' | 'player_entered';
  map_mode: 'grid_2d' | 'narrative_only';
}

export interface SettingsFormProps {
  initialValues: CampaignSettings;
  onSave: (settings: CampaignSettings) => Promise<void>;
  onCancel?: () => void;
  isOwner: boolean;
}

/**
 * SettingsForm - Form for editing campaign settings
 */
export function SettingsForm({
  initialValues,
  onSave,
  onCancel,
  isOwner,
}: SettingsFormProps) {
  const [values, setValues] = useState<CampaignSettings>(initialValues);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasChanges, setHasChanges] = useState(false);

  const handleChange = (field: keyof CampaignSettings, value: string) => {
    setValues((prev) => ({ ...prev, [field]: value }));
    setHasChanges(true);
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!hasChanges || !isOwner) return;

    setLoading(true);
    setError(null);

    try {
      await onSave(values);
      setHasChanges(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save settings');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setValues(initialValues);
    setHasChanges(false);
    setError(null);
    onCancel?.();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Campaign Name */}
      <div>
        <label className="block text-sm font-medium text-foreground mb-2">
          Campaign Name
        </label>
        <input
          type="text"
          value={values.name}
          onChange={(e) => handleChange('name', e.target.value)}
          disabled={!isOwner}
          className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-primary/50 disabled:opacity-50 disabled:cursor-not-allowed"
          placeholder="Enter campaign name"
          required
        />
      </div>

      {/* Description */}
      <div>
        <label className="block text-sm font-medium text-foreground mb-2">
          Description
        </label>
        <textarea
          value={values.description || ''}
          onChange={(e) => handleChange('description', e.target.value)}
          disabled={!isOwner}
          rows={3}
          className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-primary/50 disabled:opacity-50 disabled:cursor-not-allowed resize-none"
          placeholder="Describe your campaign..."
        />
      </div>

      {/* Dice Mode */}
      <div>
        <label className="block text-sm font-medium text-foreground mb-2">
          Dice Mode
        </label>
        <div className="space-y-2">
          <label className="flex items-start gap-3 p-3 bg-background border border-border rounded-lg cursor-pointer hover:border-primary/50 transition-colors">
            <input
              type="radio"
              name="dice_mode"
              value="rng"
              checked={values.dice_mode === 'rng'}
              onChange={() => handleChange('dice_mode', 'rng')}
              disabled={!isOwner}
              className="mt-1 text-primary focus:ring-primary"
            />
            <div>
              <span className="font-medium text-foreground">Automatic Rolls</span>
              <p className="text-sm text-muted">
                Dice are rolled automatically by the system using random number generation.
              </p>
            </div>
          </label>
          <label className="flex items-start gap-3 p-3 bg-background border border-border rounded-lg cursor-pointer hover:border-primary/50 transition-colors">
            <input
              type="radio"
              name="dice_mode"
              value="player_entered"
              checked={values.dice_mode === 'player_entered'}
              onChange={() => handleChange('dice_mode', 'player_entered')}
              disabled={!isOwner}
              className="mt-1 text-primary focus:ring-primary"
            />
            <div>
              <span className="font-medium text-foreground">Physical Dice</span>
              <p className="text-sm text-muted">
                Players roll physical dice and enter the results manually.
              </p>
            </div>
          </label>
        </div>
      </div>

      {/* Map Mode */}
      <div>
        <label className="block text-sm font-medium text-foreground mb-2">
          Map Mode
        </label>
        <div className="space-y-2">
          <label className="flex items-start gap-3 p-3 bg-background border border-border rounded-lg cursor-pointer hover:border-primary/50 transition-colors">
            <input
              type="radio"
              name="map_mode"
              value="narrative_only"
              checked={values.map_mode === 'narrative_only'}
              onChange={() => handleChange('map_mode', 'narrative_only')}
              disabled={!isOwner}
              className="mt-1 text-primary focus:ring-primary"
            />
            <div>
              <span className="font-medium text-foreground">Narrative Only</span>
              <p className="text-sm text-muted">
                Theater of the mind style with no visual map.
              </p>
            </div>
          </label>
          <label className="flex items-start gap-3 p-3 bg-background border border-border rounded-lg cursor-pointer hover:border-primary/50 transition-colors">
            <input
              type="radio"
              name="map_mode"
              value="grid_2d"
              checked={values.map_mode === 'grid_2d'}
              onChange={() => handleChange('map_mode', 'grid_2d')}
              disabled={!isOwner}
              className="mt-1 text-primary focus:ring-primary"
            />
            <div>
              <span className="font-medium text-foreground">2D Grid Map</span>
              <p className="text-sm text-muted">
                Visual grid map for tactical combat with token positioning.
              </p>
            </div>
          </label>
        </div>
      </div>

      {/* Error message */}
      {error && (
        <div className="p-3 bg-danger/10 border border-danger/30 rounded-lg text-danger text-sm">
          {error}
        </div>
      )}

      {/* Actions */}
      {isOwner && (
        <div className="flex justify-end gap-3 pt-4 border-t border-border">
          {onCancel && (
            <Button
              type="button"
              variant="ghost"
              onClick={handleReset}
              disabled={loading}
            >
              Cancel
            </Button>
          )}
          <Button
            type="submit"
            variant="primary"
            loading={loading}
            disabled={!hasChanges || loading}
          >
            Save Changes
          </Button>
        </div>
      )}

      {!isOwner && (
        <p className="text-sm text-muted italic">
          Only the campaign owner can modify settings.
        </p>
      )}
    </form>
  );
}

export default SettingsForm;
