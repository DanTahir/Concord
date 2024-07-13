import SideNav from '@/app/ui/dashboard/sidenav';
import Servers from '../ui/channels/servers';
 
export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen flex-row md:overflow-hidden">
      <div className="flex-none">
        <Servers />
      </div>
      <div className="flex-grow p-6 md:overflow-y-auto md:p-12">{children}</div>
    </div>
  );
}