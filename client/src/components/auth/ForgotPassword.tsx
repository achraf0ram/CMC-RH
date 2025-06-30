import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Link } from "react-router-dom";
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
import { Mail, ArrowLeft } from "lucide-react";
import { axiosInstance } from "../Api/axios";

const formSchema = z.object({
  email: z.string().email({ message: "L'adresse e-mail n'est pas valide" }),
});

export const ForgotPassword = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [isEmailSent, setIsEmailSent] = useState(false);
  const { toast } = useToast();
  const [apiError, setApiError] = useState("");

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
    },
  });

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    setIsLoading(true);
    setApiError("");
    try {
      const checkRes = await axiosInstance.post('/api/check-email-exists', { email: values.email });
      if (!checkRes.data.exists) {
        setApiError("Aucun compte trouvé avec cet e-mail. Vous pouvez créer un nouveau compte.");
        setIsLoading(false);
        return;
      }
      await axiosInstance.post('/api/forgot-password', { email: values.email });
      setIsEmailSent(true);
    } catch (error: any) {
      setApiError("Une erreur s'est produite. Veuillez réessayer plus tard.");
    } finally {
      setIsLoading(false);
    }
  };

  if (isEmailSent) {
    return (
      <div
        className="flex min-h-screen items-center justify-center bg-cover bg-center p-4"
        style={{ backgroundImage: "url('/lovable-uploads/CMC CASA -.png')" }}
      >
        <div className="absolute inset-0 bg-slate-100/80 backdrop-blur-md" />
        <div className="relative z-10 w-full max-w-md">
           <div className="overflow-hidden rounded-2xl bg-white shadow-2xl text-center p-8">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-green-400 to-green-600 rounded-full mb-6 shadow-lg">
                <Mail className="w-8 h-8 text-white" />
              </div>
              <h1 className="text-2xl font-bold text-slate-800">Lien envoyé !</h1>
              <p className="mt-3 text-slate-500">
                Un lien de réinitialisation de mot de passe a été envoyé à votre adresse e-mail. Veuillez vérifier votre boîte de réception.
              </p>
              <Button asChild className="mt-6 w-full bg-gradient-to-r from-blue-600 to-green-500 text-white hover:opacity-90">
                <Link to="/login">
                  Retour à la connexion
                </Link>
              </Button>
            </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className="flex min-h-screen items-center justify-center bg-cover bg-center p-4"
      style={{ backgroundImage: "url('/lovable-uploads/CMC CASA -.png')" }}
    >
      <div className="absolute inset-0 bg-slate-100/80 backdrop-blur-md" />
      <div className="relative z-10 w-full max-w-md">
        <div className="mb-8 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-blue-600 to-green-500 rounded-full mb-4 shadow-lg">
            <Mail className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-slate-800">Mot de passe oublié ?</h1>
          <p className="mt-2 text-slate-500">
            Entrez votre e-mail pour recevoir un lien de réinitialisation
          </p>
        </div>

        <div className="overflow-hidden rounded-2xl bg-white shadow-2xl">
          <div className="bg-gradient-to-r from-blue-600 to-green-500 p-4 text-center">
            <h2 className="text-2xl font-bold text-white tracking-wider">CMC</h2>
          </div>
          <div className="p-7">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-left block">E-mail</FormLabel>
                      <FormControl>
                        <Input
                          type="email"
                          placeholder="exemple@ofppt.ma"
                          {...field}
                          dir="ltr"
                        />
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
                  {isLoading ? "Envoi en cours..." : "Envoyer le lien de réinitialisation"}
                </Button>
              </form>
            </Form>
            <div className="mt-6 text-center text-sm text-slate-500">
              <Link to="/login" className="font-medium text-blue-600 hover:underline inline-flex items-center gap-1">
                <ArrowLeft className="w-4 h-4" />
                Retour à la page de connexion
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};