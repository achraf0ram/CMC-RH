
import { AppHeader } from "@/components/AppHeader";
import { AppSidebar } from "@/components/AppSidebar";
import { AIAssistantButton } from "@/components/AIAssistantButton";
import { Outlet } from "react-router-dom";
import { useLanguage } from "@/contexts/LanguageContext";
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";

export const MainLayout = () => {
  const { language } = useLanguage();
  const isMobile = useIsMobile();
  
  return (
    <div className="min-h-screen flex relative cmc-page-background">
      <AppSidebar />
      
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
      
      {/* زر المساعد الذكي العائم */}
      <AIAssistantButton />
    </div>
  );
};
