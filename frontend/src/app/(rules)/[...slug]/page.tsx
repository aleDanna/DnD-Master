/**
 * 404 Not Found Page for Rules Explorer
 * T099: Create 404 not-found page
 */

import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[50vh] text-center px-4">
      <div className="text-6xl mb-4">📜</div>
      <h1 className="text-2xl font-bold text-gray-900 mb-2">Page Not Found</h1>
      <p className="text-gray-600 mb-6 max-w-md">
        The page you&apos;re looking for doesn&apos;t exist. It may have been moved, deleted, or perhaps the scroll was never written.
      </p>
      <div className="flex flex-wrap gap-4 justify-center">
        <Link
          href="/rules"
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          Browse Rules
        </Link>
        <Link
          href="/classes"
          className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
        >
          View Classes
        </Link>
        <Link
          href="/spells"
          className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
        >
          View Spells
        </Link>
      </div>
    </div>
  );
}
