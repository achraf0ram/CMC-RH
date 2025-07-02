import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Loader2, LogIn } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import { useLanguage } from "../../contexts/LanguageContext";

const formSchema = z.object({
  email: z.string().email({ message: "Veuillez entrer une adresse e-mail valide." }),
  password: z.string().min(8, { message: "Le mot de passe doit contenir au moins 8 caractères." }),
});

export const SignIn = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const { toast } = useToast();
  const { setLanguage } = useLanguage();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const { formState: { isSubmitting } } = form;

  const handleSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      const { success, isAdmin } = await login(values.email, values.password);

      if (success) {
        toast({
          title: "Connexion réussie",
          description: "Bienvenue sur la plateforme CMC",
        });
        
        setLanguage('fr');

        setTimeout(() => {
          if (isAdmin) {
            navigate("/admin/dashboard", { replace: true });
          } else {
            navigate("/", { replace: true });
          }
        }, 100); // A small delay to ensure state update

      } else {
        toast({
          variant: "destructive",
          title: "Erreur de connexion",
          description: "Veuillez vérifier votre e-mail et votre mot de passe",
        });
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Erreur de connexion",
        description: "Une erreur s'est produite. Veuillez réessayer",
      });
    }
  };

  return (
    <div
      className="flex min-h-screen items-center justify-center bg-cover bg-center p-4"
      style={{ backgroundImage: "url('/lovable-uploads/CMC CASA -.png')" }}
    >
      <div className="absolute inset-0 bg-white/30" />
      <div className="relative z-10 w-full max-w-md">
        <div className="overflow-hidden rounded-3xl bg-white shadow-3xl animate-fade-in">
          <div className="bg-gradient-to-r from-blue-500 to-green-400 p-6 text-center rounded-t-3xl">
            <div className="flex justify-center mb-1">
              <div className="w-16 h-16 rounded-full bg-white/90 border-2 border-blue-400 shadow-xl flex items-center justify-center transition-transform duration-200 hover:scale-105 hover:shadow-2xl">
                <img src="/favicon.ico" alt="Logo" className="w-12 h-12 object-cover rounded-full" />
              </div>
            </div>
            <h2 className="text-3xl font-bold text-white tracking-wider mb-1">CMC</h2>
            <p className="text-white/80 text-sm">مرحبا بك! الرجاء تسجيل الدخول للمتابعة</p>
          </div>
          <div className="p-8">
            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-left block">E-mail</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="exemple@ofppt.ma"
                  {...form.register("email")}
                  required
                  dir="ltr"
                />
                {form.formState.errors.email && <p className="text-red-500 text-sm">{form.formState.errors.email.message}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-left block">Mot de passe</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Entrez votre mot de passe"
                  {...form.register("password")}
                  required
                  dir="ltr"
                />
                 {form.formState.errors.password && <p className="text-red-500 text-sm">{form.formState.errors.password.message}</p>}
              </div>
              
              <div className="text-sm text-left">
                  <Button variant="link" type="button" className="p-0 text-blue-600 hover:text-blue-700 hover:underline" onClick={() => navigate('/forgot-password')}>
                      Mot de passe oublié ?
                  </Button>
              </div>

              <Button
                type="submit"
                className="w-full bg-gradient-to-r from-blue-600 to-green-500 text-white hover:shadow-md active:scale-95 transition-all text-lg py-3"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Connexion...
                  </>
                ) : (
                  "Se connecter"
                )}
              </Button>

              <div className="mt-4 text-center text-sm">
                Vous n'avez pas de compte ?{" "}
                <Button
                  variant="link"
                  className="p-0 text-blue-600 hover:text-blue-700 hover:underline"
                  onClick={() => navigate("/register")}
                >
                  Créer un nouveau compte
                </Button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};