import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Volume2, VolumeX, Music, Bell, MousePointer, PartyPopper } from 'lucide-react';
import { useSoundPreferences } from '@/contexts/SoundPreferencesContext';
import { gameSounds } from '@/utils/gameSounds';

export const SoundSettings: React.FC = () => {
  const {
    preferences,
    setEnabled,
    setVolume,
    setFeedbackSounds,
    setNavigationSounds,
    setCelebrationSounds,
    toggleEnabled
  } = useSoundPreferences();

  const testSound = (type: string) => {
    switch (type) {
      case 'feedback':
        gameSounds.playCorrect();
        break;
      case 'navigation':
        gameSounds.playClick();
        break;
      case 'celebration':
        gameSounds.playCelebration();
        break;
      default:
        gameSounds.playClick();
    }
  };

  return (
    <Card className="hover:shadow-md transition-shadow duration-300">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {preferences.enabled ? <Volume2 className="h-5 w-5" /> : <VolumeX className="h-5 w-5" />}
          Sons e Feedback
        </CardTitle>
        <CardDescription>
          Configure os sons de feedback e interação do aplicativo
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Master Toggle */}
        <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-full ${preferences.enabled ? 'bg-primary/20 text-primary' : 'bg-muted text-muted-foreground'}`}>
              {preferences.enabled ? <Volume2 className="h-5 w-5" /> : <VolumeX className="h-5 w-5" />}
            </div>
            <div>
              <Label htmlFor="sounds-enabled" className="text-base font-medium cursor-pointer">
                Sons do Aplicativo
              </Label>
              <p className="text-sm text-muted-foreground">
                {preferences.enabled ? 'Sons ativados' : 'Sons desativados'}
              </p>
            </div>
          </div>
          <Switch
            id="sounds-enabled"
            checked={preferences.enabled}
            onCheckedChange={setEnabled}
          />
        </div>

        {/* Volume Slider */}
        <div className={`space-y-3 transition-opacity ${!preferences.enabled ? 'opacity-50 pointer-events-none' : ''}`}>
          <div className="flex items-center justify-between">
            <Label className="text-sm font-medium">Volume Geral</Label>
            <span className="text-sm text-muted-foreground">{Math.round(preferences.volume * 100)}%</span>
          </div>
          <div className="flex items-center gap-3">
            <VolumeX className="h-4 w-4 text-muted-foreground" />
            <Slider
              value={[preferences.volume * 100]}
              onValueChange={([val]) => setVolume(val / 100)}
              max={100}
              step={5}
              className="flex-1"
            />
            <Volume2 className="h-4 w-4 text-muted-foreground" />
          </div>
        </div>

        {/* Individual Sound Categories */}
        <div className={`space-y-4 transition-opacity ${!preferences.enabled ? 'opacity-50 pointer-events-none' : ''}`}>
          <Label className="text-sm font-medium text-muted-foreground">Categorias de Sons</Label>
          
          {/* Feedback Sounds */}
          <div className="flex items-center justify-between p-3 border rounded-lg">
            <div className="flex items-center gap-3">
              <Bell className="h-4 w-4 text-primary" />
              <div>
                <Label htmlFor="feedback-sounds" className="text-sm font-medium cursor-pointer">
                  Sons de Feedback
                </Label>
                <p className="text-xs text-muted-foreground">
                  Correto, incorreto, notificações
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => testSound('feedback')}
                disabled={!preferences.feedbackSounds}
              >
                Testar
              </Button>
              <Switch
                id="feedback-sounds"
                checked={preferences.feedbackSounds}
                onCheckedChange={setFeedbackSounds}
              />
            </div>
          </div>

          {/* Navigation Sounds */}
          <div className="flex items-center justify-between p-3 border rounded-lg">
            <div className="flex items-center gap-3">
              <MousePointer className="h-4 w-4 text-primary" />
              <div>
                <Label htmlFor="navigation-sounds" className="text-sm font-medium cursor-pointer">
                  Sons de Navegação
                </Label>
                <p className="text-xs text-muted-foreground">
                  Cliques, transições, botões
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => testSound('navigation')}
                disabled={!preferences.navigationSounds}
              >
                Testar
              </Button>
              <Switch
                id="navigation-sounds"
                checked={preferences.navigationSounds}
                onCheckedChange={setNavigationSounds}
              />
            </div>
          </div>

          {/* Celebration Sounds */}
          <div className="flex items-center justify-between p-3 border rounded-lg">
            <div className="flex items-center gap-3">
              <PartyPopper className="h-4 w-4 text-primary" />
              <div>
                <Label htmlFor="celebration-sounds" className="text-sm font-medium cursor-pointer">
                  Sons de Celebração
                </Label>
                <p className="text-xs text-muted-foreground">
                  Level up, conquistas, streaks
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => testSound('celebration')}
                disabled={!preferences.celebrationSounds}
              >
                Testar
              </Button>
              <Switch
                id="celebration-sounds"
                checked={preferences.celebrationSounds}
                onCheckedChange={setCelebrationSounds}
              />
            </div>
          </div>
        </div>

        {/* Info */}
        <p className="text-xs text-muted-foreground text-center pt-2">
          As preferências de som são salvas automaticamente no seu navegador.
        </p>
      </CardContent>
    </Card>
  );
};
