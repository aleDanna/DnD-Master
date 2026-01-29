'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/components/ui/AuthProvider';
import { Button } from '@/components/ui/Button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import Link from 'next/link';

export default function JoinCampaignPage() {
  const params = useParams();
  const router = useRouter();
  const { user, session } = useAuth();
  const token = params.token as string;

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [campaignId, setCampaignId] = useState<string | null>(null);

  const handleJoin = async () => {
    if (!session?.access_token) {
      // Redirect to login with return URL
      router.push(`/auth/login?redirect=/campaigns/join/${token}`);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/campaigns/join/${token}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${session.access_token}`,
          },
        }
      );

      const data = await response.json();

      if (!data.success) {
        setError(data.error?.message || 'Failed to join campaign');
        return;
      }

      setSuccess(true);
      setCampaignId(data.data.campaign_id);

      // Redirect to campaign after a short delay
      setTimeout(() => {
        router.push(`/dashboard/campaigns/${data.data.campaign_id}`);
      }, 2000);
    } catch (err) {
      setError('An error occurred. Please try again.');
      console.error('Join error:', err);
    } finally {
      setLoading(false);
    }
  };

  // Auto-join if user is logged in
  useEffect(() => {
    if (user && session?.access_token && !success && !error && !loading) {
      // Small delay to ensure page is rendered
      const timer = setTimeout(() => {
        handleJoin();
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [user, session, success, error, loading]);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-center">
            {success ? 'Welcome to the Adventure!' : 'Join Campaign'}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {!user && (
            <>
              <p className="text-center text-muted">
                You need to be logged in to accept this invitation.
              </p>
              <div className="flex flex-col gap-3">
                <Button
                  variant="primary"
                  onClick={() => router.push(`/auth/login?redirect=/campaigns/join/${token}`)}
                  className="w-full"
                >
                  Log In
                </Button>
                <Button
                  variant="secondary"
                  onClick={() => router.push(`/auth/signup?redirect=/campaigns/join/${token}`)}
                  className="w-full"
                >
                  Sign Up
                </Button>
              </div>
            </>
          )}

          {user && loading && (
            <div className="flex flex-col items-center gap-4 py-8">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary" />
              <p className="text-muted">Joining campaign...</p>
            </div>
          )}

          {user && error && (
            <div className="space-y-4">
              <div className="p-4 bg-danger/10 border border-danger/30 rounded-lg">
                <p className="text-danger text-center">{error}</p>
              </div>
              <div className="flex flex-col gap-3">
                <Button variant="primary" onClick={handleJoin} className="w-full">
                  Try Again
                </Button>
                <Link href="/dashboard" className="w-full">
                  <Button variant="secondary" className="w-full">
                    Go to Dashboard
                  </Button>
                </Link>
              </div>
            </div>
          )}

          {success && (
            <div className="space-y-4">
              <div className="p-4 bg-success/10 border border-success/30 rounded-lg">
                <p className="text-success text-center font-medium">
                  You've successfully joined the campaign!
                </p>
              </div>
              <p className="text-center text-muted text-sm">
                Redirecting to campaign page...
              </p>
              {campaignId && (
                <Link href={`/dashboard/campaigns/${campaignId}`}>
                  <Button variant="primary" className="w-full">
                    View Campaign
                  </Button>
                </Link>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
