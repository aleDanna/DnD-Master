/**
 * Rules Layout Component
 * T060: Create RulesLayout component (sidebar + content area)
 */

'use client';

import { ReactNode, useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import Sidebar from './Sidebar';
import MobileDrawer from './MobileDrawer';
import HamburgerButton from './HamburgerButton';
import MobileSearchButton from './MobileSearchButton';

interface RulesLayoutProps {
  children: ReactNode;
}

// Create a client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,
      retry: 2,
    },
  },
});

export default function RulesLayout({ children }: RulesLayoutProps) {
  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState(false);

  const openDrawer = () => setIsMobileDrawerOpen(true);
  const closeDrawer = () => setIsMobileDrawerOpen(false);

  return (
    <QueryClientProvider client={queryClient}>
      <div className="flex h-screen bg-gray-50">
        {/* Desktop Sidebar */}
        <aside className="hidden md:flex md:w-72 lg:w-80 md:flex-col md:fixed md:inset-y-0">
          <div className="flex flex-col flex-grow border-r border-gray-200 bg-white overflow-y-auto">
            <div className="flex items-center flex-shrink-0 px-4 h-16 border-b border-gray-200">
              <h1 className="text-lg font-semibold text-gray-900">Rules Explorer</h1>
            </div>
            <Sidebar />
          </div>
        </aside>

        {/* Mobile Header */}
        <div className="md:hidden fixed top-0 left-0 right-0 z-40 flex items-center justify-between h-14 bg-white border-b border-gray-200 px-4">
          <div className="flex items-center">
            <HamburgerButton onClick={openDrawer} />
            <h1 className="ml-3 text-lg font-semibold text-gray-900">Rules Explorer</h1>
          </div>
          <MobileSearchButton />
        </div>

        {/* Mobile Drawer */}
        <MobileDrawer isOpen={isMobileDrawerOpen} onClose={closeDrawer}>
          <Sidebar onNavigate={closeDrawer} />
        </MobileDrawer>

        {/* Main Content */}
        <main className="flex-1 md:ml-72 lg:ml-80">
          <div className="pt-14 md:pt-0 min-h-screen">
            <div className="max-w-4xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
              {children}
            </div>
          </div>
        </main>
      </div>
    </QueryClientProvider>
  );
}
