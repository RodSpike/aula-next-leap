
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BookOpen, Volume2, Eye, MessageSquare, PenTool, Headphones } from "lucide-react";

interface LessonContentItem {
  id: string;
  section_type: 'grammar' | 'vocabulary' | 'reading' | 'listening' | 'speaking' | 'writing';
  title: string;
  explanation: string;
  examples: Array<{
    example?: string;
    translation?: string;
    word?: string;
    meaning?: string;
    usage?: string;
    text?: string;
    questions?: string[];
  }>;
  order_index: number;
}

interface LessonContentProps {
  content: LessonContentItem[];
}

const getSectionIcon = (type: string) => {
  switch (type) {
    case 'grammar': return <BookOpen className="h-5 w-5" />;
    case 'vocabulary': return <MessageSquare className="h-5 w-5" />;
    case 'reading': return <Eye className="h-5 w-5" />;
    case 'listening': return <Headphones className="h-5 w-5" />;
    case 'speaking': return <Volume2 className="h-5 w-5" />;
    case 'writing': return <PenTool className="h-5 w-5" />;
    default: return <BookOpen className="h-5 w-5" />;
  }
};

const getSectionColor = (type: string) => {
  switch (type) {
    case 'grammar': return 'bg-blue-100 text-blue-800 border-blue-200';
    case 'vocabulary': return 'bg-green-100 text-green-800 border-green-200';
    case 'reading': return 'bg-purple-100 text-purple-800 border-purple-200';
    case 'listening': return 'bg-orange-100 text-orange-800 border-orange-200';
    case 'speaking': return 'bg-red-100 text-red-800 border-red-200';
    case 'writing': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    default: return 'bg-gray-100 text-gray-800 border-gray-200';
  }
};

export function LessonContent({ content }: LessonContentProps) {
  if (!content || content.length === 0) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <p className="text-muted-foreground">No lesson content available yet.</p>
        </CardContent>
      </Card>
    );
  }

  const sortedContent = [...content].sort((a, b) => a.order_index - b.order_index);

  return (
    <div className="space-y-6">
      {sortedContent.map((item) => (
        <Card key={item.id} className="border-l-4 border-l-primary">
          <CardHeader>
            <CardTitle className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                {getSectionIcon(item.section_type)}
                <span className="capitalize">{item.section_type}</span>
              </div>
              <Badge className={getSectionColor(item.section_type)}>
                {item.title}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-muted/50 p-4 rounded-lg">
              <p className="text-sm leading-relaxed">{item.explanation}</p>
            </div>
            
            {item.examples && item.examples.length > 0 && (
              <div className="space-y-3">
                <h4 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">
                  Examples & Practice
                </h4>
                
                {item.section_type === 'vocabulary' && (
                  <div className="grid gap-3">
                    {item.examples.map((example, index) => (
                      <div key={index} className="p-3 bg-background border rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-semibold text-primary">{example.word}</span>
                          <span className="text-sm text-muted-foreground">{example.meaning}</span>
                        </div>
                        <p className="text-sm italic">"{example.usage}"</p>
                      </div>
                    ))}
                  </div>
                )}
                
                {item.section_type === 'grammar' && (
                  <div className="space-y-2">
                    {item.examples.map((example, index) => (
                      <div key={index} className="p-3 bg-background border rounded-lg">
                        <p className="font-medium">{example.example}</p>
                        <p className="text-sm text-muted-foreground mt-1">{example.translation}</p>
                      </div>
                    ))}
                  </div>
                )}
                
                {item.section_type === 'reading' && (
                  <div className="space-y-4">
                    {item.examples.map((example, index) => (
                      <div key={index} className="space-y-3">
                        <div className="p-4 bg-background border rounded-lg">
                          <p className="text-sm leading-relaxed">{example.text}</p>
                        </div>
                        {example.questions && example.questions.length > 0 && (
                          <div className="space-y-2">
                            <h5 className="font-medium text-sm">Comprehension Questions:</h5>
                            <ul className="list-decimal list-inside space-y-1 text-sm text-muted-foreground">
                              {example.questions.map((question, qIndex) => (
                                <li key={qIndex}>{question}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
