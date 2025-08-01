import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/contexts/LanguageContext';
import { useToast } from '@/hooks/use-toast';
import { axiosInstance } from '../components/Api/axios';
import { Download, User, FileText, Calendar, Eye, ClipboardCheck, CreditCard, DollarSign } from 'lucide-react';
import { format } from 'date-fns';
import { ar, fr } from 'date-fns/locale';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';

const REQUEST_ENDPOINTS = [
  { type: 'missionOrder', url: '/mission-orders/user', labelAr: 'أمر مهمة', labelFr: 'Ordre de Mission' },
  { type: 'workCertificate', url: '/work-certificates/user', labelAr: 'شهادة عمل', labelFr: 'Attestation de Travail' },
  { type: 'vacationRequest', url: '/vacation-requests/user', labelAr: 'طلب إجازة', labelFr: 'Demande de Congé' },
  { type: 'salaryDomiciliation', url: '/salary-domiciliations/user-domiciliations', labelAr: 'توطين الراتب', labelFr: 'Domiciliation de Salaire' },
  { type: 'annualIncome', url: '/annual-incomes/user-annual-incomes', labelAr: 'دخل سنوي', labelFr: 'Revenu Annuel' },
];

const getStatusColor = (status: string) => {
  switch (status) {
    case 'approved':
      return 'bg-green-100 text-green-800 border-green-200';
    case 'rejected':
      return 'bg-red-100 text-red-800 border-red-200';
    case 'urgent':
      return 'bg-orange-100 text-orange-800 border-orange-200';
    case 'waiting_admin_file':
      return 'bg-orange-50 text-orange-600 border-orange-200';
    default:
      return 'bg-yellow-100 text-yellow-800 border-yellow-200';
  }
};

const getStatusText = (status: string, language: string) => {
  switch (status) {
    case 'approved':
      return language === 'ar' ? 'قبول تام' : 'Accepté définitivement';
    case 'rejected':
      return language === 'ar' ? 'مرفوض' : 'Rejeté';
    case 'urgent':
      return language === 'ar' ? 'عاجل' : 'Urgent';
    case 'waiting_admin_file':
      return language === 'ar'
        ? 'قبول نسبي (رأى الأدمين طلبك .. انتظر ليرسل لك ملف)'
        : 'Acceptation partielle (l’admin a vu votre demande, attendez le fichier)';
    default:
      return language === 'ar' ? 'قيد الانتظار' : 'En attente';
  }
};

const getTypeLabel = (type: string, language: string) => {
  const found = REQUEST_ENDPOINTS.find(e => e.type === type);
  if (!found) return type;
  return language === 'ar' ? found.labelAr : found.labelFr;
};

const getPdfUrl = (type: string, id: number) => {
  let prefix = '';
  if (type === 'workCertificate') prefix = 'workcert';
  else if (type === 'vacationRequest') prefix = 'vacation';
  else if (type === 'missionOrder') prefix = 'mission';
  else return null;
  return `/storage/requests/${prefix}_${id}.pdf`;
};

