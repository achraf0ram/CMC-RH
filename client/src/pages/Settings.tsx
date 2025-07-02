import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { toast } from "@/hooks/use-toast";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import axios from "axios";

// import { Label } from "@/components/ui/label";
// import { useToast } from "@/hooks/use-toast";
// import { useAuth } from "@/contexts/AuthContext";
// import { Loader2 } from "lucide-react";

const profileFormSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  phone: z.string().min(10),
});

const notificationsFormSchema = z.object({
  emailNotifications: z.boolean().default(true),
  newRequests: z.boolean(),
  requestUpdates: z.boolean(),
});

const passwordFormSchema = z.object({
  currentPassword: z.string().min(8),
  newPassword: z.string().min(8),
  confirmPassword: z.string().min(8),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Les mots de passe ne correspondent pas",
  path: ["confirmPassword"],
});

const Settings = () => {
  const [activeTab, setActiveTab] = useState("profile");
  const { t } = useLanguage();
  const { user, isLoading } = useAuth();
  
  const profileForm = useForm<z.infer<typeof profileFormSchema>>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
      name: user?.name || "",
      email: user?.email || "",
      phone: "", // Will update below if user has phone
    },
  });

  const notificationsForm = useForm<z.infer<typeof notificationsFormSchema>>({
    resolver: zodResolver(notificationsFormSchema),
    defaultValues: {
      emailNotifications: true,
      newRequests: true,
      requestUpdates: true,
    },
  });

  const passwordForm = useForm<z.infer<typeof passwordFormSchema>>({
    resolver: zodResolver(passwordFormSchema),
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
  });

  // Update form values when user data is loaded
  useEffect(() => {
    if (user) {
      profileForm.reset({
        name: user.name || "",
        email: user.email || "",
        phone: (user as any).phone || "", // Use type assertion to avoid TS error
      });
    }
  }, [user]);

  // Show loading indicator while user data is loading
  if (isLoading) {
    return <div className="flex h-screen items-center justify-center">Chargement...</div>;
  }

  function onProfileSubmit(values: z.infer<typeof profileFormSchema>) {
    axios.put('/api/user/profile', {
      name: values.name,
      email: values.email,
      phone: values.phone
    }, { withCredentials: true })
      .then(res => {
        toast({
          title: "Les informations ont été mises à jour",
          description: "Les modifications ont été enregistrées avec succès",
        });
      })
      .catch(err => {
        toast({
          title: "Erreur lors de la mise à jour des informations",
          description: "Veuillez réessayer plus tard ou contacter l'administrateur",
        });
      });
  }

  function onNotificationsSubmit(values: z.infer<typeof notificationsFormSchema>) {
    console.log(values);
    toast({
      title: "Les paramètres d'alerte ont été mis à jour",
      description: "Les modifications ont été enregistrées avec succès",
    });
  }

  function onPasswordSubmit(values: z.infer<typeof passwordFormSchema>) {
    console.log(values);
    toast({
      title: "Le mot de passe a été changé",
      description: "Le mot de passe a été changé avec succès",
    });
    passwordForm.reset({
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    });
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-green-50 to-blue-100 p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-6 md:mb-8">
          <h1 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-blue-600 to-green-600 bg-clip-text text-transparent mb-2">
            {t('settings')}
          </h1>
        </div>

        <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-sm">
          <CardHeader className="bg-gradient-to-r from-blue-600 to-green-600 text-white rounded-t-lg p-4 md:p-6">
            <CardTitle className="text-lg md:text-xl font-semibold text-center">
              {t('settings')}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 md:p-8">
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="space-x-5 grid-cols-1 md:grid-cols-3 mb-3 bg-blue-50/50">
                <TabsTrigger 
                  value="profile" 
                  className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-600 data-[state=active]:to-green-600 data-[state=active]:text-white"
                >
                  {t('profileTab')}
                </TabsTrigger>
                <TabsTrigger 
                  value="notifications" 
                  className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-600 data-[state=active]:to-green-600 data-[state=active]:text-white"
                >
                  {t('notificationsTab')}
                </TabsTrigger>
                <TabsTrigger 
                  value="password" 
                  className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-600 data-[state=active]:to-green-600 data-[state=active]:text-white"
                >
                  {t('passwordTab')}
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="profile">
                <Form {...profileForm}>
                  <form onSubmit={profileForm.handleSubmit(onProfileSubmit)} className="space-y-6">
                    <div className="grid gap-6 sm:grid-cols-2">
                      <FormField
                        control={profileForm.control}
                        name="name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-slate-700 font-medium">{t('name')}</FormLabel>
                            <FormControl>
                              <Input {...field} className="border-blue-300 focus:border-blue-500 focus:ring-blue-200" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={profileForm.control}
                        name="email"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-slate-700 font-medium">{t('email')}</FormLabel>
                            <FormControl>
                              <Input {...field} className="border-blue-300 focus:border-blue-500 focus:ring-blue-200" readOnly disabled />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    
                    <FormField
                      control={profileForm.control}
                      name="phone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-slate-700 font-medium">{t('phone')}</FormLabel>
                          <FormControl>
                            <Input {...field} className="border-blue-300 focus:border-blue-500 focus:ring-blue-200" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <div className="flex justify-end">
                      <Button 
                        type="submit" 
                        className="w-full md:w-auto px-8 py-3 bg-gradient-to-r from-blue-600 to-green-600 hover:from-blue-700 hover:to-green-700 text-white font-medium rounded-lg shadow-lg hover:shadow-xl transition-all duration-200"
                      >
                        {t('saveChanges')}
                      </Button>
                    </div>
                  </form>
                </Form>
              </TabsContent>
              
              <TabsContent value="notifications">
                <Form {...notificationsForm}>
                  <form onSubmit={notificationsForm.handleSubmit(onNotificationsSubmit)} className="space-y-6">
                    <div className="space-y-2">
                      <FormField
                        control={notificationsForm.control}
                        name="emailNotifications"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-center justify-between rounded-lg border border-blue-200 p-4 bg-white/50">
                            <div className="space-y-0.5">
                              <FormLabel className="text-base text-slate-700 font-medium">{t('emailNotifications')}</FormLabel>
                              <FormDescription className="text-slate-600">
                                {t('emailNotificationsDesc')}
                              </FormDescription>
                            </div>
                            <FormControl>
                              <Switch
                                checked={field.value}
                                onCheckedChange={field.onChange}
                                className="data-[state=checked]:bg-gradient-to-r data-[state=checked]:from-blue-600 data-[state=checked]:to-green-600"
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={notificationsForm.control}
                        name="newRequests"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-center justify-between rounded-lg border border-blue-200 p-4 bg-white/50">
                            <div className="space-y-0.5">
                              <FormLabel className="text-base text-slate-700 font-medium">{t('newRequests')}</FormLabel>
                              <FormDescription className="text-slate-600">
                                {t('newRequestsDesc')}
                              </FormDescription>
                            </div>
                            <FormControl>
                              <Switch
                                checked={field.value}
                                onCheckedChange={field.onChange}
                                className="data-[state=checked]:bg-gradient-to-r data-[state=checked]:from-blue-600 data-[state=checked]:to-green-600"
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={notificationsForm.control}
                        name="requestUpdates"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-center justify-between rounded-lg border border-blue-200 p-4 bg-white/50">
                            <div className="space-y-0.5">
                              <FormLabel className="text-base text-slate-700 font-medium">{t('requestUpdates')}</FormLabel>
                              <FormDescription className="text-slate-600">
                                {t('requestUpdatesDesc')}
                              </FormDescription>
                            </div>
                            <FormControl>
                              <Switch
                                checked={field.value}
                                onCheckedChange={field.onChange}
                                className="data-[state=checked]:bg-gradient-to-r data-[state=checked]:from-blue-600 data-[state=checked]:to-green-600"
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                    </div>
                    
                    <div className="flex justify-end">
                      <Button 
                        type="submit" 
                        className="w-full md:w-auto px-8 py-3 bg-gradient-to-r from-blue-600 to-green-600 hover:from-blue-700 hover:to-green-700 text-white font-medium rounded-lg shadow-lg hover:shadow-xl transition-all duration-200"
                      >
                        {t('saveChanges')}
                      </Button>
                    </div>
                  </form>
                </Form>
              </TabsContent>
              
              <TabsContent value="password">
                <Form {...passwordForm}>
                  <form onSubmit={passwordForm.handleSubmit(onPasswordSubmit)} className="space-y-6">
                    <div className="grid gap-6">
                      <FormField
                        control={passwordForm.control}
                        name="currentPassword"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-slate-700 font-medium">{t('currentPassword')}</FormLabel>
                            <FormControl>
                              <Input type="password" {...field} className="border-blue-300 focus:border-blue-500 focus:ring-blue-200" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={passwordForm.control}
                        name="newPassword"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-slate-700 font-medium">{t('newPassword')}</FormLabel>
                            <FormControl>
                              <Input type="password" {...field} className="border-blue-300 focus:border-blue-500 focus:ring-blue-200" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={passwordForm.control}
                        name="confirmPassword"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-slate-700 font-medium">{t('confirmPassword')}</FormLabel>
                            <FormControl>
                              <Input type="password" {...field} className="border-blue-300 focus:border-blue-500 focus:ring-blue-200" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    
                    <div className="flex justify-end">
                      <Button 
                        type="submit" 
                        className="w-full md:w-auto px-8 py-3 bg-gradient-to-r from-blue-600 to-green-600 hover:from-blue-700 hover:to-green-700 text-white font-medium rounded-lg shadow-lg hover:shadow-xl transition-all duration-200"
                      >
                        {t('changePassword')}
                      </Button>
                    </div>
                  </form>
                </Form>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Settings;
