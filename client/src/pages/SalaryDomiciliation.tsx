import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import axios from 'axios';
import { useLanguage } from '../contexts/LanguageContext';
import { useToast } from '@/hooks/use-toast';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useAuth } from '@/contexts/AuthContext';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { axiosInstance } from '../components/Api/axios';
import { SuccessMessage } from "@/components/SuccessMessage";

const formSchema = z.object({
  fullName: z.string().min(3, { message: 'Please enter your full name.' }),
  matricule: z.string().min(1, { message: 'Please enter your matricule.' }),
  file: z.instanceof(File).refine(file => file.size > 0, 'File is required.'),
  status: z.string().optional(),
});

const SalaryDomiciliation: React.FC = () => {
  const { language } = useLanguage();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { user } = useAuth();
  const [showUrgentDialog, setShowUrgentDialog] = useState(false);
  const [pendingFormData, setPendingFormData] = useState<z.infer<typeof formSchema> | null>(null);
  const [successData, setSuccessData] = useState<any>(null);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      fullName: '',
      matricule: '',
      file: new File([], ''),
      status: '',
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
    await handleSubmit({ ...pendingFormData, status: isUrgent ? 'urgent' : 'pending' });
    setShowUrgentDialog(false);
    setPendingFormData(null);
  };

  const handleSubmit = async (values: z.infer<typeof formSchema>) => {
    setIsSubmitting(true);

    const formData = new FormData();
    formData.append('fullName', values.fullName);
    formData.append('matricule', values.matricule);
    formData.append('file', values.file);
    formData.append('type', 'salaryDomiciliation');
    formData.append('status', values.status || 'pending');

    try {
      const response = await axiosInstance.post('http://localhost:8000/api/salary-domiciliations', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        withCredentials: true,
      });
      setSuccessData(response.data.data); // Save the response for the success message
      toast({
        title: language === 'ar' ? 'تم الإرسال بنجاح' : 'Demande envoyée',
        description: language === 'ar' ? 'تم إرسال طلبك بنجاح.' : 'Votre demande a été envoyée avec succès.',
        variant: 'default',
        className: 'bg-green-50 border-green-200',
      });
      form.reset();
    } catch (error) {
      toast({
        title: language === 'ar' ? 'خطأ' : 'Erreur',
        description: language === 'ar' ? 'حدث خطأ أثناء إرسال الطلب.' : "Une erreur s'est produite lors de l'envoi de la demande.",
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-green-50 to-blue-100 px-2 sm:px-4 py-4">
      <div className="max-w-4xl mx-auto w-full">
        <div className="text-center mb-4 sm:mb-6 md:mb-8">
          <h1 className="text-xl sm:text-2xl md:text-3xl font-bold bg-gradient-to-r from-blue-600 to-green-600 bg-clip-text text-transparent mb-1 sm:mb-2">
            {language === 'ar' ? 'طلب شهادة توطين الراتب' : "Demande d'attestation de domiciliation de salaire"}
          </h1>
          <p className="text-gray-600 text-xs sm:text-sm md:text-base hidden sm:block">{language === 'ar' ? 'يرجى ملء النموذج ورفع المستند المطلوب.' : 'Veuillez remplir le formulaire et télécharger le document requis.'}</p>
        </div>
        <div className="flex justify-start mb-2">
          <Button 
            variant="outline"
            className="border-blue-500 text-blue-600 hover:bg-blue-50 px-4 sm:px-6 py-2 rounded-lg shadow-sm font-semibold text-sm sm:text-base"
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
          >
            {language === 'ar' ? 'عرض جميع الطلبات' : 'Voir tous les demandes'}
          </Button>
        </div>
        <div className="shadow-xl border-0 bg-white/80 backdrop-blur-sm rounded-lg overflow-hidden">
          <div className="bg-gradient-to-r from-blue-600 to-green-600 text-white rounded-t-lg py-4 px-6">
            <h2 className="text-lg font-semibold text-center">{language === 'ar' ? 'تفاصيل الطلب' : 'Détails de la demande'}</h2>
          </div>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-6 p-6 md:p-8">
              <FormField
                control={form.control}
                name="fullName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{language === 'ar' ? 'الاسم الكامل' : 'Nom et Prénom'}</FormLabel>
                    <FormControl>
                      <Input placeholder={language === 'ar' ? 'أدخل الاسم الكامل' : 'Entrez le nom et prénom'} {...field} />
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
                    <FormLabel>{language === 'ar' ? 'الرقم المالي' : 'Matricule'}</FormLabel>
                    <FormControl>
                      <Input placeholder={language === 'ar' ? 'أدخل الرقم المالي' : 'Entrez le matricule'} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="file"
                render={({ field: { onChange, value, ...rest } }) => (
                  <FormItem>
                    <FormLabel>{language === 'ar' ? 'رفع المستند' : 'Télécharger le document'}</FormLabel>
                    <FormControl>
                      <Input
                        type="file"
                        accept="image/*,application/pdf"
                        onChange={(e) => onChange(e.target.files?.[0])}
                        {...rest}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="flex justify-center pt-4">
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full md:w-auto px-8 py-3 bg-gradient-to-r from-blue-600 to-green-600 text-white font-medium rounded-lg"
                >
                  {isSubmitting ? (language === 'ar' ? 'جاري الإرسال...' : 'Envoi en cours...') : (language === 'ar' ? 'إرسال الطلب' : 'Envoyer la demande')}
                </Button>
              </div>
            </form>
          </Form>
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
    </div>
  );
};

export default SalaryDomiciliation; 