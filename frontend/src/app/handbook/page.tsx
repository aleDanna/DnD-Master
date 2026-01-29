// Handbook Main Page - T020
// Redirects to the default tab (rules)

import { redirect } from 'next/navigation';

export default function HandbookPage() {
  redirect('/handbook/rules');
}
