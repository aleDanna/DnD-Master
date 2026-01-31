/**
 * Item Detail Page
 * T090: Create item detail page
 */

'use client';

import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { fetchItem } from '@/lib/api/contentApi';
import { ContentSkeleton } from '@/components/layout/ContentPanel';
import Breadcrumb from '@/components/layout/Breadcrumb';
import ItemCard from '@/components/content/ItemCard';

interface ItemDetailPageProps {
  params: { slug: string };
}

export default function ItemDetailPage({ params }: ItemDetailPageProps) {
  const { slug } = params;

  const { data: item, isLoading, isError } = useQuery({
    queryKey: ['item', slug],
    queryFn: () => fetchItem(slug),
  });

  if (isLoading) {
    return (
      <div>
        <div className="h-8 w-48 bg-gray-200 rounded animate-pulse mb-6" />
        <ContentSkeleton />
      </div>
    );
  }

  if (isError || !item) {
    return (
      <div>
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Item Not Found</h1>
        <p className="text-gray-600 mb-4">
          The item you&apos;re looking for doesn&apos;t exist.
        </p>
        <Link href="/items" className="text-blue-600 hover:text-blue-800">
          ← Back to Items
        </Link>
      </div>
    );
  }

  return (
    <div>
      <Breadcrumb
        items={[
          { label: 'Items', href: '/items' },
          { label: item.name },
        ]}
      />

      <ItemCard item={item} showFullContent />
    </div>
  );
}
