import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Users, Lock, CheckCircle2 } from "lucide-react";

interface EnhancedGroupCardProps {
  group: {
    id: string;
    name: string;
    description: string;
    level: string;
    is_default: boolean;
    group_type: 'open' | 'closed';
    member_count?: number;
    is_member?: boolean;
  };
  onJoin: (groupId: string) => void;
  onSelect: () => void;
}

export const EnhancedGroupCard: React.FC<EnhancedGroupCardProps> = ({
  group,
  onJoin,
  onSelect
}) => {
  const levelColors: Record<string, string> = {
    'A1': 'bg-green-500/10 text-green-700 dark:text-green-400',
    'A2': 'bg-blue-500/10 text-blue-700 dark:text-blue-400',
    'B1': 'bg-yellow-500/10 text-yellow-700 dark:text-yellow-400',
    'B2': 'bg-orange-500/10 text-orange-700 dark:text-orange-400',
    'C1': 'bg-red-500/10 text-red-700 dark:text-red-400',
    'C2': 'bg-purple-500/10 text-purple-700 dark:text-purple-400',
  };

  return (
    <Card className="group hover:shadow-lg transition-all duration-300 hover:scale-[1.02] cursor-pointer border-2 hover:border-primary/50">
      <CardContent className="p-6">
        <div className="space-y-4">
          {/* Header */}
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <h3 className="font-bold text-lg group-hover:text-primary transition-colors">
                  {group.name}
                </h3>
                {group.is_default && (
                  <Badge variant="secondary" className="text-xs">
                    Official
                  </Badge>
                )}
                {group.group_type === 'closed' && (
                  <Lock className="h-4 w-4 text-muted-foreground" />
                )}
              </div>
              
              <Badge className={levelColors[group.level] || 'bg-gray-500/10'}>
                Level {group.level}
              </Badge>
            </div>
          </div>

          {/* Description */}
          <p className="text-sm text-muted-foreground line-clamp-2 min-h-[40px]">
            {group.description}
          </p>

          {/* Footer */}
          <div className="flex items-center justify-between pt-2 border-t">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Users className="h-4 w-4" />
              <span>{group.member_count || 0} members</span>
            </div>

            {group.is_member ? (
              <Button 
                onClick={onSelect}
                className="gap-2"
              >
                <CheckCircle2 className="h-4 w-4" />
                Open
              </Button>
            ) : (
              <Button 
                onClick={() => onJoin(group.id)}
                variant="outline"
              >
                Join Group
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
