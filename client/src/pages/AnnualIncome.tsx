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

const formSchema = z.object({
  fullName: z.string().min(3, { message: 'Please enter your full name.' }),
  matricule: z.string().min(1, { message: 'Please enter your matricule.' }),
  file: z.instanceof(File).refine(file => file.size > 0, 'File is required.'),
});

const AnnualIncome: React.FC = () => {
  const { language, t } = useLanguage();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { user } = useAuth();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      fullName: '',
      matricule: '',
      file: new File([], ''),
    },
  });

  useEffect(() => {
    if (user && user.name) {
      form.setValue('fullName', user.name);
    }
  }, [user]);

  const handleSubmit = async (values: z.infer<typeof formSchema>) => {
    setIsSubmitting(true);

    const formData = new FormData();
    formData.append('fullName', values.fullName);
    formData.append('matricule', values.matricule);
    formData.append('file', values.file);
    formData.append('type', 'annualIncome');

    try {
      await axios.post('http://localhost:8000/api/annual-incomes', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-green-50 to-blue-100 p-4">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-6 md:mb-8">
          <h1 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-blue-600 to-green-600 bg-clip-text text-transparent mb-2">
            {t('annualIncome')}
          </h1>
          <p className="text-gray-600 text-sm md:text-base">{language === 'ar' ? 'يرجى ملء النموذج ورفع المستند المطلوب.' : 'Veuillez remplir le formulaire et télécharger le document requis.'}</p>
        </div>
        <div className="shadow-xl border-0 bg-white/80 backdrop-blur-sm rounded-lg overflow-hidden">
          <div className="bg-gradient-to-r from-blue-600 to-green-600 text-white rounded-t-lg py-4 px-6">
            <h2 className="text-lg font-semibold text-center">{language === 'ar' ? 'تفاصيل الطلب' : 'Détails de la demande'}</h2>
          </div>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6 p-6 md:p-8">
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
      </div>
    </div>
  );
};

export default AnnualIncome;
