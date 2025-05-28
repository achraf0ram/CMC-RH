import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import jsPDF from "jspdf";
import { format } from "date-fns";
import { ar, fr } from "date-fns/locale";
import { CalendarIcon, FileImage, CheckCircle, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/contexts/LanguageContext";

const formSchema = z.object({
  fullName: z.string().min(3, { message: "يرجى إدخال الاسم الكامل" }),
  matricule: z.string().min(1, { message: "يرجى إدخال الرقم المالي" }),
  echelle: z.string().optional(),
  echelon: z.string().optional(),
  grade: z.string().optional(),
  fonction: z.string().optional(),
  direction: z.string().optional(),
  address: z.string().optional(),
  phone: z.string().optional(),
  leaveType: z.string().min(1, { message: "يرجى اختيار نوع الإجازة" }),
  duration: z.string().min(1, { message: "يرجى تحديد المدة" }),
  startDate: z.date({ required_error: "يرجى تحديد تاريخ البداية" }),
  endDate: z.date({ required_error: "يرجى تحديد تاريخ النهاية" }),
  with: z.string().optional(),
  interim: z.string().optional(),
  additionalInfo: z.string().optional(),
  leaveMorocco: z.string().optional(),
  reason: z.string().min(5, { message: "يرجى توضيح سبب الإجازة" }).optional(),
  signature: z.instanceof(File).optional(),
});

const VacationRequest = () => {
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [signaturePreview, setSignaturePreview] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const { language, t } = useLanguage();
  const logoPath = "/lovable-uploads/d44e75ac-eac5-4ed3-bf43-21a71c6a089d.png";

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      fullName: "",
      matricule: "",
      echelle: "",
      echelon: "",
      grade: "",
      fonction: "",
      direction: "",
      address: "",
      phone: "",
      leaveType: "",
      duration: "",
      startDate: undefined,
      endDate: undefined,
      with: "",
      interim: "",
      additionalInfo: "",
      leaveMorocco: "",
      reason: "",
      signature: undefined,
    },
  });

  const handleSignatureChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    setUploadError(null);
    
    if (file) {
      // Validate file type
      const validTypes = ['.png', '.jpg', '.jpeg', '.gif', '.bmp', '.tiff', '.webp'];
      const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase();
      
      if (!validTypes.includes(fileExtension)) {
        setUploadError(t('invalidFileType'));
        return;
      }
      
      // Validate file size (max 2MB)
      if (file.size > 2 * 1024 * 1024) {
        setUploadError(t('fileTooLarge'));
        return;
      }
      
      setIsUploading(true);
      form.setValue("signature", file);
      
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setSignaturePreview(event.target.result as string);
          setIsUploading(false);
        }
      };
      reader.onerror = () => {
        setUploadError(t('uploadError'));
        setIsUploading(false);
      };
      reader.readAsDataURL(file);
    } else {
      form.setValue("signature", undefined);
      setSignaturePreview(null);
    }
  };

  const clearSignature = () => {
    form.setValue("signature", undefined);
    setSignaturePreview(null);
    setUploadError(null);
    const fileInput = document.getElementById("signature-upload") as HTMLInputElement;
    if (fileInput) {
      fileInput.value = '';
    }
  };

  function onSubmit(values: z.infer<typeof formSchema>) {
    setIsSubmitted(true);
    generatePDF(values);
  }

  const generatePDF = (data: z.infer<typeof formSchema>) => {
    const doc = new jsPDF("p", "mm", "a4");

    const currentDate = format(new Date(), "dd/MM/yyyy");

    doc.setFont("Helvetica");
    doc.setFontSize(11);

    try {
      doc.addImage(logoPath, "PNG", 10, 10, 50, 25);
    } catch (error) {
      console.log("Could not load logo:", error);
    }

    doc.text("Réf : OFP/DR……/CMC…../N°", 20, 45);
    doc.text("/2025", 75, 45);
    doc.text("Date :", 20, 50);
    doc.text(currentDate, 35, 50);

    doc.setFontSize(14);
    doc.setFont("Helvetica", "bold");
    doc.text("Demande de congé", 90, 65);
    doc.text("طلب إجازة", 115, 70);
    doc.line(115, 71, 140, 71);
    doc.setFont("Helvetica", "normal");
    doc.setFontSize(11);

    let currentY = 80;
    const col1XFr = 20;
    const col1XAr = 190;
    const col2XFr = 60;
    const col2XAr = 150;
    const lineLengthFr = 40;
    const lineLengthAr = 35;
    const lineThickness = 0.2;

    const addFieldRow = (labelFr: string, value: string | undefined | Date, labelAr: string, y: number, isArabicPair = true) => {
      const displayValue = typeof value === 'string' ? value : (value instanceof Date ? format(value, "yyyy-MM-dd") : "");

      doc.text(`${labelFr} :`, col1XFr, y);

      if (displayValue) {
        doc.text(displayValue, col2XFr, y);
      } else {
        doc.line(col2XFr, y + 1, col2XFr + lineLengthFr, y + 1);
      }

      doc.text(`${labelAr} :`, col1XAr, y, { align: "right" });

      if (displayValue && isArabicPair) {
        doc.line(col2XAr - lineLengthAr, y + 1, col2XAr, y + 1);
      } else {
        doc.line(col2XAr - lineLengthAr, y + 1, col2XAr, y + 1);
      }
      doc.setLineWidth(lineThickness);
    };

    addFieldRow("Nom & Prénom", data.fullName, "الاسم الكامل", currentY); currentY += 7;
    addFieldRow("Matricule", data.matricule, "الرقم المالي", currentY); currentY += 7;
    addFieldRow("Echelle", data.echelle, "السلم", currentY);
    doc.text("Echelon:", col2XFr + lineLengthFr + 10, currentY);
    addFieldRow("Echelon", data.echelon, "الرتبة", currentY, false);
    currentY += 7;
    addFieldRow("Grade", data.grade, "الدرجة", currentY); currentY += 7;
    addFieldRow("Fonction", data.fonction, "الوظيفة", currentY); currentY += 10;

    doc.setFont("Helvetica", "bold");
    doc.text("Affectation", 90, currentY); currentY += 5;
    doc.text("التعيين", 115, currentY);
    doc.line(115, currentY + 1, 140, currentY + 1);
    doc.setFont("Helvetica", "normal");
    currentY += 10;

    addFieldRow("Direction", data.direction, "المديرية", currentY); currentY += 7;
    addFieldRow("Adresse", data.address, "العنوان", currentY); currentY += 7;
    addFieldRow("Téléphone", data.phone, "الهاتف", currentY); currentY += 7;

    const leaveTypeOptions: { [key: string]: string } = {
      administrative: "إدارية / Administrative",
      marriage: "زواج / Mariage",
      birth: "ازدياد / Naissance",
      exceptional: "استثنائية / Exceptionnel",
    };
    addFieldRow("Nature de congé (2)", leaveTypeOptions[data.leaveType] || data.leaveType, "نوع الإجازة (2)", currentY); currentY += 7;
    addFieldRow("Durée", data.duration, "المدة", currentY); currentY += 7;

    doc.text("Du :", col1XFr, currentY);
    const startDateValue = data.startDate instanceof Date ? format(data.startDate, "yyyy-MM-dd") : "";
    if (startDateValue) {
      doc.text(startDateValue, col2XFr, currentY);
    } else {
      doc.line(col2XFr, currentY + 1, col2XFr + lineLengthFr, currentY + 1);
    }
    doc.text("ابتداء من :", col1XAr, currentY, { align: "right" });

    currentY += 7;
    doc.text("Au :", col1XFr, currentY);
    const endDateValue = data.endDate instanceof Date ? format(data.endDate, "yyyy-MM-dd") : "";
    if (endDateValue) {
      doc.text(endDateValue, col2XFr, currentY);
    } else {
      doc.line(col2XFr, currentY + 1, col2XFr + lineLengthFr, currentY + 1);
    }
    doc.text("إلى :", col1XAr, currentY, { align: "right" });

    currentY += 7;
    addFieldRow("Avec (3)", data.with, "مع (3)", currentY); currentY += 7;

    doc.text("Intérim (Nom et Fonction) :", col1XFr, currentY);
    if (data.interim) {
      doc.text(data.interim, col2XFr + 20, currentY);
    } else {
      doc.line(col2XFr + 20, currentY + 1, col2XFr + 20 + 60, currentY + 1);
    }
    doc.text("النيابة (الاسم والوظيفة) :", col1XAr, currentY, { align: "right" });
    currentY += 10;

    const signatureY = 215;
    doc.text("Signature de l'intéressé", 30, signatureY);
    doc.text("إمضاء المعني(ة) بالأمر", 30, signatureY + 5);

    doc.text("Avis du Chef Immédiat", 85, signatureY);
    doc.text("رأي الرئيس المباشر", 85, signatureY + 5);

    doc.text("Avis du Directeur", 150, signatureY);
    doc.text("رأي المدير", 150, signatureY + 5);

    console.log("Signature preview value before adding image:", signaturePreview ? "Has data" : "No data", signaturePreview ? `Data URL starts with: ${signaturePreview.substring(0, 30)}` : "");

    if (signaturePreview) {
      const imgType = signaturePreview.startsWith("data:image/png") ? "PNG" : "JPEG";
      try {
        doc.addImage(signaturePreview, imgType, 30, signatureY + 15, 40, 20);
      } catch (error) {
        console.error("Error adding signature image:", error);
      }
    }

    doc.line(25, signatureY + 38, 70, signatureY + 38);
    doc.line(80, signatureY + 38, 125, signatureY + 38);
    doc.line(145, signatureY + 38, 190, signatureY + 38);

    let notesY = 250;
    doc.setFontSize(9);
    doc.setFont("Helvetica", "bold");
    doc.text("Très important :", 20, notesY);
    doc.text("هام جدا :", 190, notesY, { align: "right" });

    notesY += 5;
    doc.setFontSize(8);
    doc.setFont("Helvetica", "normal");

    const notes = [
      "Aucun agent n'est autorisé à quitter le lieu de son travail avant d'avoir",
      "obtenu sa décision de congé le cas échéant il sera considéré en",
      "abandon de poste.",
      "(1) La demande doit être déposée 8 jours avant la date demandée",
      "(2) Nature de congé : Administratif - Mariage - Naissance - Exceptionnel",
      '(3) Si l\'intéressé projette de quitter le territoire Marocain il faut qu\'il',
      'le mentionne "Quitter le territoire Marocain"',
    ];

    const notesAr = [
      "لا يسمح لأي مستخدم بمغادرة العمل إلا بعد توصله بمقرر الإجازة و إلا اعتبر في",
      "وضعية تخلي عن العمل.",
      "(1) يجب تقديم الطلب قبل 8 أيام من التاريخ المطلوب",
      "(2) نوع الإجازة : إدارية - زواج - ازدياد - استثنائية",
      '(3) إذا كان المعني بالأمر يرغب في مغادرة التراب الوطني فعليه أن يحدد ذلك بإضافة',
      '"مغادرة التراب الوطني"',
    ];

    let notesStartXFr = 20;
    let notesStartXAr = 190;
    let currentNotesY = notesY;

    notes.forEach((line, i) => {
      doc.text(line, notesStartXFr, currentNotesY);
      if (i < notesAr.length) {
        doc.text(notesAr[i], notesStartXAr, currentNotesY, { align: "right" });
      }
      currentNotesY += 5;
    });

    doc.save(`demande_conge_${data.fullName.replace(/\s+/g, "_")}.pdf`);
  };

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">{t("vacationRequestTitle")}</h1>

      {isSubmitted ? (
        <Card className="border-green-200 bg-green-50">
          <CardContent className="pt-6">
            <div className="flex flex-col items-center text-center gap-4">
              <div className="h-16 w-16 rounded-full bg-green-100 flex items-center justify-center">
                <CheckCircle className="h-8 w-8 text-green-600" />
              </div>
              <div>
                <h2 className="text-xl font-semibold mb-2">
                  {t('requestSubmitted')}
                </h2>
                <p className="text-muted-foreground">
                  {t('requestReviewMessage')}
                  <br />
                  {t('followUpMessage')}
                </p>
                <Button 
                  className="mt-4" 
                  onClick={() => setIsSubmitted(false)}
                >
                  {t('newRequest')}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>{t('requestInfo')}</CardTitle>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="fullName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('fullName')}*</FormLabel>
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
                        <FormLabel>{t('matricule')}*</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <FormField
                    control={form.control}
                    name="echelle"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('echelle')}</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="echelon"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('echelon')}</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="grade"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('grade')}</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="fonction"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('fonction')}</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="direction"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('direction')}</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="address"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('address')}</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="phone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('phone')}</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="leaveType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('leaveType')}*</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder={t('selectLeaveType')} />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="administrative">{t('administrativeLeave')}</SelectItem>
                          <SelectItem value="marriage">{t('marriageLeave')}</SelectItem>
                          <SelectItem value="birth">{t('birthLeave')}</SelectItem>
                          <SelectItem value="exceptional">{t('exceptionalLeave')}</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="duration"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('duration')}*</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="startDate"
                    render={({ field }) => (
                      <FormItem className="flex flex-col">
                        <FormLabel>{t('startDate')}*</FormLabel>
                        <Popover>
                          <PopoverTrigger asChild>
                            <FormControl>
                              <Button
                                variant={"outline"}
                                className={cn(
                                  "pl-3 text-right font-normal",
                                  !field.value && "text-muted-foreground"
                                )}
                              >
                                {field.value ? (
                                  format(field.value, "PPP", { locale: language === 'ar' ? ar : fr })
                                ) : (
                                  <span>{t('selectDate')}</span>
                                )}
                                <CalendarIcon className="mr-auto h-4 w-4 opacity-50" />
                              </Button>
                            </FormControl>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="start">
                            <Calendar
                              mode="single"
                              selected={field.value}
                              onSelect={field.onChange}
                              disabled={(date) =>
                                date < new Date(new Date().setHours(0, 0, 0, 0))
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
                        <FormLabel>{t('endDate')}*</FormLabel>
                        <Popover>
                          <PopoverTrigger asChild>
                            <FormControl>
                              <Button
                                variant={"outline"}
                                className={cn(
                                  "pl-3 text-right font-normal",
                                  !field.value && "text-muted-foreground"
                                )}
                              >
                                {field.value ? (
                                  format(field.value, "PPP", { locale: language === 'ar' ? ar : fr })
                                ) : (
                                  <span>{t('selectDate')}</span>
                                )}
                                <CalendarIcon className="mr-auto h-4 w-4 opacity-50" />
                              </Button>
                            </FormControl>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="start">
                            <Calendar
                              mode="single"
                              selected={field.value}
                              onSelect={field.onChange}
                              disabled={(date) => {
                                const startDate = form.getValues("startDate");
                                return (
                                  date < (startDate || new Date(new Date().setHours(0, 0, 0, 0)))
                                );
                              }}
                              initialFocus
                            />
                          </PopoverContent>
                        </Popover>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="with"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('with')}</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="interim"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('interim')}</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="reason"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('reason')}</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder={t('vacationReasonPlaceholder')}
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
                  render={({ field: { value, ...fieldProps } }) => (
                    <FormItem>
                      <FormLabel>{t('signatureUpload')}</FormLabel>
                      <FormControl>
                        <div className="flex flex-col gap-4">
                          <div className="flex items-center gap-4">
                            <Input
                              type="file"
                              accept=".png,.jpg,.jpeg,.gif,.bmp,.tiff,.webp"
                              onChange={handleSignatureChange}
                              className="hidden"
                              id="signature-upload"
                              {...fieldProps}
                            />
                            <Button
                              type="button"
                              variant="outline"
                              onClick={() => document.getElementById("signature-upload")?.click()}
                              className="w-full"
                              disabled={isUploading}
                            >
                              {isUploading ? (
                                <div className="flex items-center">
                                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-900 mr-2"></div>
                                  {t('uploading')}
                                </div>
                              ) : (
                                <>
                                  <FileImage className="mr-2 h-4 w-4" />
                                  {t('signatureUploadButton')}
                                </>
                              )}
                            </Button>
                          </div>
                          {signaturePreview && (
                            <div className="border rounded-md p-2 relative">
                              <img
                                src={signaturePreview}
                                alt={t('signature')}
                                className="max-h-32 mx-auto object-contain"
                                style={{ maxWidth: '100%' }}
                              />
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                className="absolute top-2 right-2"
                                onClick={clearSignature}
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </div>
                          )}
                          {uploadError && (
                            <p className="text-sm text-red-500">{uploadError}</p>
                          )}
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="flex justify-end gap-3">
                  <Button type="submit">{t('submit')}</Button>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default VacationRequest;