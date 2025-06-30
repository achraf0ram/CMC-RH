import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Loader2, LogIn } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";

export const SignIn = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const success = await login(email, password);

      if (success) {
        toast({
          title: "Connexion réussie",
          description: "Bienvenue sur la plateforme CMC",
        });
        window.location.reload();
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
        description:
          "Une erreur s'est produite. Veuillez réessayer",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      className="flex min-h-screen items-center justify-center bg-cover bg-center p-4"
      style={{ backgroundImage: "url('/lovable-uploads/CMC CASA -.png')" }}
    >
      <div className="absolute inset-0 bg-slate-100/80 backdrop-blur-md" />
      <div className="relative z-10 w-full max-w-md">
        <div className="mb-8 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-blue-600 to-green-500 rounded-full mb-4 shadow-lg">
            <LogIn className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-slate-800">Se connecter</h1>
          <p className="mt-2 text-slate-500">
            Entrez vos informations pour accéder à votre compte
          </p>
        </div>

        <div className="overflow-hidden rounded-2xl bg-white shadow-2xl">
          <div className="bg-gradient-to-r from-blue-600 to-green-500 p-4 text-center">
            <h2 className="text-2xl font-bold text-white tracking-wider">CMC</h2>
          </div>
          <div className="p-7">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-left block">E-mail</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="exemple@ofppt.ma"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  dir="ltr"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-left block">Mot de passe</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Entrez votre mot de passe"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  dir="ltr"
                />
              </div>
              
              <div className="text-sm text-left">
                  <Button variant="link" type="button" className="p-0 text-blue-600 hover:text-blue-700 hover:underline" onClick={() => navigate('/forgot-password')}>
                      Mot de passe oublié ?
                  </Button>
              </div>

              <Button
                type="submit"
                className="w-full bg-gradient-to-r from-blue-600 to-green-500 text-white hover:opacity-90"
                disabled={isLoading}
              >
                {isLoading ? (
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