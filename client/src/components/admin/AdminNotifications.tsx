import React, { useEffect, useState } from 'react';
import axiosInstance from '@/components/Api/axios';
import { Users, FileText, AlertTriangle, Calendar, ClipboardCheck, CreditCard, DollarSign } from 'lucide-react';
import { RequestDetailsDialog } from './RequestDetailsDialog';
import { useLanguage } from '@/contexts/LanguageContext';

interface NotificationItem {
  type: 'user' | 'request' | 'urgent';
  id: number;
  title: string;
  message: string;
  date: string;
  full_name?: string;
  requestType?: string;
  request?: any;
}

export const AdminNotifications = () => {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRequest, setSelectedRequest] = useState<any | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { t } = useLanguage();

  // دالة لعرض نوع الطلب بشكل جميل
  const getTypeInfo = (type: string) => {
    switch (type) {
      case 'vacationRequest':
        return { label: t('vacationRequest'), color: 'bg-blue-100 text-blue-700', icon: <Calendar className="w-4 h-4 mr-1 inline" /> };
      case 'workCertificate':
        return { label: t('workCertificate'), color: 'bg-green-100 text-green-700', icon: <FileText className="w-4 h-4 mr-1 inline" /> };
      case 'missionOrder':
        return { label: t('missionOrder'), color: 'bg-purple-100 text-purple-700', icon: <ClipboardCheck className="w-4 h-4 mr-1 inline" /> };
      case 'salaryDomiciliation':
        return { label: t('salaryDomiciliation'), color: 'bg-cyan-100 text-cyan-700', icon: <CreditCard className="w-4 h-4 mr-1 inline" /> };
      case 'annualIncome':
        return { label: t('annualIncome'), color: 'bg-orange-100 text-orange-700', icon: <DollarSign className="w-4 h-4 mr-1 inline" /> };
      default:
        return { label: t('notSpecified') || type, color: 'bg-gray-100 text-gray-800', icon: null };
    }
  };

  useEffect(() => {
    const fetchAll = async () => {
      setLoading(true);
      try {
        const usersRes = await axiosInstance.get('/admin/users');
        const usersArray = Array.isArray(usersRes.data) ? usersRes.data : usersRes.data.data || usersRes.data.users || [];
        const users = usersArray.slice(0, 5).map((u: any) => ({
          type: 'user',
          id: u.id,
          title: 'Nouveau utilisateur',
          message: u.name + ' vient de s\'inscrire',
          date: u.created_at,
        }));
        const reqRes = await axiosInstance.get('/admin/requests');
        const requestsArray = Array.isArray(reqRes.data) ? reqRes.data : reqRes.data.data || reqRes.data.requests || [];
        const requests = requestsArray.slice(0, 5).map((r: any) => ({
          type: 'request',
          id: r.id,
          title: 'Nouvelle demande',
          message: r.full_name + ' a soumis une demande: ' + r.type,
          date: r.created_at,
          full_name: r.full_name,
          requestType: r.type,
          request: r,
        }));
        const urgentRes = await axiosInstance.get('/admin/urgent-messages');
        const urgentsArray = Array.isArray(urgentRes.data) ? urgentRes.data : urgentRes.data.data || urgentRes.data.urgents || [];
        const urgents = urgentsArray.slice(0, 5).map((m: any) => ({
          type: 'urgent',
          id: m.id,
          title: 'Message urgent',
          message: m.user?.name + ': ' + m.message,
          date: m.created_at,
        }));
        const all = [...users, ...requests, ...urgents].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        setNotifications(all.slice(0, 7));
      } catch (error) {
        setNotifications([]);
        // يمكنك أيضًا حفظ رسالة الخطأ في state لعرضها
      }
      setLoading(false);
    };
    fetchAll();
  }, []);

  return (
    <div className="p-2">
      <h4 className="font-semibold text-slate-800 mb-2">Notifications</h4>
      {loading && <div>Chargement...</div>}
      {!loading && notifications.length === 0 && <div className="text-gray-500">Aucune notification récente.</div>}
      <ul className="space-y-1">
        {notifications.map((notif) => (
          <li
            key={notif.type + notif.id}
            className="flex items-start gap-2 p-1 rounded hover:bg-slate-50 cursor-pointer transition-all"
            onClick={() => {
              if (notif.type === 'request' && notif.request) {
                setSelectedRequest(notif.request);
                setIsDialogOpen(true);
              }
            }}
          >
            {notif.type === 'user' && <Users className="w-4 h-4 text-blue-500 mt-0.5" />}
            {notif.type === 'request' && getTypeInfo(notif.requestType).icon}
            {notif.type === 'urgent' && <AlertTriangle className="w-4 h-4 text-red-600 mt-0.5" />}
            <div className="flex flex-col gap-0.5">
              <div className="font-medium text-[13px] leading-tight">{notif.title}</div>
              {notif.type === 'request' ? (
                <div className="flex items-center gap-1 text-xs text-gray-700 mb-0.5">
                  <span className="font-semibold text-[12px]">{notif.full_name}</span>
                  <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[11px] font-medium ${getTypeInfo(notif.requestType).color}`}
                        style={{marginLeft: 2}}>
                    {getTypeInfo(notif.requestType).icon}
                    {getTypeInfo(notif.requestType).label}
                  </span>
                </div>
              ) : (
                <div className="text-xs text-gray-700 mb-0.5">{notif.message}</div>
              )}
              <div className="text-[11px] text-gray-400">{new Date(notif.date).toLocaleString('fr-FR')}</div>
            </div>
          </li>
        ))}
      </ul>
      <RequestDetailsDialog
        request={selectedRequest}
        isOpen={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
      />
    </div>
  );
}; 