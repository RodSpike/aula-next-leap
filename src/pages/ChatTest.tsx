import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export default function ChatTest() {
  const [message, setMessage] = useState("");
  const [response, setResponse] = useState("");
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const testChat = async () => {
    if (!message.trim() || loading) return;
    
    setLoading(true);
    try {
      console.log('Testing AI chat with message:', message);
      
      const { data, error } = await supabase.functions.invoke('english-tutor-chat', {
        body: {
          message: message,
          conversation_history: []
        }
      });
      
      console.log('Response data:', data);
      console.log('Response error:', error);
      
      if (error) {
        console.error('Supabase function error:', error);
        throw error;
      }
      
      if (data?.error) {
        console.error('AI function returned error:', data.error);
        toast({
          title: 'AI Error',
          description: data.error,
          variant: 'destructive',
        });
        return;
      }

      setResponse(data.response || 'No response received');
      toast({
        title: 'Success',
        description: 'AI chat is working!',
      });
    } catch (error: any) {
      console.error('Chat test error:', error);
      setResponse(`Error: ${error?.message || 'Unknown error'}`);
      toast({
        title: 'Error',
        description: error?.message || 'Failed to test chat',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-2xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle>AI Chat Test</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <Input
                placeholder="Type a test message..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    testChat();
                  }
                }}
                disabled={loading}
              />
              <Button onClick={testChat} disabled={!message.trim() || loading}>
                {loading ? 'Testing...' : 'Test Chat'}
              </Button>
            </div>
            
            {response && (
              <div className="bg-muted p-4 rounded-lg">
                <h4 className="font-medium mb-2">AI Response:</h4>
                <p className="whitespace-pre-wrap text-sm">{response}</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}