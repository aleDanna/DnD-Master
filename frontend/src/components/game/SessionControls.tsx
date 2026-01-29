'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { ConfirmModal } from '@/components/ui/Modal';

export interface SessionControlsProps {
  sessionStatus: 'active' | 'paused' | 'ended';
  onSave: () => Promise<void>;
  onEnd: () => Promise<void>;
  disabled?: boolean;
}

/**
 * SessionControls - Save and End session buttons with confirmation modals
 */
export function SessionControls({
  sessionStatus,
  onSave,
  onEnd,
  disabled,
}: SessionControlsProps) {
  const [saving, setSaving] = useState(false);
  const [ending, setEnding] = useState(false);
  const [showEndModal, setShowEndModal] = useState(false);
  const [showSaveModal, setShowSaveModal] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      await onSave();
      setShowSaveModal(false);
    } finally {
      setSaving(false);
    }
  };

  const handleEnd = async () => {
    setEnding(true);
    try {
      await onEnd();
      setShowEndModal(false);
    } finally {
      setEnding(false);
    }
  };

  if (sessionStatus === 'ended') {
    return (
      <div className="text-sm text-muted italic">
        Session ended
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <Button
        variant="secondary"
        size="sm"
        onClick={() => setShowSaveModal(true)}
        disabled={disabled || sessionStatus !== 'active'}
        title="Save your progress and take a break"
      >
        💾 Save
      </Button>

      <Button
        variant="danger"
        size="sm"
        onClick={() => setShowEndModal(true)}
        disabled={disabled}
        title="End the session permanently"
      >
        End Session
      </Button>

      {/* Save Confirmation Modal */}
      <ConfirmModal
        isOpen={showSaveModal}
        onClose={() => setShowSaveModal(false)}
        onConfirm={handleSave}
        title="Save Session"
        message="Save your progress? You can resume this session later and receive a recap of what happened."
        confirmText="Save & Exit"
        variant="primary"
        loading={saving}
      />

      {/* End Confirmation Modal */}
      <ConfirmModal
        isOpen={showEndModal}
        onClose={() => setShowEndModal(false)}
        onConfirm={handleEnd}
        title="End Session"
        message="Are you sure you want to end this session? A summary will be generated, but you won't be able to continue from this point."
        confirmText="End Session"
        variant="danger"
        loading={ending}
      />
    </div>
  );
}

export default SessionControls;
