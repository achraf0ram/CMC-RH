import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { Lock, Eye, EyeOff } from "lucide-react";
import { axiosInstance } from "../Api/axios";

const formSchema = z.object({
  password: z.string().min(6, { message: "Le mot de passe doit contenir au moins 6 caractères" }),
  confirmPassword: z.string().min(1, { message: "La confirmation du mot de passe est requise" }),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Les mots de passe ne correspondent pas",
  path: ["confirmPassword"],
});

function useQuery() {
  return new URLSearchParams(useLocation().search);
}

export const ResetPassword = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [apiError, setApiError] = useState("");
  const [success, setSuccess] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();
  const query = useQuery();
  const token = query.get("token") || "";
  const email = query.get("email") || "";

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      password: "",
      confirmPassword: "",
    },
  });

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    setIsLoading(true);
    setApiError("");
    try {
      await axiosInstance.get('/sanctum/csrf-cookie');
      await axiosInstance.post(
        '/reset-password',
        {
          token,
          email,
          password: values.password,
          password_confirmation: values.confirmPassword,
        },
        {
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );
      setSuccess(true);
      toast({
        title: "Mot de passe mis à jour",
        description: "Votre mot de passe a été mis à jour avec succès.",
      });
      setTimeout(() => navigate("/login"), 2000);
    } catch (error: any) {
      setApiError("Une erreur s'est produite lors de la mise à jour. Veuillez vérifier le lien ou réessayer.");
    } finally {
      setIsLoading(false);
    }
  };

  if (!token || !email) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-cover bg-center p-4" style={{ backgroundImage: "url('/lovable-uploads/CMC CASA -.png')" }}>
        <div className="absolute inset-0 bg-white/20" />
        <div className="relative z-10 w-full max-w-md text-center bg-white rounded-2xl shadow-2xl p-8">
          <h2 className="text-2xl font-bold text-red-600 mb-4">Lien invalide</h2>
          <p className="mb-6">Le lien de réinitialisation est invalide ou incomplet.</p>
          <Button asChild className="bg-gradient-to-r from-blue-600 to-green-500 text-white">
            <Link to="/forgot-password">Demander un nouveau lien</Link>
          </Button>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-cover bg-center p-4" style={{ backgroundImage: "url('/lovable-uploads/CMC CASA -.png')" }}>
        <div className="absolute inset-0 bg-white/20" />
        <div className="relative z-10 w-full max-w-md text-center bg-white rounded-2xl shadow-2xl p-8">
          <h2 className="text-2xl font-bold text-green-600 mb-4">Mot de passe mis à jour !</h2>
          <p className="mb-6">Vous pouvez maintenant vous connecter avec votre nouveau mot de passe.</p>
          <Button asChild className="bg-gradient-to-r from-blue-600 to-green-500 text-white">
            <Link to="/login">Aller à la connexion</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div
      className="flex min-h-screen items-center justify-center bg-cover bg-center p-4"
      style={{ backgroundImage: "url('/lovable-uploads/CMC CASA -.png')" }}
    >
      <div className="absolute inset-0 bg-white/30" />
      <div className="relative z-10 w-full max-w-md">
        <div className="flex justify-center mb-1">
          <div className="w-16 h-16 rounded-full bg-white/90 border-2 border-blue-400 shadow-xl flex items-center justify-center transition-transform duration-200 hover:scale-105 hover:shadow-2xl">
            <img src="/favicon.ico" alt="Logo" className="w-12 h-12 object-cover rounded-full" />
          </div>
        </div>
        <div className="mb-8 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-blue-600 to-green-500 rounded-full mb-4 shadow-lg">
            <Lock className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-slate-800">Réinitialiser le mot de passe</h1>
          <p className="mt-2 text-slate-500">
            Entrez votre nouveau mot de passe
          </p>
        </div>
        <div className="overflow-hidden rounded-2xl bg-white shadow-2xl">
          <div className="bg-gradient-to-r from-blue-600 to-green-500 p-4 text-center rounded-t-2xl">
            <div className="flex justify-center mb-2">
              <div className="w-12 h-12 rounded-full bg-white shadow flex items-center justify-center">
                <img src="/favicon.ico" alt="Logo" className="w-8 h-8 object-contain" />
              </div>
            </div>
            <h2 className="text-2xl font-bold text-white tracking-wider">CMC</h2>
          </div>
          <div className="p-7">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-left block">Nouveau mot de passe</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Input
                            type={showPassword ? "text" : "password"}
                            placeholder="Entrez le nouveau mot de passe"
                            {...field}
                            dir="ltr"
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                            onClick={() => setShowPassword(!showPassword)}
                          >
                            {showPassword ? <EyeOff className="h-4 w-4 text-slate-400" /> : <Eye className="h-4 w-4 text-slate-400" />}
                          </Button>
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="confirmPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-left block">Confirmer le mot de passe</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Input
                            type={showConfirmPassword ? "text" : "password"}
                            placeholder="Confirmez le mot de passe"
                            {...field}
                            dir="ltr"
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          >
                            {showConfirmPassword ? <EyeOff className="h-4 w-4 text-slate-400" /> : <Eye className="h-4 w-4 text-slate-400" />}
                          </Button>
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                {apiError && (
                  <div className="text-red-600 text-sm text-center font-medium">{apiError}</div>
                )}
                <Button
                  type="submit"
                  className="w-full bg-gradient-to-r from-blue-600 to-green-500 text-white hover:opacity-90"
                  disabled={isLoading}
                >
                  {isLoading ? "Mise à jour..." : "Mettre à jour le mot de passe"}
                </Button>
              </form>
            </Form>
            <div className="mt-6 text-center text-sm text-slate-500">
              <Link to="/login" className="font-medium text-blue-600 hover:underline">
                &larr; Retour à la page de connexion
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};