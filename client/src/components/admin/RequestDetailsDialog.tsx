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
import frLocale from 'date-fns/locale/fr';
import arLocale from 'date-fns/locale/ar';

interface Request {
  id: number;
  full_name: string;
  matricule: string;
  created_at: string;
  status: 'pending' | 'approved' | 'rejected';
  type: string;
  file_path: string | null;
  // Add any other fields from your various request types
  [key: string]: any;
}

interface RequestDetailsDialogProps {
  request: Request | null;
  isOpen: boolean;
  onClose: () => void;
}

export const RequestDetailsDialog: React.FC<RequestDetailsDialogProps> = ({ request, isOpen, onClose }) => {
  const { t, lang } = useLanguage();
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
        return { label: t('vacationRequest'), color: 'bg-blue-100 text-blue-800', icon: <Calendar className="w-4 h-4 mr-1 inline" /> };
      case 'workCertificate':
        return { label: t('workCertificate'), color: 'bg-green-100 text-green-800', icon: <FileText className="w-4 h-4 mr-1 inline" /> };
      case 'missionOrder':
        return { label: t('missionOrder'), color: 'bg-yellow-100 text-yellow-800', icon: <ClipboardCheck className="w-4 h-4 mr-1 inline" /> };
      case 'salaryDomiciliation':
        return { label: t('salaryDomiciliation'), color: 'bg-indigo-100 text-indigo-800', icon: <CreditCard className="w-4 h-4 mr-1 inline" /> };
      case 'annualIncome':
        return { label: t('annualIncome'), color: 'bg-rose-100 text-rose-800', icon: <DollarSign className="w-4 h-4 mr-1 inline" /> };
      default:
        return { label: t('notSpecified') || type, color: 'bg-gray-100 text-gray-800', icon: null };
    }
  };
  const getStatusInfo = (status: string) => {
    switch (status) {
      case 'approved':
        return { label: t('approved'), color: 'bg-green-100 text-green-800', icon: <BadgeCheck className="w-4 h-4 mr-1 inline" /> };
      case 'rejected':
        return { label: t('rejected'), color: 'bg-rose-100 text-rose-800', icon: <XCircle className="w-4 h-4 mr-1 inline" /> };
      case 'pending':
      default:
        return { label: t('pending'), color: 'bg-gray-100 text-gray-800', icon: <Clock className="w-4 h-4 mr-1 inline" /> };
    }
  };
  // ترتيب الحقول الأساسية
  const importantFields: { label: string; value: any; isBadge?: boolean; badgeInfo?: any }[] = [
    { label: t('name'), value: request.full_name },
    { label: t('matricule') || 'Matricule', value: request.matricule },
    { label: t('type'), value: request.type, isBadge: true, badgeInfo: getTypeInfo(request.type) },
    { label: t('status'), value: request.status, isBadge: true, badgeInfo: getStatusInfo(request.status) },
    { label: t('createdAt') || t('created_at') || 'Created At', value: request.created_at ? format(new Date(request.created_at), 'PPP p', { locale: lang === 'ar' ? arLocale : frLocale }) : '' },
    { label: t('startDate'), value: request.start_date ? format(new Date(request.start_date), 'PPP', { locale: lang === 'ar' ? arLocale : frLocale }) : '' },
    { label: t('endDate'), value: request.end_date ? format(new Date(request.end_date), 'PPP', { locale: lang === 'ar' ? arLocale : frLocale }) : '' },
    { label: t('phone'), value: request.phone },
    { label: t('address'), value: request.address },
    { label: t('leaveType') || 'Leave Type', value: request.leave_type },
    { label: t('duration'), value: request.duration },
    { label: t('family') || 'Family', value: request.family },
    { label: t('direction') || 'Direction', value: request.direction },
    { label: t('grade') || 'Grade', value: request.grade },
    { label: t('echelon') || 'Echelon', value: request.echelon },
    { label: t('fonction') || 'Fonction', value: request.fonction },
  ];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>
            {getTypeInfo(request.type).icon}
            {getTypeInfo(request.type).label} {t('details') || 'Details'}
          </DialogTitle>
          <DialogDescription>
            {lang === 'ar'
              ? `جميع تفاصيل الطلب الخاص بـ ${request.full_name}`
              : `Tous les détails de la demande de ${request.full_name}`}
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          {/* عرض الحقول المهمة فقط */}
          {importantFields.filter(f => f.value).map((field, idx) => (
            <div className="grid grid-cols-4 items-center gap-4" key={idx}>
              <span className="text-right col-span-1 font-semibold">{field.label}:</span>
              <span className="col-span-3 break-words">
                {field.isBadge ? (
                  <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-semibold ${field.badgeInfo.color}`}>
                    {field.badgeInfo.icon}
                    {field.badgeInfo.label}
                  </span>
                ) : (
                  field.value
                )}
              </span>
            </div>
          ))}
          {/* عرض المرفق إذا وجد */}
          {request.file_path && (
            <div ref={attachmentRef} className="grid grid-cols-4 items-center gap-4">
              <span className="text-right col-span-1 font-semibold">{t('attachment') || 'Attachment'}:</span>
              <div className="col-span-3 flex gap-2 items-center">
                <Link to={`/file-viewer?file=${encodeURIComponent(`http://localhost:8000/storage/${request.file_path}`)}`} className="text-blue-500 hover:underline">
                  View File
                </Link>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}; 