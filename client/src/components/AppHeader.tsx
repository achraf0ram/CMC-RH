import { Search, Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { LanguageSwitcher } from "./LanguageSwitcher";
import { useLanguage } from "@/contexts/LanguageContext";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { AdminNotifications } from '@/components/admin/AdminNotifications';
import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';

export const AppHeader = () => {
  const { t, language } = useLanguage();
  const isMobile = useIsMobile();
  const [notifCount, setNotifCount] = useState(0);
  const [notifOpen, setNotifOpen] = useState(false);
  const [lastNotifIds, setLastNotifIds] = useState<number[]>([]);
  const { user } = useAuth();
  const [userNotifCount, setUserNotifCount] = useState(0);
  const [userNotifs, setUserNotifs] = useState<any[]>([]);
  const [userNotifOpen, setUserNotifOpen] = useState(false);

  // جلب عدد الإشعارات غير المقروءة من AdminNotifications
  useEffect(() => {
    const fetchNotifCount = async () => {
      // جلب نفس الأحداث من AdminNotifications
      const usersRes = await import('@/components/Api/axios').then(m => m.default.get('/admin/users'));
      const reqRes = await import('@/components/Api/axios').then(m => m.default.get('/admin/requests'));
      const urgentRes = await import('@/components/Api/axios').then(m => m.default.get('/admin/urgent-messages'));
      // معالجة مرنة لاستجابة الـAPI
      const usersArray = Array.isArray(usersRes.data) ? usersRes.data : usersRes.data.data || usersRes.data.users || [];
      const requestsArray = Array.isArray(reqRes.data) ? reqRes.data : reqRes.data.data || reqRes.data.requests || [];
      const urgentsArray = Array.isArray(urgentRes.data) ? urgentRes.data : urgentRes.data.data || urgentRes.data.urgents || [];
      const users = usersArray.slice(0, 5).map((u: any) => u.id);
      const requests = requestsArray.slice(0, 5).map((r: any) => r.id);
      const urgents = urgentsArray.slice(0, 5).map((m: any) => m.id);
      const allIds = [...users, ...requests, ...urgents];
      // إذا لم تكن الإشعارات مقروءة، اعتبرها جديدة
      const unread = allIds.filter(id => !lastNotifIds.includes(id));
      setNotifCount(unread.length);
    };
    if (!notifOpen) fetchNotifCount();
  }, [notifOpen, lastNotifIds]);

  // عند فتح القائمة، اعتبر كل الإشعارات مقروءة
  const handleNotifOpenChange = (open: boolean) => {
    setNotifOpen(open);
    if (open) {
      import('@/components/Api/axios').then(m => Promise.all([
        m.default.get('/admin/users'),
        m.default.get('/admin/requests'),
        m.default.get('/admin/urgent-messages'),
      ])).then(([usersRes, reqRes, urgentRes]) => {
        const usersArray = Array.isArray(usersRes.data) ? usersRes.data : usersRes.data.data || usersRes.data.users || [];
        const requestsArray = Array.isArray(reqRes.data) ? reqRes.data : reqRes.data.data || reqRes.data.requests || [];
        const urgentsArray = Array.isArray(urgentRes.data) ? urgentRes.data : urgentRes.data.data || urgentRes.data.urgents || [];
        const users = usersArray.slice(0, 5).map((u: any) => u.id);
        const requests = requestsArray.slice(0, 5).map((r: any) => r.id);
        const urgents = urgentsArray.slice(0, 5).map((m: any) => m.id);
        setLastNotifIds([...users, ...requests, ...urgents]);
        setNotifCount(0);
      });
    }
  };

  // إشعارات المستخدم العادي
  useEffect(() => {
    if (user && !user.is_admin) {
      import('@/components/Api/axios').then(m => m.default.get('/notifications')).then(res => {
        const notifs = Array.isArray(res.data) ? res.data : [];
        setUserNotifs(notifs);
        setUserNotifCount(notifs.filter(n => !n.is_read).length);
      });
    }
  }, [user, userNotifOpen]);

  const handleUserNotifOpenChange = (open: boolean) => {
    setUserNotifOpen(open);
    if (open && user && !user.is_admin) {
      import('@/components/Api/axios').then(m => m.default.post('/notifications/read-all')).then(() => {
        setUserNotifCount(0);
        setUserNotifs(prev => prev.map(n => ({ ...n, is_read: true })));
      });
    }
  };

  return (
    <header className={cn(
      "bg-white/95 backdrop-blur-sm border-b border-slate-200/50 py-3 px-4 md:px-6 flex items-center justify-between shadow-sm",
      "relative z-20 h-16 md:h-20"
    )}>
      <div className="flex-grow max-w-lg mx-auto">
        <div className="relative w-full">
          <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400" size={16} />
          <Input
            placeholder={t('search')}
            className="cmc-input pl-4 pr-10 h-9 md:h-10 text-sm"
          /> 
        </div>
      </div>
      
      <div className="flex items-center gap-2 md:gap-3">
        <LanguageSwitcher />
        {/* جرس إشعارات المستخدم العادي */}
        {user && !user.is_admin && (
          <DropdownMenu onOpenChange={handleUserNotifOpenChange}>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="relative hover:bg-cmc-blue-light/50 text-cmc-blue h-9 w-9 md:h-10 md:w-10">
                <Bell size={16} />
                {userNotifCount > 0 && (
                  <Badge className="absolute -top-1 -right-1 h-4 w-4 p-0 flex items-center justify-center bg-gradient-to-r from-cmc-blue to-cmc-green text-xs">
                    {userNotifCount}
                  </Badge>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-72 md:w-80 cmc-card">
              <h4 className="font-semibold text-slate-800 mb-2">{t('notifications')}</h4>
              {userNotifs.length === 0 && <div className="text-gray-500">لا توجد إشعارات جديدة.</div>}
              {userNotifs.map((notif, idx) => (
                <DropdownMenuItem key={notif.id || idx} className={notif.is_read ? '' : 'bg-cmc-blue-light/20'}>
                  <div>
                    <div className="font-bold text-cmc-blue text-sm">{language === 'ar' ? notif.title_ar : notif.title_fr}</div>
                    <div className="text-xs text-gray-700">{language === 'ar' ? notif.body_ar : notif.body_fr}</div>
                    <div className="text-xs text-gray-400 mt-1">{new Date(notif.created_at).toLocaleString(language === 'ar' ? 'ar-EG' : 'fr-FR')}</div>
                  </div>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        )}
        {/* جرس إشعارات الأدمن */}
        {user && user.is_admin && (
          <DropdownMenu onOpenChange={handleNotifOpenChange}>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="relative hover:bg-cmc-blue-light/50 text-cmc-blue h-9 w-9 md:h-10 md:w-10">
                <Bell size={16} />
                {notifCount > 0 && (
                  <Badge className="absolute -top-1 -right-1 h-4 w-4 p-0 flex items-center justify-center bg-gradient-to-r from-cmc-blue to-cmc-green text-xs">
                    {notifCount}
                  </Badge>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-72 md:w-80 cmc-card">
              <AdminNotifications />
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>
    </header>
  );
};
