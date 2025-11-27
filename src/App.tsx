import { useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { BrowserRouter, Routes, Route, useNavigate } from "react-router-dom";
import Home from "./pages/Home";
import Index from "./pages/Index";
import Admin from "./pages/Admin";
import AdminDashboard from "./pages/AdminDashboard";
import SuperAdmin from "./pages/SuperAdmin";
import SuperAdminDashboard from "./pages/SuperAdminDashboard";
import NotFound from "./pages/NotFound";
import { Chatbot } from "@/components/Chatbot";

// Componente para manejar el listener de teclado
const KeyboardListener = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Ctrl + Alt + A para acceso admin
      if (event.ctrlKey && event.altKey && event.key.toLowerCase() === 'a') {
        event.preventDefault();
        navigate("/admin");
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [navigate]);

  return null;
};

const App = () => (
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <KeyboardListener />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/votar" element={<Index />} />
          <Route path="/admin" element={<Admin />} />
          <Route path="/admin/dashboard" element={<AdminDashboard />} />
          <Route path="/superadmin" element={<SuperAdmin />} />
          <Route path="/superadmin/dashboard" element={<SuperAdminDashboard />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
        <Chatbot />
      </BrowserRouter>
    </TooltipProvider>
);

export default App;
