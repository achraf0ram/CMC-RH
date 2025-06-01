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

export const AppHeader = () => {
  const { t } = useLanguage();
  const isMobile = useIsMobile();
  
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
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="relative hover:bg-cmc-blue-light/50 text-cmc-blue h-9 w-9 md:h-10 md:w-10">
              <Bell size={16} />
              <Badge className="absolute -top-1 -right-1 h-4 w-4 p-0 flex items-center justify-center bg-gradient-to-r from-cmc-blue to-cmc-green text-xs">
                3
              </Badge>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-72 md:w-80 cmc-card">
            <div className="p-4 border-b border-slate-100">
              <h4 className="font-semibold text-slate-800">{t('notifications')}</h4>
            </div>
            <DropdownMenuItem className="p-4 cursor-pointer hover:bg-cmc-blue-light/30">
              <div className="flex flex-col gap-1">
                <span className="font-medium text-slate-800">تم الموافقة على طلب الإجازة</span>
                <span className="text-xs text-slate-500">منذ ساعتين</span>
              </div>
            </DropdownMenuItem>
            <DropdownMenuItem className="p-4 cursor-pointer hover:bg-cmc-blue-light/30">
              <div className="flex flex-col gap-1">
                <span className="font-medium text-slate-800">تم إصدار شهادة العمل</span>
                <span className="text-xs text-slate-500">منذ 3 ساعات</span>
              </div>
            </DropdownMenuItem>
            <DropdownMenuItem className="p-4 cursor-pointer hover:bg-cmc-blue-light/30">
              <div className="flex flex-col gap-1">
                <span className="font-medium text-slate-800">تذكير: تحديث البيانات الشخصية</span>
                <span className="text-xs text-slate-500">منذ يوم</span>
              </div>
            </DropdownMenuItem>
            <div className="p-2 text-center border-t border-slate-100">
              <Button variant="link" size="sm" className="text-cmc-blue hover:text-cmc-blue-dark">
                {t('viewAll')}
              </Button>
            </div>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
};
