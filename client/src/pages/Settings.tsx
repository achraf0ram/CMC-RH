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
import { axiosInstance } from '../components/Api/axios';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Camera, Upload, Eye, EyeOff } from "lucide-react";

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
  const [profilePhoto, setProfilePhoto] = useState<File | null>(null);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const { t, language } = useLanguage();
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
    axiosInstance.put('/user/profile', {
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
    toast({
      title: "Les paramètres d'alerte ont été mis à jour",
      description: "Les modifications ont été enregistrées avec succès",
    });
  }

  async function onPasswordSubmit(values: z.infer<typeof passwordFormSchema>) {
    try {
      await axiosInstance.post('/user/change-password', {
        current_password: values.currentPassword,
        new_password: values.newPassword,
        new_password_confirmation: values.confirmPassword,
      }, { withCredentials: true });
      toast({
        title: language === 'ar' ? "تم تغيير كلمة المرور بنجاح" : "Mot de passe changé avec succès",
        description: language === 'ar' ? "يمكنك الآن استخدام كلمة المرور الجديدة." : "Vous pouvez maintenant utiliser le nouveau mot de passe.",
      });
      passwordForm.reset({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
    } catch (error: any) {
      const msg = error.response?.data?.message || (language === 'ar' ? "حدث خطأ أثناء تغيير كلمة المرور" : "Une erreur s'est produite lors du changement du mot de passe");
      toast({
        title: language === 'ar' ? "خطأ في تغيير كلمة المرور" : "Erreur lors du changement du mot de passe",
        description: msg,
        variant: "destructive",
      });
    }
  }

  const handleProfilePhotoUpload = async () => {
    if (!profilePhoto) return;
    
    setIsUploadingPhoto(true);
    try {
      const formData = new FormData();
      formData.append('profile_photo', profilePhoto);
      
      await axiosInstance.post('/user/profile-photo', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      
      toast({
        title: "Photo de profil mise à jour",
        description: "Votre photo de profil a été mise à jour avec succès",
      });
      
      setProfilePhoto(null);
    } catch (error) {
      toast({
        title: "Erreur lors de la mise à jour",
        description: "Impossible de mettre à jour la photo de profil",
      });
    } finally {
      setIsUploadingPhoto(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-green-50 to-blue-100 px-2 sm:px-4 py-4">
      <div className="max-w-3xl mx-auto w-full">
        <div className="text-center mb-4 sm:mb-6 md:mb-8">
          <h1 className="text-xl sm:text-2xl md:text-3xl font-bold bg-gradient-to-r from-blue-600 to-green-600 bg-clip-text text-transparent mb-1 sm:mb-2">
            {language === 'ar' ? 'الإعدادات' : 'Paramètres'}
          </h1>
          <p className="text-gray-600 text-xs sm:text-sm md:text-base hidden sm:block">
            {language === 'ar' ? 'قم بتحديث معلوماتك الشخصية وكلمة المرور' : 'Mettez à jour vos informations personnelles et votre mot de passe'}
          </p>
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
                    {/* Profile Photo Section */}
                    <div className="flex flex-col items-center space-y-4 p-6 border border-blue-200 rounded-lg bg-blue-50/30">
                      <div className="relative">
                        <Avatar className="w-24 h-24">
                          <AvatarImage src={user?.profile_photo_url} alt={user?.name} />
                          <AvatarFallback className="text-2xl">{user?.name?.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <label htmlFor="profile-photo-upload" className="absolute bottom-0 right-0 bg-blue-600 text-white rounded-full p-2 cursor-pointer hover:bg-blue-700 transition-colors">
                          <Camera className="w-4 h-4" />
                        </label>
                        <input
                          id="profile-photo-upload"
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => setProfilePhoto(e.target.files?.[0] || null)}
                        />
                      </div>
                      
                      {profilePhoto && (
                        <div className="flex flex-col items-center space-y-2">
                          <p className="text-sm text-gray-600">Photo sélectionnée: {profilePhoto.name}</p>
                          <Button
                            type="button"
                            onClick={handleProfilePhotoUpload}
                            disabled={isUploadingPhoto}
                            className="bg-green-600 hover:bg-green-700 text-white"
                          >
                            {isUploadingPhoto ? "Mise à jour..." : "Mettre à jour la photo"}
                          </Button>
                        </div>
                      )}
                    </div>

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
                              <div className="relative">
                                <Input type={showCurrentPassword ? "text" : "password"} {...field} className="border-blue-300 focus:border-blue-500 focus:ring-blue-200 pr-10" />
                                <button type="button" onClick={() => setShowCurrentPassword(v => !v)} className="absolute inset-y-0 right-0 flex items-center px-2 text-gray-500 focus:outline-none">
                                  {showCurrentPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                </button>
                              </div>
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
                              <div className="relative">
                                <Input type={showNewPassword ? "text" : "password"} {...field} className="border-blue-300 focus:border-blue-500 focus:ring-blue-200 pr-10" />
                                <button type="button" onClick={() => setShowNewPassword(v => !v)} className="absolute inset-y-0 right-0 flex items-center px-2 text-gray-500 focus:outline-none">
                                  {showNewPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                </button>
                              </div>
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
                              <div className="relative">
                                <Input type={showConfirmPassword ? "text" : "password"} {...field} className="border-blue-300 focus:border-blue-500 focus:ring-blue-200 pr-10" />
                                <button type="button" onClick={() => setShowConfirmPassword(v => !v)} className="absolute inset-y-0 right-0 flex items-center px-2 text-gray-500 focus:outline-none">
                                  {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                </button>
                              </div>
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
