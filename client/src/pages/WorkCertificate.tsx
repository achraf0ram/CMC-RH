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
import { useToast } from "@/components/ui/use-toast";
import { CheckCircle } from "lucide-react";

// Import the Arabic font data
import { AmiriFont } from "../fonts/AmiriFont";

// IMPORTANT: Place your converted Arabic font file (e.g., arabic_font.js) in a directory accessible to your project.
// For example, you might put it in client/public/fonts/

// You might need to import the font file if your converter generates a JS module
// import './fonts/arabic_font.js'; // Uncomment and update path if needed

const formSchema = z.object({
  fullName: z.string().min(3, { message: "يرجى إدخال الاسم الكامل" }),
  matricule: z.string().min(1, { message: "يرجى إدخال رقم التسجيل" }),
  grade: z.string().optional(),
  hireDate: z.string().optional(),
  function: z.string().optional(),
  purpose: z.string().min(5, { message: "يرجى وصف الغرض من الشهادة" }),
  additionalInfo: z.string().optional(),
});

const WorkCertificate = () => {
  const { t } = useLanguage();
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const logoPath = "/lovable-uploads/d44e75ac-eac5-4ed3-bf43-21a71c6a089d.png";
  const { toast } = useToast();

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
    },
  });

  const handleSubmit = async (data: z.infer<typeof formSchema>) => {
    try {
      setIsGenerating(true);
      
      // Generate PDF
      const doc = new jsPDF("p", "mm", "a4");
      const currentDate = format(new Date(), "dd/MM/yyyy");

      // Load and add logo
      try {
        const img = new Image();
        img.src = logoPath;
        await new Promise((resolve) => {
          img.onload = resolve;
        });
        // Adjusted logo position to top left (example coordinates)
        doc.addImage(img, "PNG", 6, 6, 98, 33); // Adjust size (40x15) and position (15, 10) as needed
      } catch (error) {
        console.error("Error loading logo:", error);
      }

      // --- Arabic Font Setup ---
      // Add Amiri font to PDF
      console.log("Adding Amiri font to VFS...");
      doc.addFileToVFS("Amiri-Regular.ttf", AmiriFont);
      console.log("Amiri font added to VFS. Adding font to doc...");
      doc.addFont("Amiri-Regular.ttf", "Amiri", "normal");
      console.log("Amiri font added to doc.");
      
      // Set font for Latin text (like French)
      doc.setFont("helvetica", "normal");
      doc.setFontSize(12);
      // Adjusted vertical position based on new logo placement
      doc.text("N/Réf. : OFP/DR CASA SETTAT/DAAL/SRRH /N°", 20, 45);
      // Adjusted vertical position of date
      doc.text(`Casablanca, le ${currentDate}`, 140, 45);

      doc.setFont("helvetica", "bold");
      doc.setFontSize(16);
      // Adjusted vertical position of title
      doc.text("ATTESTATION DE TRAVAIL", 75, 65);

      doc.setFont("helvetica", "normal");
      doc.setFontSize(12);
      // Adjusted vertical position of introductory text
      doc.text("Nous soussignés, Directeur Régional Casablanca-Settat de l'Office de la", 20, 75);
      doc.text("Formation Professionnelle et de la Promotion du Travail (OFPPT), attestons", 20, 80);
      doc.text("que :", 20, 85);

      // Adjusted vertical positions of form data fields
      doc.text(`Monsieur : ${data.fullName}`, 20, 95);
      doc.text(`Matricule : ${data.matricule}`, 20, 105);
      doc.text(`Grade : ${data.grade || ""}`, 20, 115);
      doc.text(`Est employé au sein de notre organisme depuis le : ${data.hireDate || ""}`, 20, 125);
      doc.text(`En qualité de : ${data.function || ""}`, 20, 135);

      doc.text("La présente attestation est délivrée à l'intéressé pour servir et valoir ce que de droit.", 20, 165);

      // --- Set font for Arabic text ---
      console.log("Setting font to Amiri...");
      doc.setFont('Amiri', 'normal');
      console.log("Font set to Amiri.");
      
      doc.setFontSize(9);
      // These lines are for Arabic text and need an Arabic-supporting font set above
      doc.text("المديرية الجهوية لجهة الدارالبيضاء – سطات", 190, 230, { align: "right" });
      doc.text( " زنقة الكابورال إدريس اشباكو,50", 190, 234, { align: "right" });
      doc.text("عين البرجة - الدار البيضاء", 190, 238, { align: "right" });
      doc.text("الهاتف : 82 00 60 22 05 - الفاكس : 65 6039 22 05", 190, 242, { align: "right" });
      // --- End Arabic text ---

      // Add French text for the footer on the left side
      doc.setFont("helvetica", "normal"); // Ensure using a font that supports Latin characters
      doc.setFontSize(9);
      doc.text("Direction Régionale CASABLANCA –SETTAT", 20, 230);
      doc.text("50, rue Caporal Driss Chbakou", 20, 234);
      doc.text("Ain Bordja-Casablanca", 20, 238);
      doc.text("Tél :05 22 60 00 82 - Fax :05 22 6039 65", 20, 242);

      // Save PDF
      doc.save("attestation_de_travail.pdf");

      // Here you would typically send the data to your backend
      // For example:
      // await axios.post('/api/work-certificate', data);
      
      setIsSubmitted(true);

      // Show success toast
      toast({
        title: "تم بنجاح",
        description: "تم إنشاء شهادة العمل وتحميلها بنجاح",
        variant: "default",
        className: "bg-green-50 border-green-200",
      });

    } catch (error) {
      console.error("Error:", error);
      toast({
        title: "خطأ",
        description: "حدث خطأ أثناء معالجة الطلب. يرجى المحاولة مرة أخرى.",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">{t("workCertificateTitle")}</h1>

      <Card>
        <CardHeader>
          <CardTitle>{t("requestInfo")}</CardTitle>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
              <FormField control={form.control} name="fullName" render={({ field }) => (
                <FormItem>
                  <FormLabel>Monsieur (سيد)</FormLabel>
                  <FormControl><Input {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />

              <FormField control={form.control} name="matricule" render={({ field }) => (
                <FormItem>
                  <FormLabel>Matricule (الرقم التسجيلي)</FormLabel>
                  <FormControl><Input {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />

              <FormField control={form.control} name="grade" render={({ field }) => (
                <FormItem>
                  <FormLabel>Grade (الرتبة)</FormLabel>
                  <FormControl><Input {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />

              <FormField control={form.control} name="hireDate" render={({ field }) => (
                <FormItem>
                  <FormLabel>Date d'embauche (تاريخ التوظيف)</FormLabel>
                  <FormControl><Input type="date" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />

              <FormField control={form.control} name="function" render={({ field }) => (
                <FormItem>
                  <FormLabel>Fonction (الوظيفة)</FormLabel>
                  <FormControl><Input {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />

              <FormField control={form.control} name="purpose" render={({ field }) => (
                <FormItem>
                  <FormLabel>Objet (الغرض)</FormLabel>
                  <FormControl><Input {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />

              <FormField control={form.control} name="additionalInfo" render={({ field }) => (
                <FormItem>
                  <FormLabel>Informations supplémentaires (معلومات إضافية)</FormLabel>
                  <FormControl><Textarea {...field} className="resize-none" /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />

              <div className="flex justify-end">
                <Button 
                  type="submit" 
                  disabled={isGenerating}
                  className="w-full"
                >
                  {isGenerating ? "جاري المعالجة..." : "إرسال وتحميل PDF"}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
};

export default WorkCertificate;