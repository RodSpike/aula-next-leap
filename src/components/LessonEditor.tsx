import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Plus, Trash2, Edit, Save, X } from "lucide-react";

interface Exercise {
  id?: string;
  question: string;
  options: string[];
  correct_answer: string;
  explanation?: string;
  exercise_type: string;
  order_index: number;
  points: number;
}

interface LessonContent {
  id?: string;
  title: string;
  explanation?: string;
  section_type: string;
  order_index: number;
  content?: any;
  examples?: any[];
}

interface LessonEditorProps {
  lessonId: string;
  lessonTitle: string;
  onClose: () => void;
}

export const LessonEditor: React.FC<LessonEditorProps> = ({
  lessonId,
  lessonTitle,
  onClose,
}) => {
  const { toast } = useToast();
  const [lessonContent, setLessonContent] = useState<LessonContent[]>([]);
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  // New content/exercise states
  const [newContentTitle, setNewContentTitle] = useState('');
  const [newContentExplanation, setNewContentExplanation] = useState('');
  const [newExercise, setNewExercise] = useState<Partial<Exercise>>({
    question: '',
    options: ['', '', '', ''],
    correct_answer: '',
    explanation: '',
    exercise_type: 'multiple_choice',
    points: 1,
  });
  const [isAddingContent, setIsAddingContent] = useState(false);
  const [isAddingExercise, setIsAddingExercise] = useState(false);
  const [editingContentId, setEditingContentId] = useState<string | null>(null);
  const [editingContent, setEditingContent] = useState<{ title: string; explanation: string } | null>(null);

  useEffect(() => {
    fetchLessonData();
  }, [lessonId]);

  const fetchLessonData = async () => {
    try {
      setLoading(true);
      
      // Fetch lesson content
      const { data: contentData, error: contentError } = await supabase
        .from('lesson_content')
        .select('*')
        .eq('lesson_id', lessonId)
        .order('order_index');

      if (contentError) throw contentError;

      // Fetch exercises
      const { data: exerciseData, error: exerciseError } = await supabase
        .from('exercises')
        .select('*')
        .eq('lesson_id', lessonId)
        .order('order_index');

      if (exerciseError) throw exerciseError;

      setLessonContent((contentData || []).map(item => ({
        ...item,
        content: item.content as any,
        examples: item.examples as any[] || [],
      })));
      setExercises((exerciseData || []).map(item => ({
        ...item,
        options: item.options as string[],
      })));
    } catch (error: any) {
      console.error('Error fetching lesson data:', error);
      toast({
        title: "Error",
        description: "Failed to load lesson data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const saveContent = async (content: LessonContent) => {
    try {
      setSaving(true);
      
      if (content.id) {
        // Update existing content
        const { error } = await supabase
          .from('lesson_content')
          .update({
            title: content.title,
            explanation: content.explanation,
            section_type: content.section_type,
          })
          .eq('id', content.id);

        if (error) throw error;
      } else {
        // Create new content
        const { error } = await supabase
          .from('lesson_content')
          .insert({
            lesson_id: lessonId,
            title: content.title,
            explanation: content.explanation,
            section_type: 'explanation',
            order_index: lessonContent.length,
          });

        if (error) throw error;
      }

      toast({
        title: "Success",
        description: "Content saved successfully",
      });

      fetchLessonData(); // Refresh data
    } catch (error: any) {
      console.error('Error saving content:', error);
      toast({
        title: "Error",
        description: "Failed to save content",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const saveExercise = async (exercise: Exercise) => {
    try {
      setSaving(true);
      
      const exerciseData = {
        lesson_id: lessonId,
        question: exercise.question,
        options: exercise.options,
        correct_answer: exercise.correct_answer,
        explanation: exercise.explanation,
        exercise_type: exercise.exercise_type,
        points: exercise.points,
        order_index: exercises.length,
      };

      if (exercise.id) {
        // Update existing exercise
        const { error } = await supabase
          .from('exercises')
          .update(exerciseData)
          .eq('id', exercise.id);

        if (error) throw error;
      } else {
        // Create new exercise
        const { error } = await supabase
          .from('exercises')
          .insert(exerciseData);

        if (error) throw error;
      }

      toast({
        title: "Success",
        description: "Exercise saved successfully",
      });

      fetchLessonData(); // Refresh data
    } catch (error: any) {
      console.error('Error saving exercise:', error);
      toast({
        title: "Error",
        description: "Failed to save exercise",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const deleteContent = async (contentId: string) => {
    try {
      const { error } = await supabase
        .from('lesson_content')
        .delete()
        .eq('id', contentId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Content deleted successfully",
      });

      fetchLessonData();
    } catch (error: any) {
      console.error('Error deleting content:', error);
      toast({
        title: "Error",
        description: "Failed to delete content",
        variant: "destructive",
      });
    }
  };

  const deleteExercise = async (exerciseId: string) => {
    try {
      const { error } = await supabase
        .from('exercises')
        .delete()
        .eq('id', exerciseId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Exercise deleted successfully",
      });

      fetchLessonData();
    } catch (error: any) {
      console.error('Error deleting exercise:', error);
      toast({
        title: "Error",
        description: "Failed to delete exercise",
        variant: "destructive",
      });
    }
  };

  const handleAddContent = () => {
    if (!newContentTitle.trim()) return;

    const content: LessonContent = {
      title: newContentTitle,
      explanation: newContentExplanation,
      section_type: 'explanation',
      order_index: lessonContent.length,
    };

    saveContent(content);
    setNewContentTitle('');
    setNewContentExplanation('');
    setIsAddingContent(false);
  };

  const handleAddExercise = () => {
    if (!newExercise.question?.trim() || !newExercise.correct_answer) return;

    const exercise: Exercise = {
      question: newExercise.question!,
      options: newExercise.options!,
      correct_answer: newExercise.correct_answer!,
      explanation: newExercise.explanation,
      exercise_type: newExercise.exercise_type!,
      points: newExercise.points!,
      order_index: exercises.length,
    };

    saveExercise(exercise);
    setNewExercise({
      question: '',
      options: ['', '', '', ''],
      correct_answer: '',
      explanation: '',
      exercise_type: 'multiple_choice',
      points: 1,
    });
    setIsAddingExercise(false);
  };

  const updateExerciseOption = (index: number, value: string) => {
    const newOptions = [...(newExercise.options || ['', '', '', ''])];
    newOptions[index] = value;
    setNewExercise({ ...newExercise, options: newOptions });
  };

  const handleEditContent = (content: LessonContent) => {
    setEditingContentId(content.id!);
    setEditingContent({
      title: content.title,
      explanation: content.explanation || ''
    });
  };

  const handleSaveEditedContent = () => {
    if (!editingContent || !editingContentId) return;

    const content: LessonContent = {
      id: editingContentId,
      title: editingContent.title,
      explanation: editingContent.explanation,
      section_type: 'explanation',
      order_index: 0,
    };

    saveContent(content);
    setEditingContentId(null);
    setEditingContent(null);
  };

  const handleCancelEdit = () => {
    setEditingContentId(null);
    setEditingContent(null);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">Loading lesson data...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Edit Lesson: {lessonTitle}</h2>
        <Button variant="outline" onClick={onClose}>
          <X className="w-4 h-4 mr-2" />
          Close
        </Button>
      </div>

      {/* Lesson Content Section */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Lesson Content</CardTitle>
            <Button onClick={() => setIsAddingContent(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Add Content
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {lessonContent.map((content) => (
            <div key={content.id} className="border rounded-lg p-4">
              {editingContentId === content.id ? (
                <div className="space-y-4">
                  <Input
                    placeholder="Content Title"
                    value={editingContent?.title || ''}
                    onChange={(e) => setEditingContent(prev => prev ? { ...prev, title: e.target.value } : null)}
                  />
                  <Textarea
                    placeholder="Content Explanation"
                    value={editingContent?.explanation || ''}
                    onChange={(e) => setEditingContent(prev => prev ? { ...prev, explanation: e.target.value } : null)}
                    rows={4}
                  />
                  <div className="flex gap-2">
                    <Button onClick={handleSaveEditedContent} disabled={saving}>
                      <Save className="w-4 h-4 mr-2" />
                      Save Changes
                    </Button>
                    <Button variant="outline" onClick={handleCancelEdit}>
                      Cancel
                    </Button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium">{content.title}</h4>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEditContent(content)}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => deleteContent(content.id!)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                  <p className="text-muted-foreground">{content.explanation}</p>
                </>
              )}
            </div>
          ))}

          {isAddingContent && (
            <div className="border rounded-lg p-4 bg-muted">
              <div className="space-y-4">
                <Input
                  placeholder="Content Title"
                  value={newContentTitle}
                  onChange={(e) => setNewContentTitle(e.target.value)}
                />
                <Textarea
                  placeholder="Content Explanation"
                  value={newContentExplanation}
                  onChange={(e) => setNewContentExplanation(e.target.value)}
                  rows={4}
                />
                <div className="flex gap-2">
                  <Button onClick={handleAddContent} disabled={saving}>
                    <Save className="w-4 h-4 mr-2" />
                    Save Content
                  </Button>
                  <Button variant="outline" onClick={() => setIsAddingContent(false)}>
                    Cancel
                  </Button>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Exercises Section */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Exercises</CardTitle>
            <Button onClick={() => setIsAddingExercise(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Add Exercise
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {exercises.map((exercise) => (
            <div key={exercise.id} className="border rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-medium">Question {exercise.order_index + 1}</h4>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => deleteExercise(exercise.id!)}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
              <p className="mb-2">{exercise.question}</p>
              <div className="space-y-1">
                {exercise.options.map((option, index) => (
                  <div 
                    key={index} 
                    className={`text-sm p-2 rounded ${
                      option === exercise.correct_answer 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-gray-100'
                    }`}
                  >
                    {String.fromCharCode(65 + index)}. {option}
                    {option === exercise.correct_answer && ' ✓'}
                  </div>
                ))}
              </div>
            </div>
          ))}

          {isAddingExercise && (
            <div className="border rounded-lg p-4 bg-muted">
              <div className="space-y-4">
                <Input
                  placeholder="Exercise Question"
                  value={newExercise.question}
                  onChange={(e) => setNewExercise({ ...newExercise, question: e.target.value })}
                />
                
                <div className="space-y-2">
                  <Label>Answer Options:</Label>
                  {newExercise.options?.map((option, index) => (
                    <Input
                      key={index}
                      placeholder={`Option ${String.fromCharCode(65 + index)}`}
                      value={option}
                      onChange={(e) => updateExerciseOption(index, e.target.value)}
                    />
                  ))}
                </div>

                <div>
                  <Label>Correct Answer:</Label>
                  <RadioGroup
                    value={newExercise.correct_answer}
                    onValueChange={(value) => setNewExercise({ ...newExercise, correct_answer: value })}
                  >
                    {newExercise.options?.map((option, index) => (
                      <div key={index} className="flex items-center space-x-2">
                        <RadioGroupItem value={option} id={`option-${index}`} />
                        <Label htmlFor={`option-${index}`}>
                          {String.fromCharCode(65 + index)}. {option || `Option ${String.fromCharCode(65 + index)}`}
                        </Label>
                      </div>
                    ))}
                  </RadioGroup>
                </div>

                <Textarea
                  placeholder="Explanation (optional)"
                  value={newExercise.explanation}
                  onChange={(e) => setNewExercise({ ...newExercise, explanation: e.target.value })}
                  rows={2}
                />

                <div className="flex gap-2">
                  <Button onClick={handleAddExercise} disabled={saving}>
                    <Save className="w-4 h-4 mr-2" />
                    Save Exercise
                  </Button>
                  <Button variant="outline" onClick={() => setIsAddingExercise(false)}>
                    Cancel
                  </Button>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};