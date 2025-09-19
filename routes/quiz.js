alert("quiz.js loaded!");
// Upsert user info on login (call this after successful login)
// Example usage: await upsertUser(supabaseUser)
export async function upsertUser(supabaseUser) {
  if (!supabaseUser) return;
  const { id, email, user_metadata } = supabaseUser;
  const full_name = user_metadata?.full_name || user_metadata?.name || null;
  const avatar_url = user_metadata?.avatar_url || user_metadata?.picture || null;
  await supabase.from('users').upsert([
    {
      id,
      email,
      full_name,
      avatar_url,
      is_active: true,
      updated_at: new Date().toISOString(),
    }
  ], { onConflict: 'id' });
}
// ---
// How to get all user answers, quiz, and module for a given attempt:
//
// 1. Get the quiz_attempt row by attemptId.
// 2. Get the quiz info from quizzes table using quiz_attempt.quiz_id.
// 3. Get the module info from modules table using quizzes.module_id.
// 4. Get all user_answers for that attemptId.
//
// Example (Supabase JS):
//
// const { data: attempt } = await supabase
//   .from('quiz_attempts')
//   .select('*, quizzes(*, modules(*)), user_answers(*)')
//   .eq('id', attemptId)
//   .single();
//
// // attempt.quizzes contains quiz info (including module_id)
// // attempt.quizzes.modules contains module info
// // attempt.user_answers is an array of all answers for this attempt
//
import express from 'express';
import supabase from '../database/supabase-client.js';

const router = express.Router();

// Save a quiz attempt and answers
router.post('/submit', async (req, res) => {
  const { moduleName, quizNumber, answers, timeSpentSeconds } = req.body;
  const userId = req.session.user.id;

  // 1. Get module and quiz IDs
  const { data: module, error: moduleError } = await supabase
    .from('modules')
    .select('id')
    .eq('name', moduleName)
    .single();
  if (moduleError || !module) return res.status(400).json({ error: 'Module not found' });

  const { data: quiz, error: quizError } = await supabase
    .from('quizzes')
    .select('id, total_questions')
    .eq('module_id', module.id)
    .eq('quiz_number', quizNumber)
    .single();
  if (quizError || !quiz) return res.status(400).json({ error: 'Quiz not found' });

  // 2. Get the next attempt number for this user/quiz
  const { count } = await supabase
    .from('quiz_attempts')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('quiz_id', quiz.id);
  const attemptNumber = (count || 0) + 1;

  // 3. Insert quiz_attempts row
  const { data: attempt, error: attemptError } = await supabase
    .from('quiz_attempts')
    .insert([{
      user_id: userId,
      quiz_id: quiz.id,
      attempt_number: attemptNumber,
      total_questions: quiz.total_questions,
      started_at: new Date().toISOString()
    }])
    .select()
    .single();
  if (attemptError || !attempt) {
    console.error('Quiz attempt insert error:', attemptError);
    console.error('Quiz attempt insert data:', {
      user_id: userId,
      quiz_id: quiz.id,
      attempt_number: attemptNumber,
      total_questions: quiz.total_questions
    });
    return res.status(500).json({ error: 'Could not save attempt', details: attemptError?.message });
  }

  // 4. Insert user_answers for each question
  const answersToInsert = answers.map(ans => ({
    attempt_id: attempt.id,
    question_id: ans.questionId,
    selected_option_number: ans.selectedOption,
    is_correct: ans.isCorrect,
    time_spent_seconds: ans.timeSpent
  }));
  console.log('answersToInsert:', answersToInsert);
  if (!answersToInsert.length) {
    console.error('No answers to insert!');
  }
  const { error: answersError } = await supabase
    .from('user_answers')
    .insert(answersToInsert);
  if (answersError) {
    console.error('user_answers insert error:', answersError);
    return res.status(500).json({ error: 'Could not save answers', details: answersError.message });
  }

  // 5. Update quiz_attempts with results
  const correctAnswers = answers.filter(a => a.isCorrect).length;
  const scorePercentage = (correctAnswers / quiz.total_questions) * 100;
  await supabase
    .from('quiz_attempts')
    .update({
      completed_at: new Date().toISOString(),
      time_spent_seconds: timeSpentSeconds,
      correct_answers: correctAnswers,
      score_percentage: scorePercentage,
      is_completed: true
    })
    .eq('id', attempt.id);


  // --- FIXED MODULE-WIDE PROGRESS LOGIC ---
  // Get total quizzes in this module
  const { count: totalQuizzesInModule } = await supabase
    .from('quizzes')
    .select('id', { count: 'exact', head: true })
    .eq('module_id', module.id)
    .eq('is_active', true);

  // Get all completed attempts for ALL quizzes in this module
  const { data: allModuleAttempts } = await supabase
    .from('quiz_attempts')
    .select(`
      id,
      quiz_id,
      score_percentage,
      time_spent_seconds,
      quizzes!inner(module_id)
    `)
    .eq('user_id', userId)
    .eq('quizzes.module_id', module.id)
    .eq('is_completed', true);

  // Count unique quizzes completed (not total attempts)
  const uniqueQuizzesCompleted = new Set(
    allModuleAttempts?.map(a => a.quiz_id) || []
  ).size;

  // Calculate best and average scores across ALL module attempts
  const scores = allModuleAttempts?.map(a => Number(a.score_percentage) || 0) || [scorePercentage];
  const bestScore = Math.max(...scores);
  const avgScore = scores.reduce((sum, score) => sum + score, 0) / scores.length;

  // Calculate total time spent across all attempts
  const totalTimeSpent = allModuleAttempts?.reduce((sum, a) => 
    sum + (a.time_spent_seconds || 0), 0) || timeSpentSeconds;

  const progressPayload = {
    user_id: userId,
    module_id: module.id,
    quizzes_completed: uniqueQuizzesCompleted,
    total_quizzes: totalQuizzesInModule || 1,
    best_score_percentage: bestScore,
    average_score_percentage: avgScore,
    total_attempts: allModuleAttempts?.length || 1,
    total_time_spent_seconds: totalTimeSpent,
    last_activity: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };
  console.log('user_progress upsert:', progressPayload);
  const { error: progressError } = await supabase.from('user_progress').upsert([
    progressPayload
  ], { onConflict: ['user_id', 'module_id'] });
  if (progressError) {
    console.error('user_progress upsert error:', progressError);
  }

  // Optionally update quiz total_questions if needed
  if (quiz.total_questions !== answers.length) {
    await supabase
      .from('quizzes')
      .update({ total_questions: answers.length })
      .eq('id', quiz.id);
  }

  res.json({ success: true, attemptId: attempt.id });
});

export default router;
