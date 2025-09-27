import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Bot, Sparkles, MessageSquare, Zap, ExternalLink } from 'lucide-react';
import { Link } from 'react-router-dom';

interface EnhancedAIChatInterfaceProps {
  groupLevel?: string;
  className?: string;
}

export const EnhancedAIChatInterface: React.FC<EnhancedAIChatInterfaceProps> = ({
  groupLevel,
  className = ""
}) => {
  return (
    <Card className={`${className} bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20`}>
      <CardHeader className="text-center pb-4">
        <div className="flex items-center justify-center gap-2 mb-2">
          <div className="p-2 bg-primary/10 rounded-full">
            <Bot className="h-6 w-6 text-primary" />
          </div>
          <CardTitle className="text-xl bg-gradient-to-r from-primary to-primary/80 bg-clip-text text-transparent">
            AI Tutor Assistant
          </CardTitle>
        </div>
        <div className="flex items-center justify-center gap-2">
          <Badge variant="secondary" className="bg-primary/10 text-primary border-primary/20">
            <Sparkles className="h-3 w-3 mr-1" />
            Smart Learning
          </Badge>
          {groupLevel && (
            <Badge variant="outline" className="border-primary/20">
              Level {groupLevel}
            </Badge>
          )}
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        <div className="text-center space-y-3">
          <p className="text-muted-foreground text-sm leading-relaxed">
            🤖 Your personal AI English tutor is here to help! Get instant feedback, 
            practice conversations, and receive personalized learning assistance.
          </p>
          
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="flex items-center gap-1 text-muted-foreground">
              <Zap className="h-3 w-3" />
              <span>Instant responses</span>
            </div>
            <div className="flex items-center gap-1 text-muted-foreground">
              <MessageSquare className="h-3 w-3" />
              <span>Natural conversation</span>
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <p className="text-sm font-medium text-center">Quick Actions:</p>
          <div className="grid grid-cols-1 gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              className="justify-start h-auto p-3 text-left hover:bg-primary/5"
              asChild
            >
              <Link to="/ai-chat">
                <div>
                  <div className="font-medium">💬 Start Chat</div>
                  <div className="text-xs text-muted-foreground">Begin conversation with AI tutor</div>
                </div>
                <ExternalLink className="h-3 w-3 ml-auto" />
              </Link>
            </Button>
            
            <Button 
              variant="outline" 
              size="sm" 
              className="justify-start h-auto p-3 text-left hover:bg-primary/5"
              asChild
            >
              <Link to={`/ai-chat?topic=${encodeURIComponent('Grammar Help')}&level=${groupLevel || 'B1'}`}>
                <div>
                  <div className="font-medium">📚 Grammar Help</div>
                  <div className="text-xs text-muted-foreground">Get help with grammar questions</div>
                </div>
                <ExternalLink className="h-3 w-3 ml-auto" />
              </Link>
            </Button>
          </div>
        </div>

        <div className="pt-2 border-t">
          <p className="text-xs text-muted-foreground text-center">
            💡 Tip: You can ask questions in Portuguese or English, upload documents for review, 
            and use voice input for speaking practice!
          </p>
        </div>
      </CardContent>
    </Card>
  );
};