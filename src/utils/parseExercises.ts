interface Exercise {
  type: 'multiple_choice' | 'fill_blank' | 'true_false';
  question: string;
  options: string[];
  correct_answer: string;
  explanation: string;
}

export const parseExercisesFromContent = (content: string): Exercise[] => {
  try {
    // Look for <activities> tag in the content
    const activitiesMatch = content.match(/<activities>(.*?)<\/activities>/s);
    if (!activitiesMatch) {
      console.log('No <activities> tag found in content');
      return [];
    }

    const activitiesJson = activitiesMatch[1].trim();
    const exercises = JSON.parse(activitiesJson);
    
    if (!Array.isArray(exercises)) {
      console.log('Activities content is not an array');
      return [];
    }

    // Validate and format exercises
    return exercises
      .filter((exercise: any) => {
        return (
          exercise.question &&
          exercise.correct_answer &&
          exercise.explanation &&
          Array.isArray(exercise.options)
        );
      })
      .map((exercise: any) => ({
        type: exercise.type || 'multiple_choice',
        question: exercise.question,
        options: exercise.options,
        correct_answer: exercise.correct_answer,
        explanation: exercise.explanation,
      }));
  } catch (error) {
    console.error('Error parsing exercises from content:', error);
    return [];
  }
};

export const cleanContentFromExercises = (content: string): string => {
  // Remove the <activities> tag and its content from the HTML
  return content.replace(/<activities>.*?<\/activities>/s, '').trim();
};