
import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MessageCircle, X, Minimize2, Maximize2 } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { Link } from "react-router-dom";

export function FloatingChatBubble() {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);

  if (!user) return null;

  if (!isOpen) {
    return (
      <div className="fixed bottom-6 right-6 z-50">
        <Button
          onClick={() => setIsOpen(true)}
          className="h-14 w-14 rounded-full shadow-lg bg-primary hover:bg-primary/90"
          size="icon"
        >
          <MessageCircle className="h-6 w-6" />
        </Button>
      </div>
    );
  }

  return (
    <div className={`fixed bottom-6 right-6 z-50 ${isMinimized ? 'w-80 h-12' : 'w-80 h-96'} transition-all duration-300`}>
      <Card className="w-full h-full shadow-2xl border-2 border-primary/20">
        <CardHeader className="p-3 bg-primary/5">
          <CardTitle className="text-sm flex items-center justify-between">
            <span className="flex items-center gap-2">
              <MessageCircle className="h-4 w-4" />
              AI Chat Assistant
            </span>
            <div className="flex gap-1">
              <Button
                size="sm"
                variant="ghost"
                className="h-6 w-6 p-0"
                onClick={() => setIsMinimized(!isMinimized)}
              >
                {isMinimized ? <Maximize2 className="h-3 w-3" /> : <Minimize2 className="h-3 w-3" />}
              </Button>
              <Button
                size="sm"
                variant="ghost"
                className="h-6 w-6 p-0"
                onClick={() => setIsOpen(false)}
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
          </CardTitle>
        </CardHeader>
        
        {!isMinimized && (
          <CardContent className="p-4 flex flex-col h-full">
            <div className="flex-1 flex items-center justify-center text-center">
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Get help with your English learning journey!
                </p>
                <Button asChild className="w-full">
                  <Link to="/ai-chat">
                    Open Full Chat
                  </Link>
                </Button>
              </div>
            </div>
          </CardContent>
        )}
      </Card>
    </div>
  );
}
