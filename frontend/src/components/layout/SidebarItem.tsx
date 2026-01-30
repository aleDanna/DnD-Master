/**
 * Sidebar Item Component
 * T062: Create SidebarItem component (expandable tree node)
 */

'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { NavigationNode } from '@/types/api.types';
import { ChevronDownIcon, ChevronRightIcon } from './Icons';

interface SidebarItemProps {
  node: NavigationNode;
  depth: number;
  isExpanded: boolean;
  onToggle: () => void;
  sidebar: {
    isExpanded: (id: string) => boolean;
    toggle: (id: string) => void;
  };
  onNavigate?: () => void;
}

export default function SidebarItem({
  node,
  depth,
  isExpanded,
  onToggle,
  sidebar,
  onNavigate,
}: SidebarItemProps) {
  const pathname = usePathname();
  const isActive = pathname === node.path;
  const hasChildren = node.children && node.children.length > 0;
  const paddingLeft = depth * 12 + 8;

  const handleClick = () => {
    if (hasChildren) {
      onToggle();
    }
    if (!hasChildren && onNavigate) {
      onNavigate();
    }
  };

  const handleLinkClick = () => {
    if (onNavigate) {
      onNavigate();
    }
  };

  return (
    <div>
      <div
        className={`
          flex items-center py-2 px-2 text-sm rounded-md cursor-pointer
          transition-colors duration-150
          ${isActive
            ? 'bg-blue-50 text-blue-700 font-medium'
            : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
          }
          min-h-[44px] touch-manipulation
        `}
        style={{ paddingLeft: `${paddingLeft}px` }}
        onClick={hasChildren ? handleClick : undefined}
      >
        {/* Expand/Collapse Icon */}
        {hasChildren && (
          <button
            className="mr-1 p-1 rounded hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
            onClick={(e) => {
              e.stopPropagation();
              onToggle();
            }}
            aria-label={isExpanded ? 'Collapse' : 'Expand'}
          >
            {isExpanded ? (
              <ChevronDownIcon className="w-4 h-4" />
            ) : (
              <ChevronRightIcon className="w-4 h-4" />
            )}
          </button>
        )}

        {/* Spacer for items without children */}
        {!hasChildren && <span className="w-6" />}

        {/* Label/Link */}
        {node.type === 'item' || !hasChildren ? (
          <Link
            href={node.path}
            className="flex-1 truncate"
            onClick={handleLinkClick}
          >
            {node.label}
          </Link>
        ) : (
          <span className="flex-1 truncate">{node.label}</span>
        )}

        {/* Item count badge */}
        {node.itemCount !== undefined && (
          <span className="ml-2 px-2 py-0.5 text-xs rounded-full bg-gray-200 text-gray-600">
            {node.itemCount}
          </span>
        )}
      </div>

      {/* Children */}
      {hasChildren && isExpanded && (
        <div className="mt-1">
          {node.children!.map(child => (
            <SidebarItem
              key={child.id}
              node={child}
              depth={depth + 1}
              isExpanded={sidebar.isExpanded(child.id)}
              onToggle={() => sidebar.toggle(child.id)}
              sidebar={sidebar}
              onNavigate={onNavigate}
            />
          ))}
        </div>
      )}
    </div>
  );
}
