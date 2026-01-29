-- Campaign Invites table for multiplayer invitations
-- This allows users to invite others to join their campaigns

CREATE TABLE IF NOT EXISTS campaign_invites (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    campaign_id UUID NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
    email VARCHAR(255) NOT NULL,
    token VARCHAR(64) NOT NULL UNIQUE,
    role VARCHAR(20) NOT NULL DEFAULT 'player' CHECK (role IN ('player', 'dm')),
    invited_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    expires_at TIMESTAMPTZ NOT NULL,
    accepted_at TIMESTAMPTZ,

    -- Prevent duplicate pending invites for same email/campaign
    CONSTRAINT unique_pending_invite UNIQUE (campaign_id, email)
        WHERE accepted_at IS NULL
);

-- Indexes for common queries
CREATE INDEX idx_campaign_invites_campaign ON campaign_invites(campaign_id);
CREATE INDEX idx_campaign_invites_token ON campaign_invites(token);
CREATE INDEX idx_campaign_invites_email ON campaign_invites(email);

-- RLS policies
ALTER TABLE campaign_invites ENABLE ROW LEVEL SECURITY;

-- Campaign owners can manage invites
CREATE POLICY "Campaign owners can manage invites" ON campaign_invites
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM campaigns c
            WHERE c.id = campaign_invites.campaign_id
            AND c.owner_id = auth.uid()
        )
    );

-- Users can view invites sent to their email
CREATE POLICY "Users can view their invites" ON campaign_invites
    FOR SELECT USING (
        email = (SELECT email FROM auth.users WHERE id = auth.uid())
    );

-- Anyone with the token can accept
CREATE POLICY "Token holders can accept invites" ON campaign_invites
    FOR UPDATE USING (
        accepted_at IS NULL
        AND expires_at > NOW()
    )
    WITH CHECK (
        accepted_at IS NOT NULL
    );
