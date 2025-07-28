import React, { useEffect, useState } from 'react';
import axiosInstance from '@/components/Api/axios';
import { Users, FileText, AlertTriangle, Calendar, ClipboardCheck, CreditCard, DollarSign, Bell, User as UserIcon } from 'lucide-react';
import { RequestDetailsDialog } from './RequestDetailsDialog';
import { useLanguage } from '@/contexts/LanguageContext';
import { createEcho } from '../../lib/echo';
import { useNavigate } from 'react-router-dom';
import { getTypeInfo } from './typeInfo';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

interface NotificationItem {
  id: number;
  type: string; // دعم كل الأنواع
  title: string;
  message?: string;
  body?: string;
  date?: string;
  created_at?: string;
  full_name?: string;
  requestType?: string;
  request?: any;
  title_ar?: string; // Added for Arabic titles
  title_fr?: string; // Added for French titles
  body_ar?: string; // Added for Arabic bodies
  body_fr?: string; // Added for French bodies
  user?: {
    id: number;
    name: string;
    email: string;
    profile_photo_url: string;
  };
  data?: string; // Added for request data
}

export const AdminNotifications: React.FC = () => {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRequest, setSelectedRequest] = useState<any | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { t, language } = useLanguage();
  const [visibleCount, setVisibleCount] = useState(3);
  const [showFloating, setShowFloating] = useState(false);
  const [lastNotif, setLastNotif] = useState<NotificationItem | null>(null);
  const navigate = useNavigate();
  const [selectedNotificationId, setSelectedNotificationId] = useState<number | null>(null);

  useEffect(() => {
    // جلب الإشعارات مرة واحدة فقط عند mount
    const fetchAll = async () => {
      setLoading(true);
      try {
        const res = await axiosInstance.get('/admin/notifications/all');
        setNotifications(res.data.notifications || []);
      } catch (error) {
        setNotifications([]);
      }
      setLoading(false);
    };
    fetchAll();

    // استقبال التحديثات اللحظية عبر WebSocket (Echo)
    const token = localStorage.getItem('token');
    if (!token) return;
    const echo = createEcho(token);
    if (!echo) return;
    const channel = echo.channel('notifications');
    channel.listen('NewNotification', (data: any) => {
      // عند وصول إشعار جديد، أضفه مباشرة إلى state
      if (data && data.notification) {
        setNotifications(prev => {
          if (prev.length > 0 && prev[0].id === data.notification.id) return prev;
          return [data.notification, ...prev];
        });
        // إخطار AppHeader بتحديث العداد
      } else if (data && data.id) {
        // fallback إذا لم يكن هناك notification كامل
        setNotifications(prev => {
          if (prev.length > 0 && prev[0].id === data.id) return prev;
          return [data, ...prev];
        });
        // إخطار AppHeader بتحديث العداد
      }
    });
    return () => {
      echo.leave('notifications');
    };
  }, []); // [] حتى لا يعيد التحميل عند كل فتح

  useEffect(() => {
    if (notifications.length > 0) {
      // شغّل الرنة عند وصول إشعار جديد
      // playNotificationSound(); // This line was removed as per the edit hint.
    }
  }, [notifications.length]);

  // عند استقبال إشعار جديد (ليس urgent):
  useEffect(() => {
    if (notifications.length > 0 && notifications[0].type !== 'urgent') {
      setLastNotif(notifications[0]);
      setShowFloating(true);
      // رنة مميزة
      // playNotificationSound(); // This line was removed as per the edit hint.
      // أخفِ الأيقونة بعد 5 ثواني تلقائياً
      const timeout = setTimeout(() => setShowFloating(false), 5000);
      return () => clearTimeout(timeout);
    }
  }, [notifications.length]);

  // عند جلب الإشعارات الجديدة أو تحديثها، أعد ضبط visibleCount إلى 3
  useEffect(() => { setVisibleCount(3); }, [loading]);

  // استخراج اسم صاحب الطلب من body
  const extractNameFromBody = (body: string) => {
    if (!body) return '';
    // مثال: 'العميل: محمد أحمد - أرسل طلب ...' أو 'Client: Jean Dupont a soumis ...'
    const arMatch = body.match(/العميل: (.+?) -/);
    if (arMatch) return arMatch[1].trim();
    const frMatch = body.match(/Client: (.+?) a soumis/);
    if (frMatch) return frMatch[1].trim();
    // إذا لم يوجد نمط، خذ أول كلمتين (لأن بعض الأسماء مركبة)
    const words = body.trim().split(' ');
    return words.slice(0, 2).join(' ');
  };

  // دالة لاستخراج معرف الطلب من data
  const extractRequestId = (notif: NotificationItem) => {
    if (!notif.data) return null;
    try {
      const data = JSON.parse(notif.data);
      return data.work_certificate_id || data.vacation_request_id || data.mission_order_id || 
             data.salary_domiciliation_id || data.annual_income_id || null;
    } catch {
      return null;
    }
  };

  // دالة لتحديد نوع الطلب من data
  const extractRequestType = (notif: NotificationItem) => {
    if (!notif.data) return null;
    try {
      const data = JSON.parse(notif.data);
      if (data.work_certificate_id) return 'workCertificate';
      if (data.vacation_request_id) return 'vacationRequest';
      if (data.mission_order_id) return 'missionOrder';
      if (data.salary_domiciliation_id) return 'salaryDomiciliation';
      if (data.annual_income_id) return 'annualIncome';
      return null;
    } catch {
      return null;
    }
  };

  // دالة للتنقل إلى الجدول مع highlight
  const navigateToRequest = (notif: NotificationItem) => {
    const requestId = extractRequestId(notif);
    const requestType = extractRequestType(notif);
    if (requestId && requestType) {
      const detailsPath = `/admin/dashboard?tab=requests&highlight=${requestId}-${requestType}`;
      navigate(detailsPath, { replace: false });
    } else if (notif.type === 'newUser' && notif.user) {
      navigate('/admin/dashboard?tab=users', { replace: false });
    }
  };

  // دالة توليد نص الإشعار حسب النوع
  const getNotificationText = (notif: NotificationItem, language: string, userName: string) => {
    switch (notif.type) {
      case 'newUser':
        return language === 'ar'
          ? `تم إنشاء حساب جديد باسم ${userName}`
          : `${userName} a créé un nouveau compte`;
      case 'vacationRequest':
      case 'workCertificate':
      case 'missionOrder':
      case 'salaryDomiciliation':
      case 'annualIncome':
      case 'request':
        return language === 'ar'
          ? `${userName} أرسل طلب`
          : `${userName} a envoyé une demande`;
      case 'urgent':
        return language === 'ar'
          ? `إشعار عاجل من ${userName}`
          : `Notification urgente de la part de ${userName}`;
      default:
        return language === 'ar'
          ? `لديك إشعار جديد من ${userName}`
          : `Vous avez une nouvelle notification de ${userName}`;
    }
  };

  return (
    <>
      <div className="p-2 max-h-[300px] flex flex-col" style={{height: 300, minWidth: 320}}>
        <h4 className="font-semibold text-slate-800 mb-2">Notifications</h4>
        {/* أزل كلمة Chargement... نهائيًا */}
        {/* لا تعرض أي تحميل عند فتح النافذة */}
        {!loading && notifications.length === 0 && <div className="text-gray-500">لا توجد إشعارات جديدة.</div>}
        <div className="flex-1 overflow-y-auto">
          <ul className="space-y-1">
            {notifications.length > 0 && notifications.slice(0, visibleCount).map((notif) => {
              const typeInfo = getTypeInfo(notif.type, t);
              const extractedFromBody = extractNameFromBody(language === 'ar' ? notif.body : notif.body_fr);
              let userName =
                (notif.full_name && notif.full_name.trim()) ||
                (notif.user?.name && notif.user.name.trim()) ||
                (extractedFromBody && extractedFromBody.trim()) ||
                '';
              if (!userName) userName = language === 'ar' ? 'مستخدم غير معروف' : 'Utilisateur inconnu';
              if (process.env.NODE_ENV === 'development') {
                console.log('notif:', notif, 'userName:', userName, 'extractedFromBody:', extractedFromBody);
              }
              const notificationText = getNotificationText(notif, language, userName);
              return (
                <li
                  key={notif.id}
                  className={`flex items-start gap-3 p-3 rounded-lg shadow-sm hover:shadow-md cursor-pointer transition-all border bg-white ${selectedNotificationId === notif.id ? 'border-2 border-blue-500' : 'border-b last:border-b-0'} group`}
                  onClick={() => {
                    setSelectedNotificationId(notif.id);
                    navigateToRequest(notif);
                  }}
                  style={{marginBottom: 4}}
                >
                  {/* اسم المستخدم فقط بدون دائرة */}
                  <div className="flex flex-col gap-0.5 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-[13px] leading-tight">{userName}</span>
                      <span className="font-medium text-[13px] leading-tight">{notificationText.replace(userName, '').trim()}</span>
                      {['vacationRequest','workCertificate','missionOrder','salaryDomiciliation','annualIncome'].includes(notif.type) && (
                        <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[11px] font-medium ${typeInfo.color} ml-2`}>
                          {typeInfo.icon}
                          {typeInfo.label}
                        </span>
                      )}
                    </div>
                    {/* باقي التفاصيل كما هي */}
                    {notif.type === 'urgent' && (
                      <span className="text-xs text-red-700">{language === 'ar' ? notif.body_ar : notif.body_fr}</span>
                    )}
                    {notif.type !== 'urgent' && notif.type !== 'request' && (
                      <span className="text-xs text-gray-700">{language === 'ar' ? notif.body_ar : notif.body_fr}</span>
                    )}
                    <div className="text-[11px] text-gray-400 mt-1">{new Date((notif.created_at || notif.date) ?? '').toLocaleString('fr-FR')}</div>
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
        <button
          className={`w-full mt-2 py-1 rounded font-semibold text-sm transition ${notifications.length > visibleCount ? 'bg-blue-100 hover:bg-blue-200 text-blue-700' : 'bg-gray-100 text-gray-400 cursor-not-allowed'}`}
          onClick={() => setVisibleCount(notifications.length)}
          disabled={notifications.length <= visibleCount}
          style={{ marginTop: 8 }}
        >
          Afficher plus
        </button>
        <RequestDetailsDialog
          request={selectedRequest}
          isOpen={isDialogOpen}
          onClose={() => setIsDialogOpen(false)}
        />
      </div>
    </>
  );
}; 