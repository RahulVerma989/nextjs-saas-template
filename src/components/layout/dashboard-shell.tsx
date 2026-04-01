'use client';

import { useSidebar } from '@/context/sidebar-context';

export function DashboardShell({ children }: { children: React.ReactNode }) {
  const { collapsed } = useSidebar();

  return (
    <div className="transition-all duration-300 ease-in-out">
      <div className={`lg:transition-all lg:duration-300 lg:ease-in-out ${collapsed ? 'lg:pl-14' : 'lg:pl-60'}`}>
        {children}
      </div>
    </div>
  );
}
