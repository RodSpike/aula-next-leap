import { useNavigate } from 'react-router-dom';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';
import { CupheadFoxMascot } from '@/components/mascot/CupheadFoxMascot';
import { WelcomeBackSuggestion } from '@/hooks/useWelcomeBack';

interface WelcomeBackDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  suggestion: WelcomeBackSuggestion | null;
}

export function WelcomeBackDialog({ open, onOpenChange, suggestion }: WelcomeBackDialogProps) {
  const navigate = useNavigate();

  const handleAction = (path: string) => {
    onOpenChange(false);
    // Small delay for animation
    setTimeout(() => {
      navigate(path);
    }, 200);
  };

  const handleClose = () => {
    onOpenChange(false);
  };

  if (!suggestion) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md p-0 overflow-hidden border-4 border-[#1A1A1A] rounded-2xl bg-gradient-to-b from-[#FFF8DC] to-[#F5DEB3] shadow-2xl">
        {/* Close button */}
        <button
          onClick={handleClose}
          className="absolute right-3 top-3 z-10 rounded-full bg-[#1A1A1A]/10 p-1.5 hover:bg-[#1A1A1A]/20 transition-colors"
        >
          <X className="h-4 w-4 text-[#1A1A1A]" />
        </button>

        <div className="p-6 pt-8 flex flex-col items-center text-center">
          {/* Mascot */}
          <div className="animate-scale-in mb-4">
            <CupheadFoxMascot 
              mood={suggestion.mascotMood} 
              size="lg" 
              animate={true}
            />
          </div>

          {/* Title */}
          <h2 className="text-xl font-bold text-[#1A1A1A] mb-2 animate-fade-in" style={{ fontFamily: 'serif' }}>
            {suggestion.title}
          </h2>

          {/* Message */}
          <p className="text-[#1A1A1A]/80 mb-6 animate-fade-in" style={{ animationDelay: '100ms' }}>
            {suggestion.message}
          </p>

          {/* Action buttons */}
          <div className="w-full space-y-3 animate-fade-in" style={{ animationDelay: '200ms' }}>
            {/* Primary action */}
            <Button
              onClick={() => handleAction(suggestion.primaryAction.path)}
              className="w-full h-12 text-base font-semibold bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary border-2 border-[#1A1A1A] shadow-[3px_3px_0px_#1A1A1A] hover:shadow-[1px_1px_0px_#1A1A1A] hover:translate-x-[2px] hover:translate-y-[2px] transition-all"
            >
              {suggestion.primaryAction.label}
            </Button>

            {/* Secondary action */}
            {suggestion.secondaryAction && (
              <Button
                onClick={() => handleAction(suggestion.secondaryAction!.path)}
                variant="outline"
                className="w-full h-11 text-base font-medium bg-white border-2 border-[#1A1A1A] shadow-[2px_2px_0px_#1A1A1A] hover:shadow-[1px_1px_0px_#1A1A1A] hover:translate-x-[1px] hover:translate-y-[1px] hover:bg-gray-50 transition-all"
              >
                {suggestion.secondaryAction.label}
              </Button>
            )}

            {/* Tertiary action */}
            {suggestion.tertiaryAction && (
              <Button
                onClick={() => handleAction(suggestion.tertiaryAction!.path)}
                variant="ghost"
                className="w-full h-10 text-sm font-medium text-[#1A1A1A]/70 hover:text-[#1A1A1A] hover:bg-[#1A1A1A]/5 transition-all"
              >
                {suggestion.tertiaryAction.label}
              </Button>
            )}
          </div>

          {/* No thanks button */}
          <button
            onClick={handleClose}
            className="mt-4 text-sm text-[#1A1A1A]/50 hover:text-[#1A1A1A]/70 transition-colors underline-offset-4 hover:underline"
          >
            Não, obrigado
          </button>
        </div>

        {/* Decorative bottom border */}
        <div className="h-2 bg-gradient-to-r from-primary via-orange-400 to-primary" />
      </DialogContent>
    </Dialog>
  );
}
