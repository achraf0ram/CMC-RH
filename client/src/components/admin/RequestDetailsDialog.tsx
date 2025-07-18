import React, { useRef, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { Link } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { FileText, Calendar, ClipboardCheck, CreditCard, DollarSign, BadgeCheck, XCircle, Clock } from 'lucide-react';
import ar from 'date-fns/locale/ar';
import fr from 'date-fns/locale/fr';
import { Locale } from 'date-fns';

interface Request {
  id: number;
  full_name: string;
  matricule: string;
  created_at: string;
  status: 'pending' | 'approved' | 'rejected' | 'waiting_admin_file' | 'urgent' | '';
  type: string;
  file_path: string | null;
  scrollToAttachment?: boolean;
  leave_type?: string;
  // Add any other fields from your various request types
  [key: string]: any;
}

interface RequestDetailsDialogProps {
  request: Request | null;
  isOpen: boolean;
  onClose: () => void;
}

export const RequestDetailsDialog: React.FC<RequestDetailsDialogProps> = ({ request, isOpen, onClose }) => {
  const { t, language } = useLanguage();
  const attachmentRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (request && (request as any).scrollToAttachment && attachmentRef.current) {
      attachmentRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [request]);

  if (!request) return null;

  // دوال مساعدة لعرض الحالة والنوع بشكل جميل
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
  const getStatusInfo = (status: string) => {
    switch (status) {
      case 'urgent':
        return { label: t('urgent'), color: 'bg-red-100 text-red-800', icon: <span className="mr-1">⚡</span> };
      case 'pending':
        return { label: 'Normal', color: 'bg-yellow-100 text-yellow-800', icon: null };
      default:
        return { label: '', color: '', icon: null };
    }
  };
  // ترتيب الحقول الأساسية
  const importantFields: { label: string; value: any; isBadge?: boolean; badgeInfo?: any }[] = [
    { label: t('name'), value: request.full_name },
    { label: t('matricule'), value: request.matricule },
    { label: t('type'), value: request.type, isBadge: true, badgeInfo: getTypeInfo(request.type) },
    { label: t('status'), value: request.status, isBadge: true, badgeInfo: getStatusInfo(request.status) },
    { label: t('createdAt'), value: request.created_at ? format(new Date(request.created_at), 'PPP p', { locale: language === 'ar' ? (ar as unknown as Locale) : (fr as unknown as Locale) }) : '' },
    { label: t('startDate'), value: request.start_date ? format(new Date(request.start_date), 'PPP', { locale: language === 'ar' ? (ar as unknown as Locale) : (fr as unknown as Locale) }) : '' },
    { label: t('endDate'), value: request.end_date ? format(new Date(request.end_date), 'PPP', { locale: language === 'ar' ? (ar as unknown as Locale) : (fr as unknown as Locale) }) : '' },
    { label: t('phone'), value: request.phone },
    { label: t('address'), value: request.address },
    { label: t('leaveType'), value: request.leave_type },
    { label: t('duration'), value: request.duration },
    { label: t('family'), value: request.family },
    { label: t('direction'), value: request.direction },
    { label: t('grade'), value: request.grade },
    { label: t('echelon'), value: request.echelon },
    { label: t('fonction'), value: request.fonction },
  ];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent
        className={`sm:max-w-[430px] rounded-xl shadow-2xl border-0 p-6 ${language === 'ar' ? 'text-right' : 'text-left'}`}
        style={{ direction: language === 'ar' ? 'rtl' : 'ltr' }}
      >
        <DialogHeader className={`flex flex-col ${language === 'ar' ? 'items-end' : 'items-start'}`}>
          <DialogTitle className="text-lg font-bold flex items-center gap-2">
            {getTypeInfo(request.type).icon}
            {getTypeInfo(request.type).label} {t('details')}
          </DialogTitle>
          <DialogDescription className="text-[14px] text-gray-500 mb-2">
            {language === 'ar'
              ? `جميع تفاصيل الطلب الخاص بـ ${request.full_name}`
              : `Tous les détails de la demande de ${request.full_name}`}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-2 py-2">
          {/* عرض الحقول المهمة فقط */}
          {importantFields.filter(f => f.value).map((field, idx) => (
            <div className={`flex justify-between items-center text-[14px] border-b pb-1`} key={idx}>
              <span className="font-semibold text-gray-700">{field.label}:</span>
              <div className={`break-words`}>
                {field.label === t('status') && getStatusInfo(request.status).label ? (
                  <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-semibold ${getStatusInfo(request.status).color}`}>
                    {getStatusInfo(request.status).icon}
                    {getStatusInfo(request.status).label}
                  </span>
                ) : field.isBadge ? (
                  <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-semibold ${field.badgeInfo.color}`}>
                    {field.badgeInfo.icon}
                    {field.badgeInfo.label}
                  </span>
                ) : (
                  field.value
                )}
              </div>
            </div>
          ))}
          {/* عرض المرفق إذا وجد */}
          {request.file_path && (
            <div className={`flex justify-between items-center text-[14px] pt-2`}>
              <span className="font-semibold text-gray-700">{t('attachment')}:</span>
              <div className="flex gap-2 items-center">
                <a href={`/file-viewer?file=${encodeURIComponent(`http://localhost:8000/storage/${request.file_path}`)}`} className="text-blue-600 hover:underline font-medium" target="_blank" rel="noopener noreferrer">
                  {language === 'ar' ? 'عرض PDF' : 'Afficher PDF'}
                </a>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}; 