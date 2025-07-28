import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { format } from 'date-fns';
import { axiosInstance as api } from '@/components/Api/axios';
import { useToast } from '@/hooks/use-toast';
import { RequestDetailsDialog } from './RequestDetailsDialog';
import { FileDown } from 'lucide-react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { FileText, Calendar, ClipboardCheck, CreditCard, DollarSign } from 'lucide-react';
import { fr } from 'date-fns/locale';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

// This declaration tells TypeScript that the jsPDF object and its autoTable method will exist on the window object.
declare global {
  interface Window {
    jspdf: any;
    XLSX: any;
  }
}

// Change interface name to AdminRequest to avoid type conflicts
interface AdminRequest {
  id: number;
  full_name: string;
  matricule: string;
  created_at: string;
  status: 'pending' | 'approved' | 'rejected' | 'waiting_admin_file' | 'urgent' | '';
  type: string;
  file_path: string | null;
  scrollToAttachment?: boolean;
  leave_type?: string;
  user_id?: number;
  user?: {
    id: number;
    name: string;
    email: string;
    profile_photo_url: string;
  };
}

interface AdminRequestsTableProps {
  requests: AdminRequest[];
  onRequestUpdate: () => void;
  setRequests?: React.Dispatch<React.SetStateAction<AdminRequest[]>>;
  highlightedRequestId?: string | null;
  clearHighlight?: () => void;
}

