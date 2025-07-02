import { AppHeader } from "@/components/AppHeader";
import { AppSidebar } from "@/components/AppSidebar";
import { Outlet } from "react-router-dom";
import { useLanguage } from "@/contexts/LanguageContext";
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";
import UrgentChatButton from '@/components/UrgentChatButton';
import { useAuth } from '@/contexts/AuthContext';
import { useState } from 'react';

export const MainLayout = () => {
  const { language } = useLanguage();
  const isMobile = useIsMobile();
  const { user } = useAuth();
  const [isSidebarMobileOpen, setIsSidebarMobileOpen] = useState(false);
  
  return (
    <div className="min-h-screen flex relative cmc-page-background">
      <AppSidebar isMobileOpen={isSidebarMobileOpen} setIsMobileOpen={setIsSidebarMobileOpen} />
      
      <div className={cn(
        "flex-1 flex flex-col",
        !isMobile && (language === 'ar' ? 'mr-0 md:mr-0' : 'ml-0 md:ml-0'),
        "pt-16 md:pt-0" 
      )}>
        <AppHeader />
        
        <main className="flex-1 p-4 md:p-6">
          <Outlet />
        </main>
      </div>
      {!user?.is_admin && <UrgentChatButton hide={isMobile && isSidebarMobileOpen} />}
    </div>
  );
};
