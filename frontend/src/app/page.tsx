import Link from 'next/link';

export default function HomePage() {
  return (
    <div className="min-h-screen flex flex-col">
      {/* Hero Section */}
      <header className="flex-1 flex flex-col items-center justify-center px-4 text-center">
        <h1 className="text-5xl md:text-6xl font-bold text-foreground mb-6">
          D&D Master
        </h1>
        <p className="text-xl md:text-2xl text-muted max-w-2xl mb-8">
          An AI-powered Dungeon Master for your Dungeons & Dragons adventures.
          Solo play or multiplayer - your story awaits.
        </p>
        <div className="flex flex-col sm:flex-row gap-4">
          <Link
            href="/auth/signup"
            className="px-8 py-3 bg-primary hover:bg-primary/90 text-white font-medium rounded-md transition-colors text-lg"
          >
            Get Started
          </Link>
          <Link
            href="/auth/login"
            className="px-8 py-3 bg-surface hover:bg-border text-foreground font-medium rounded-md transition-colors text-lg border border-border"
          >
            Sign In
          </Link>
        </div>
      </header>

      {/* Features Section */}
      <section className="py-16 px-4 bg-surface">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-foreground text-center mb-12">
            Features
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="text-4xl mb-4">🎲</div>
              <h3 className="text-xl font-semibold text-foreground mb-2">
                AI Dungeon Master
              </h3>
              <p className="text-muted">
                An intelligent AI that narrates your adventures, controls NPCs, and manages game rules.
              </p>
            </div>
            <div className="text-center">
              <div className="text-4xl mb-4">👥</div>
              <h3 className="text-xl font-semibold text-foreground mb-2">
                Multiplayer Support
              </h3>
              <p className="text-muted">
                Play solo or invite friends to join your campaign for a shared adventure.
              </p>
            </div>
            <div className="text-center">
              <div className="text-4xl mb-4">📚</div>
              <h3 className="text-xl font-semibold text-foreground mb-2">
                Official D&D Rules
              </h3>
              <p className="text-muted">
                Built on the D&D Basic Rules with rule citations for every decision.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-6 px-4 border-t border-border text-center text-muted text-sm">
        <p>&copy; {new Date().getFullYear()} D&D Master. Not affiliated with Wizards of the Coast.</p>
      </footer>
    </div>
  );
}
