import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft } from "lucide-react";
import { adminApi } from "@/services/api";
import { useToast } from "@/hooks/use-toast";

const Admin = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await adminApi.login(email, password);

      if (response.success && response.data) {
        // Guardar token en sessionStorage
        sessionStorage.setItem("adminToken", response.data.token);
        sessionStorage.setItem("adminEmail", email);
        
        toast({
          title: "Login exitoso",
          description: "Bienvenido al panel administrativo",
        });

        // Redirigir al dashboard
        navigate("/admin/dashboard");
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
      <div className="w-full max-w-md">
        <Button
          variant="ghost"
          onClick={() => navigate("/")}
          className="mb-4 flex items-center gap-2"
        >
          <ArrowLeft className="w-4 h-4" />
          Volver al inicio
        </Button>

        <Card className="shadow-card">
          <CardHeader className="text-center">
            <div className="w-16 h-16 bg-gradient-peru rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-3xl">🛡️</span>
            </div>
            <CardTitle className="text-2xl font-bold">Apartado Administrativo</CardTitle>
            <CardDescription>Acceso exclusivo para administradores del sistema electoral</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSignIn} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Correo Electrónico</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="admin@elecciones.pe"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Contraseña</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
              <Button
                type="submit"
                className="w-full bg-gradient-peru hover:opacity-90"
              >
                Iniciar Sesión
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Admin;