const AllRequestsPage = () => {
  const { language } = useLanguage();
  const { toast } = useToast();
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [downloadingId, setDownloadingId] = useState<number | null>(null);
  const [selectedRequest, setSelectedRequest] = useState<any | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [pdfLoading, setPdfLoading] = useState(false);
  // أضف حالة لعرض Dialog الملف
  const [showAdminFile, setShowAdminFile] = useState(false);
  const [adminFileUrl, setAdminFileUrl] = useState<string | null>(null);
  // أضف state لعرض ملف المستخدم
  const [showUserFile, setShowUserFile] = useState(false);
  const [userFileUrl, setUserFileUrl] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    setLoading(true);
    const fetchRequests = async () => {
      Promise.all(
        REQUEST_ENDPOINTS.map(async (endpoint) => {
          try {
            const res = await axiosInstance.get(endpoint.url);
            return (res.data || []).map((item: any) => ({ ...item, type: endpoint.type }));
          } catch {
            return [];
          }
        })
      ).then(async (results) => {
        let all = ([] as any[]).concat(...results).sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
        try {
          const adminRes = await axiosInstance.get('/admin/requests');
          const adminMap = {};
          (adminRes.data.requests || []).forEach((req: any) => {
            adminMap[req.id + '-' + req.type] = req.admin_file_url;
          });
          all = all.map((req: any) => ({ ...req, admin_file_url: adminMap[req.id + '-' + req.type] || null }));
        } catch {}
        if (isMounted) {
          setRequests(all);
          setLoading(false);
        }
      });
    };
    fetchRequests();
    const interval = setInterval(fetchRequests, 5000); // تحديث كل 5 ثوانٍ
    return () => { isMounted = false; clearInterval(interval); };
  }, [language]);

  // منطق Toast عند قبول الطلب بدون PDF (مرة واحدة فقط لكل طلب)
  useEffect(() => {
    requests.forEach((req) => {
      if (req.status === 'approved' && !req.file_path && !req._notifiedWaitingPDF) {
        toast({
          title: language === 'ar' ? 'تم قبول طلبك' : 'Votre demande a été acceptée',
          description: language === 'ar' ? 'انتظر وصول ملف PDF النهائي من الإدارة.' : 'Veuillez attendre le PDF final de l’administration.',
          duration: 7000,
        });
        req._notifiedWaitingPDF = true;
      }
    });
    // eslint-disable-next-line
  }, [requests, language]);

  const handleDownload = async (req: any) => {
    setDownloadingId(req.id);
    try {
      let url = '';
      let fileName = '';
      if (req.type === 'missionOrder') {
        url = `/mission-orders/download-db/${req.id}`;
        fileName = `ORDRE_DE_MISSION_${req.full_name || req.monsieur_madame || 'user'}.pdf`;
      } else if (req.type === 'workCertificate') {
        url = `/work-certificates/download-db/${req.id}`;
        fileName = `attestation_travail_${req.full_name || req.fullName || req.nom || 'user'}.pdf`;
      } else if (req.type === 'vacationRequest') {
        url = `/download-pdf-vacation/${req.id}`;
        fileName = `DEMANDE_CONGE_${req.full_name || 'user'}.pdf`;
      } else if (req.type === 'salaryDomiciliation') {
        url = `/salary-domiciliations/download/${req.id}`;
        fileName = `domiciliation_salaire_${req.full_name || 'user'}.pdf`;
      } else if (req.type === 'annualIncome') {
        url = `/annual-incomes/download/${req.id}`;
        fileName = `revenu_annuel_${req.full_name || 'user'}.pdf`;
      }
      const response = await axiosInstance.get(url, { responseType: 'blob' });

      // تحقق من نوع الملف
      const contentType = response.headers['content-type'];
      if (!contentType || !contentType.includes('pdf')) {
        // الملف ليس PDF، أظهر رسالة خطأ
        toast({
          title: language === 'ar' ? 'خطأ' : 'Erreur',
          description: language === 'ar'
            ? 'الملف غير متوفر أو ليس ملف PDF.'
            : "Le fichier n'est pas disponible ou n'est pas un PDF.",
          variant: 'destructive',
        });
        setDownloadingId(null);
        return;
      }

      const blobUrl = window.URL.createObjectURL(new Blob([response.data], { type: contentType }));
      const link = document.createElement('a');
      link.href = blobUrl;
      link.setAttribute('download', fileName);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(blobUrl);
      toast({
        title: language === 'ar' ? 'تم التحميل' : 'Téléchargé',
        description: language === 'ar' ? 'تم تحميل الملف بنجاح.' : 'Fichier téléchargé avec succès.',
      });
    } catch (error) {
      toast({
        title: language === 'ar' ? 'خطأ' : 'Erreur',
        description: language === 'ar' ? 'فشل في تحميل الملف.' : 'Échec du téléchargement du fichier.',
        variant: 'destructive',
      });
    } finally {
      setDownloadingId(null);
    }
  };

  // دالة لعرض PDF في نافذة جديدة
  const handleShowPDF = async (req: any) => {
    if (!req.file_path) {
      toast({
        title: language === 'ar' ? 'لا يوجد PDF' : 'Pas de PDF',
        description: language === 'ar' ? 'لم يتم حفظ ملف PDF لهذا الطلب بعد.' : 'Aucun PDF sauvegardé pour cette demande.',
        variant: 'destructive',
      });
      return;
    }
    setPdfLoading(true);
    try {
      const url = getPdfUrl(req.type, req.id);
      if (url) {
        window.open(url, '_blank');
      } else {
        toast({
          title: language === 'ar' ? 'خطأ' : 'Erreur',
          description: language === 'ar' ? 'رابط PDF غير متوفر.' : 'Lien PDF non disponible.',
          variant: 'destructive',
        });
      }
    } finally {
      setPdfLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-green-50 to-blue-100 p-2 sm:p-3 md:p-4">
      <div className="max-w-6xl mx-auto w-full">
        <div className="text-center mb-6 sm:mb-8">
          <h1 className="text-xl sm:text-2xl md:text-3xl font-bold bg-gradient-to-r from-blue-600 to-green-600 bg-clip-text text-transparent mb-1 sm:mb-2">
            {language === 'ar' ? 'جميع الطلبات' : 'Toutes les demandes'}
          </h1>
          <p className="text-gray-600 text-xs sm:text-sm md:text-base">
            {language === 'ar' ? 'كل طلباتك بأنواعها في مكان واحد' : 'Toutes vos demandes, tous types confondus'}
          </p>
        </div>
        {loading ? (
          <div className="flex flex-col items-center text-center gap-3 sm:gap-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <p className="text-slate-600 text-sm">
              {language === 'ar' ? 'جاري التحميل...' : 'Chargement...'}
            </p>
          </div>
        ) : requests.length === 0 ? (
          <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-sm w-full max-w-md mx-auto">
            <CardContent className="pt-4 pb-4 sm:pt-6 sm:pb-6 md:pt-8 md:pb-8">
              <div className="flex flex-col items-center text-center gap-3 sm:gap-4">
                <FileText className="h-10 w-10 sm:h-12 sm:w-12 text-gray-400" />
                <div>
                  <h3 className="text-base sm:text-lg font-semibold text-gray-700 mb-1 sm:mb-2">
                    {language === 'ar' ? 'لا توجد طلبات' : 'Aucune demande'}
                  </h3>
                  <p className="text-gray-500 text-xs sm:text-sm">
                    {language === 'ar' ? 'لم تقم بإرسال أي طلب بعد' : 'Vous n\'avez pas encore soumis de demande'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-3 sm:gap-4 md:gap-6">
            {requests.map((req) => (
              <Card key={req.id + '-' + req.type} className="shadow-lg border-0 bg-white/80 backdrop-blur-sm hover:shadow-xl transition-shadow cursor-pointer w-full max-w-full" onClick={() => { setSelectedRequest(req); setShowModal(true); }}>
                <CardHeader className="pb-2 sm:pb-3">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-0">
                    <div className="flex items-center gap-2 sm:gap-3">
                      <div className="h-9 w-9 sm:h-10 sm:w-10 rounded-full bg-gradient-to-r from-blue-600 to-green-600 flex items-center justify-center">
                        <User className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
                      </div>
                      <div>
                        <CardTitle className="text-base sm:text-lg font-semibold text-slate-800">
                          {req.full_name || req.fullName || req.nom || req.monsieur_madame}
                        </CardTitle>
                        <p className="text-xs sm:text-sm text-slate-600">
                          {language === 'ar' ? 'رقم التسجيل:' : 'Matricule:'} {req.matricule}
                        </p>
                        <span className={`inline-block mt-1 px-2 py-0.5 rounded text-xs font-medium ${
  req.type === 'workCertificate' ? 'bg-green-100 text-green-700' :
  req.type === 'vacationRequest' ? 'bg-blue-100 text-blue-700' :
  req.type === 'missionOrder' ? 'bg-purple-100 text-purple-700' :
  req.type === 'salaryDomiciliation' ? 'bg-cyan-100 text-cyan-700' :
  req.type === 'annualIncome' ? 'bg-orange-100 text-orange-700' :
  'bg-gray-100 text-gray-800'
}`}>
                          {getTypeLabel(req.type, language)}
                        </span>
                      </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-1 sm:gap-2 mt-2 sm:mt-0">
                      {/* شارة حالة الطلب الجديدة */}
                      {req.status === 'pending' && (
                        <span className="px-2 sm:px-3 py-1 rounded-full text-xs font-medium border bg-gray-100 text-gray-500 border-gray-200">
                          {language === 'ar' ? 'في انتظار' : 'En attente'}
                        </span>
                      )}
                      {req.status === 'rejected' && (
                        <span className="px-2 sm:px-3 py-1 rounded-full text-xs font-medium border bg-red-100 text-red-700 border-red-200">
                          {language === 'ar' ? 'مرفوض' : 'Rejeté'}
                        </span>
                      )}
                      {req.status === 'waiting_admin_file' && (
                        <span className="px-2 sm:px-3 py-1 rounded-full text-xs font-medium border bg-orange-50 text-orange-600 border-orange-200 italic">
                          {language === 'ar' ? 'بانتظار ملف الإدارة' : "En attente du fichier de l'admin"}
                        </span>
                      )}
                      {req.status === 'approved' && !req.file_path && (
                        <span className="px-2 sm:px-3 py-1 rounded-full text-xs font-medium border bg-orange-100 text-orange-700 border-orange-200">
                          {language === 'ar' ? 'قبول في انتظار ملف PDF' : 'Accepté, en attente du PDF'}
                        </span>
                      )}
                      {req.status === 'approved' && (
                        <>
                          <span className="px-2 sm:px-3 py-1 rounded-full text-xs font-medium border bg-green-100 text-green-800 border-green-200 mr-1">
                            {language === 'ar' ? 'مقبول' : 'Accepté'}
                          </span>
                          {req.admin_file_url && (
                            <Button size="icon" variant="ghost" className="ml-1" title={language === 'ar' ? 'عرض ما أرسله الأدمن' : "Voir le fichier envoyé par l'admin"} onClick={e => { e.stopPropagation(); setAdminFileUrl(req.admin_file_url); setShowAdminFile(true); }}>
                              <Eye className="w-4 h-4 text-blue-600" />
                            </Button>
                          )}
                        </>
                      )}
                      {/* الشارات القديمة (Urgent/PDF...) */}
                      {req.status === 'urgent' ? (
                        <span className="px-2 sm:px-3 py-1 rounded-full text-xs font-medium border bg-orange-100 text-orange-800 border-orange-200">
                          {language === 'ar' ? 'عاجل' : 'Urgent'}
                        </span>
                      ) : req.status === 'pending' ? (
                        <span className="px-2 sm:px-3 py-1 rounded-full text-xs font-medium border bg-gray-100 text-gray-800 border-gray-200">
                          {language === 'ar' ? 'عادي' : 'Normal'}
                        </span>
                      ) : null}
                      {req.file_path ? (
                        <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 border border-green-200">
                          {language === 'ar' ? 'PDF محفوظ' : 'PDF sauvegardé'}
                        </span>
                      ) : (
                        <span className="px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800 border border-gray-200">
                          {language === 'ar' ? 'لا يوجد PDF' : 'Pas de PDF'}
                        </span>
                      )}
                      {/* زر واحد فقط لعرض ملف الإدارة بالشروط الصحيحة */}
                      {req.status === 'approved' && req.admin_file_url && typeof req.admin_file_url === 'string' && req.admin_file_url.trim() !== '' && req.admin_file_url !== `/storage/${req.file_path}` && (
                        <Button size="sm" variant="outline" className="ml-2" onClick={e => { e.stopPropagation(); setAdminFileUrl(req.admin_file_url); setShowAdminFile(true); }}>
                          {language === 'ar' ? 'عرض ملف الإدارة' : "Voir le fichier de l'admin"}
                        </Button>
                      )}
                      {req.status === 'approved' && req.admin_file_url && (
                        <a
                          href={req.admin_file_url}
                          download
                          target="_blank"
                          rel="noopener noreferrer"
                          className="ml-2 px-2 sm:px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 border border-blue-200 hover:bg-blue-200 transition"
                          title={language === 'ar' ? 'تحميل ملف الإدارة' : 'Télécharger le fichier admin'}
                        >
                          {language === 'ar' ? 'تحميل ملف الإدارة' : 'Télécharger admin'}
                        </a>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="grid grid-cols-1 gap-2 sm:gap-4 md:grid-cols-2">
                    <div className="flex items-start gap-1 sm:gap-2">
                      <FileText className="h-4 w-4 text-blue-600 mt-0.5" />
                      <div>
                        <p className="text-xs sm:text-sm font-medium text-slate-700 mb-0.5 sm:mb-1">
                          {language === 'ar' ? 'نوع الطلب:' : 'Type de demande:'}
                        </p>
                        <p className="text-xs sm:text-sm text-slate-600">{getTypeLabel(req.type, language)}</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-1 sm:gap-2">
                      <Calendar className="h-4 w-4 text-green-600 mt-0.5" />
                      <div>
                        <p className="text-xs sm:text-sm font-medium text-slate-700 mb-0.5 sm:mb-1">
                          {language === 'ar' ? 'تاريخ الإرسال:' : 'Date de soumission:'}
                        </p>
                        <p className="text-xs sm:text-sm text-slate-600">{format(new Date(req.created_at), 'dd/MM/yyyy HH:mm', { locale: language === 'ar' ? ar : fr })}</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
      {/* نافذة التفاصيل */}
      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className={`max-w-xs sm:max-w-md md:max-w-lg w-full ${language === 'ar' ? 'text-right' : 'text-left'}`}
          style={{ direction: language === 'ar' ? 'rtl' : 'ltr' }}>
          <DialogHeader className={`flex flex-col ${language === 'ar' ? 'items-end' : 'items-start'}`}>
            <DialogTitle className="text-base sm:text-lg font-bold flex items-center gap-1 sm:gap-2">
              {selectedRequest?.type === 'vacationRequest' && <Calendar className="w-4 h-4 mr-1 inline" />}
              {selectedRequest?.type === 'workCertificate' && <FileText className="w-4 h-4 mr-1 inline" />}
              {selectedRequest?.type === 'missionOrder' && <ClipboardCheck className="w-4 h-4 mr-1 inline" />}
              {selectedRequest?.type === 'salaryDomiciliation' && <CreditCard className="w-4 h-4 mr-1 inline" />}
              {selectedRequest?.type === 'annualIncome' && <DollarSign className="w-4 h-4 mr-1 inline" />}
              {getTypeLabel(selectedRequest?.type, language)} {language === 'ar' ? 'تفاصيل' : 'Détails'}
            </DialogTitle>
            <DialogDescription className="text-xs sm:text-[14px] text-gray-500 mb-1 sm:mb-2">
              {language === 'ar'
                ? `جميع تفاصيل الطلب الخاص بـ ${selectedRequest?.full_name || selectedRequest?.fullName || selectedRequest?.nom || selectedRequest?.monsieur_madame}`
                : `Tous les détails de la demande de ${selectedRequest?.full_name || selectedRequest?.fullName || selectedRequest?.nom || selectedRequest?.monsieur_madame}`}
            </DialogDescription>
          </DialogHeader>
          {selectedRequest && (
            <div className="space-y-1 sm:space-y-2 py-1 sm:py-2">
              <div className="flex justify-between items-center text-xs sm:text-[14px] border-b pb-1">
                <span className="font-semibold text-gray-700">{language === 'ar' ? 'الاسم:' : 'Nom:'}</span>
                <span>{selectedRequest.full_name || selectedRequest.fullName || selectedRequest.nom || selectedRequest.monsieur_madame}</span>
              </div>
              <div className="flex justify-between items-center text-xs sm:text-[14px] border-b pb-1">
                <span className="font-semibold text-gray-700">{language === 'ar' ? 'رقم التسجيل:' : 'Matricule:'}</span>
                <span>{selectedRequest.matricule}</span>
              </div>
              <div className="flex justify-between items-center text-xs sm:text-[14px] border-b pb-1">
                <span className="font-semibold text-gray-700">{language === 'ar' ? 'نوع الطلب:' : 'Type de demande:'}</span>
                <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-semibold ${
  selectedRequest.type === 'workCertificate' ? 'bg-green-100 text-green-700' :
  selectedRequest.type === 'vacationRequest' ? 'bg-blue-100 text-blue-700' :
  selectedRequest.type === 'missionOrder' ? 'bg-purple-100 text-purple-700' :
  selectedRequest.type === 'salaryDomiciliation' ? 'bg-cyan-100 text-cyan-700' :
  selectedRequest.type === 'annualIncome' ? 'bg-orange-100 text-orange-700' :
  'bg-gray-100 text-gray-800'
}`}>
                  {getTypeLabel(selectedRequest.type, language)}
                </span>
              </div>
              {/* تم حذف سطر الحالة (Statut) بناءً على طلب المستخدم */}
              <div className="flex justify-between items-center text-xs sm:text-[14px] border-b pb-1">
                <span className="font-semibold text-gray-700">{language === 'ar' ? 'الحالة:' : 'Statut:'}</span>
                <span className={`inline-block px-2 py-1 rounded text-xs font-semibold border ${getStatusColor(selectedRequest.status)}`}>{getStatusText(selectedRequest.status, language)}</span>
              </div>
              {/* تفاصيل Demande de Congé */}
              {selectedRequest.type === 'vacationRequest' && (
                <>
                  {(selectedRequest.leaveType || selectedRequest.leave_type) && (
                    <div className="flex justify-between items-center text-xs sm:text-[14px] border-b pb-1">
                      <span className="font-semibold text-gray-700">{language === 'ar' ? 'نوع الإجازة:' : 'Type de congé:'}</span>
                      <span>{selectedRequest.leaveType || selectedRequest.leave_type}</span>
                    </div>
                  )}
                  {(selectedRequest.startDate || selectedRequest.start_date) && (
                    <div className="flex justify-between items-center text-xs sm:text-[14px] border-b pb-1">
                      <span className="font-semibold text-gray-700">{language === 'ar' ? 'تاريخ البداية:' : 'Date de début:'}</span>
                      <span>{format(new Date(selectedRequest.startDate || selectedRequest.start_date), 'PPP', { locale: language === 'ar' ? ar : fr })}</span>
                    </div>
                  )}
                  {(selectedRequest.endDate || selectedRequest.end_date) && (
                    <div className="flex justify-between items-center text-xs sm:text-[14px] border-b pb-1">
                      <span className="font-semibold text-gray-700">{language === 'ar' ? 'تاريخ النهاية:' : 'Date de fin:'}</span>
                      <span>{format(new Date(selectedRequest.endDate || selectedRequest.end_date), 'PPP', { locale: language === 'ar' ? ar : fr })}</span>
                    </div>
                  )}
                </>
              )}
              {/* تفاصيل معلومات الفورم حسب نوع الطلب */}
              {selectedRequest.type === 'workCertificate' && (
                <>
                  {selectedRequest.purpose && (
                    <div className="flex justify-between items-center text-xs sm:text-[14px] border-b pb-1">
                      <span className="font-semibold text-gray-700">{language === 'ar' ? 'الغرض:' : "Objet de l'attestation:"}</span>
                      <span>{selectedRequest.purpose}</span>
                    </div>
                  )}
                  {selectedRequest.grade && (
                    <div className="flex justify-between items-center text-xs sm:text-[14px] border-b pb-1">
                      <span className="font-semibold text-gray-700">{language === 'ar' ? 'الدرجة:' : 'Grade:'}</span>
                      <span>{selectedRequest.grade}</span>
                    </div>
                  )}
                  {selectedRequest.function && (
                    <div className="flex justify-between items-center text-xs sm:text-[14px] border-b pb-1">
                      <span className="font-semibold text-gray-700">{language === 'ar' ? 'الوظيفة:' : 'Fonction:'}</span>
                      <span>{selectedRequest.function}</span>
                    </div>
                  )}
                </>
              )}
              {selectedRequest.type === 'missionOrder' && (
                <>
                  {selectedRequest.destination && (
                    <div className="flex justify-between items-center text-xs sm:text-[14px] border-b pb-1">
                      <span className="font-semibold text-gray-700">{language === 'ar' ? 'الوجهة:' : 'Destination:'}</span>
                      <span>{selectedRequest.destination}</span>
                    </div>
                  )}
                  {selectedRequest.purpose && (
                    <div className="flex justify-between items-center text-xs sm:text-[14px] border-b pb-1">
                      <span className="font-semibold text-gray-700">{language === 'ar' ? 'الغرض من المهمة:' : 'Objet de la mission:'}</span>
                      <span>{selectedRequest.purpose}</span>
                    </div>
                  )}
                  {selectedRequest.startDate && (
                    <div className="flex justify-between items-center text-xs sm:text-[14px] border-b pb-1">
                      <span className="font-semibold text-gray-700">{language === 'ar' ? 'من:' : 'Du:'}</span>
                      <span>{selectedRequest.startDate}</span>
                    </div>
                  )}
                  {selectedRequest.endDate && (
                    <div className="flex justify-between items-center text-xs sm:text-[14px] border-b pb-1">
                      <span className="font-semibold text-gray-700">{language === 'ar' ? 'إلى:' : 'Au:'}</span>
                      <span>{selectedRequest.endDate}</span>
                    </div>
                  )}
                </>
              )}
              {/* زر PDF في الأسفل */}
            </div>
          )}
          <DialogFooter className="mt-4 flex flex-col gap-2">
            <button
              className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded bg-blue-600 hover:bg-blue-700 text-white font-semibold shadow disabled:opacity-60"
              onClick={() => {
                if (selectedRequest.file_path) {
                  let pdfUrl = '';
                  if (selectedRequest.type === 'annualIncome') {
                    pdfUrl = selectedRequest.file_path.startsWith('/storage/annual_incomes/')
                      ? selectedRequest.file_path
                      : '/storage/annual_incomes/' + selectedRequest.file_path.replace(/^.*[\\/]/, '');
                  } else if (selectedRequest.type === 'salaryDomiciliation') {
                    pdfUrl = selectedRequest.file_path.startsWith('/storage/salary_domiciliations/')
                      ? selectedRequest.file_path
                      : '/storage/salary_domiciliations/' + selectedRequest.file_path.replace(/^.*[\\/]/, '');
                  } else {
                    pdfUrl = selectedRequest.file_path.startsWith('/storage/requests/')
                      ? selectedRequest.file_path
                      : '/storage/requests/' + selectedRequest.file_path.replace(/^.*[\\/]/, '');
                  }
                  const fullUrl = pdfUrl.startsWith('http') ? pdfUrl : `http://localhost:8000${pdfUrl}`;
                  window.open(fullUrl, '_blank');
                }
              }}
              disabled={pdfLoading || !selectedRequest?.file_path}
            >
              <Eye className="h-5 w-5" />
              {pdfLoading ? (language === 'ar' ? 'جاري التحميل...' : 'Chargement...') : (language === 'ar' ? 'عرض PDF' : 'Afficher PDF')}
            </button>
            {/* زر تحميل PDF مباشرة */}
            {selectedRequest?.file_path && (
              <button
                className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded bg-green-600 hover:bg-green-700 text-white font-semibold shadow disabled:opacity-60"
                onClick={() => handleDownload(selectedRequest)}
                disabled={downloadingId === selectedRequest.id}
              >
                <Download className="h-5 w-5" />
                {downloadingId === selectedRequest.id
                  ? (language === 'ar' ? 'جاري التحميل...' : 'Téléchargement...')
                  : (language === 'ar' ? 'تحميل PDF' : 'Télécharger PDF')}
              </button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
      {/* Dialog عرض ملف الإدارة */}
      <Dialog open={showAdminFile} onOpenChange={setShowAdminFile}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{language === 'ar' ? 'ملف الإدارة' : "Fichier de l'administration"}</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col items-center gap-4 py-4">
            {adminFileUrl && (adminFileUrl.endsWith('.pdf') ? (
              <iframe src={adminFileUrl} title="admin-pdf" className="w-full h-[60vh] border rounded" />
            ) : (
              <img src={adminFileUrl} alt="admin-file" className="max-h-[60vh] rounded shadow" />
            ))}
            {adminFileUrl && (
              <a href={adminFileUrl} target="_blank" rel="noopener noreferrer" download className="mt-4 px-4 py-2 bg-blue-600 text-white rounded font-semibold">
                {language === 'ar' ? 'تحميل الملف' : 'Télécharger'}
              </a>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAdminFile(false)}>{language === 'ar' ? 'إغلاق' : 'Fermer'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      {/* Dialog عرض ملف المستخدم */}
      <Dialog open={showUserFile} onOpenChange={setShowUserFile}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{language === 'ar' ? 'ملف المستخدم' : "Fichier envoyé par l'utilisateur"}</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col items-center gap-4 py-4">
            {userFileUrl && (userFileUrl.endsWith('.pdf') ? (
              <iframe src={userFileUrl} title="user-pdf" className="w-full h-[60vh] border rounded" />
            ) : (
              <img src={userFileUrl} alt="user-file" className="max-h-[60vh] rounded shadow" />
            ))}
            {userFileUrl && (
              <a href={userFileUrl} target="_blank" rel="noopener noreferrer" download className="mt-4 px-4 py-2 bg-blue-600 text-white rounded font-semibold">
                {language === 'ar' ? 'تحميل الملف' : 'Télécharger'}
              </a>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowUserFile(false)}>{language === 'ar' ? 'إغلاق' : 'Fermer'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AllRequestsPage; 