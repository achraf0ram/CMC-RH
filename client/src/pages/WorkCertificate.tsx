import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useLanguage } from "@/contexts/LanguageContext";
import jsPDF from "jspdf";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { CheckCircle } from "lucide-react";
import axios from "axios";
import { useAuth } from '@/contexts/AuthContext';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { axiosInstance } from '../components/Api/axios';
import { SuccessMessage } from "@/components/SuccessMessage";

// Import the Arabic font data
import { AmiriFont } from "../fonts/AmiriFont";

const WorkCertificate = () => {
  const { t, language } = useLanguage();

  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const logoPath = "/lovable-uploads/d44e75ac-eac5-4ed3-bf43-21a71c6a089d.png";
  const { toast } = useToast();
  const { user } = useAuth();
  const [showUrgentDialog, setShowUrgentDialog] = useState(false);
  const [pendingFormData, setPendingFormData] = useState<z.infer<typeof formSchema> | null>(null);
  const [lastSubmittedCertificate, setLastSubmittedCertificate] = useState<any>(null);
  const [fileInfo, setFileInfo] = useState<any>(null);
  const [successData, setSuccessData] = useState<any>(null);

  // Define form schema inside the component to access the language context
  const formSchema = z.object({
    fullName: z.string().min(3, { message: language === 'ar' ? "يرجى إدخال الاسم الكامل" : "Veuillez entrer le nom complet" }),
    matricule: z.string().min(1, { message: language === 'ar' ? "يرجى إدخال رقم التسجيل" : "Veuillez entrer le numéro de matricule" }),
    grade: z.string().optional(),
    hireDate: z.string().optional(),
    function: z.string().optional(),
    purpose: z.string().min(5, { message: language === 'ar' ? "يرجى وصف الغرض من الشهادة" : "Veuillez décrire l'objet de l'attestation" }),
    additionalInfo: z.string().optional(),
    status: z.string().optional(),
  });

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      fullName: "",
      matricule: "",
      grade: "",
      hireDate: "",
      function: "",
      purpose: "",
      additionalInfo: "",
      status: "",
    },
  });

  useEffect(() => {
    if (user && user.name) {
      form.setValue('fullName', user.name);
    }
  }, [user]);

  const handleFormSubmit = (values: z.infer<typeof formSchema>) => {
    setPendingFormData(values);
    setShowUrgentDialog(true);
  };

  const handleUrgentChoice = async (isUrgent: boolean) => {
    if (!pendingFormData) return;
    await onSubmit({ ...pendingFormData, status: isUrgent ? 'urgent' : 'pending' });
    setShowUrgentDialog(false);
    setPendingFormData(null);
  };

  const onSubmit = async (data: z.infer<typeof formSchema>) => {
    setIsGenerating(true);
    try {
      // Generate PDF from form data
      const doc = new jsPDF("p", "mm", "a4");
      const currentDate = format(new Date(), "dd/MM/yyyy");
      // Load and add logo
      try {
        const img = new Image();
        img.src = logoPath;
        await new Promise((resolve) => {
          img.onload = resolve;
        });
        doc.addImage(img, "PNG", 6, 6, 98, 33);
      } catch (error) {}
      // --- Arabic Font Setup ---
      doc.addFileToVFS("Amiri-Regular.ttf", AmiriFont);
      doc.addFont("Amiri-Regular.ttf", "Amiri", "normal");
      doc.setFont("helvetica", "normal");
      doc.setFontSize(12);
      doc.text("N/Réf. : OFP/DR CASA SETTAT/DAAL/SRRH /N°", 20, 45);
      doc.text(`Casablanca, le ${currentDate}`, 140, 45);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(16);
      doc.text("ATTESTATION DE TRAVAIL", 75, 65);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(12);
      doc.text("Nous soussignés, Directeur Régional Casablanca-Settat de l'Office de la", 20, 75);
      doc.text("Formation Professionnelle et de la Promotion du Travail (OFPPT), attestons", 20, 80);
      doc.text("que :", 20, 85);
      doc.text(`Monsieur : ${data.fullName}`, 20, 95);
      doc.text(`Matricule : ${data.matricule}`, 20, 105);
      doc.text(`Grade : ${data.grade || ""}`, 20, 115);
      doc.text(`Est employé au sein de notre organisme depuis le : ${data.hireDate || ""}`, 20, 125);
      doc.text(`En qualité de : ${data.function || ""}`, 20, 135);
      doc.text("La présente attestation est délivrée à l'intéressé pour servir et valoir ce que de droit.", 20, 165);
      doc.setFont('Amiri', 'normal');
      doc.setFontSize(9);
      doc.text("المديرية الجهوية لجهة الدارالبيضاء – سطات", 190, 230, { align: "right" });
      doc.text( " زنقة الكابورال إدريس اشباكو,50", 190, 234, { align: "right" });
      doc.text("عين البرجة - الدار البيضاء", 190, 238, { align: "right" });
      doc.text("الهاتف : 82 00 60 22 05 - الفاكس : 65 6039 22 05", 190, 242, { align: "right" });
      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      doc.text("Direction Régionale CASABLANCA –SETTAT", 20, 230);
      doc.text("50, rue Caporal Driss Chbakou", 20, 234);
      doc.text("Ain Bordja-Casablanca", 20, 238);
      doc.text("Tél :05 22 60 00 82 - Fax :05 22 6039 65", 20, 242);
      const pdfBlob = doc.output("blob");
      const formData = new FormData();
      formData.append("fullName", data.fullName);
      formData.append("matricule", data.matricule);
      formData.append("grade", data.grade || "");
      formData.append("hireDate", data.hireDate || "");
      formData.append("function", data.function || "");
      formData.append("purpose", data.purpose);
      formData.append("additionalInfo", data.additionalInfo || "");
      formData.append("type", "workCertificate");
      formData.append("pdf", pdfBlob, "attestation_de_travail.pdf");
      formData.append("status", data.status || 'pending');
      const response = await axiosInstance.post("http://localhost:8000/api/work-certificates", formData, {
        headers: { "Content-Type": "multipart/form-data" },
        withCredentials: true,
      });
      setIsSubmitted(true);
      setLastSubmittedCertificate(response.data.data);
      setFileInfo(response.data.file_info);
      setSuccessData(response.data.data); // Save the response for the success message
      toast({
        title: language === 'ar' ? "📤 تم الإرسال" : "📤 Envoyé à l'admin",
        description: language === 'ar'
          ? "تم إرسال الطلب إلى الإدارة بنجاح"
          : "Les demandes ont été envoyées à l'administration avec succès",
        variant: "default",
        className: "bg-green-50 border-green-200",
      });
    } catch (error) {
      toast({
        title: language === 'ar' ? "خطأ" : "Erreur",
        description: language === 'ar' ? "حدث خطأ أثناء إرسال الطلب." : "Une erreur s'est produite lors de l'envoi de la demande.",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  if (successData) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <SuccessMessage
          title={language === 'ar' ? 'تم إرسال الطلب بنجاح' : 'Demande envoyée avec succès'}
          description={language === 'ar' ? 'تم حفظ طلبك وسيتم معالجته قريباً.' : 'Votre demande a été enregistrée et sera traitée prochainement.'}
          primaryButtonText={language === 'ar' ? 'طلب جديد' : 'Nouvelle demande'}
          onPrimary={() => window.location.reload()}
          secondaryButtonText={language === 'ar' ? 'عرض جميع الطلبات' : 'Voir toutes les demandes'}
          onSecondary={() => (window.location.href = '/all-requests')}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-green-50 to-blue-100 p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-6 md:mb-8">
          <h1 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-blue-600 to-green-600 bg-clip-text text-transparent mb-2">
            {language === 'ar' ? 'شهادة العمل' : 'Attestation de Travail'}
          </h1>
          <p className="text-gray-600 text-sm md:text-base">
            {language === 'ar' ? 'قم بملء البيانات المطلوبة لإصدار شهادة العمل' : 'Veuillez remplir les informations requises pour obtenir votre attestation de travail'}
          </p>
        </div>
        <div className="flex justify-start mt-4 mb-2">
          <Button 
            variant="outline"
            onClick={() => {
              toast({
                title: language === 'ar' ? "📋 عرض جميع الطلبات" : "📋 Voir toutes les demandes",
                description: language === 'ar' 
                  ? "انتقال إلى صفحة جميع الطلبات"
                  : "Navigation vers la page de toutes les demandes",
                variant: "default",
                className: "bg-blue-50 border-blue-200",
              });
              window.location.href = '/all-requests';
            }}
            className="border-blue-500 text-blue-600 hover:bg-blue-50 px-6 py-2 rounded-lg shadow-sm font-semibold text-base"
          >
            {language === 'ar' ? 'عرض جميع الطلبات' : 'Voir tous les demandes'}
          </Button>
        </div>

        <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-sm">
          <CardHeader className="bg-gradient-to-r from-blue-600 to-green-600 text-white rounded-t-lg p-4 md:p-6">
            <CardTitle className="text-lg md:text-xl font-semibold text-center">
              {language === 'ar' ? 'معلومات الطلب' : 'Informations de la demande'}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 md:p-8">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-4 md:space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                  <FormField control={form.control} name="fullName" render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-slate-700 font-medium">
                        {language === 'ar' ? 'الاسم الكامل' : 'Nom complet'}
                      </FormLabel>
                      <FormControl>
                        <Input 
                          {...field} 
                          className="border-blue-300 focus:border-blue-500 focus:ring-blue-200"
                          placeholder={language === 'ar' ? "أدخل الاسم الكامل" : "Entrez le nom complet"}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />

                  <FormField control={form.control} name="matricule" render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-slate-700 font-medium">
                        {language === 'ar' ? 'الرقم التسجيلي' : 'Matricule'}
                      </FormLabel>
                      <FormControl>
                        <Input 
                          {...field} 
                          className="border-blue-300 focus:border-blue-500 focus:ring-blue-200"
                          placeholder={language === 'ar' ? "أدخل الرقم التسجيلي" : "Entrez le matricule"}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />

                  <FormField control={form.control} name="grade" render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-slate-700 font-medium">
                        {language === 'ar' ? 'الرتبة' : 'Grade'}
                      </FormLabel>
                      <FormControl>
                        <Input 
                          {...field} 
                          className="border-blue-300 focus:border-blue-500 focus:ring-blue-200"
                          placeholder={language === 'ar' ? "أدخل الرتبة" : "Entrez le grade"}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />

                  <FormField control={form.control} name="hireDate" render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-slate-700 font-medium">
                        {language === 'ar' ? 'تاريخ التوظيف' : 'Date d\'embauche'}
                      </FormLabel>
                      <FormControl>
                        <Input 
                          type="date" 
                          {...field} 
                          className="border-blue-300 focus:border-blue-500 focus:ring-blue-200"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />

                  <FormField control={form.control} name="function" render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-slate-700 font-medium">
                        {language === 'ar' ? 'الوظيفة' : 'Fonction'}
                      </FormLabel>
                      <FormControl>
                        <Input 
                          {...field} 
                          className="border-blue-300 focus:border-blue-500 focus:ring-blue-200"
                          placeholder={language === 'ar' ? "أدخل الوظيفة" : "Entrez la fonction"}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />

                  <FormField control={form.control} name="purpose" render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-slate-700 font-medium">
                        {language === 'ar' ? 'الغرض' : 'Objet'}
                      </FormLabel>
                      <FormControl>
                        <Input 
                          {...field} 
                          className="border-blue-300 focus:border-blue-500 focus:ring-blue-200"
                          placeholder={language === 'ar' ? "أدخل الغرض من الشهادة" : "Entrez l'objet"}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                </div>

                <FormField control={form.control} name="additionalInfo" render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-slate-700 font-medium">
                      {language === 'ar' ? 'معلومات إضافية' : 'Informations supplémentaires'}
                    </FormLabel>
                    <FormControl>
                      <Textarea 
                        {...field} 
                        className="resize-none border-blue-300 focus:border-blue-500 focus:ring-blue-200" 
                        placeholder={language === 'ar' ? "أدخل أي معلومات إضافية" : "Entrez les informations supplémentaires"}
                        rows={4}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />

                <div className="flex justify-center pt-4 md:pt-6">
                  <Button 
                    type="submit" 
                    disabled={isGenerating}
                    className="w-full md:w-auto px-8 py-3 bg-gradient-to-r from-blue-600 to-green-600 hover:from-blue-700 hover:to-green-700 text-white font-medium rounded-lg shadow-lg hover:shadow-xl transition-all duration-200"
                  >
                    {isGenerating ? 
                      (language === 'ar' ? "جاري المعالجة..." : "Traitement en cours...") 
                      : (language === 'ar' ? "إرسال وتحميل PDF" : "Envoyer et télécharger le PDF")}
                  </Button>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>

        {/* مربع حوار تحديد حالة الطلب */}
        <Dialog open={showUrgentDialog} onOpenChange={setShowUrgentDialog}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle
                className="text-lg font-bold text-center"
                dir={language === 'fr' ? 'ltr' : undefined}
              >
                {language === 'ar' ? 'هل هذا الطلب عاجل؟' : 'Cette demande est-elle urgente\u00A0?'}
              </DialogTitle>
            </DialogHeader>
            <DialogFooter className="flex flex-row justify-center gap-6 mt-6">
              <button
                type="button"
                className="w-28 py-2 rounded-lg border border-gray-300 bg-white text-gray-700 hover:bg-gray-100 font-semibold text-base transition"
                onClick={() => handleUrgentChoice(false)}
              >
                {language === 'ar' ? 'لا' : 'Non'}
              </button>
              <button
                type="button"
                className="w-28 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700 font-semibold text-base transition"
                onClick={() => handleUrgentChoice(true)}
              >
                {language === 'ar' ? 'نعم' : 'Oui'}
              </button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default WorkCertificate;
