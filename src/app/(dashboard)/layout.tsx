import { Sidebar } from '@/components/dashboard/Sidebar';
import { HeaderWrapper } from '@/components/dashboard/HeaderWrapper';
import { InstallPWA } from '@/components/pwa/InstallPWA';
import { Toaster } from 'sonner';
import { NotificationProvider } from '@/contexts/NotificationContext';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <NotificationProvider>
      <div className="h-screen text-white flex overflow-hidden relative bg-gradient-to-br from-[#0a0a0a] via-[#050505] to-[#0a0a0a]">
        {/* Performance: Using CSS class instead of inline SVG filter */}
        <div className="noise-texture absolute inset-0" />
        {/* Very subtle grid - optimized with contain */}
        <div className="absolute inset-0 opacity-[0.02] pointer-events-none grid-pattern" />
        {/* Sidebar - Desktop */}
        <Sidebar />

        {/* Main Content */}
        <div className="flex-1 flex flex-col transition-all duration-300 lg:ml-(--sidebar-width,16rem) overflow-hidden relative z-10">
          {/* Header */}
          <HeaderWrapper />

          {/* Page Content - Performance Optimized Scroll */}
          <main className="flex-1 overflow-auto scroll-container">
            {children}
          </main>
        </div>

        {/* Toast Notifications - Bottom Right for better UX */}
        <Toaster
          position="bottom-right"
          toastOptions={{
            style: {
              background: '#18181b',
              color: '#fff',
              border: '1px solid #27272a',
            },
            className: 'sonner-toast',
          }}
          richColors
        />

        {/* PWA Install Prompt */}
        <InstallPWA />
      </div>
    </NotificationProvider>
  );
}