import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Users, TrendingUp } from "lucide-react";

interface CandidateCardProps {
  id: string;
  name: string;
  photo: string;
  description: string;
  voteCount: number;
  percentage: number;
  onViewCandidate: (id: string) => void;
  onVote: (id: string) => void;
  isSelected?: boolean;
  disabled?: boolean;
}

export const CandidateCard = ({
  id,
  name,
  photo,
  description,
  voteCount,
  percentage,
  onViewCandidate,
  onVote,
  isSelected = false,
  disabled = false,
}: CandidateCardProps) => {
  return (
    <Card className={`flex flex-col overflow-hidden shadow-card hover:shadow-hover transition-all duration-300 border-border h-full ${isSelected ? 'ring-2 ring-primary ring-offset-2' : ''}`}>
      {/* Imagen del candidato */}
      <div className="relative h-64 overflow-hidden">
        <img
          src={photo}
          alt={name}
          className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
        />
        {/* Badge con porcentaje en la esquina superior derecha */}
        <div className="absolute top-4 right-4">
          <Badge className="bg-primary text-primary-foreground font-semibold">
            {percentage.toFixed(1)}%
          </Badge>
        </div>
      </div>

      {/* Contenido del candidato */}
      <div className="flex flex-col justify-between flex-grow p-6 space-y-4">
        <div>
          <h3 className="text-2xl font-bold text-foreground mb-2">{name}</h3>
          <p className="text-sm text-muted-foreground leading-relaxed">
            {description}
          </p>
        </div>

        {/* Estadísticas de votos */}
        <div className="flex items-center gap-4 py-3 px-4 bg-muted rounded-lg">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-primary" />
            <span className="text-sm font-semibold text-foreground">{voteCount.toLocaleString()}</span>
          </div>
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-primary" />
            <span className="text-sm font-semibold text-foreground">{percentage.toFixed(1)}%</span>
          </div>
        </div>

        {/* Botones alineados */}
        <div className="flex gap-2 pt-2">
          <Button
            variant="outline"
            onClick={() => onViewCandidate(id)}
            className="flex-1 border-primary text-primary hover:bg-primary hover:text-primary-foreground transition-colors"
          >
            Ver Información
          </Button>
          <Button
            onClick={() => onVote(id)}
            disabled={disabled}
            className={`flex-1 transition-opacity ${isSelected ? 'bg-green-600 hover:bg-green-700' : 'bg-gradient-peru hover:opacity-90'}`}
          >
            {disabled ? 'Ya votaste' : isSelected ? 'Elegido' : 'Elegir'}
          </Button>
        </div>
      </div>
    </Card>
  );
};
