import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/contexts/LanguageContext";
import { useToast } from "@/hooks/use-toast";
import { axiosInstance } from '../components/Api/axios';
import { useAuth } from '@/contexts/AuthContext';
import { ArrowLeft, Download, User, FileText, Image as ImageIcon, Calendar } from "lucide-react";
import { format } from "date-fns";
import { ar, fr } from "date-fns/locale";

interface VacationRequest {
  id: number;
  full_name: string;
  matricule: string;
  file_path: string | null;
  status: string;
  created_at: string;
  type: string;
  start_date?: string;
  end_date?: string;
  leave_type?: string;
  custom_leave_type?: string;
}

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
      return language === 'ar' ? 'مقبول' : 'Approuvé';
    case 'rejected':
      return language === 'ar' ? 'مرفوض' : 'Rejeté';
    case 'urgent':
      return language === 'ar' ? 'عاجل' : 'Urgent';
    case 'waiting_admin_file':
      return language === 'ar' ? 'بانتظار ملف الإدارة' : "En attente du fichier de l'admin";
    default:
      return language === 'ar' ? 'قيد الانتظار' : 'En attente';
  }
};

const VacationRequestHistory = () => {
  const { language } = useLanguage();
  const { user } = useAuth();
  const { toast } = useToast();
  const [requests, setRequests] = useState<VacationRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [downloadingId, setDownloadingId] = useState<number | null>(null);

  useEffect(() => {
    setLoading(true);
    axiosInstance.get('/vacation-requests/user')
      .then(res => {
        setRequests(res.data);
      })
      .catch(() => {
        toast({
          title: language === 'ar' ? 'خطأ' : 'Erreur',
          description: language === 'ar' ? 'فشل في تحميل سجل الطلبات.' : 'Échec du chargement de l\'historique.',
          variant: 'destructive',
        });
      })
      .finally(() => setLoading(false));
  }, [language, toast]);

  const handleDownload = async (id: number, fullName: string) => {
    setDownloadingId(id);
    try {
      const response = await axiosInstance.get(`/download-pdf-vacation/${id}`, { responseType: 'blob' });
      const fileName = `DEMANDE_CONGE_${fullName || 'user'}.pdf`;
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', fileName);
      document.body.appendChild(link);
      link.click();
      link.parentNode?.removeChild(link);
      window.URL.revokeObjectURL(url);
      toast({
        title: language === 'ar' ? 'تم التحميل' : 'Téléchargé',
        description: language === 'ar' ? 'تم تحميل PDF بنجاح.' : 'PDF téléchargé avec succès.',
        variant: 'default',
        className: 'bg-blue-50 border-blue-200',
      });
    } catch {
      toast({
        title: language === 'ar' ? 'خطأ' : 'Erreur',
        description: language === 'ar' ? 'فشل في تحميل الملف.' : 'Échec du téléchargement du fichier.',
        variant: 'destructive',
      });
    } finally {
      setDownloadingId(null);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-green-50 to-blue-100 p-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6 md:mb-8">
          <div className="flex items-center gap-4">
            <Button 
              variant="outline"
              onClick={() => window.history.back()}
              className="border-blue-500 text-blue-600 hover:bg-blue-50"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              {language === 'ar' ? 'رجوع' : 'Retour'}
            </Button>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-blue-600 to-green-600 bg-clip-text text-transparent">
                {language === 'ar' ? 'سجل طلبات الإجازة' : 'Historique des demandes de congé'}
              </h1>
              <p className="text-gray-600 text-sm md:text-base">
                {language === 'ar' ? 'جميع طلبات الإجازة المحفوظة' : 'Toutes vos demandes de congé sauvegardées'}
              </p>
              <div className="mt-2 text-sm text-blue-600 font-medium">
                {language === 'ar' 
                  ? `إجمالي الطلبات المحفوظة: ${requests.length}`
                  : `Total des demandes sauvegardées: ${requests.length}`
                }
              </div>
            </div>
          </div>
          <Button
            variant="secondary"
            onClick={() => window.location.href = '/all-requests'}
            className="bg-blue-100 text-blue-700 border border-blue-200"
          >
            {language === 'ar' ? 'عرض جميع الطلبات' : 'Voir tous les demandes'}
          </Button>
        </div>
        {loading ? (
          <div className="flex flex-col items-center text-center gap-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <p className="text-slate-600">
              {language === 'ar' ? 'جاري التحميل...' : 'Chargement...'}
            </p>
          </div>
        ) : requests.length === 0 ? (
          <div className="text-center text-muted-foreground py-8">
            {language === 'ar' ? 'لا توجد طلبات بعد.' : 'Aucune demande trouvée.'}
          </div>
        ) : (
          <div className="grid gap-4 md:gap-6">
            {requests.map((req) => (
              <Card key={req.id} className="shadow-lg border-0 bg-white/80 backdrop-blur-sm hover:shadow-xl transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-gradient-to-r from-blue-600 to-green-600 flex items-center justify-center">
                        <User className="h-5 w-5 text-white" />
                      </div>
                      <div>
                        <CardTitle className="text-lg font-semibold text-slate-800">
                          {req.full_name}
                        </CardTitle>
                        <p className="text-sm text-slate-600">
                          {language === 'ar' ? 'رقم التسجيل:' : 'Matricule:'} {req.matricule}
                        </p>
                      </div>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(req.status)}`}>
                      {getStatusText(req.status, language)}
                    </span>
                    {req.file_path ? (
                      <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 border border-green-200">
                        {language === 'ar' ? 'PDF محفوظ' : 'PDF sauvegardé'}
                      </span>
                    ) : (
                      <span className="px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800 border border-gray-200">
                        {language === 'ar' ? 'لا يوجد PDF' : 'Pas de PDF'}
                      </span>
                    )}
                    {req.file_path && (
                      <Button
                        size="sm"
                        onClick={() => handleDownload(req.id, req.full_name)}
                        disabled={downloadingId === req.id}
                        className="bg-blue-600 hover:bg-blue-700 text-white"
                      >
                        {downloadingId === req.id ? (
                          <div className="flex items-center gap-1">
                            <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white"></div>
                            {language === 'ar' ? "جاري..." : "En cours..."}
                          </div>
                        ) : (
                          <>
                            <Download className="h-4 w-4 mr-1" />
                            {language === 'ar' ? "تحميل" : "Télécharger"}
                          </>
                        )}
                      </Button>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex items-start gap-2">
                      <FileText className="h-4 w-4 text-blue-600 mt-0.5" />
                      <div>
                        <p className="text-sm font-medium text-slate-700 mb-1">
                          {language === 'ar' ? 'نوع الإجازة:' : 'Type de congé:'}
                        </p>
                        <p className="text-sm text-slate-600">{req.custom_leave_type || req.leave_type || req.type || '-'}</p>
                        {req.leave_type && req.leave_type !== req.custom_leave_type && (
                          <p className="text-xs text-slate-400">{req.leave_type}</p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-start gap-2">
                      <Calendar className="h-4 w-4 text-green-600 mt-0.5" />
                      <div>
                        <p className="text-sm font-medium text-slate-700 mb-1">
                          {language === 'ar' ? 'التواريخ:' : 'Dates:'}
                        </p>
                        <p className="text-sm text-slate-600">
                          {req.start_date && req.end_date
                            ? `${format(new Date(req.start_date), 'dd/MM/yyyy', { locale: language === 'ar' ? ar : fr })} - ${format(new Date(req.end_date), 'dd/MM/yyyy', { locale: language === 'ar' ? ar : fr })}`
                            : language === 'ar' ? '-' : '-'}
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="mt-4">
                    <p className="text-sm font-medium text-slate-700 mb-1">
                      {language === 'ar' ? 'تاريخ الإرسال:' : 'Date de soumission:'}
                    </p>
                    <p className="text-sm text-slate-600">{format(new Date(req.created_at), 'dd/MM/yyyy HH:mm', { locale: language === 'ar' ? ar : fr })}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default VacationRequestHistory; 