export const AdminRequestsTable: React.FC<AdminRequestsTableProps> = ({ requests, onRequestUpdate, setRequests, highlightedRequestId: propHighlightedRequestId, clearHighlight }) => {
  const { toast } = useToast();
  const { t, language } = useLanguage();
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedRequest, setSelectedRequest] = useState<AdminRequest | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [requestToDelete, setRequestToDelete] = useState<AdminRequest | null>(null);
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [requestToReject, setRequestToReject] = useState<AdminRequest | null>(null);
  const location = useLocation();
  const navigate = useNavigate();
  // قراءة highlight من كود الاستعلام
  const urlParams = new URLSearchParams(location.search);
  const highlightFromUrl = urlParams.get('highlight');
  const highlightedRequestId = propHighlightedRequestId || highlightFromUrl;
  // إزالة كل منطق highlightClickCount، واجعل handleHighlightInteraction تزيل highlight من الـ URL مباشرة عند أي تفاعل
  // احذف تعريف highlightClickCount نهائيًا
  // const [highlightClickCount, setHighlightClickCount] = useState(0);

  // refs للصفوف
  const rowRefs = useRef<{ [key: string]: HTMLTableRowElement | null }>({});
  const hasScrolledToHighlight = useRef<string | null>(null);

  // أضف حالة جديدة لإظهار Dialog رفع PDF
  const [uploadDialog, setUploadDialog] = useState<{ open: boolean; req: AdminRequest | null }>({ open: false, req: null });

  // أضف حالة جديدة 'deleted' في rowStates
  // احذف أي تعريف مكرر لـ rowStates و setRowStates
  // أضف حالة جديدة pdf_sent
  const [rowStates, setRowStates] = useState<{ [key: string]: 'normal' | 'approved' | 'rejected' | 'waiting_file' | 'file_added' | 'deleted' | 'pdf_sent' | 'approved_pending_file' }>({});

  // أضف حالة loading محلية لكل صف
  const [rowLoading, setRowLoading] = useState<{ [key: string]: boolean }>({});

  // أضف حالة لتخزين الملف المؤقت قبل الإرسال
  const [pendingFile, setPendingFile] = useState<File | null>(null);

  const requestTypes = useMemo(() => {
    const types = Array.from(new Set(requests.map(r => r.type)));
    return types;
  }, [requests]);

  const filteredRequests = useMemo(() => {
    return requests
      .filter(req => {
        if (typeFilter === 'all') return true;
        return req.type === typeFilter;
      })
          .filter(req => {
      if (statusFilter === 'all') return true;
      return req.status === statusFilter;
    })
      .filter(req => {
        return req.full_name.toLowerCase().includes(searchTerm.toLowerCase());
      });
  }, [requests, searchTerm, typeFilter, statusFilter]);

  // Scroll تلقائي للصف المميز مع إعادة المحاولة إذا لم يكن ظاهرًا
  useEffect(() => {
    let retryTimeout: NodeJS.Timeout | null = null;
    function tryScrollToHighlight(attempt = 0) {
      if (
        highlightedRequestId &&
        rowRefs.current[highlightedRequestId] &&
        hasScrolledToHighlight.current !== highlightedRequestId
      ) {
        rowRefs.current[highlightedRequestId]?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        hasScrolledToHighlight.current = highlightedRequestId;
        // احذف سطر document.activeElement.blur(); نهائيًا
      } else if (highlightedRequestId && attempt < 10) {
        // أعد المحاولة بعد 150ms إذا لم يكن الصف ظاهرًا بعد (مثلاً بسبب الفلترة أو البطء)
        retryTimeout = setTimeout(() => tryScrollToHighlight(attempt + 1), 150);
      }
    }
    tryScrollToHighlight();
    return () => {
      if (retryTimeout) clearTimeout(retryTimeout);
    };
  }, [highlightedRequestId, filteredRequests, location.search]);

  // لا تزل highlight من الـ URL تلقائيًا أبداً هنا
  // فقط عند تفاعل المستخدم (بحث/فلتر/ضغط صف)

  // احذف useEffect الذي ينفذ setHighlightClickCount(0)
  // useEffect(() => { setHighlightClickCount(0) }, [highlightedRequestId]);

  // إعادة تعيين hasScrolledToHighlight عند كل تغيير في location.search
  useEffect(() => {
    hasScrolledToHighlight.current = null;
  }, [location.search]);

  // أضف دالة مساعدة لتحديث حالة الطلب محلياً في الـ state
  const updateRequestStatusLocally = (id: number, type: string, newStatus: AdminRequest['status'], newFilePath?: string) => {
    setRequests(prev => prev.map(req => {
      if (req.id === id && req.type === type) {
        return {
          ...req,
          status: newStatus,
          ...(newFilePath ? { file_path: newFilePath } : {}),
        };
      }
      return req;
    }));
  };

  // عدل دالة handleUpdateStatus بحيث عند الموافقة لا ترسل للباكند، فقط غيّر الحالة محليًا
  const handleUpdateStatus = async (type: string, id: number, status: 'approved' | 'rejected') => {
    if (!type) {
      toast({
        title: language === 'ar' ? 'خطأ في نوع الطلب' : 'Type Error',
        description: language === 'ar' ? 'نوع الطلب غير معروف، لا يمكن تحديث الحالة.' : 'Request type is missing, cannot update status.',
        variant: 'destructive',
      });
      return;
    }
    const rowKey = `${id}-${type}`;
    // UI update first (temporary)
    if (status === 'rejected') {
      setRowStates(prev => ({ ...prev, [rowKey]: 'rejected' }));
    } else if (status === 'approved') {
      setRowStates(prev => ({ ...prev, [rowKey]: 'waiting_file' }));
    }
    // API call
    const typeSlug = typeToApi(type);
    setRowLoading(prev => ({ ...prev, [rowKey]: true }));
    try {
      await api.post(`/admin/requests/${typeSlug}/${id}/status`, { status });
      updateRequestStatusLocally(id, type, status);
      toast({
        title: language === 'ar' ? 'تم تحديث الحالة' : 'Status Updated',
        description: language === 'ar' ? 'تم تحديث حالة الطلب بنجاح' : 'Request status updated successfully',
        variant: 'default',
        duration: 3000,
      });
      // Immediately refresh data from backend
      onRequestUpdate();
    } catch (error) {
      console.error('Failed to update status:', error);
      toast({
        title: language === 'ar' ? 'فشل تحديث الحالة' : 'Failed to update status',
        description: error instanceof Error ? error.message : '',
        variant: 'destructive',
        duration: 3000,
      });
    } finally {
      setRowLoading(prev => ({ ...prev, [rowKey]: false }));
    }
  };

  const handleExportPDF = () => {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    (doc as any).autoTable({
      head: [['Employee', 'Matricule', 'Request Type', 'Date', 'Status']],
      body: filteredRequests.map(req => [
        req.full_name,
        req.matricule,
        req.type,
        format(new Date(req.created_at), 'PPP'),
        req.status
      ]),
    });
    doc.save('requests.pdf');
  };

  const handleExportExcel = () => {
    const worksheet = window.XLSX.utils.json_to_sheet(filteredRequests.map(req => ({
      Employee: req.full_name,
      Matricule: req.matricule,
      'Request Type': req.type,
      Date: format(new Date(req.created_at), 'PPP'),
      Status: req.status,
    })));
    const workbook = window.XLSX.utils.book_new();
    window.XLSX.utils.book_append_sheet(workbook, worksheet, 'Requests');
    window.XLSX.writeFile(workbook, 'requests.xlsx');
  };

  const getTypeInfo = (type: string, t: (key: string) => string) => {
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

  const getStatusBadgeInfo = (status: string) => {
    switch (status) {
      case 'waiting_admin_file':
        return {
          color: 'bg-orange-100 text-orange-700',
          text: language === 'ar'
            ? 'قبول نسبي (رأى الأدمين طلبك .. انتظر ليرسل لك ملف)'
            : 'Acceptation partielle (l’admin a vu votre demande, attendez le fichier)',
        };
      case 'approved':
        return {
          color: 'bg-green-100 text-green-700',
          text: language === 'ar' ? 'قبول تام' : 'Accepté définitivement',
        };
      case 'rejected':
        return {
          color: 'bg-red-100 text-red-700',
          text: language === 'ar' ? 'مرفوض' : 'Rejeté',
        };
      case 'urgent':
        return {
          color: 'bg-red-100 text-red-800',
          text: language === 'ar' ? 'عاجل' : 'Urgent',
        };
      case 'pending':
      case '':
      default:
        return {
          color: 'bg-gray-100 text-gray-800',
          text: language === 'ar' ? 'قيد الانتظار' : 'En attente',
        };
    }
  };

  // أضف حالة جديدة 'deleted' في rowStates
  // احذف أي تعريف مكرر لـ rowStates و setRowStates

  // عند تأكيد الحذف (Reject)
  const handleDeleteRequest = async (req: AdminRequest) => {
    setRequestToDelete(req);
    setShowDeleteDialog(true);
  };

  // تحويل نوع الطلب لصيغة الباك اند
  const typeToApi = (type: string) => {
    switch (type) {
      case 'workCertificate': return 'work_certificates';
      case 'vacationRequest': return 'vacation_requests';
      case 'missionOrder': return 'mission_orders';
      case 'salaryDomiciliation': return 'salary_domiciliations';
      case 'annualIncome': return 'annual_incomes';
      default: return type;
    }
  };

  const confirmDeleteRequest = async () => {
    if (!requestToDelete) return;
    if (!requestToDelete.type) {
      toast({
        title: language === 'ar' ? 'خطأ في نوع الطلب' : 'Type Error',
        description: language === 'ar' ? 'نوع الطلب غير معروف، لا يمكن حذف الطلب.' : 'Request type is missing, cannot delete request.',
        variant: 'destructive',
      });
      return;
    }
    const rowKey = `${requestToDelete.id}-${requestToDelete.type}`;
    setRowLoading(prev => ({ ...prev, [rowKey]: true })); // أظهر spinner
    try {
      const typeSlug = typeToApi(requestToDelete.type);
      await api.post(`/admin/requests/${typeSlug}/${requestToDelete.id}/status`, { status: 'rejected' });
      toast({
        title: language === 'ar' ? 'تم رفض الطلب' : 'Demande rejetée',
        description: language === 'ar' ? 'تم وضع الطلب في حالة مرفوضة.' : 'La demande a été rejetée.',
        variant: 'destructive',
      });
      setRowStates(prev => ({ ...prev, [rowKey]: 'deleted' }));
    } catch (error) {
      toast({
        title: language === 'ar' ? 'خطأ' : 'Erreur',
        description: language === 'ar' ? 'فشل في رفض الطلب.' : 'Échec du rejet de la demande.',
        variant: 'destructive',
      });
    } finally {
      setRowLoading(prev => ({ ...prev, [rowKey]: false })); // أخفِ spinner
      setShowDeleteDialog(false);
      setRequestToDelete(null);
    }
  };

  // دالة تأكيد الرفض
  const handleRejectRequest = async (req: AdminRequest) => {
    setRequestToReject(req);
    setShowRejectDialog(true);
  };

  const confirmRejectRequest = async () => {
    if (!requestToReject) return;
    if (!requestToReject.type) {
      toast({
        title: language === 'ar' ? 'خطأ في نوع الطلب' : 'Type Error',
        description: language === 'ar' ? 'نوع الطلب غير معروف، لا يمكن رفض الطلب.' : 'Request type is missing, cannot reject request.',
        variant: 'destructive',
      });
      return;
    }
    const rowKey = `${requestToReject.id}-${requestToReject.type}`;
    setRowLoading(prev => ({ ...prev, [rowKey]: true }));
    try {
      const typeSlug = typeToApi(requestToReject.type);
      await api.post(`/admin/requests/${typeSlug}/${requestToReject.id}/status`, { status: 'rejected' });
      updateRequestStatusLocally(requestToReject.id, requestToReject.type, 'rejected');
      toast({
        title: language === 'ar' ? 'تم رفض الطلب' : 'Demande rejetée',
        description: language === 'ar' ? 'تم رفض الطلب بنجاح.' : 'La demande a été rejetée avec succès.',
        variant: 'destructive',
      });
      setRowStates(prev => ({ ...prev, [rowKey]: 'rejected' }));
    } catch (error) {
      toast({
        title: language === 'ar' ? 'خطأ' : 'Erreur',
        description: language === 'ar' ? 'فشل في رفض الطلب.' : 'Échec du rejet de la demande.',
        variant: 'destructive',
      });
    } finally {
      setRowLoading(prev => ({ ...prev, [rowKey]: false }));
      setShowRejectDialog(false);
      setRequestToReject(null);
    }
  };

  // عدل handleUploadPDF بحيث يرسل status=approved مع الملف
  const handleUploadPDF = async (type: string, id: number, file: File) => {
    const rowKey = `${id}-${type}`;
    setRowLoading(prev => ({ ...prev, [rowKey]: true }));
    try {
      const typeSlug = typeToApi(type);
      const formData = new FormData();
      formData.append('file', file);
      const response = await api.post(`/admin/requests/upload-file/${typeSlug}/${id}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      updateRequestStatusLocally(id, type, 'approved', response.data?.file_path);
      setRowStates(prev => ({ ...prev, [rowKey]: 'file_added' }));
      toast({
        title: language === 'ar' ? 'تم رفع الملف' : 'File uploaded',
        description: language === 'ar' ? 'تم رفع ملف الإدارة بنجاح' : 'Admin file uploaded successfully',
        variant: 'default',
        duration: 3000,
      });
      // Immediately refresh data from backend
      onRequestUpdate();
    } catch (error) {
      toast({
        title: language === 'ar' ? 'فشل رفع الملف' : 'Failed to upload file',
        description: error instanceof Error ? error.message : '',
        variant: 'destructive',
        duration: 3000,
      });
    } finally {
      setRowLoading(prev => ({ ...prev, [rowKey]: false }));
    }
  };

  const getPdfUrl = (type: string, id: number) => {
    let prefix = '';
    if (type === 'workCertificate') prefix = 'workcert';
    else if (type === 'vacationRequest') prefix = 'vacation';
    else if (type === 'missionOrder') prefix = 'mission';
    else return null;
    return `/storage/requests/${prefix}_${id}.pdf`;
  };

  // دالة لإزالة highlight من الـ URL
  const clearHighlightFromUrl = () => {
    const url = new URL(window.location.href);
    url.searchParams.delete('highlight');
    window.history.replaceState({}, '', url.pathname + url.search);
  };

  // دالة تفاعل مع highlight: أول تفاعل يزيد العداد فقط، الثاني يزيل highlight
  const handleHighlightInteraction = () => {
    if (highlightedRequestId) {
      // إزالة highlight من الـ URL مباشرة عند أي تفاعل
      const url = new URL(window.location.href);
      url.searchParams.delete('highlight');
      window.history.replaceState({}, '', url.pathname + url.search);
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <Input
          placeholder="Search by name..."
          value={searchTerm}
          onChange={(e) => {
            setSearchTerm(e.target.value);
            handleHighlightInteraction();
          }}
          className="max-w-sm"
        />
        <div className="flex items-center gap-2">
          <Select value={typeFilter} onValueChange={val => {
            setTypeFilter(val);
            handleHighlightInteraction();
          }}>
            <SelectTrigger className="min-w-[180px] max-w-xs">
              <SelectValue placeholder="Filter by type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">
                <span className="inline-flex items-center gap-1 w-full truncate">
                  <span className="truncate">{`${t('allRequests') || 'كل الطلبات'} (${t('requestType') || 'جميع الأنواع'})`}</span>
                </span>
              </SelectItem>
              {requestTypes.map(type => {
                const info = getTypeInfo(type, t);
                return (
                  <SelectItem key={type} value={type}>
                    <span className="inline-flex items-center gap-1 w-full truncate">
                      {info.icon}
                      <span className="truncate">{info.label}</span>
                    </span>
                  </SelectItem>
                );
              })}
            </SelectContent>
          </Select>
          {/* Dropdown جديد لفلترة الحالة */}
          <Select value={statusFilter} onValueChange={val => setStatusFilter(val)}>
            <SelectTrigger className="min-w-[180px] max-w-xs">
              <SelectValue placeholder={language === 'ar' ? 'تصفية حسب الحالة' : 'Filter by status'} />
            </SelectTrigger>
                    <SelectContent>
          <SelectItem value="all">{language === 'ar' ? 'جميع الحالات' : 'Toutes les statuts'}</SelectItem>
          <SelectItem value="pending">{language === 'ar' ? 'في انتظار' : 'En attente'}</SelectItem>
          <SelectItem value="approved">{language === 'ar' ? 'تم الإرسال' : 'Accepté'}</SelectItem>
          <SelectItem value="rejected">{language === 'ar' ? 'مرفوض' : 'Rejeté'}</SelectItem>
          <SelectItem value="waiting_admin_file">{language === 'ar' ? 'بانتظار ملف الإدارة' : "En attente du fichier de l'admin"}</SelectItem>
          <SelectItem value="urgent">{language === 'ar' ? 'عاجل' : 'Urgent'}</SelectItem>
        </SelectContent>
          </Select>
          <Button onClick={handleExportPDF} variant="outline" size="sm" className="ml-2">
            <FileDown className="h-4 w-4 mr-2" />
            Export PDF
          </Button>
          <Button onClick={handleExportExcel} variant="outline" size="sm">
            <FileDown className="h-4 w-4 mr-2" />
            Export Excel
          </Button>
        </div>
      </div>
      <Table className="border rounded-lg bg-white">
        <TableHeader>
          <TableRow className="bg-gray-50">
            <TableHead className="font-bold text-gray-700">{t('name') || 'Employee'}</TableHead>
            <TableHead className="font-bold text-gray-700">Matricule</TableHead>
            <TableHead className="font-bold text-gray-700">{t('requestType') || 'Request Type'}</TableHead>
            <TableHead className="font-bold text-gray-700">{t('startDate') || 'Date'}</TableHead>
            <TableHead className="font-bold text-gray-700">{t('file') || 'File'}</TableHead>
            <TableHead className="font-bold text-gray-700">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filteredRequests && filteredRequests.map((req, idx) => {
            const safeType = req.type || 'unknown';
            const uniqueKey = `${req.id}-${safeType}`;
            return (
              <TableRow
                key={`${uniqueKey}-${idx}`}
                ref={el => { if (highlightedRequestId === uniqueKey) rowRefs.current[uniqueKey] = el; }}
                className={`hover:bg-gray-50 cursor-pointer transition-all ${highlightedRequestId === uniqueKey ? 'border-2 border-blue-500 shadow-md' : ''}`}
                onClick={() => {
                  setSelectedRequest(req);
                  handleHighlightInteraction();
                  if (clearHighlight) clearHighlight();
                }}
              >
                <TableCell className="py-2 px-3 text-sm">
                  <div className="flex items-center gap-3">
                    <Avatar className="w-8 h-8">
                      <AvatarImage src={req.user?.profile_photo_url} alt={req.user?.name || req.full_name} />
                      <AvatarFallback className="text-xs">
                        {(req.user?.name || req.full_name).charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="font-medium">{req.full_name}</div>
                      {req.user?.email && (
                        <div className="text-xs text-gray-500">{req.user.email}</div>
                      )}
                    </div>
                  </div>
                </TableCell>
                <TableCell className="py-2 px-3 text-sm">{req.matricule}</TableCell>
                <TableCell className="py-2 px-3 text-sm">
                  {(() => {
                    const info = getTypeInfo(req.type, t);
                    return (
                      <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-semibold ${info.color}`}>
                        {info.icon}
                        {info.label}
                      </span>
                    );
                  })()}
                </TableCell>
                <TableCell className="py-2 px-3 text-sm">
                  <div className="flex flex-col">
                    <span className="font-semibold text-base">
                      {format(new Date(req.created_at), 'HH:mm', { locale: fr })}
                    </span>
                    <span className="text-xs text-gray-500 mt-1">
                      {format(new Date(req.created_at), 'd MMMM yyyy', { locale: fr })}
                    </span>
                  </div>
                </TableCell>
                <TableCell className="py-2 px-3 text-sm">
                  {req.file_path ? (
                    <Button size="sm" variant="secondary" asChild>
                      <Link 
                        to={`/file-viewer?file=${encodeURIComponent(`http://localhost:8000/storage/${req.file_path}`)}&full_name=${encodeURIComponent(req.full_name)}&highlight=${req.id}-${req.type}`}
                      >
                        {language === 'ar' ? 'عرض PDF' : 'Afficher PDF'}
                      </Link>
                    </Button>
                  ) : (
                    <span className="text-gray-400">No File</span>
                  )}
                </TableCell>
                <TableCell className="py-2 px-3 text-sm space-x-2" onClick={e => e.stopPropagation()}>
                  {(() => {
                    const rowKey = `${req.id}-${req.type}`;
                    if (rowLoading[rowKey]) {
                      return (
                        <div className="flex items-center gap-2">
                          <svg className="animate-spin h-5 w-5 mr-2 text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"></path>
                          </svg>
                          <span className="text-gray-500">{language === 'ar' ? 'جاري التنفيذ...' : 'Traitement...'}</span>
                        </div>
                      );
                    }
                    if (req.status === 'rejected') {
                      return <span className="text-red-500 font-semibold">{language === 'ar' ? 'مرفوض' : 'Rejected'}</span>;
                    }
                    if (req.status === 'approved' && req.file_path) {
                      return <span className="text-green-600 font-semibold">{language === 'ar' ? 'تم إضافة الملف' : 'File added'}</span>;
                    }
                    if ((req.status === 'approved' && !req.file_path) || req.status === 'waiting_admin_file') {
                      return (
                        <Button size="sm" onClick={() => setUploadDialog({ open: true, req })}>
                          {language === 'ar' ? 'إضافة ملف' : 'Ajouter un fichier'}
                        </Button>
                      );
                    }
                    if (req.status === 'pending' || req.status === 'urgent' || !req.status) {
                      return (
                        <div className="flex gap-2">
                          <Button size="sm" variant="default" onClick={() => handleUpdateStatus(req.type, req.id, 'approved')}>{language === 'ar' ? 'قبول' : 'Approve'}</Button>
                          <Button size="sm" variant="destructive" onClick={() => handleRejectRequest(req)}>{language === 'ar' ? 'رفض' : 'Reject'}</Button>
                        </div>
                      );
                    }
                    return null;
                  })()}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
      <RequestDetailsDialog
        isOpen={!!selectedRequest}
        onClose={() => setSelectedRequest(null)}
        request={selectedRequest}
      />
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-center">
              {t('deleteRequestConfirmation')}
            </DialogTitle>
          </DialogHeader>
          <DialogFooter className="flex flex-row justify-center gap-4 mt-4">
            <button
              type="button"
              className="px-6 py-2 rounded border border-gray-300 bg-white text-gray-700 hover:bg-gray-100 font-semibold text-base transition"
              onClick={() => setShowDeleteDialog(false)}
            >
              {t('cancel')}
            </button>
            <button
              type="button"
              className="px-6 py-2 rounded bg-red-600 text-white hover:bg-red-700 font-semibold text-base transition"
              onClick={confirmDeleteRequest}
            >
              {t('delete')}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      {/* Dialog تأكيد الرفض */}
      <Dialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-center">
              {requestToReject ? (
                language === 'ar'
                  ? `هل أنت متأكد أنك تريد رفض ${getTypeInfo(requestToReject.type, t).label}؟`
                  : `Êtes-vous sûr de vouloir rejeter la demande « ${getTypeInfo(requestToReject.type, t).label} » ?`
              ) : (language === 'ar' ? 'تأكيد الرفض' : 'Confirmation de rejet')}
            </DialogTitle>
          </DialogHeader>
          <DialogFooter className="flex flex-row justify-center gap-4 mt-4">
            <button
              type="button"
              className="px-6 py-2 rounded border border-gray-300 bg-white text-gray-700 hover:bg-gray-100 font-semibold text-base transition"
              onClick={() => setShowRejectDialog(false)}
            >
              {t('cancel')}
            </button>
            <button
              type="button"
              className="px-6 py-2 rounded bg-red-600 text-white hover:bg-red-700 font-semibold text-base transition"
              onClick={confirmRejectRequest}
            >
              {language === 'ar' ? 'رفض' : 'Rejeter'}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      {/* Dialog رفع ملف PDF أو صورة */}
      <Dialog open={uploadDialog.open} onOpenChange={open => setUploadDialog({ open, req: open ? uploadDialog.req : null })}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{language === 'ar' ? 'تحميل PDF أو صورة' : 'Télécharger un PDF ou une image'}</DialogTitle>
          </DialogHeader>
          <form
            onSubmit={async e => {
              e.preventDefault();
              if (!pendingFile || !uploadDialog.req) return;
              await handleUploadPDF(uploadDialog.req.type, uploadDialog.req.id, pendingFile);
            }}
            className="flex flex-col gap-4"
          >
            <input
              type="file"
              accept=".pdf,image/*"
              onChange={e => setPendingFile(e.target.files?.[0] || null)}
              className="block"
            />
            <div className="flex gap-2 mt-4">
              <Button type="submit" disabled={!pendingFile}>{language === 'ar' ? 'إرسال' : 'Envoyer'}</Button>
              <Button type="button" variant="outline" onClick={() => setUploadDialog({ open: false, req: null })}>{language === 'ar' ? 'إلغاء' : 'Annuler'}</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}; 