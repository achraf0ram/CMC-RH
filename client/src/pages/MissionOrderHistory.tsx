import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/contexts/LanguageContext";
import { useToast } from "@/hooks/use-toast";
import { axiosInstance } from '../components/Api/axios';
import { useAuth } from '@/contexts/AuthContext';
import { ArrowLeft, Download, Calendar, MapPin, User, FileText } from "lucide-react";
import { format } from "date-fns";
import { ar, fr } from "date-fns/locale";

interface MissionOrder {
  id: number;
  monsieur_madame: string;
  matricule: string;
  destination: string;
  purpose: string;
  start_date: string;
  end_date: string;
  status: string;
  file_path: string | null;
  created_at: string;
  type: string;
}

const MissionOrderHistory = () => {
  const [orders, setOrders] = useState<MissionOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [downloadingId, setDownloadingId] = useState<number | null>(null);
  const { language, t } = useLanguage();
  const { toast } = useToast();
  const { user } = useAuth();

  useEffect(() => {
    fetchOrders();
    // تم حذف رسالة الترحيب نهائياً
  }, [user, language]);

  const fetchOrders = async () => {
    try {
      const response = await axiosInstance.get('/mission-orders/user');
      setOrders(response.data);
      
      // رسالة تأكيد عند تحميل البيانات بنجاح
      if (response.data.length > 0) {
        // تم حذف رسالة النجاح من هنا
      } else {
        toast({
          title: language === 'ar' ? "📭 لا توجد طلبات" : "📭 Aucune demande",
          description: language === 'ar' 
            ? "لم يتم العثور على أي طلبات محفوظة"
            : "Aucune demande sauvegardée trouvée",
          variant: "default",
          className: "bg-yellow-50 border-yellow-200",
        });
      }
    } catch (error) {
      console.error('Error fetching orders:', error);
      toast({
        title: "خطأ",
        description: "حدث خطأ أثناء جلب الطلبات",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const downloadPDF = async (order: MissionOrder) => {
    if (!order.id) {
      toast({
        title: "خطأ",
        description: "لا يوجد ملف PDF لهذا الطلب",
        variant: "destructive",
      });
      return;
    }

    setDownloadingId(order.id);
    try {
      const response = await axiosInstance.get(`/download-pdf-db/${order.id}`, {
        responseType: 'blob'
      });
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `ordre_mission_${order.destination.replace(/\s+/g, '_')}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      
      toast({
        title: language === 'ar' ? "تم التحميل" : "Téléchargé",
        description: language === 'ar' ? "تم تحميل PDF بنجاح" : "PDF téléchargé avec succès",
        variant: "default",
        className: "bg-blue-50 border-blue-200",
      });
      // تم حذف الرسائل الإضافية هنا
    } catch (error) {
      console.error("Error downloading PDF:", error);
      toast({
        title: "خطأ",
        description: "حدث خطأ أثناء تحميل PDF",
        variant: "destructive",
      });
    } finally {
      setDownloadingId(null);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'rejected':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'urgent':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      default:
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'approved':
        return language === 'ar' ? 'مقبول' : 'Approuvé';
      case 'rejected':
        return language === 'ar' ? 'مرفوض' : 'Rejeté';
      case 'urgent':
        return language === 'ar' ? 'عاجل' : 'Urgent';
      default:
        return language === 'ar' ? 'قيد الانتظار' : 'En attente';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-green-50 to-blue-100 flex items-center justify-center p-4">
        <Card className="w-full max-w-md shadow-xl border-0 bg-white/80 backdrop-blur-sm">
          <CardContent className="pt-6 pb-6 md:pt-8 md:pb-8">
            <div className="flex flex-col items-center text-center gap-4">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <p className="text-slate-600">
                {language === 'ar' ? 'جاري التحميل...' : 'Chargement...'}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-green-50 to-blue-100 p-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6 md:mb-8">
          <div className="flex items-center gap-4">
            <Button 
              variant="outline"
              onClick={() => {
                // رسالة تأكيد
                toast({
                  title: language === 'ar' ? "🔙 العودة" : "🔙 Retour",
                  description: language === 'ar' 
                    ? "العودة إلى الصفحة السابقة"
                    : "Retour à la page précédente",
                  variant: "default",
                  className: "bg-blue-50 border-blue-200",
                });
                window.history.back();
              }}
              className="border-blue-500 text-blue-600 hover:bg-blue-50"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              {language === 'ar' ? 'رجوع' : 'Retour'}
            </Button>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-blue-600 to-green-600 bg-clip-text text-transparent">
                {language === 'ar' ? 'تاريخ طلبات المهام' : 'Historique des ordres de mission'}
              </h1>
              <p className="text-gray-600 text-sm md:text-base">
                {language === 'ar' ? 'جميع طلبات المهام المحفوظة' : 'Tous vos ordres de mission sauvegardés'}
              </p>
              <div className="mt-2 text-sm text-blue-600 font-medium">
                {language === 'ar' 
                  ? `إجمالي الطلبات المحفوظة: ${orders.length}`
                  : `Total des demandes sauvegardées: ${orders.length}`
                }
              </div>
            </div>
          </div>
          {/* زر عرض جميع الطلبات تمت إزالته */}
        </div>

        {orders.length === 0 ? (
          <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-sm">
            <CardContent className="pt-6 pb-6 md:pt-8 md:pb-8">
              <div className="flex flex-col items-center text-center gap-4">
                <FileText className="h-12 w-12 text-gray-400" />
                <div>
                  <h3 className="text-lg font-semibold text-gray-700 mb-2">
                    {language === 'ar' ? 'لا توجد طلبات' : 'Aucune demande'}
                  </h3>
                  <p className="text-gray-500">
                    {language === 'ar' ? 'لم تقم بإرسال أي طلب مهمة بعد' : 'Vous n\'avez pas encore soumis d\'ordre de mission'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:gap-6">
            {orders.map((order) => (
              <Card key={order.id} className="shadow-lg border-0 bg-white/80 backdrop-blur-sm hover:shadow-xl transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-gradient-to-r from-blue-600 to-green-600 flex items-center justify-center">
                        <User className="h-5 w-5 text-white" />
                      </div>
                      <div>
                        <CardTitle className="text-lg font-semibold text-slate-800">
                          {order.monsieur_madame}
                        </CardTitle>
                        <p className="text-sm text-slate-600">
                          {language === 'ar' ? 'رقم التسجيل:' : 'Matricule:'} {order.matricule}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(order.status)}`}>
                        {getStatusText(order.status)}
                      </span>
                      {order.file_path ? (
                        <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 border border-green-200">
                          {language === 'ar' ? 'PDF محفوظ' : 'PDF sauvegardé'}
                        </span>
                      ) : (
                        <span className="px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800 border border-gray-200">
                          {language === 'ar' ? 'لا يوجد PDF' : 'Pas de PDF'}
                        </span>
                      )}
                      {order.file_path && (
                        <Button
                          size="sm"
                          onClick={() => downloadPDF(order)}
                          disabled={downloadingId === order.id}
                          className="bg-blue-600 hover:bg-blue-700 text-white"
                        >
                          {downloadingId === order.id ? (
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
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex items-start gap-2">
                      <MapPin className="h-4 w-4 text-blue-600 mt-0.5" />
                      <div>
                        <p className="text-sm font-medium text-slate-700">
                          {language === 'ar' ? 'الوجهة:' : 'Destination:'}
                        </p>
                        <p className="text-sm text-slate-600">{order.destination}</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-2">
                      <Calendar className="h-4 w-4 text-green-600 mt-0.5" />
                      <div>
                        <p className="text-sm font-medium text-slate-700">
                          {language === 'ar' ? 'التواريخ:' : 'Dates:'}
                        </p>
                        <p className="text-sm text-slate-600">
                          {format(new Date(order.start_date), "dd/MM/yyyy", { locale: language === 'ar' ? ar : fr })} - {format(new Date(order.end_date), "dd/MM/yyyy", { locale: language === 'ar' ? ar : fr })}
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="mt-4">
                    <p className="text-sm font-medium text-slate-700 mb-1">
                      {language === 'ar' ? 'الغرض:' : 'Objet:'}
                    </p>
                    <p className="text-sm text-slate-600 line-clamp-2">{order.purpose}</p>
                  </div>
                  <div className="mt-3 text-xs text-slate-500">
                    {language === 'ar' ? 'تاريخ الإرسال:' : 'Date de soumission:'} {format(new Date(order.created_at), "dd/MM/yyyy HH:mm", { locale: language === 'ar' ? ar : fr })}
                  </div>
                  {order.file_path && (
                    <div className="mt-2 text-xs text-green-600">
                      {language === 'ar' ? '✅ PDF محفوظ في قاعدة البيانات' : '✅ PDF sauvegardé dans la base de données'}
                    </div>
                  )}
                  {order.file_path && (
                    <div className="mt-1 text-xs text-gray-500">
                      {language === 'ar' ? '📄 يمكن تحميل PDF من قاعدة البيانات' : '📄 PDF téléchargeable depuis la base de données'}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default MissionOrderHistory; 