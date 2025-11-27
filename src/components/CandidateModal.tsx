import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Check, CheckSquare } from "lucide-react";

interface CandidateModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  candidateName: string;
  academicFormation?: string;
  professionalExperience?: string;
  campaignProposal?: string;
  partyName?: string;
  partyLogo?: string | null;
  partyDescription?: string | null;
  voteCount?: number;
  percentage?: number;
  candidatePhoto?: string | null;
  extras?: Record<string, string | number | null> | null;
  email?: string | null;
  social?: { twitter?: string; facebook?: string; website?: string } | null;
  category?: string | null;
}

export const CandidateModal = ({ 
  open, 
  onOpenChange, 
  candidateName,
  academicFormation,
  professionalExperience,
  campaignProposal,
  partyName,
  partyLogo,
  partyDescription,
  voteCount,
  percentage,
  candidatePhoto,
  extras,
  email,
  social,
  category,
}: CandidateModalProps) => {
  // Usar solo los datos que vienen de Supabase
  const academicStr = academicFormation && academicFormation.trim() ? academicFormation : null;
  const professionalStr = professionalExperience && professionalExperience.trim() ? professionalExperience : null;
  const proposalsStr = campaignProposal && campaignProposal.trim() ? campaignProposal : null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <div className="text-center w-full">
            {candidatePhoto && candidatePhoto.trim() ? (
              <img src={candidatePhoto} alt={candidateName} className="w-20 h-20 rounded-full mx-auto object-cover" />
            ) : (
              <div className="w-20 h-20 rounded-full bg-muted mx-auto flex items-center justify-center text-foreground font-bold text-xl">
                {candidateName?.charAt(0) ?? "C"}
              </div>
            )}
            <DialogTitle className="mt-3 text-2xl font-bold text-foreground">{candidateName}</DialogTitle>
          </div>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Partido block removed as requested */}

          <div>
            <h3 className="font-semibold text-lg mb-2 text-foreground">Formación Académica</h3>
            {academicStr ? (
              (() => {
                const items = academicStr.split(/\r?\n/).map((s) => s.trim()).filter(Boolean);
                return items.length > 1 ? (
                  <ul className="list-none space-y-2 text-muted-foreground">
                    {items.map((it, idx) => (
                      <li key={idx} className="leading-relaxed">{it}</li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-muted-foreground leading-relaxed">{items[0]}</p>
                );
              })()
            ) : (
              <p className="text-muted-foreground leading-relaxed">No se ha proporcionado información académica.</p>
            )}
          </div>

          <div>
            <h3 className="font-semibold text-lg mb-2 text-foreground">Experiencia Profesional</h3>
            {professionalStr ? (
              (() => {
                const items = professionalStr.split(/\r?\n/).map((s) => s.trim()).filter(Boolean);
                return (
                  <ul className="space-y-2 text-muted-foreground">
                    {items.map((it, idx) => (
                      <li key={idx} className="flex items-start gap-3">
                        <Check className="w-4 h-4 text-emerald-500 mt-1 flex-shrink-0" />
                        <span className="leading-relaxed">{it}</span>
                      </li>
                    ))}
                  </ul>
                );
              })()
            ) : (
              <p className="text-muted-foreground leading-relaxed">No se ha proporcionado experiencia profesional.</p>
            )}
          </div>

          <div>
            <h3 className="font-semibold text-lg mb-2 text-foreground">Propuestas de Campaña</h3>
            {proposalsStr ? (
              (() => {
                const items = proposalsStr.split(/\r?\n/).map((s) => s.trim()).filter(Boolean);
                return (
                  <ul className="space-y-2 text-muted-foreground">
                    {items.map((it, idx) => (
                      <li key={idx} className="flex items-start gap-3">
                        <CheckSquare className="w-4 h-4 text-primary mt-1 flex-shrink-0" />
                        <span className="leading-relaxed">{it}</span>
                      </li>
                    ))}
                  </ul>
                );
              })()
            ) : (
              <p className="text-muted-foreground leading-relaxed">No se ha proporcionado propuesta de campaña.</p>
            )}
          </div>

          {/* Detalles removed as requested */}

          {(email || (social && Object.keys(social).length > 0)) && (
            <div>
              <h3 className="font-semibold text-lg mb-2 text-foreground">Contacto / Redes</h3>
              <div className="text-muted-foreground">
                {email && <p>Email: <a className="text-primary" href={`mailto:${email}`}>{email}</a></p>}
                {social?.twitter && <p>Twitter: <a className="text-primary" href={social.twitter} target="_blank" rel="noreferrer">{social.twitter}</a></p>}
                {social?.facebook && <p>Facebook: <a className="text-primary" href={social.facebook} target="_blank" rel="noreferrer">{social.facebook}</a></p>}
                {social?.website && <p>Sitio: <a className="text-primary" href={social.website} target="_blank" rel="noreferrer">{social.website}</a></p>}
              </div>
            </div>
          )}

        </div>
      </DialogContent>
    </Dialog>
  );
};
