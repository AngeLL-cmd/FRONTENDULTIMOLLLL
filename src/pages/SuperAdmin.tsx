import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Shield } from "lucide-react";
import { superAdminApi } from "@/services/api";
import { useToast } from "@/hooks/use-toast";

const SuperAdmin = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await superAdminApi.login(email, password);

      if (response.success && response.data) {
        // Guardar token en sessionStorage
        sessionStorage.setItem("superAdminToken", response.data.token);
        sessionStorage.setItem("superAdminEmail", email);
        
        toast({
          title: "Login exitoso",
          description: "Bienvenido al panel de Super Administración",
        });

        // Redirigir al dashboard
        navigate("/superadmin/dashboard");
      } else {
        toast({
          title: "Error de autenticación",
          description: response.error || "Credenciales inválidas",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Error al conectar con el servidor",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-card">
        <CardHeader className="space-y-1">
          <div className="flex items-center justify-between">
            <CardTitle className="text-2xl font-bold">Super Administración</CardTitle>
            <Shield className="w-8 h-8 text-primary" />
          </div>
          <CardDescription>
            Acceso exclusivo para Super Administradores
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSignIn} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="superadmin@elecciones.pe"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={loading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Contraseña</Label>
              <Input
                id="password"
                type="password"
                placeholder="Ingresa tu contraseña"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={loading}
              />
            </div>
            <Button
              type="submit"
              className="w-full bg-gradient-peru hover:opacity-90"
              disabled={loading}
            >
              {loading ? "Iniciando sesión..." : "Iniciar Sesión"}
            </Button>
          </form>
          <div className="mt-4">
            <Button
              variant="ghost"
              className="w-full"
              onClick={() => navigate("/admin/dashboard")}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Volver al Panel Admin
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SuperAdmin;

