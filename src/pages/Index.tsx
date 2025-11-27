import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { CandidateCard } from "@/components/CandidateCard";
import { CandidateModal } from "@/components/CandidateModal";
import { ConfirmVoteModal } from "@/components/ConfirmVoteModal";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { RefreshCw, CheckCircle2, User, MapPin, CreditCard, Sparkles, AlertCircle, Loader2, Clock, ArrowLeft } from "lucide-react";
import { cn } from "@/lib/utils";
import { candidateApi, voteApi, CandidateDTO, VoterDTO } from "@/services/api";

interface Candidate extends CandidateDTO {
  photo_url?: string;
  party_name?: string;
  party_logo_url?: string;
  party_description?: string;
  academic_formation?: string;
  professional_experience?: string;
  campaign_proposal?: string;
  vote_count?: number;
}

const Index = () => {
  const navigate = useNavigate();
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [voterData, setVoterData] = useState<VoterDTO | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [candidateModalOpen, setCandidateModalOpen] = useState(false);
  const [confirmModalOpen, setConfirmModalOpen] = useState(false);
  const [selectedCandidate, setSelectedCandidate] = useState<Candidate | null>(null);
  const [voteSelections, setVoteSelections] = useState<Array<{
    candidateId: string;
    candidateName: string;
    category: "presidencial" | "distrital" | "regional";
  }>>([]);
  const [votedCategories, setVotedCategories] = useState<string[]>([]);
  const [timeRemaining, setTimeRemaining] = useState<number>(300); // 5 minutos en segundos
  const [showTimeoutModal, setShowTimeoutModal] = useState(false);
  const [showTimeWarning, setShowTimeWarning] = useState(true);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const warningTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };
  
  const handleTimeout = useCallback(async () => {
    // Mostrar modal de tiempo agotado
    setShowTimeoutModal(true);
    
    // Invalidar votos en el backend
    const voterDni = sessionStorage.getItem('voterDni');
    if (voterDni) {
      try {
        await voteApi.invalidate(voterDni);
      } catch (error) {
        console.error('Error al invalidar votos:', error);
      }
    }
    
    // Después de 7 segundos, cerrar sesión y redirigir
    timeoutRef.current = setTimeout(() => {
      // Limpiar sessionStorage
      sessionStorage.removeItem('voter');
      sessionStorage.removeItem('voterDni');
      sessionStorage.removeItem('session_start_time');
      
      // Redirigir a home
      navigate('/');
    }, 7000);
  }, [navigate]);

  // Cargar datos del votante y candidatos
  useEffect(() => {
    const loadData = async () => {
      // Obtener datos del votante del sessionStorage
      const voterJson = sessionStorage.getItem('voter');
      const voterDni = sessionStorage.getItem('voterDni');

      if (!voterJson || !voterDni) {
        navigate('/');
        return;
      }

      try {
        const voter: VoterDTO = JSON.parse(voterJson);
        setVoterData(voter);

        // Obtener candidatos
        const candidatesResponse = await candidateApi.getAll();
        if (candidatesResponse.success && candidatesResponse.data) {
          // Convertir CandidateDTO a Candidate
          const candidatesData: Candidate[] = candidatesResponse.data.map(c => ({
            ...c,
            photo_url: c.photoUrl,
            party_name: c.partyName,
            party_logo_url: c.partyLogoUrl,
            party_description: c.partyDescription,
            academic_formation: c.academicFormation,
            professional_experience: c.professionalExperience,
            campaign_proposal: c.campaignProposal,
            vote_count: c.voteCount || 0,
          }));
          setCandidates(candidatesData);
        } else {
          setError(candidatesResponse.error || 'Error al cargar candidatos');
        }

        // Obtener categorías ya votadas
        const categoriesResponse = await voteApi.getVotedCategories(voterDni);
        if (categoriesResponse.success && categoriesResponse.data) {
          const voted = categoriesResponse.data;
          setVotedCategories(voted);
          
          // Si ya votó en todas las categorías o hasVoted es true, ocultar contador y mensaje
          const allCategoriesVoted = voted.length >= 3;
          if (allCategoriesVoted || voter.hasVoted) {
            setShowTimeWarning(false);
          }
        }
      } catch (err) {
        setError('Error al cargar datos');
      } finally {
        setLoading(false);
      }
    };

    loadData();
    
    // Verificar si el votante ya votó
    const checkIfVoted = async () => {
      const voterDni = sessionStorage.getItem('voterDni');
      if (voterDni) {
        const categoriesResponse = await voteApi.getVotedCategories(voterDni);
        if (categoriesResponse.success && categoriesResponse.data) {
          const voted = categoriesResponse.data;
          setVotedCategories(voted);
          
          // Si ya votó en todas las categorías (3) o si hasVoted es true, no mostrar contador ni mensaje
          const allCategoriesVoted = voted.length >= 3;
          const voterJson = sessionStorage.getItem('voter');
          if (voterJson) {
            const voter: VoterDTO = JSON.parse(voterJson);
            if (allCategoriesVoted || voter.hasVoted) {
              setShowTimeWarning(false);
              return true; // Ya votó, no iniciar contador
            }
          }
        }
      }
      return false; // No ha votado, iniciar contador
    };
    
    // Verificar si ya votó antes de mostrar avisos
    checkIfVoted().then((hasVoted) => {
      if (hasVoted) {
        return; // No mostrar contador ni mensaje si ya votó
      }
      
      // Mostrar aviso de tiempo limitado por 5 segundos solo si no ha votado
      warningTimeoutRef.current = setTimeout(() => {
        setShowTimeWarning(false);
      }, 5000);
      
      // Inicializar contador de tiempo desde sessionStorage
      // El tiempo se inicia cuando se verifica el DNI en Home.tsx
      const sessionStartTime = sessionStorage.getItem('session_start_time');
      if (sessionStartTime) {
        const elapsed = Math.floor((Date.now() - parseInt(sessionStartTime)) / 1000);
        const remaining = Math.max(0, 300 - elapsed); // 5 minutos = 300 segundos
        setTimeRemaining(remaining);
        
        if (remaining === 0) {
          // Si ya pasó el tiempo, invalidar votos inmediatamente
          handleTimeout();
          return;
        }
      } else {
        // Si no hay tiempo de inicio, redirigir a home (sesión no iniciada)
        navigate('/');
        return;
      }
      
      // Iniciar contador
      intervalRef.current = setInterval(() => {
        setTimeRemaining((prev) => {
          if (prev <= 1) {
            // Tiempo agotado
            if (intervalRef.current) {
              clearInterval(intervalRef.current);
            }
            handleTimeout();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    });
    
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      if (warningTimeoutRef.current) {
        clearTimeout(warningTimeoutRef.current);
      }
    };
  }, [navigate, handleTimeout]);

  const handleVote = (candidate: Candidate) => {
    // Verificar si ya votó en esta categoría
    if (votedCategories.includes(candidate.category)) {
      setError(`Ya has votado en la categoría ${candidate.category}`);
      return;
    }

    const isCurrentlySelected = voteSelections.some(
      (sel) => sel.candidateId === candidate.id && sel.category === candidate.category
    );

    if (isCurrentlySelected) {
      setVoteSelections((prev) =>
        prev.filter(
          (sel) => !(sel.candidateId === candidate.id && sel.category === candidate.category)
        )
      );
    } else {
      const existingSelection = voteSelections.find(
        (sel) => sel.category === candidate.category
      );

      if (existingSelection) {
        setVoteSelections((prev) =>
          prev.map((sel) =>
            sel.category === candidate.category
              ? {
                  candidateId: candidate.id,
                  candidateName: candidate.name,
                  category: candidate.category as "presidencial" | "distrital" | "regional",
                }
              : sel
          )
        );
      } else {
        setVoteSelections((prev) => [
          ...prev,
          {
            candidateId: candidate.id,
            candidateName: candidate.name,
            category: candidate.category as "presidencial" | "distrital" | "regional",
          },
        ]);
      }
    }
    setError(null);
  };

  const handleConfirmVotes = () => {
    setConfirmModalOpen(true);
  };

  const handleSubmitVotes = async () => {
    const voterDni = sessionStorage.getItem('voterDni');
    if (!voterDni || voteSelections.length === 0) {
      setError('No hay votos para registrar');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const response = await voteApi.register({
        voterDni,
        selections: voteSelections,
      });

      if (response.success) {
        // Limpiar selecciones y cerrar modal
        setVoteSelections([]);
        setConfirmModalOpen(false);
        
        // Limpiar intervalos y timeouts
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
        }
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
        }
        
        // Limpiar sessionStorage
        sessionStorage.removeItem('voter');
        sessionStorage.removeItem('voterDni');
        sessionStorage.removeItem('session_start_time');
        
        // Redirigir a la página de inicio después de un breve delay
        setTimeout(() => {
          navigate('/');
        }, 500);
      } else {
        setError(response.error || 'Error al registrar votos');
        setSubmitting(false);
      }
    } catch (err) {
      setError('Error de conexión al registrar votos');
      setSubmitting(false);
    }
  };

  const handleViewCandidate = (candidate: Candidate) => {
    setSelectedCandidate(candidate);
    setCandidateModalOpen(true);
  };

  const handleRefresh = async () => {
    setLoading(true);
    setError(null);
    try {
      const candidatesResponse = await candidateApi.getAll();
      if (candidatesResponse.success && candidatesResponse.data) {
        const candidatesData: Candidate[] = candidatesResponse.data.map(c => ({
          ...c,
          photo_url: c.photoUrl,
          party_name: c.partyName,
          party_logo_url: c.partyLogoUrl,
          party_description: c.partyDescription,
          academic_formation: c.academicFormation,
          professional_experience: c.professionalExperience,
          campaign_proposal: c.campaignProposal,
          vote_count: c.voteCount || 0,
        }));
        setCandidates(candidatesData);
      }
    } catch (err) {
      setError('Error al actualizar datos');
    } finally {
      setLoading(false);
    }
  };

  const getCandidatesByCategory = (category: string) => {
    return candidates.filter((c) => c.category === category);
  };

  const getCategoryTotal = (category: string) => {
    return getCandidatesByCategory(category).reduce((sum, c) => sum + (c.vote_count || 0), 0);
  };

  const getPercentage = (voteCount: number, category: string) => {
    const total = getCategoryTotal(category);
    return total > 0 ? (voteCount / total) * 100 : 0;
  };

  const totalVotes = candidates.reduce((sum, c) => sum + (c.vote_count || 0), 0);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Cargando candidatos...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-gradient-peru text-primary-foreground py-6 shadow-lg">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold mb-2">Elecciones Perú 2025</h1>
              <p className="text-primary-foreground/90 text-lg">Sistema de Votación Electoral</p>
            </div>
          </div>
        </div>
      </header>

      {/* Contador fijo visible en todo momento - Solo si no ha votado */}
      {(!voterData?.hasVoted && votedCategories.length < 3) && (
        <div className="fixed top-4 right-4 z-50 flex items-center gap-3 bg-red-600 backdrop-blur-sm px-6 py-4 rounded-lg border-2 border-red-400 shadow-2xl">
          <Clock className="w-7 h-7 animate-pulse text-white" />
          <div className="flex flex-col">
            <span className="text-xs font-semibold uppercase tracking-wide text-white/90">Tiempo Restante</span>
            <span className="text-3xl font-bold font-mono text-white">{formatTime(timeRemaining)}</span>
          </div>
        </div>
      )}

      {/* Mensaje de Bienvenida */}
      {voterData && (
        <div className="bg-gradient-to-br from-primary via-primary/95 to-primary/90 text-primary-foreground shadow-lg border-b-4 border-primary/20">
          <div className="container mx-auto px-4 py-6">
            <div className="flex items-center gap-4 flex-wrap">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-2">
                  <Sparkles className="w-5 h-5 text-yellow-300 animate-pulse" />
                  <h2 className="text-3xl font-bold tracking-tight">
                    ¡Bienvenido, {voterData.fullName}!
                  </h2>
                </div>
                
                <div className="flex flex-wrap items-center gap-4 text-primary-foreground/90">
                  <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm px-3 py-1.5 rounded-full border border-white/20">
                    <CreditCard className="w-4 h-4" />
                    <span className="text-sm font-medium">DNI: {voterData.dni}</span>
                  </div>
                  
                  {voterData.district && voterData.province && voterData.department && (
                    <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm px-3 py-1.5 rounded-full border border-white/20">
                      <MapPin className="w-4 h-4" />
                      <span className="text-sm font-medium">
                        {voterData.district}, {voterData.province}, {voterData.department}
                      </span>
                    </div>
                  )}
                </div>
              </div>
              
              <div className="flex-shrink-0">
                <div className="bg-white/20 backdrop-blur-sm px-4 py-2 rounded-lg border border-white/30">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-300 rounded-full animate-pulse"></div>
                    <span className="text-sm font-semibold">Verificado</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Error Alert */}
      {error && (
        <div className="container mx-auto px-4 pt-4">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        </div>
      )}

      {/* Stats Bar */}
      <div className="bg-card border-b border-border py-4 shadow-sm">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-6">
              <div>
                <p className="text-sm text-muted-foreground">Total de Votos</p>
                <p className="text-3xl font-bold text-primary">{totalVotes.toLocaleString()}</p>
              </div>
              <div className="hidden md:block">
                <p className="text-sm text-muted-foreground">Candidatos</p>
                <p className="text-2xl font-bold text-foreground">{candidates.length}</p>
              </div>
            </div>
            <Button onClick={handleRefresh} variant="outline" className="flex items-center gap-2" disabled={loading}>
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              Actualizar
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <Tabs defaultValue="presidencial" className="w-full">
          <TabsList className="grid w-full max-w-2xl mx-auto grid-cols-3 mb-8">
            <TabsTrigger value="presidencial" className="text-base">
              Presidencial
            </TabsTrigger>
            <TabsTrigger value="distrital" className="text-base">
              Distrital
            </TabsTrigger>
            <TabsTrigger value="regional" className="text-base">
              Regional
            </TabsTrigger>
          </TabsList>

          {["presidencial", "distrital", "regional"].map((category) => (
            <TabsContent key={category} value={category}>
              {votedCategories.includes(category) && (
                <Alert className="mb-4">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    Ya has votado en esta categoría. No puedes cambiar tu voto.
                  </AlertDescription>
                </Alert>
              )}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {getCandidatesByCategory(category).map((candidate) => {
                  const isSelected = voteSelections.some(
                    (sel) => sel.candidateId === candidate.id && sel.category === category
                  );
                  const isDisabled = votedCategories.includes(category);
                  
                  return (
                    <CandidateCard
                      key={candidate.id}
                      id={candidate.id}
                      name={candidate.name}
                      photo={candidate.photo_url}
                      description={candidate.description}
                      voteCount={candidate.vote_count || 0}
                      percentage={getPercentage(candidate.vote_count || 0, category)}
                      onViewCandidate={() => handleViewCandidate(candidate)}
                      onVote={() => handleVote(candidate)}
                      isSelected={isSelected}
                      disabled={isDisabled}
                    />
                  );
                })}
              </div>
            </TabsContent>
          ))}
        </Tabs>
      </main>

      {/* Modals */}
      {selectedCandidate && (
        <CandidateModal
          open={candidateModalOpen}
          onOpenChange={setCandidateModalOpen}
          candidateName={selectedCandidate.name}
          academicFormation={selectedCandidate.academic_formation}
          professionalExperience={selectedCandidate.professional_experience}
          campaignProposal={selectedCandidate.campaign_proposal}
          partyName={selectedCandidate.party_name}
          partyLogo={selectedCandidate.party_logo_url}
          partyDescription={selectedCandidate.party_description}
          voteCount={selectedCandidate.vote_count || 0}
          percentage={getPercentage(selectedCandidate.vote_count || 0, selectedCandidate.category)}
          candidatePhoto={selectedCandidate.photo_url}
          category={selectedCandidate.category}
        />
      )}

      <ConfirmVoteModal
        open={confirmModalOpen}
        onOpenChange={setConfirmModalOpen}
        voteSelections={voteSelections}
        onConfirm={handleSubmitVotes}
        loading={submitting}
      />

      {/* Botón flotante de Confirmar Votos */}
      {voteSelections.length > 0 && (
        <Button
          onClick={handleConfirmVotes}
          className={cn(
            "fixed bottom-6 right-28 shadow-lg z-50",
            "bg-gradient-peru hover:opacity-90 text-white",
            "transition-all duration-300",
            "px-6 py-3 h-auto"
          )}
        >
          <CheckCircle2 className="w-5 h-5 mr-2" />
          Confirmar Votos ({voteSelections.length})
        </Button>
      )}

      {/* Botón para volver al inicio - Solo para votantes que ya votaron */}
      {(voterData?.hasVoted || votedCategories.length >= 3) && (
        <Button
          onClick={() => {
            sessionStorage.removeItem('voter');
            sessionStorage.removeItem('voterDni');
            sessionStorage.removeItem('session_start_time');
            navigate('/');
          }}
          className={cn(
            "fixed bottom-6 left-6 shadow-lg z-50",
            "bg-gradient-peru hover:opacity-90 text-white",
            "transition-all duration-300",
            "px-6 py-3 h-auto"
          )}
        >
          <ArrowLeft className="w-5 h-5 mr-2" />
          Volver al Inicio
        </Button>
      )}

      {/* Modal de aviso de tiempo limitado - Solo si no ha votado */}
      {(!voterData?.hasVoted && votedCategories.length < 3) && (
        <Dialog open={showTimeWarning} onOpenChange={() => {}}>
          <DialogContent className="sm:max-w-md" hideClose>
            <DialogHeader>
              <DialogTitle className="text-center text-4xl font-bold text-primary mb-4 flex items-center justify-center gap-3">
                <Clock className="w-10 h-10 text-amber-500 animate-pulse" />
                Tiempo Limitado
              </DialogTitle>
              <DialogDescription className="text-center text-2xl pt-4 font-bold text-foreground">
                Tienes <span className="text-red-600">5 minutos</span> para completar tu votación
              </DialogDescription>
              <div className="flex justify-center mt-4">
                <div className="bg-primary/10 px-4 py-2 rounded-lg">
                  <p className="text-sm text-muted-foreground">
                    El tiempo comenzará a contar ahora
                  </p>
                </div>
              </div>
            </DialogHeader>
          </DialogContent>
        </Dialog>
      )}

      {/* Modal de tiempo agotado */}
      <Dialog open={showTimeoutModal} onOpenChange={() => {}}>
        <DialogContent className="sm:max-w-md" hideClose>
          <DialogHeader>
            <DialogTitle className="text-center text-3xl font-bold text-primary mb-4">
              Tiempo Agotado
            </DialogTitle>
            <DialogDescription className="text-center text-xl pt-4 font-semibold">
              Su tiempo ha acabado, gracias por votar
            </DialogDescription>
          </DialogHeader>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Index;
