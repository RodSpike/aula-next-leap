import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useState, useEffect } from "react";
import { Clock, MessageSquare, Download, FileText, User } from "lucide-react";

interface ActivityLog {
  id: string;
  action: string;
  context: any;
  created_at: string;
}

interface UserActivityDialogProps {
  userId: string;
  userDisplayName: string;
  isOpen: boolean;
  onClose: () => void;
}

export const UserActivityDialog = ({ userId, userDisplayName, isOpen, onClose }: UserActivityDialogProps) => {
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen && userId) {
      fetchUserActivity();
    }
  }, [isOpen, userId]);

  const fetchUserActivity = async () => {
    setLoading(true);
    try {
      const { data } = await supabase
        .from('user_activity_logs')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(100);

      setLogs(data || []);
    } catch (error) {
      console.error('Error fetching user activity:', error);
    } finally {
      setLoading(false);
    }
  };

  const getActionIcon = (action: string) => {
    switch (action) {
      case 'login':
        return <User className="h-4 w-4" />;
      case 'ai_chat_question':
        return <MessageSquare className="h-4 w-4" />;
      case 'file_download':
        return <Download className="h-4 w-4" />;
      case 'group_post':
        return <FileText className="h-4 w-4" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

  const getActionLabel = (action: string) => {
    switch (action) {
      case 'login':
        return 'Logged In';
      case 'ai_chat_question':
        return 'AI Tutor Question';
      case 'file_download':
        return 'Downloaded File';
      case 'group_post':
        return 'Created Post';
      default:
        return action;
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const lastLogin = logs.find(log => log.action === 'login');

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle>Activity History: {userDisplayName}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {lastLogin && (
            <div className="p-4 bg-muted rounded-lg">
              <div className="flex items-center gap-2 text-sm">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">Last Login:</span>
                <span>{formatDate(lastLogin.created_at)}</span>
              </div>
            </div>
          )}

          <ScrollArea className="h-[500px]">
            {loading ? (
              <div className="text-center py-8 text-muted-foreground">
                Loading activity...
              </div>
            ) : logs.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No activity recorded yet
              </div>
            ) : (
              <div className="space-y-3">
                {logs.map((log) => (
                  <div
                    key={log.id}
                    className="flex items-start gap-3 p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
                  >
                    <div className="mt-1">{getActionIcon(log.action)}</div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge variant="outline" className="text-xs">
                          {getActionLabel(log.action)}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {formatDate(log.created_at)}
                        </span>
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {log.action === 'login' && (
                          <span>Method: {log.context.method || 'email'}</span>
                        )}
                        {log.action === 'ai_chat_question' && log.context.text_snippet && (
                          <p className="truncate">{log.context.text_snippet}</p>
                        )}
                        {log.action === 'file_download' && (
                          <span>
                            {log.context.filename || 'File'} from group
                          </span>
                        )}
                        {log.action === 'group_post' && log.context.text_snippet && (
                          <p className="truncate">{log.context.text_snippet}</p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
        </div>
      </DialogContent>
    </Dialog>
  );
};