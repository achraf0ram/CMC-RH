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
import { CalendarIcon, CheckCircle, FileImage } from "lucide-react";
import { format } from "date-fns";
import { ar, fr } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/contexts/LanguageContext";
import jsPDF from "jspdf";

// تعريف الـ Schema للتحقق من صحة البيانات
const formSchema = z.object({
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
  additionalInfo: z.string().optional(),
  signature: z.instanceof(File).optional(),
});

const MissionOrder = () => {
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [signaturePreview, setSignaturePreview] = useState<string | null>(null);
  const { language, t } = useLanguage();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      destination: "",
      purpose: "",
      additionalInfo: "",
    },
  });

  // دالة للإرسال
  const onSubmit = (values: z.infer<typeof formSchema>) => {
    console.log(values);
    setIsSubmitted(true);
    generatePDF(values); // توليد PDF بعد الإرسال
  };

  // دالة لتحميل التوقيع
  const handleSignatureChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      form.setValue("signature", file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setSignaturePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // دالة لتوليد PDF
  const generatePDF = (data) => {
    const doc = new jsPDF('p', 'mm', 'a4');
    const currentDate = format(new Date(), "EEEE d MMMM yyyy", { locale: fr });

    // رأس المستند
    const logoPath = "/client/public/lovable-uploads/d44e75ac-eac5-4ed3-bf43-21a71c6a089d.png";
    doc.addImage(logoPath, 'PNG', 20, 10, 30, 30);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(11);
    doc.text("N/Réf : OFP/DR Casa Settat/          / N° :           …/2025", 20, 45);
    doc.text(`Casablanca, le ${currentDate}`, 120, 45);

    // العنوان
    doc.setFont("helvetica", "bold");
    doc.setFontSize(14);
    doc.text("ORDRE DE MISSION", 80, 55);
    doc.text("OFFICE DE LA FORMATION PROFESSIONNELLE", 40, 62);
    doc.text("ET DE LA PROMOTION DU TRAVAIL", 50, 69);
    doc.text("D E S I G N E", 90, 80);

    // تفاصيل المهمة
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.rect(20, 85, 170, 90);

    // السطر 1
    doc.line(20, 95, 190, 95);
    doc.text("De se rendre à           :", 25, 90);
    doc.text(data.destination, 80, 90);

    // السطر 2
    doc.line(20, 105, 190, 105);
    doc.text("Pour accomplir la mission suivante :", 25, 100);
    doc.text(data.purpose, 80, 100);

    // السطر 3
    doc.line(20, 115, 190, 115);
    doc.line(130, 105, 130, 115);
    doc.text("Date de départ    :", 25, 110);
    doc.text(format(data.startDate, "yyyy-MM-dd"), 70, 110);
    doc.text("Date de retour   :", 135, 110);
    doc.text(format(data.endDate, "yyyy-MM-dd"), 170, 110);

    // السطر 4
    doc.line(20, 125, 190, 125);
    doc.text("Informations supplémentaires :", 25, 120);
    doc.text(data.additionalInfo || "", 80, 120);

    // التوقيع
    if (data.signature && typeof data.signature === 'string') {
      doc.addImage(data.signature, 'PNG', 150, 130, 40, 20);
    }

    // تذييل المستند
    doc.setFont("helvetica", "bold");
    doc.setFillColor(220, 220, 220);
    doc.rect(20, 185, 170, 10, "F");
    doc.text("Cadre réservé à l'entité de destinations", 55, 191);

    doc.setFont("helvetica", "normal");
    doc.rect(20, 195, 170, 40);
    doc.line(105, 195, 105, 235);
    doc.text("Visa d'arrivée", 55, 201);
    doc.text("Visa de départ", 140, 201);
    doc.line(20, 205, 190, 205);
    doc.text("Date et Heure d'arrivée :", 25, 212);
    doc.text("Date et Heure de départ :", 110, 212);
    doc.text("Cachet et signature :", 25, 225);
    doc.text("Cachet et signature :", 110, 225);

    // ملاحظة
    doc.setFontSize(9);
    doc.setFont("helvetica", "italic");
    doc.text("NB : Le visa de départ est obligatoire pour les missions au-delà d'une journée.", 30, 245);

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
                  name="destination"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("destination")}*</FormLabel>
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
                      <FormLabel>{t("purpose")}*</FormLabel>
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
                      <FormLabel>{t("startDate")}*</FormLabel>
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
                                format(field.value, "PPP", { locale: language === "ar" ? ar : fr })
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
                  name="endDate"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>{t("endDate")}*</FormLabel>
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
                                format(field.value, "PPP", { locale: language === "ar" ? ar : fr })
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
                  name="additionalInfo"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("additionalInfo")}</FormLabel>
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
                <FormField
                  control={form.control}
                  name="signature"
                  render={({ field: { value, onChange, ...field } }) => (
                    <FormItem>
                      <FormLabel>{t("signature")}</FormLabel>
                      <FormControl>
                        <div className="flex items-center gap-4">
                          <Input
                            type="file"
                            accept="image/*"
                            onChange={handleSignatureChange}
                            {...field}
                          />
                          {signaturePreview && (
                            <img
                              src={signaturePreview}
                              alt="Signature preview"
                              className="h-12 w-auto"
                            />
                          )}
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button type="submit" className="w-full">
                  {t("submit")}
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
