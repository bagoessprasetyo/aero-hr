'use client';

import { usePathname } from 'next/navigation';
import { SidebarProvider, useSidebar } from '@/components/layout/sidebar-provider';
import { Sidebar } from '@/components/layout/sidebar';
import { SidebarToggle } from '@/components/layout/sidebar-toggle';
import { HelpFloatingButton } from '@/components/help/help-floating-button';
import { cn } from '@/lib/utils';

interface LayoutWrapperProps {
  children: React.ReactNode;
}

function LayoutContent({ children }: LayoutWrapperProps) {
  const pathname = usePathname();
  const isAuthPage = pathname.startsWith('/login') || pathname.startsWith('/register');

  if (isAuthPage) {
    return (
      <div className="min-h-screen">
        {children}
      </div>
    );
  }

  return (
    <div className="h-screen flex overflow-hidden">
      {/* Sidebar */}
      <Sidebar />
      
      {/* Main Content Area */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        {/* Mobile Header with Sidebar Toggle */}
        <header className="lg:hidden flex-shrink-0 sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <div className="flex h-16 items-center justify-between px-4">
            <div className="flex items-center gap-3">
              <SidebarToggle />
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground font-bold text-sm">
                  HR
                </div>
                <div>
                  <h1 className="text-lg font-semibold text-foreground">Aero HR</h1>
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main 
          id="main-content" 
          className="flex-1 overflow-y-auto lg:p-8 p-4"
        >
          <div className="container mx-auto max-w-7xl">
            {children}
          </div>
        </main>
      </div>
      
      {/* Help Floating Button */}
      <HelpFloatingButton />
    </div>
  );
}

export function LayoutWrapper({ children }: LayoutWrapperProps) {
  return (
    <SidebarProvider>
      <LayoutContent>
        {children}
      </LayoutContent>
    </SidebarProvider>
  );
}