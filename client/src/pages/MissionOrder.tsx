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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { CalendarIcon, CheckCircle } from "lucide-react";
import { format } from "date-fns";
import { ar, fr } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/contexts/LanguageContext";
import jsPDF from "jspdf";
import { useToast } from "@/hooks/use-toast";
import axios from "axios";
import { useAuth } from '@/contexts/AuthContext';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';

// Import the Arabic font data
import { AmiriFont } from "../fonts/AmiriFont";

const MissionOrder = () => {
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const { language, t } = useLanguage();
  const { toast } = useToast();
  const { user } = useAuth();
  const [showUrgentDialog, setShowUrgentDialog] = useState(false);
  const [pendingFormData, setPendingFormData] = useState<z.infer<typeof formSchema> | null>(null);

  // تعريف الـ Schema للتحقق من صحة البيانات
  const formSchema = z.object({
    monsieurMadame: z.string().min(3, { message: language === 'ar' ? "يرجى إدخال اسم السيد/السيدة" : "Veuillez entrer le nom complet" }),
    matricule: z.string().min(1, { message: language === 'ar' ? "يرجى إدخال رقم التسجيل" : "Veuillez entrer le numéro de matricule" }),
    destination: z.string().min(3, {
      message: language === 'ar' ? "يرجى ذكر وجهة المهمة" : "Veuillez spécifier la destination de la mission",
    }),
    purpose: z.string().min(5, {
      message: language === 'ar' ? "يرجى وصف الغرض من المهمة" : "Veuillez décrire l'objet de la mission",
    }),
    startDate: z.date({
      required_error: language === 'ar' ? "يرجى تحديد تاريخ البداية" : "Veuillez sélectionner la date de début",
    }),
    endDate: z.date({
      required_error: language === 'ar' ? "يرجى تحديد تاريخ النهاية" : "Veuillez sélectionner la date de fin",
    }),
    conducteur: z.string().optional(),
    conducteurMatricule: z.string().optional(),
    startTime: z.string().optional(),
    endTime: z.string().optional(),
    additionalInfo: z.string().optional(),
    status: z.string().optional(),
  });

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      monsieurMadame: "",
      matricule: "",
      destination: "",
      purpose: "",
      additionalInfo: "",
      conducteur: "",
      conducteurMatricule: "",
      startTime: "",
      endTime: "",
      status: "",
    },
  });

  useEffect(() => {
    if (user && user.name) {
      form.setValue('monsieurMadame', user.name);
    }
  }, [user]);

  // دالة للإرسال
  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    setIsGenerating(true);
    try {
      // Step 1: Send data to the backend
      const response = await axios.post('http://localhost:8000/api/mission-orders', { ...values, type: 'missionOrder' }, { withCredentials: true });
      console.log('Backend response:', response.data);

      // Step 2: Generate PDF
      await generatePDF(values);
      setIsSubmitted(true);
      
      // Show success toast
      toast({
        title: language === 'ar' ? "تم بنجاح" : "Envoyé avec succès",
        description: language === 'ar'
          ? "تم إنشاء أمر المهمة وتحميله بنجاح."
          : "L'ordre de mission a été créé et téléchargé avec succès.",
        variant: "default",
        className: "bg-green-50 border-green-200",
      });
    } catch (error) {
      console.error("Error submitting mission order:", error);
      toast({
        title: "خطأ",
        description: "حدث خطأ أثناء معالجة الطلب. يرجى المحاولة مرة أخرى.",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

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

  // دالة لتوليد PDF
  const generatePDF = async (data: z.infer<typeof formSchema>) => {
    const doc = new jsPDF('p', 'mm', 'a4');
    const currentDate = format(new Date(), "EEEE d MMMM yyyy", { locale: fr });

    // رأس المستند
    const logoPath = "/lovable-uploads/d44e75ac-eac5-4ed3-bf43-21a71c6a089d.png";
    
    // Load and add logo
    try {
      const img = new Image();
      img.src = logoPath;
      await new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = reject; // Handle potential loading errors
      });
      // Adjusted logo position and size to match the image
      doc.addImage(img, "PNG", 6, 6, 98, 33); // Adjusted position and size
    } catch (error) {
      console.error("Error loading logo:", error);
    }

    // Add Amiri font to PDF (if still needed for any Arabic text)
    doc.addFileToVFS("Amiri-Regular.ttf", AmiriFont);
    doc.addFont("Amiri-Regular.ttf", "Amiri", "normal");

    // Set font for Latin text (like French)
    doc.setFont("helvetica", "normal");
    doc.setFontSize(11);
    // Adjusted vertical and horizontal position based on image
    doc.text("N/Réf : OFP/DR Casa Settat/          / N° :           …/2025", 20, 50); // Adjusted Y
    doc.text(`Casablanca, le ${currentDate}`, 140, 50); // Adjusted X and Y

    // العنوان
    doc.setFont("helvetica", "bolditalic"); // Changed to bolditalic based on image
    doc.setFontSize(14);
    // Adjusted vertical position of titles
    doc.text("ORDRE DE MISSION", 105, 65, { align: "center" }); // Centered and adjusted Y
    doc.text("OFFICE DE LA FORMATION PROFESSIONNELLE", 105, 72, { align: "center" }); // Centered and adjusted Y
    doc.text("ET DE LA PROMOTION DU TRAVAIL", 105, 79, { align: "center" }); // Centered and adjusted Y

    doc.setFont("helvetica", "bold"); // Bold for DESIGNE
    doc.setFontSize(14);
    doc.text("D E S I G N E", 105, 90, { align: "center" }); // Centered and adjusted Y

    // تفاصيل المهمة
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    
    // Drawing the table structure based on the image - Adjusted starting Y
    const startY = 95; // Adjusted starting Y
    const col1X = 20;
    const col2X = 105;
    const endX = 190;
    const rowHeight = 10;

    // Header row
    doc.rect(col1X, startY, endX - col1X, rowHeight);
    doc.text("Monsieur/Madame :", col1X + 5, startY + rowHeight / 2 + 2);
    doc.text(data.monsieurMadame || "", col1X + 50, startY + rowHeight / 2 + 2);
    doc.text("Matricule :", col2X + 5, startY + rowHeight / 2 + 2);
    doc.text(data.matricule || "", col2X + 30, startY + rowHeight / 2 + 2);

    // Row 1
    doc.rect(col1X, startY + rowHeight, endX - col1X, rowHeight);
    doc.text("De se rendre à           :", col1X + 5, startY + rowHeight * 1.5 + 2);
    doc.text(data.destination, col1X + 50, startY + rowHeight * 1.5 + 2);

    // Row 2
    doc.rect(col1X, startY + rowHeight * 2, endX - col1X, rowHeight);
    doc.text("Pour accomplir la mission suivante :", col1X + 5, startY + rowHeight * 2.5 + 2);
    doc.text(data.purpose, col1X + 80, startY + rowHeight * 2.5 + 2);

    // Row 3
    doc.rect(col1X, startY + rowHeight * 3, endX - col1X, rowHeight);
    doc.text("Conducteur :", col1X + 5, startY + rowHeight * 3.5 + 2);
    doc.text(data.conducteur || "", col1X + 40, startY + rowHeight * 3.5 + 2);
    doc.text("Matricule :", col2X + 5, startY + rowHeight * 3.5 + 2);
    doc.text(data.conducteurMatricule || "", col2X + 30, startY + rowHeight * 3.5 + 2);

    // Row 4
    doc.rect(col1X, startY + rowHeight * 4, endX - col1X, rowHeight);
   // النص الأساسي
doc.text("Date de départ :", col1X + 5, startY + rowHeight * 4.5 + 2);

// التاريخ - معدل ليكون قريباً من النص
doc.text(format(data.startDate, "yyyy-MM-dd"), col1X + 45, startY + rowHeight * 4.5 + 2);
    doc.text("Heure :", col2X + 5, startY + rowHeight * 4.5 + 2);
    doc.text(data.startTime || "", col2X + 25, startY + rowHeight * 4.5 + 2);

    // Row 5
    doc.rect(col1X, startY + rowHeight * 5, endX - col1X, rowHeight);
  // النص الأساسي
doc.text("Date de retour :", col1X + 5, startY + rowHeight * 5.5 + 2);

// التاريخ - نفس الإزاحة المستخدمة في "Date de départ"
doc.text(format(data.endDate, "yyyy-MM-dd"), col1X + 45, startY + rowHeight * 5.5 + 2);
    doc.text("Heure :", col2X + 5, startY + rowHeight * 5.5 + 2);
    doc.text(data.endTime || "", col2X + 25, startY + rowHeight * 5.5 + 2);

    // Row 6
    const row6Height = 20; // Increased height for this row
    doc.rect(col1X, startY + rowHeight * 6, endX - col1X, row6Height);
    doc.text("L'intéressé(e) utilisera :", col1X + 5, startY + rowHeight * 6 + row6Height / 2 + 2);
    doc.text(data.additionalInfo || "", col1X + 60, startY + rowHeight * 6 + row6Height / 2 + 2);

    // Cadre réservé à l'entité de destinations
    const cadreY = startY + rowHeight * 6 + row6Height + 10; // Position below the table
    doc.setFont("helvetica", "bold");
    doc.setFillColor(220, 220, 220);
    doc.rect(col1X, cadreY, endX - col1X, rowHeight, "F");
    doc.text("Cadre réservé à l'entité de destinations", col1X + (endX - col1X) / 2, cadreY + rowHeight / 2 + 2, { align: "center" });

    // Visa section
    const visaY = cadreY + rowHeight;
    const visaSectionHeight = 40;
    doc.setFont("helvetica", "normal");
    doc.rect(col1X, visaY, endX - col1X, visaSectionHeight);
    doc.line(col2X, visaY, col2X, visaY + visaSectionHeight);
    doc.text("Visa d'arrivée", col1X + (col2X - col1X) / 2, visaY + rowHeight / 2 + 2, { align: "center" });
    doc.text("Visa de départ", col2X + (endX - col2X) / 2, visaY + rowHeight / 2 + 2, { align: "center" });
    doc.line(col1X, visaY + rowHeight, endX, visaY + rowHeight);
    doc.text("Date et Heure d'arrivée :", col1X + 5, visaY + rowHeight * 1.5 + 2);
    doc.text("Date et Heure de départ :", col2X + 5, visaY + rowHeight * 1.5 + 2);
    doc.text("Cachet et signature :", col1X + 5, visaY + rowHeight * 2.5 + 2);
    doc.text("Cachet et signature :", col2X + 5, visaY + rowHeight * 2.5 + 2);

    // ملاحظة
    doc.setFontSize(9);
    doc.setFont("helvetica", "italic");
    const noteY = visaY + visaSectionHeight + 5; // Adjusted vertical position
    doc.text("NB : Le visa de départ est obligatoire pour les missions au-delà d'une journée.", 30, noteY);

    // حفظ الـ PDF
    doc.save(`ordre_mission_${data.destination.replace(/\s+/g, '_')}.pdf`);
  };

  if (isSubmitted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-green-50 to-blue-100 flex items-center justify-center p-4">
        <Card className="w-full max-w-md shadow-xl border-0 bg-white/80 backdrop-blur-sm">
          <CardContent className="pt-6 pb-6 md:pt-8 md:pb-8">
            <div className="flex flex-col items-center text-center gap-4 md:gap-6">
              <div className="h-16 w-16 md:h-20 md:w-20 rounded-full bg-gradient-to-r from-blue-600 to-green-600 flex items-center justify-center shadow-lg">
                <CheckCircle className="h-8 w-8 md:h-10 md:w-10 text-white" />
              </div>
              <div>
                <h2 className="text-xl md:text-2xl font-bold mb-2 md:mb-3 text-slate-800">{t('successTitle')}</h2>
                <p className="text-slate-600 leading-relaxed mb-4 md:mb-6 text-sm md:text-base">{t('successDescMission')}</p>
                <Button 
                  onClick={() => {
                    setIsSubmitted(false);
                    form.reset();
                  }}
                  className="border-blue-500 text-blue-600 hover:bg-blue-50 px-6 md:px-8 py-2 md:py-3 rounded-lg text-sm md:text-base"
                >
                  {t('newRequestBtn')}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-green-50 to-blue-100 p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-6 md:mb-8">
          <h1 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-blue-600 to-green-600 bg-clip-text text-transparent mb-2">
            {language === 'ar' ? 'أمر المهمة' : 'Ordre de Mission'}
          </h1>
          <p className="text-gray-600 text-sm md:text-base">
            {language === 'ar' ? 'قم بملء البيانات المطلوبة لإصدار أمر المهمة' : 'Veuillez remplir les informations requises pour obtenir votre ordre de mission'}
          </p>
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
                  <FormField
                    control={form.control}
                    name="monsieurMadame"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-slate-700 font-medium">
                          {language === 'ar' ? 'السيد/السيدة' : 'Monsieur/Madame'}
                        </FormLabel>
                        <FormControl>
                          <Input 
                            {...field} 
                            className="border-blue-300 focus:border-blue-500 focus:ring-blue-200"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="matricule"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-slate-700 font-medium">
                          {language === 'ar' ? 'الرقم التسجيلي' : 'Matricule'}
                        </FormLabel>
                        <FormControl>
                          <Input 
                            {...field} 
                            className="border-blue-300 focus:border-blue-500 focus:ring-blue-200"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="destination"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-slate-700 font-medium">
                          {language === 'ar' ? 'الوجهة' : 'Destination'}
                        </FormLabel>
                        <FormControl>
                          <Input 
                            {...field} 
                            className="border-blue-300 focus:border-blue-500 focus:ring-blue-200"
                            placeholder={t("destinationPlaceholder")}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="purpose"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-slate-700 font-medium">
                          {language === 'ar' ? 'الغرض' : 'Objet'}
                        </FormLabel>
                        <FormControl>
                          <Textarea
                            {...field}
                            className="resize-none border-blue-300 focus:border-blue-500 focus:ring-blue-200"
                            placeholder={t("purposePlaceholder")}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="startDate"
                    render={({ field }) => (
                      <FormItem className="flex flex-col">
                        <FormLabel className="text-slate-700 font-medium">
                          {language === 'ar' ? 'تاريخ البداية' : 'Date de départ'}
                        </FormLabel>
                        <Popover>
                          <PopoverTrigger asChild>
                            <FormControl>
                              <Button
                                variant={"outline"}
                                className={cn(
                                  "w-full pl-3 text-left font-normal border-blue-300 focus:border-blue-500 focus:ring-blue-200",
                                  !field.value && "text-muted-foreground"
                                )}
                              >
                                {field.value ? (
                                  format(field.value, "yyyy-MM-dd")
                                ) : (
                                  <span>{t("pickDate")}</span>
                                )}
                                <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                              </Button>
                            </FormControl>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="start">
                            <Calendar
                              mode="single"
                              selected={field.value}
                              onSelect={field.onChange}
                              disabled={(date) =>
                                date < new Date() || date < new Date("1900-01-01")
                              }
                              initialFocus
                            />
                          </PopoverContent>
                        </Popover>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="startTime"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-slate-700 font-medium">
                          {language === 'ar' ? 'وقت البداية' : 'Heure de départ'}
                        </FormLabel>
                        <FormControl>
                          <Input 
                            type="time" 
                            {...field} 
                            className="border-blue-300 focus:border-blue-500 focus:ring-blue-200"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="endDate"
                    render={({ field }) => (
                      <FormItem className="flex flex-col">
                        <FormLabel className="text-slate-700 font-medium">
                          {language === 'ar' ? 'تاريخ النهاية' : 'Date de retour'}
                        </FormLabel>
                        <Popover>
                          <PopoverTrigger asChild>
                            <FormControl>
                              <Button
                                variant={"outline"}
                                className={cn(
                                  "w-full pl-3 text-left font-normal border-blue-300 focus:border-blue-500 focus:ring-blue-200",
                                  !field.value && "text-muted-foreground"
                                )}
                              >
                                {field.value ? (
                                  format(field.value, "yyyy-MM-dd")
                                ) : (
                                  <span>{t("pickDate")}</span>
                                )}
                                <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                              </Button>
                            </FormControl>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="start">
                            <Calendar
                              mode="single"
                              selected={field.value}
                              onSelect={field.onChange}
                              disabled={(date) =>
                                date < new Date() || date < new Date("1900-01-01")
                              }
                              initialFocus
                            />
                          </PopoverContent>
                        </Popover>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="endTime"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-slate-700 font-medium">
                          {language === 'ar' ? 'وقت النهاية' : 'Heure de retour'}
                        </FormLabel>
                        <FormControl>
                          <Input 
                            type="time" 
                            {...field} 
                            className="border-blue-300 focus:border-blue-500 focus:ring-blue-200"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="conducteur"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-slate-700 font-medium">
                          {language === 'ar' ? 'السائق' : 'Conducteur'}
                        </FormLabel>
                        <FormControl>
                          <Input 
                            {...field} 
                            className="border-blue-300 focus:border-blue-500 focus:ring-blue-200"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="conducteurMatricule"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-slate-700 font-medium">
                          {language === 'ar' ? 'رقم تسجيل السائق' : 'Matricule Conducteur'}
                        </FormLabel>
                        <FormControl>
                          <Input 
                            {...field} 
                            className="border-blue-300 focus:border-blue-500 focus:ring-blue-200"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="additionalInfo"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-slate-700 font-medium">
                        {language === 'ar' ? 'معلومات إضافية' : 'Informations supplémentaires'}
                      </FormLabel>
                      <FormControl>
                        <Textarea
                          {...field}
                          className="resize-none border-blue-300 focus:border-blue-500 focus:ring-blue-200"
                          placeholder={t("additionalInfoPlaceholder")}
                          rows={4}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

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
      </div>
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
  );
};

export default MissionOrder;
