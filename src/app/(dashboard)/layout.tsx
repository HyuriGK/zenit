import { Sidebar } from '@/components/dashboard/Sidebar';
import { HeaderWrapper } from '@/components/dashboard/HeaderWrapper';
import { Footer } from '@/components/dashboard/Footer';
import { InstallPWA } from '@/components/pwa/InstallPWA';
import { Toaster } from 'sonner';
import { NotificationProvider } from '@/contexts/NotificationContext';
import { AccessLogger } from '@/components/admin/AccessLogger';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <NotificationProvider>
      <div className="h-screen text-white flex overflow-hidden relative bg-[#09090b]">
        <AccessLogger />
        {/* Sidebar - Desktop */}
        <Sidebar />

        {/* Main Content */}
        <div className="flex-1 flex flex-col transition-all duration-300 lg:ml-(--sidebar-width,16rem) overflow-hidden relative z-10">
          {/* Header */}
          <HeaderWrapper />

          {/* Page Content - Performance Optimized Scroll */}
          <main className="flex-1 min-h-0 overflow-auto scroll-container flex flex-col">
            <div className="flex-1 min-h-0">
              {children}
            </div>
            
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
