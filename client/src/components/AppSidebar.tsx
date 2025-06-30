import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  FileText,
  ClipboardCheck,
  Calendar,
  Home,
  Settings,
  User,
  LogOut,
  ChevronRight,
  ChevronLeft,
  Menu,
  CreditCard,
  DollarSign,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/contexts/LanguageContext";
import { useIsMobile } from "@/hooks/use-mobile";
import { useAuth } from "@/contexts/AuthContext";

export const AppSidebar = () => {
  const [collapsed, setCollapsed] = useState(true);
  const { t, language } = useLanguage();
  const isMobile = useIsMobile();
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const { logout, user } = useAuth();
  const navigate = useNavigate();
  
console.log(user);
  const baseMenuItems = [
    { icon: Home, name: 'home', path: "/" },
    { icon: FileText, name: 'workCertificate', path: "/work-certificate" },
    { icon: CreditCard, name: 'salaryDomiciliation', path: "/salary-domiciliation" },
    { icon: DollarSign, name: 'annualIncome', path: "/annual-income" },
    { icon: ClipboardCheck, name: 'missionOrder', path: "/mission-order" },
    { icon: Calendar, name: 'vacationRequest', path: "/vacation-request" },
    { icon: Settings, name: 'settings', path: "/settings" },
  ];

  const handleSignOut = () => {
    logout();
    navigate("/login", { replace: true });
  };

  const chevronIcon = language === 'ar' ? 
  (collapsed ? 
    <ChevronLeft size={18} /> : 
    <ChevronRight size={18} />) :
  (collapsed ? 
    <ChevronRight size={18} /> : 
    <ChevronLeft size={18} />);

  // Mobile toggle button that appears at the top of the screen
  const MobileToggle = () => (
    <Button
      variant="ghost"
      size="icon"
      onClick={() => setIsMobileOpen(!isMobileOpen)}  // Toggle mobile sidebar visibility
      className={cn(
        "fixed top-4 z-40 hover:bg-[#E8F5E9] text-[#2E7D32]",
        language === 'ar' ? 'right-4' : 'left-4'
      )}
    >
      {/* Change icon to X when sidebar is open */}
      {isMobileOpen ? <ChevronLeft size={24} /> : <Menu size={24} />}
    </Button>
  );

  return (
    <>
      {isMobile && <MobileToggle />}
      <div
        className={cn(
          "fixed top-0 h-screen bg-white shadow-md flex flex-col transition-all duration-300 z-40",
          collapsed ? "w-20" : "w-64",
          isMobile
            ? isMobileOpen
              ? "translate-x-0"
              : language === "ar"
              ? "translate-x-full"
              : "-translate-x-full"
            : "",
          language === "ar" ? "right-0" : "left-0",
          "h-[100vh]"
        )}>
        {/* Header */}
        <div className='flex justify-between items-center p-4 border-b h-20'>
          {!collapsed && (
            <div className='flex items-center gap-2'>
              <img
                src='/lovable-uploads/61196920-7ed5-45d7-af8f-330e58178ad2.png'
                alt='CMC'
                className='h-10 w-auto'
              />
              <span className='text-[#0FA0CE] font-bold text-xl'>CMC</span>
            </div>
          )}
          <Button
            variant='ghost'
            size='icon'
            onClick={() => {
              if (isMobile) {
                setIsMobileOpen(false);
              } else {
                setCollapsed(!collapsed);
              }
            }}
            className='hover:bg-[#E8F5E9] text-[#2E7D32]'>
            {chevronIcon}
          </Button>
        </div>

        {/* Navigation */}
        <div className='flex-1 py-4 flex flex-col gap-2'>
          {baseMenuItems.map((item) => (
            <Link
              to={item.path}
              key={item.path}
              onClick={() => isMobile && setIsMobileOpen(false)} // Close mobile sidebar when clicking on a menu item
            >
              <Button
                variant='ghost'
                className={cn(
                  "flex justify-start items-center gap-3 w-full rounded-none px-4 h-12",
                  "hover:bg-[#E8F5E9] hover:text-[#2E7D32]"
                )}>
                <item.icon size={20} />
                {!collapsed && (
                  <span
                    className='block max-w-[170px] overflow-hidden whitespace-nowrap relative group'
                    style={{ position: 'relative' }}
                  >
                    <span
                      className="inline-block truncate group-hover:animate-marquee"
                      style={{ minWidth: '100%' }}
                    >
                      {t(item.name)}
                    </span>
                  </span>
                )}
              </Button>
            </Link>
          ))}
        </div>

        {/* Footer */}
        <div className='border-t py-4 flex flex-col gap-2'>
          <div
            className={cn(
              "flex items-center gap-3 px-4 py-2",
              collapsed && "justify-center"
            )}>
            <div className='w-8 h-8 rounded-full bg-[#E8F5E9] flex items-center justify-center'>
              <User
                size={16}
                className='text-[#2E7D32]'
              />
            </div>
            {!collapsed && (
              <div className='text-sm'>{user?.name || "user"}</div>
            )}
          </div>
          <Button
            variant='ghost'
            className={cn(
              "flex justify-start items-center gap-3 w-full rounded-none px-4 h-12",
              "hover:bg-[#E8F5E9] hover:text-[#2E7D32] text-muted-foreground",
              collapsed && "justify-center"
            )}
            onClick={handleSignOut}>
            <LogOut size={18} />
            {!collapsed && <span>{t("logout")}</span>}
          </Button>
        </div>
      </div>
      {/* Overlay for mobile */}
      {isMobile && isMobileOpen && (
        <div
          className='fixed inset-0 bg-black/20 z-30'
          onClick={() => setIsMobileOpen(false)}
        />
      )}
    </>
  );
};
