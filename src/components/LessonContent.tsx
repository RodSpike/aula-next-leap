import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  BookOpen, 
  MessageCircle, 
  FileText, 
  Headphones, 
  Mic, 
  PenTool,
  Target,
  CheckCircle,
  Play,
  Volume2,
  Clock,
  Users
} from "lucide-react";

interface LessonContentItem {
  id: string;
  lesson_id: string;
  section_type: string;
  title: string;
  explanation?: string;
  examples?: any[];
  content?: any;
  order_index: number;
}

interface LessonContentProps {
  content: LessonContentItem[];
}

export function LessonContent({ content }: LessonContentProps) {
  const getSectionIcon = (type: string) => {
    switch (type) {
      case 'introduction':
        return <BookOpen className="w-5 h-5" />;
      case 'practice':
        return <Target className="w-5 h-5" />;
      case 'grammar':
        return <BookOpen className="w-5 h-5" />;
      case 'vocabulary':
        return <MessageCircle className="w-5 h-5" />;
      case 'reading':
        return <FileText className="w-5 h-5" />;
      case 'listening':
        return <Headphones className="w-5 h-5" />;
      case 'speaking':
        return <Mic className="w-5 h-5" />;
      case 'writing':
        return <PenTool className="w-5 h-5" />;
      case 'exercise':
        return <Target className="w-5 h-5" />;
      case 'assessment':
        return <CheckCircle className="w-5 h-5" />;
      default:
        return <BookOpen className="w-5 h-5" />;
    }
  };

  const getSectionColor = (type: string) => {
    switch (type) {
      case 'introduction':
        return 'bg-primary/10 border-primary/20 dark:bg-primary/5';
      case 'practice':
        return 'bg-secondary/10 border-secondary/20 dark:bg-secondary/5';
      case 'grammar':
        return 'bg-blue-50 border-blue-200 dark:bg-blue-950/30';
      case 'vocabulary':
        return 'bg-green-50 border-green-200 dark:bg-green-950/30';
      case 'reading':
        return 'bg-purple-50 border-purple-200 dark:bg-purple-950/30';
      case 'listening':
        return 'bg-orange-50 border-orange-200 dark:bg-orange-950/30';
      case 'speaking':
        return 'bg-red-50 border-red-200 dark:bg-red-950/30';
      case 'writing':
        return 'bg-yellow-50 border-yellow-200 dark:bg-yellow-950/30';
      case 'exercise':
        return 'bg-indigo-50 border-indigo-200 dark:bg-indigo-950/30';
      case 'assessment':
        return 'bg-emerald-50 border-emerald-200 dark:bg-emerald-950/30';
      default:
        return 'bg-gray-50 border-gray-200 dark:bg-gray-950/30';
    }
  };

  const renderIntroductionContent = (item: LessonContentItem) => {
    const content = item.content || {};
    const parts = content.parts || [];
    
    return (
      <div className="space-y-8">
        {parts.map((part: any, index: number) => (
          <div key={index} className="space-y-4">
            <h3 className="text-xl font-semibold text-primary">{part.title}</h3>
            
            {part.content && (
              <p className="text-muted-foreground leading-relaxed">{part.content}</p>
            )}
            
            {/* Handle sections (like Formais/Informais) */}
            {part.sections && (
              <div className="grid md:grid-cols-2 gap-6">
                {part.sections.map((section: any, sIndex: number) => (
                  <div key={sIndex} className="bg-background/80 p-4 rounded-lg border">
                    <h4 className="font-medium mb-3 text-lg">{section.title}</h4>
                    <ul className="space-y-2">
                      {section.items.map((item: string, iIndex: number) => (
                        <li key={iIndex} className="text-sm flex items-center gap-2">
                          <span className="w-2 h-2 bg-primary rounded-full flex-shrink-0"></span>
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            )}

            {/* Handle alphabet */}
            {part.alphabet && (
              <div className="bg-background/50 p-6 rounded-lg border">
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
                  {part.alphabet.map((letter: string, lIndex: number) => (
                    <div key={lIndex} className="text-center p-2 bg-primary/5 rounded border">
                      <span className="font-mono text-sm">{letter}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Handle number groups */}
            {part.number_groups && (
              <div className="space-y-4">
                {part.number_groups.map((group: any, gIndex: number) => (
                  <div key={gIndex} className="bg-background/70 p-4 rounded-lg border">
                    <h4 className="font-medium mb-3">{group.range}</h4>
                    <div className="flex flex-wrap gap-2">
                      {group.numbers.map((num: string, nIndex: number) => (
                        <Badge key={nIndex} variant="secondary" className="text-xs">
                          {num}
                        </Badge>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
            
            {/* Handle tables */}
            {part.table && (
              <div className="overflow-x-auto">
                <table className="w-full border-collapse border border-border rounded-lg">
                  <thead>
                    <tr className="bg-muted/50">
                      {part.table[0].map((header: string, hIndex: number) => (
                        <th key={hIndex} className="border border-border p-3 text-left font-medium">
                          {header}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {part.table.slice(1).map((row: string[], rIndex: number) => (
                      <tr key={rIndex} className="hover:bg-muted/30">
                        {row.map((cell: string, cIndex: number) => (
                          <td key={cIndex} className="border border-border p-3 text-sm">
                            {cell}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Handle countries table */}
            {part.countries_table && (
              <div className="overflow-x-auto">
                <table className="w-full border-collapse border border-border rounded-lg">
                  <thead>
                    <tr className="bg-muted/50">
                      {part.countries_table[0].map((header: string, hIndex: number) => (
                        <th key={hIndex} className="border border-border p-3 text-left font-medium">
                          {header}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {part.countries_table.slice(1).map((row: string[], rIndex: number) => (
                      <tr key={rIndex} className="hover:bg-muted/30">
                        {row.map((cell: string, cIndex: number) => (
                          <td key={cIndex} className="border border-border p-3 text-sm">
                            {cell}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Handle wh-questions table */}
            {part.wh_table && (
              <div className="overflow-x-auto">
                <table className="w-full border-collapse border border-border rounded-lg">
                  <thead>
                    <tr className="bg-muted/50">
                      {part.wh_table[0].map((header: string, hIndex: number) => (
                        <th key={hIndex} className="border border-border p-3 text-left font-medium">
                          {header}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {part.wh_table.slice(1).map((row: string[], rIndex: number) => (
                      <tr key={rIndex} className="hover:bg-muted/30">
                        {row.map((cell: string, cIndex: number) => (
                          <td key={cIndex} className="border border-border p-3 text-sm">
                            {cell}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            
            {/* Handle sentence types */}
            {part.sentence_types && (
              <div className="space-y-4">
                {part.sentence_types.map((sentenceType: any, stIndex: number) => (
                  <div key={stIndex} className="bg-background/70 p-4 rounded-lg border">
                    <h4 className="font-medium mb-3">{sentenceType.type}</h4>
                    <ul className="space-y-2">
                      {sentenceType.examples.map((example: string, eIndex: number) => (
                        <li key={eIndex} className="text-sm flex items-start gap-2">
                          <span className="w-2 h-2 bg-primary rounded-full flex-shrink-0 mt-2"></span>
                          <span>{example}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    );
  };

  const renderPracticeContent = (item: LessonContentItem) => {
    const content = item.content || {};
    const exercises = content.exercises || [];
    
    return (
      <div className="space-y-6">
        {exercises.map((exercise: any, index: number) => (
          <div key={index} className="bg-background/70 p-6 rounded-lg border">
            <h4 className="font-semibold text-lg mb-3 text-primary">{exercise.title}</h4>
            
            {exercise.instructions && (
              <p className="text-muted-foreground mb-4">{exercise.instructions}</p>
            )}
            
            {exercise.questions && (
              <div className="space-y-3">
                {exercise.questions.map((question: string, qIndex: number) => (
                  <div key={qIndex} className="bg-primary/5 p-3 rounded border-l-4 border-primary">
                    <p className="text-sm font-medium">{question}</p>
                  </div>
                ))}
              </div>
            )}
            
            {exercise.example && (
              <div className="mt-4 bg-secondary/10 p-4 rounded-lg border">
                <h5 className="font-medium mb-2">Exemplo:</h5>
                <pre className="text-sm whitespace-pre-wrap font-mono">{exercise.example}</pre>
              </div>
            )}
          </div>
        ))}
      </div>
    );
  };

  const renderVocabularyContent = (item: LessonContentItem) => {
    const examples = item.examples || [];
    const content = item.content || {};
    
    return (
      <div className="space-y-6">
        {examples.length > 0 && (
          <div className="space-y-4">
            <h4 className="font-semibold text-base">Key Vocabulary</h4>
            <div className="grid gap-4">
              {examples.map((vocab, index) => (
                <div key={index} className="bg-background/70 p-4 rounded-lg border">
                  <div className="flex justify-between items-start gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h5 className="font-semibold text-lg">{vocab.word}</h5>
                        {vocab.pronunciation && (
                          <span className="text-sm text-muted-foreground font-mono">
                            {vocab.pronunciation}
                          </span>
                        )}
                        <Button variant="ghost" size="sm" className="p-1">
                          <Volume2 className="w-4 h-4" />
                        </Button>
                      </div>
                      <p className="text-muted-foreground mb-2">{vocab.definition}</p>
                      {vocab.usage && (
                        <div className="bg-primary/5 p-3 rounded border-l-4 border-primary">
                          <p className="text-sm italic">"{vocab.usage}"</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {content.categories && (
          <div className="space-y-4">
            <h4 className="font-semibold text-base">Word Categories</h4>
            <div className="grid md:grid-cols-2 gap-4">
              {Object.entries(content.categories).map(([category, words]: [string, any]) => (
                <div key={category} className="bg-background/50 p-4 rounded-lg border">
                  <h5 className="font-medium mb-3 capitalize">{category.replace('_', ' ')}</h5>
                  <div className="flex flex-wrap gap-2">
                    {words.map((word: string, index: number) => (
                      <Badge key={index} variant="secondary" className="text-xs">
                        {word}
                      </Badge>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {content.cultural_notes && (
          <div className="bg-amber-50 border border-amber-200 p-4 rounded-lg dark:bg-amber-950/30">
            <h4 className="font-medium mb-2 flex items-center gap-2">
              <Users className="w-4 h-4" />
              Cultural Note
            </h4>
            <p className="text-sm">{content.cultural_notes}</p>
          </div>
        )}
      </div>
    );
  };

  const renderGrammarContent = (item: LessonContentItem) => {
    const content = item.content || {};
    const examples = item.examples || [];
    
    return (
      <div className="space-y-6">
        {examples.length > 0 && (
          <div className="space-y-4">
            <h4 className="font-semibold text-base">Examples</h4>
            <div className="grid gap-3">
              {examples.map((example, index) => (
                <div key={index} className="bg-background/70 p-4 rounded-lg border">
                  <p className="font-medium text-base mb-1">{example.english}</p>
                  {example.portuguese && (
                    <p className="text-muted-foreground text-sm mb-2">{example.portuguese}</p>
                  )}
                  {example.type && (
                    <Badge variant="outline" className="text-xs">{example.type}</Badge>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {content.formation && (
          <div className="space-y-3">
            <h4 className="font-semibold text-base">Formation Rules</h4>
            <div className="bg-background/50 p-4 rounded-lg border">
              {typeof content.formation === 'string' ? (
                <p className="font-mono text-sm">{content.formation}</p>
              ) : (
                <div className="space-y-2">
                  {Object.entries(content.formation).map(([key, value]: [string, any]) => (
                    <div key={key}>
                      <span className="font-medium capitalize">{key.replace('_', ' ')}: </span>
                      <span className="font-mono text-sm">{value}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {content.rules && (
          <div className="space-y-3">
            <h4 className="font-semibold text-base">Grammar Rules</h4>
            <ul className="space-y-2">
              {content.rules.map((rule: string, index: number) => (
                <li key={index} className="flex items-start gap-3">
                  <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                  <span className="text-sm">{rule}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {content.common_mistakes && (
          <div className="bg-red-50 border border-red-200 p-4 rounded-lg dark:bg-red-950/30">
            <h4 className="font-medium mb-3 text-red-800 dark:text-red-200">Common Mistakes</h4>
            <ul className="space-y-2">
              {content.common_mistakes.map((mistake: string, index: number) => (
                <li key={index} className="text-sm text-red-700 dark:text-red-300">
                  • {mistake}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    );
  };

  const renderReadingContent = (item: LessonContentItem) => {
    const content = item.content || {};
    
    return (
      <div className="space-y-6">
        {content.text && (
          <div className="bg-background/50 p-6 rounded-lg border">
            <h4 className="font-semibold mb-4 flex items-center gap-2">
              <FileText className="w-4 h-4" />
              Reading Text
            </h4>
            <div className="prose prose-sm max-w-none">
              {content.text.split('\n').map((paragraph: string, index: number) => (
                paragraph.trim() && <p key={index} className="mb-4 leading-relaxed">{paragraph}</p>
              ))}
            </div>
          </div>
        )}

        {content.questions && (
          <div className="space-y-4">
            <h4 className="font-semibold text-base">Comprehension Questions</h4>
            <div className="space-y-3">
              {content.questions.map((q: any, index: number) => (
                <div key={index} className="bg-background/70 p-4 rounded-lg border">
                  <p className="font-medium mb-2">{q.question}</p>
                  <details className="text-sm">
                    <summary className="cursor-pointer text-primary hover:underline">
                      Show Answer
                    </summary>
                    <p className="mt-2 text-muted-foreground">{q.answer}</p>
                  </details>
                </div>
              ))}
            </div>
          </div>
        )}

        {content.vocabulary_in_context && (
          <div className="space-y-4">
            <h4 className="font-semibold text-base">Vocabulary in Context</h4>
            <div className="grid gap-3">
              {content.vocabulary_in_context.map((vocab: any, index: number) => (
                <div key={index} className="bg-green-50 border border-green-200 p-3 rounded-lg dark:bg-green-950/30">
                  <div className="flex justify-between items-start gap-4">
                    <div>
                      <span className="font-medium">{vocab.word}</span>
                      <p className="text-sm text-muted-foreground mt-1">{vocab.definition}</p>
                      <p className="text-sm italic mt-2">"{vocab.sentence}"</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderSpeakingContent = (item: LessonContentItem) => {
    const content = item.content || {};
    
    return (
      <div className="space-y-6">
        {content.exercises && (
          <div className="space-y-4">
            <h4 className="font-semibold text-base">Speaking Exercises</h4>
            <div className="space-y-4">
              {content.exercises.map((exercise: any, index: number) => (
                <div key={index} className="bg-background/70 p-4 rounded-lg border">
                  <div className="flex items-start gap-3 mb-3">
                    <Mic className="w-5 h-5 text-red-600 mt-1" />
                    <div className="flex-1">
                      <h5 className="font-medium capitalize">{exercise.type.replace('_', ' ')}</h5>
                      {exercise.scenario && (
                        <p className="text-sm text-muted-foreground mt-1">{exercise.scenario}</p>
                      )}
                    </div>
                  </div>
                  
                  {exercise.prompt && (
                    <div className="bg-primary/5 p-3 rounded border-l-4 border-primary mb-3">
                      <p className="text-sm">{exercise.prompt}</p>
                    </div>
                  )}
                  
                  {exercise.phrases && (
                    <div className="space-y-2">
                      <p className="text-sm font-medium">Practice Phrases:</p>
                      <div className="flex flex-wrap gap-2">
                        {exercise.phrases.map((phrase: string, pIndex: number) => (
                          <div key={pIndex} className="flex items-center gap-2 bg-background border rounded-lg p-2">
                            <span className="text-sm">{phrase}</span>
                            <Button variant="ghost" size="sm" className="p-1">
                              <Play className="w-3 h-3" />
                            </Button>
                          </div>
                        ))}
                      </div>
                      {exercise.tip && (
                        <p className="text-xs text-muted-foreground mt-2">💡 {exercise.tip}</p>
                      )}
                    </div>
                  )}
                  
                  <Button variant="outline" className="mt-3" size="sm">
                    <Mic className="w-4 h-4 mr-2" />
                    Start Recording
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}

        {content.conversation_starters && (
          <div className="space-y-3">
            <h4 className="font-semibold text-base">Conversation Starters</h4>
            <div className="grid gap-2">
              {content.conversation_starters.map((starter: string, index: number) => (
                <div key={index} className="bg-background/50 p-3 rounded border flex justify-between items-center">
                  <span className="text-sm">"{starter}"</span>
                  <Button variant="ghost" size="sm" className="p-1">
                    <Volume2 className="w-4 h-4" />
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderWritingContent = (item: LessonContentItem) => {
    const content = item.content || {};
    
    return (
      <div className="space-y-6">
        {content.paragraph_structure && (
          <div className="space-y-4">
            <h4 className="font-semibold text-base">Paragraph Structure</h4>
            <div className="grid gap-3">
              {Object.entries(content.paragraph_structure).map(([key, value]: [string, any]) => (
                <div key={key} className="bg-background/70 p-3 rounded-lg border">
                  <h5 className="font-medium capitalize mb-1">{key.replace('_', ' ')}</h5>
                  <p className="text-sm text-muted-foreground">{value}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {content.academic_style && (
          <div className="space-y-3">
            <h4 className="font-semibold text-base">Academic Writing Tips</h4>
            <ul className="space-y-2">
              {content.academic_style.map((tip: string, index: number) => (
                <li key={index} className="flex items-start gap-3">
                  <PenTool className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                  <span className="text-sm">{tip}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {content.revision_checklist && (
          <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg dark:bg-blue-950/30">
            <h4 className="font-medium mb-3 text-blue-800 dark:text-blue-200">Revision Checklist</h4>
            <ul className="space-y-1">
              {content.revision_checklist.map((item: string, index: number) => (
                <li key={index} className="text-sm text-blue-700 dark:text-blue-300 flex items-center gap-2">
                  <input type="checkbox" className="rounded" />
                  {item}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    );
  };

  const renderContentSection = (item: LessonContentItem) => {
    switch (item.section_type) {
      case 'introduction':
        return renderIntroductionContent(item);
      case 'practice':
        return renderPracticeContent(item);
      case 'vocabulary':
        return renderVocabularyContent(item);
      case 'grammar':
        return renderGrammarContent(item);
      case 'reading':
        return renderReadingContent(item);
      case 'speaking':
        return renderSpeakingContent(item);
      case 'writing':
        return renderWritingContent(item);
      default:
        return (
          <div className="space-y-4">
            {item.examples && Array.isArray(item.examples) && (
              <div className="grid gap-3">
                {item.examples.map((example, index) => (
                  <div key={index} className="bg-background/50 p-3 rounded-lg border">
                    <p className="font-medium">{example.english || example}</p>
                    {example.portuguese && (
                      <p className="text-muted-foreground text-sm">{example.portuguese}</p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        );
    }
  };

  // Sort content by order_index
  const sortedContent = [...content].sort((a, b) => a.order_index - b.order_index);

  return (
    <div className="space-y-6">
      {sortedContent.map((item) => (
        <Card key={item.id} className={`${getSectionColor(item.section_type)} transition-all hover:shadow-md`}>
          <CardHeader className="pb-4">
            <div className="flex items-center gap-3">
              {getSectionIcon(item.section_type)}
              <div className="flex-1">
                <CardTitle className="text-xl">{item.title}</CardTitle>
                <div className="flex items-center gap-2 mt-2">
                  <Badge variant="secondary" className="capitalize">
                    {item.section_type}
                  </Badge>
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Clock className="w-3 h-3" />
                    <span>15 min</span>
                  </div>
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {item.explanation && (
              <div className="bg-background/30 p-4 rounded-lg border-l-4 border-primary">
                <p className="text-muted-foreground leading-relaxed">
                  {item.explanation}
                </p>
              </div>
            )}
            
            <Separator />
            
            {renderContentSection(item)}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}