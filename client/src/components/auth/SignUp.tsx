import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Loader2, UserPlus } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";

export const SignUp = () => {
  const navigate = useNavigate();
  const { register } = useAuth();
  const { toast } = useToast();

  const [isLoading, setIsLoading] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [password_confirmation, setPasswordConfirmation] = useState("");
  const [phone, setPhone] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const result = await register(name, email, password, password_confirmation, phone);

      if (result.success) {
        toast({
          title: "Compte créé avec succès",
          description: "Bienvenue sur la plateforme CMC",
        });
        navigate("/");
      } else {
        toast({
          variant: "destructive",
          title: "Erreur lors de la création du compte",
          description:
            Object.values(result.errors || {})
              .flat()
              .join(", ") || "Une erreur inconnue est survenue",
        });
      }
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Erreur lors de la création du compte",
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
        <div className="mb-6 text-center">
          <div className="inline-flex items-center justify-center w-14 h-14 bg-gradient-to-r from-blue-600 to-green-500 rounded-full mb-4 shadow-lg">
            <UserPlus className="w-7 h-7 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-slate-800">Créer un compte</h1>
          <p className="mt-2 text-slate-500">
            Entrez vos informations pour créer un nouveau compte
          </p>
        </div>

        <div className="overflow-hidden rounded-2xl bg-white shadow-2xl">
          <div className="bg-gradient-to-r from-blue-600 to-green-500 p-4 text-center">
            <h2 className="text-2xl font-bold text-white tracking-wider">CMC</h2>
          </div>
          <div className="p-6">
            <form onSubmit={handleSubmit} className="space-y-2">
              <div className="space-y-1">
                <Label htmlFor="name" className="text-left block">Nom et prénom</Label>
                <Input id="name" type="text" placeholder="Entrez votre nom et prénom" value={name} onChange={(e) => setName(e.target.value)} required dir="ltr" />
              </div>
              <div className="space-y-1">
                <Label htmlFor="email" className="text-left block">E-mail</Label>
                <Input id="email" type="email" placeholder="exemple@ofppt.ma" value={email} onChange={(e) => setEmail(e.target.value)} required dir="ltr" />
              </div>
              <div className="space-y-1">
                <Label htmlFor="phone" className="text-left block">Téléphone</Label>
                <Input id="phone" type="tel" placeholder="0612345678" value={phone} onChange={(e) => setPhone(e.target.value)} required dir="ltr" />
              </div>
              <div className="space-y-1">
                <Label htmlFor="password" className="text-left block">Mot de passe</Label>
                <Input id="password" type="password" placeholder="Entrez votre mot de passe" value={password} onChange={(e) => setPassword(e.target.value)} required dir="ltr" />
              </div>
              <div className="space-y-1">
                <Label htmlFor="password_confirmation" className="text-left block">Confirmer le mot de passe</Label>
                <Input id="password_confirmation" type="password" placeholder="Confirmez votre mot de passe" value={password_confirmation} onChange={(e) => setPasswordConfirmation(e.target.value)} required dir="ltr" />
              </div>

              <Button
                type="submit"
                className="w-full bg-gradient-to-r from-blue-600 to-green-500 text-white hover:opacity-90"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Création...
                  </>
                ) : (
                  "Créer un compte"
                )}
              </Button>

              <div className="mt-3 text-center text-sm">
                Vous avez déjà un compte ?{" "}
                <Button
                  variant="link"
                  className="p-0 text-blue-600 hover:text-blue-700 hover:underline"
                  onClick={() => navigate("/login")}
                >
                  Se connecter
                </Button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};