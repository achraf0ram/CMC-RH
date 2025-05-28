import { useState } from "react";
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

// Import the Arabic font data
import { AmiriFont } from "../fonts/AmiriFont";

// تعريف الـ Schema للتحقق من صحة البيانات
const formSchema = z.object({
  monsieurMadame: z.string().min(3, { message: "يرجى إدخال اسم السيد/السيدة" }),
  matricule: z.string().min(1, { message: "يرجى إدخال رقم التسجيل" }),
  destination: z.string().min(3, {
    message: "يرجى ذكر وجهة المهمة",
  }),
  purpose: z.string().min(5, {
    message: "يرجى وصف الغرض من المهمة",
  }),
  startDate: z.date({
    required_error: "يرجى تحديد تاريخ البداية",
  }),
  endDate: z.date({
    required_error: "يرجى تحديد تاريخ النهاية",
  }),
  conducteur: z.string().optional(),
  conducteurMatricule: z.string().optional(),
  startTime: z.string().optional(),
  endTime: z.string().optional(),
  additionalInfo: z.string().optional(),
});

const MissionOrder = () => {
  const [isSubmitted, setIsSubmitted] = useState(false);
  const { language, t } = useLanguage();

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
    },
  });

  // دالة للإرسال
  const onSubmit = (values: z.infer<typeof formSchema>) => {
    console.log(values);
    setIsSubmitted(true);
    generatePDF(values); // توليد PDF بعد الإرسال
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
    doc.line(col2X, startY + rowHeight, col2X, startY + rowHeight * 2);
    doc.text("De se rendre à           :", col1X + 5, startY + rowHeight * 1.5 + 2);
    doc.text(data.destination, col1X + 50, startY + rowHeight * 1.5 + 2);

    // Row 2
    doc.rect(col1X, startY + rowHeight * 2, endX - col1X, rowHeight);
    doc.text("Pour accomplir la mission suivante :", col1X + 5, startY + rowHeight * 2.5 + 2);
    doc.text(data.purpose, col1X + 80, startY + rowHeight * 2.5 + 2);

    // Row 3
    doc.rect(col1X, startY + rowHeight * 3, endX - col1X, rowHeight);
    doc.line(col2X, startY + rowHeight * 3, col2X, startY + rowHeight * 4);
    doc.text("Conducteur :", col1X + 5, startY + rowHeight * 3.5 + 2);
    doc.text(data.conducteur || "", col1X + 40, startY + rowHeight * 3.5 + 2);
    doc.text("Matricule :", col2X + 5, startY + rowHeight * 3.5 + 2);
    doc.text(data.conducteurMatricule || "", col2X + 30, startY + rowHeight * 3.5 + 2);

    // Row 4
    doc.rect(col1X, startY + rowHeight * 4, endX - col1X, rowHeight);
    doc.line(col2X, startY + rowHeight * 4, col2X, startY + rowHeight * 5);
   // النص الأساسي
doc.text("Date de départ :", col1X + 5, startY + rowHeight * 4.5 + 2);

// التاريخ - معدل ليكون قريباً من النص
doc.text(format(data.startDate, "yyyy-MM-dd"), col1X + 45, startY + rowHeight * 4.5 + 2);
    doc.text("Heure :", col2X + 5, startY + rowHeight * 4.5 + 2);
    doc.text(data.startTime || "", col2X + 25, startY + rowHeight * 4.5 + 2);

    // Row 5
    doc.rect(col1X, startY + rowHeight * 5, endX - col1X, rowHeight);
    doc.line(col2X, startY + rowHeight * 5, col2X, startY + rowHeight * 6);
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

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">{t("missionOrderTitle")}</h1>

      {isSubmitted ? (
        <Card className="border-green-200 bg-green-50">
          <CardContent className="pt-6">
            <div className="flex flex-col items-center text-center gap-4">
              <div className="h-16 w-16 rounded-full bg-green-100 flex items-center justify-center">
                <CheckCircle className="h-8 w-8 text-green-600" />
              </div>
              <div>
                <h2 className="text-xl font-semibold mb-2">{t("requestSubmitted")}</h2>
                <p className="text-muted-foreground">
                  {t("requestReviewMessage")}
                  <br />
                  {t("followUpMessage")}
                </p>
                <Button className="mt-4" onClick={() => setIsSubmitted(false)}>
                  {t("newRequest")}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>{t("requestInfo")}</CardTitle>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <FormField
                  control={form.control}
                  name="monsieurMadame"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Monsieur/Madame :</FormLabel>
                      <FormControl>
                        <Input {...field} />
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
                      <FormLabel>Matricule :</FormLabel>
                      <FormControl>
                        <Input {...field} />
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
                      <FormLabel>De se rendre à :</FormLabel>
                      <FormControl>
                        <Input placeholder={t("destinationPlaceholder")} {...field} />
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
                      <FormLabel>Pour accomplir la mission suivante :</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder={t("purposePlaceholder")}
                          className="resize-none"
                          {...field}
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
                      <FormLabel>Date de départ :</FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant={"outline"}
                              className={cn(
                                "w-full pl-3 text-left font-normal",
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
                      <FormLabel>Heure de départ :</FormLabel>
                      <FormControl>
                        <Input type="time" {...field} />
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
                      <FormLabel>Date de retour :</FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant={"outline"}
                              className={cn(
                                "w-full pl-3 text-left font-normal",
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
                      <FormLabel>Heure de retour :</FormLabel>
                      <FormControl>
                        <Input type="time" {...field} />
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
                      <FormLabel>Conducteur :</FormLabel>
                      <FormControl>
                        <Input {...field} />
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
                      <FormLabel>Matricule Conducteur :</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="additionalInfo"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>L'intéressé(e) utilisera :</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder={t("additionalInfoPlaceholder")}
                          className="resize-none"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button type="submit" className="w-full">
                  إرسال وتحميل PDF
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default MissionOrder;
