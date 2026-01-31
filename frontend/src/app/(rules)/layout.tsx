/**
 * Rules Layout
 * T076: Create rules layout with sidebar
 */

import { ReactNode } from 'react';
import RulesLayout from '@/components/layout/RulesLayout';

export const metadata = {
  title: 'Rules Explorer - DnD Master',
  description: 'Browse D&D 5th Edition rules, classes, races, spells, and more',
};

interface LayoutProps {
  children: ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  return <RulesLayout>{children}</RulesLayout>;
}
