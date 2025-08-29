
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BookOpen, MessageSquare, FileText, Headphones, Mic, PenTool } from "lucide-react";

interface LessonContentItem {
  id: string;
  lesson_id: string;
  section_type: 'grammar' | 'vocabulary' | 'reading' | 'listening' | 'speaking' | 'writing';
  title: string;
  explanation: string;
  examples: any[];
  order_index: number;
}

interface LessonContentProps {
  content: LessonContentItem[];
}

export function LessonContent({ content }: LessonContentProps) {
  const getSectionIcon = (type: string) => {
    switch (type) {
      case 'grammar':
        return <BookOpen className="h-5 w-5" />;
      case 'vocabulary':
        return <MessageSquare className="h-5 w-5" />;
      case 'reading':
        return <FileText className="h-5 w-5" />;
      case 'listening':
        return <Headphones className="h-5 w-5" />;
      case 'speaking':
        return <Mic className="h-5 w-5" />;
      case 'writing':
        return <PenTool className="h-5 w-5" />;
      default:
        return <BookOpen className="h-5 w-5" />;
    }
  };

  const getSectionColor = (type: string) => {
    const colors = {
      grammar: 'bg-blue-50 text-blue-700 border-blue-200',
      vocabulary: 'bg-green-50 text-green-700 border-green-200',
      reading: 'bg-purple-50 text-purple-700 border-purple-200',
      listening: 'bg-orange-50 text-orange-700 border-orange-200',
      speaking: 'bg-pink-50 text-pink-700 border-pink-200',
      writing: 'bg-indigo-50 text-indigo-700 border-indigo-200'
    };
    return colors[type as keyof typeof colors] || colors.grammar;
  };

  if (!content || content.length === 0) {
    return null;
  }

  return (
    <div className="space-y-6">
      {content.map((section) => (
        <Card key={section.id} className="overflow-hidden">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg ${getSectionColor(section.section_type)}`}>
                {getSectionIcon(section.section_type)}
              </div>
              <div>
                <CardTitle className="text-lg">{section.title}</CardTitle>
                <Badge variant="outline" className="capitalize mt-1">
                  {section.section_type}
                </Badge>
              </div>
            </div>
          </CardHeader>
          
          <CardContent className="space-y-4">
            <div className="prose prose-sm max-w-none">
              <p className="text-muted-foreground leading-relaxed">
                {section.explanation}
              </p>
            </div>

            {section.examples && section.examples.length > 0 && (
              <div className="space-y-3">
                <h4 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">
                  Exemplos
                </h4>
                <div className="space-y-2">
                  {section.examples.map((example, index) => (
                    <div 
                      key={index} 
                      className="bg-muted/50 p-3 rounded-lg border-l-4 border-primary/30"
                    >
                      {section.section_type === 'vocabulary' ? (
                        <div className="space-y-1">
                          <div className="font-medium">{example.word}</div>
                          <div className="text-sm text-muted-foreground">{example.meaning}</div>
                          {example.usage && (
                            <div className="text-sm italic text-primary">
                              "{example.usage}"
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="space-y-1">
                          <div className="font-medium">{example.example}</div>
                          {example.translation && (
                            <div className="text-sm text-muted-foreground">
                              {example.translation}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {section.section_type === 'reading' && section.examples[0]?.text && (
              <div className="space-y-3">
                <h4 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">
                  Texto para Leitura
                </h4>
                <div className="bg-background border rounded-lg p-4">
                  <p className="leading-relaxed">{section.examples[0].text}</p>
                </div>
                
                {section.examples[0].questions && (
                  <div className="space-y-2">
                    <h5 className="font-medium text-sm">Questões de Compreensão:</h5>
                    <ul className="list-decimal list-inside space-y-1 text-sm text-muted-foreground">
                      {section.examples[0].questions.map((question: string, qIndex: number) => (
                        <li key={qIndex}>{question}</li>
                      ))}
                    </ul>
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
