import { Loader2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { CheckCircle2 } from "lucide-react";

interface VoteSelection {
  candidateId: string;
  candidateName: string;
  category: "presidencial" | "distrital" | "regional";
}

interface ConfirmVoteModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  voteSelections: VoteSelection[];
  onConfirm: () => void;
  loading?: boolean;
}

export const ConfirmVoteModal = ({
  open,
  onOpenChange,
  voteSelections,
  onConfirm,
  loading = false,
}: ConfirmVoteModalProps) => {
  const getCategoryLabel = (category: string) => {
    const labels: Record<string, string> = {
      presidencial: "Presidencial",
      distrital: "Distrital",
      regional: "Regional",
    };
    return labels[category] || category;
  };

  const handleConfirmVote = () => {
    onConfirm();
  };

  const handleCancel = () => {
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleCancel}>
      <DialogContent className="sm:max-w-lg [&>button]:hidden">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-foreground">
            Confirmar tu voto
          </DialogTitle>
          <DialogDescription>
            Revise sus selecciones antes de confirmar. Una vez confirmado, no podrá modificar sus votos.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Lista de selecciones */}
          {voteSelections.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">No ha seleccionado ningún candidato</p>
            </div>
          ) : (
            <div className="space-y-3 max-h-64 overflow-y-auto">
              {voteSelections.map((selection, index) => (
                <div
                  key={`${selection.candidateId}-${selection.category}`}
                  className="p-4 bg-muted rounded-lg border border-border hover:border-primary/50 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <CheckCircle2 className="w-4 h-4 text-primary" />
                        <p className="text-sm font-semibold text-muted-foreground">
                          {getCategoryLabel(selection.category)}
                        </p>
                      </div>
                      <p className="text-lg font-bold text-foreground">
                        {selection.candidateName}
                      </p>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      #{index + 1}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Resumen */}
          {voteSelections.length > 0 && (
            <div className="p-3 bg-primary/10 rounded-lg border border-primary/20">
              <p className="text-sm font-semibold text-foreground">
                Total de votos a confirmar: <span className="text-primary">{voteSelections.length}</span>
              </p>
            </div>
          )}

          {/* Botones de acción */}
          <div className="flex gap-3 pt-4 border-t">
            <Button
              variant="outline"
              onClick={handleCancel}
              disabled={loading}
              className="flex-1"
            >
              Cancelar
            </Button>
            <Button
              onClick={handleConfirmVote}
              disabled={loading || voteSelections.length === 0}
              className="flex-1 bg-gradient-peru hover:opacity-90"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Registrando...
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4 mr-2" />
                  Confirmar voto
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
