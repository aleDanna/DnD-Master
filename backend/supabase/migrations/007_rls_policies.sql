-- Migration: 007_rls_policies
-- Create Row Level Security policies for all tables

-- Helper function to check if user is campaign participant
CREATE OR REPLACE FUNCTION is_campaign_participant(campaign_uuid UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM campaigns WHERE id = campaign_uuid AND owner_id = auth.uid()
    UNION
    SELECT 1 FROM campaign_players
    WHERE campaign_id = campaign_uuid
      AND user_id = auth.uid()
      AND invite_status = 'accepted'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Helper function to check if user is campaign owner
CREATE OR REPLACE FUNCTION is_campaign_owner(campaign_uuid UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM campaigns WHERE id = campaign_uuid AND owner_id = auth.uid()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- CAMPAIGNS POLICIES
-- ============================================

-- Users can see campaigns they own or are invited to
CREATE POLICY "Campaigns visible to participants"
  ON campaigns FOR SELECT
  USING (is_campaign_participant(id));

-- Only owners can update campaigns
CREATE POLICY "Campaigns editable by owner"
  ON campaigns FOR UPDATE
  USING (owner_id = auth.uid())
  WITH CHECK (owner_id = auth.uid());

-- Only owners can delete campaigns
CREATE POLICY "Campaigns deletable by owner"
  ON campaigns FOR DELETE
  USING (owner_id = auth.uid());

-- Authenticated users can create campaigns
CREATE POLICY "Users can create campaigns"
  ON campaigns FOR INSERT
  WITH CHECK (owner_id = auth.uid());

-- ============================================
-- CAMPAIGN_PLAYERS POLICIES
-- ============================================

-- Visible to campaign owner and the invited user
CREATE POLICY "Campaign players visible to participants"
  ON campaign_players FOR SELECT
  USING (
    is_campaign_owner(campaign_id) OR user_id = auth.uid()
  );

-- Only campaign owner can invite (insert)
CREATE POLICY "Campaign owner can invite players"
  ON campaign_players FOR INSERT
  WITH CHECK (is_campaign_owner(campaign_id));

-- Invited users can accept/decline (update their own record)
CREATE POLICY "Players can respond to invites"
  ON campaign_players FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Campaign owner can remove players
CREATE POLICY "Campaign owner can remove players"
  ON campaign_players FOR DELETE
  USING (is_campaign_owner(campaign_id));

-- ============================================
-- CHARACTERS POLICIES
-- ============================================

-- Characters visible to campaign participants
CREATE POLICY "Characters visible to campaign participants"
  ON characters FOR SELECT
  USING (is_campaign_participant(campaign_id));

-- Users can create characters in campaigns they participate in
CREATE POLICY "Users can create characters in their campaigns"
  ON characters FOR INSERT
  WITH CHECK (
    is_campaign_participant(campaign_id) AND user_id = auth.uid()
  );

-- Users can only edit their own characters
CREATE POLICY "Users can edit own characters"
  ON characters FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Users can delete their own characters
CREATE POLICY "Users can delete own characters"
  ON characters FOR DELETE
  USING (user_id = auth.uid());

-- ============================================
-- SESSIONS POLICIES
-- ============================================

-- Sessions visible to campaign participants
CREATE POLICY "Sessions visible to campaign participants"
  ON sessions FOR SELECT
  USING (is_campaign_participant(campaign_id));

-- Campaign participants can create sessions
CREATE POLICY "Participants can create sessions"
  ON sessions FOR INSERT
  WITH CHECK (is_campaign_participant(campaign_id));

-- Campaign participants can update sessions (for state changes)
CREATE POLICY "Participants can update sessions"
  ON sessions FOR UPDATE
  USING (is_campaign_participant(campaign_id))
  WITH CHECK (is_campaign_participant(campaign_id));

-- Only campaign owner can delete sessions
CREATE POLICY "Owner can delete sessions"
  ON sessions FOR DELETE
  USING (is_campaign_owner(campaign_id));

-- ============================================
-- EVENTS POLICIES
-- ============================================

-- Helper to get campaign_id from session
CREATE OR REPLACE FUNCTION get_session_campaign(session_uuid UUID)
RETURNS UUID AS $$
  SELECT campaign_id FROM sessions WHERE id = session_uuid;
$$ LANGUAGE sql SECURITY DEFINER;

-- Events visible to session participants
CREATE POLICY "Events visible to session participants"
  ON events FOR SELECT
  USING (is_campaign_participant(get_session_campaign(session_id)));

-- Session participants can create events
CREATE POLICY "Participants can create events"
  ON events FOR INSERT
  WITH CHECK (is_campaign_participant(get_session_campaign(session_id)));

-- Events are immutable - no updates allowed
-- (Events are append-only for audit trail)

-- Events cannot be deleted by users
-- (Only cascade delete from session)
