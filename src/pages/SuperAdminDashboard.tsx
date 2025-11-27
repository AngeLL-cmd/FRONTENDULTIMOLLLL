import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { LogOut, Database, Shield, Download, Upload, FileText, Loader2 } from "lucide-react";
import { superAdminApi } from "@/services/api";
import { useToast } from "@/hooks/use-toast";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

const SuperAdminDashboard = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [exportData, setExportData] = useState<any>(null);

  useEffect(() => {
    const token = sessionStorage.getItem("superAdminToken");
    if (!token) {
      toast({
        title: "Acceso no autorizado",
        description: "Debes iniciar sesión para acceder al panel de Super Administración",
        variant: "destructive",
      });
      navigate("/superadmin");
      return;
    }

    loadAuditLogs();
  }, [navigate, toast]);

  const loadAuditLogs = async () => {
    setLoading(true);
    try {
      const response = await superAdminApi.getSecurityAudit();
      if (response.success && response.data) {
        setAuditLogs(response.data.logs || []);
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Error al cargar logs de auditoría",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleExportData = async () => {
    setLoading(true);
    try {
      const response = await superAdminApi.exportData();
      if (response.success && response.data) {
        setExportData(response.data);
        // Descargar como JSON
        const dataStr = JSON.stringify(response.data, null, 2);
        const blob = new Blob([dataStr], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = `export_data_${new Date().toISOString().split('T')[0]}.json`;
        link.click();
        URL.revokeObjectURL(url);
        
        toast({
          title: "Datos exportados",
          description: "Los datos se han descargado exitosamente",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Error al exportar datos",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleImportData = () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".json";
    input.onchange = async (e: any) => {
      const file = e.target.files[0];
      if (file) {
        setLoading(true);
        try {
          const text = await file.text();
          const data = JSON.parse(text);
          const response = await superAdminApi.importData(data);
          if (response.success) {
            toast({
              title: "Datos importados",
              description: "Los datos se han importado exitosamente",
            });
          }
        } catch (error) {
          toast({
            title: "Error",
            description: "Error al importar datos",
            variant: "destructive",
          });
        } finally {
          setLoading(false);
        }
      }
    };
    input.click();
  };

  const handleSignOut = () => {
    sessionStorage.removeItem("superAdminToken");
    sessionStorage.removeItem("superAdminEmail");
    navigate("/superadmin");
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="bg-gradient-to-r from-red-600 to-red-800 text-white py-4 shadow-lg">
        <div className="container mx-auto px-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Shield className="w-8 h-8" />
            <div>
              <h1 className="text-2xl font-bold">Super Administración</h1>
              <p className="text-sm text-red-100">Sistema Electoral Perú 2025</p>
            </div>
          </div>
          <Button
            onClick={handleSignOut}
            variant="ghost"
            className="text-white hover:bg-red-700"
          >
            <LogOut className="w-4 h-4 mr-2" />
            Cerrar Sesión
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-6 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Migración de Datos */}
          <Card className="shadow-card">
            <CardHeader>
              <div className="flex items-center gap-2">
                <Database className="w-6 h-6 text-primary" />
                <CardTitle>Migración de Datos</CardTitle>
              </div>
              <CardDescription>
                Exportar e importar datos del sistema
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button
                onClick={handleExportData}
                disabled={loading}
                className="w-full bg-gradient-peru hover:opacity-90"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Exportando...
                  </>
                ) : (
                  <>
                    <Download className="w-4 h-4 mr-2" />
                    Exportar Datos
                  </>
                )}
              </Button>
              <Button
                onClick={handleImportData}
                disabled={loading}
                variant="outline"
                className="w-full"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Importando...
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4 mr-2" />
                    Importar Datos
                  </>
                )}
              </Button>
              <p className="text-sm text-muted-foreground">
                Exporta todos los datos del sistema en formato JSON o importa datos desde un archivo.
              </p>
            </CardContent>
          </Card>

          {/* Auditoría de Seguridad */}
          <Card className="shadow-card">
            <CardHeader>
              <div className="flex items-center gap-2">
                <Shield className="w-6 h-6 text-primary" />
                <CardTitle>Auditoría de Seguridad</CardTitle>
              </div>
              <CardDescription>
                Registro de actividades y accesos al sistema
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-8 h-8 animate-spin text-primary" />
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="border rounded-lg overflow-hidden">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Fecha/Hora</TableHead>
                          <TableHead>Acción</TableHead>
                          <TableHead>Usuario</TableHead>
                          <TableHead>Estado</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {auditLogs.length > 0 ? (
                          auditLogs.map((log: any, index: number) => (
                            <TableRow key={index}>
                              <TableCell className="text-sm">
                                {new Date(log.timestamp).toLocaleString('es-PE')}
                              </TableCell>
                              <TableCell className="text-sm">{log.action}</TableCell>
                              <TableCell className="text-sm">{log.user}</TableCell>
                              <TableCell>
                                <span className={`text-xs px-2 py-1 rounded ${
                                  log.status === 'success' 
                                    ? 'bg-green-100 text-green-800' 
                                    : 'bg-red-100 text-red-800'
                                }`}>
                                  {log.status === 'success' ? 'Éxito' : 'Fallido'}
                                </span>
                              </TableCell>
                            </TableRow>
                          ))
                        ) : (
                          <TableRow>
                            <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                              No hay logs de auditoría disponibles
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </div>
                  <Button
                    onClick={loadAuditLogs}
                    variant="outline"
                    className="w-full"
                  >
                    <FileText className="w-4 h-4 mr-2" />
                    Actualizar Logs
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default SuperAdminDashboard;

