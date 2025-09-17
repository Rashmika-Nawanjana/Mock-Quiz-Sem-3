-- Database Views for Quiz Application

-- Useful views for common queries

-- View for quiz statistics
CREATE OR REPLACE VIEW quiz_stats AS
SELECT 
    q.id as quiz_id,
    m.name as module_name,
    m.display_name as module_display_name,
    q.quiz_number,
    q.title as quiz_title,
    q.total_questions,
    COUNT(DISTINCT qa.user_id) as total_participants,
    COUNT(qa.id) as total_attempts,
    ROUND(AVG(qa.score_percentage), 2) as average_score,
    MAX(qa.score_percentage) as highest_score,
    MIN(qa.score_percentage) as lowest_score,
    COUNT(CASE WHEN qa.score_percentage >= q.passing_score THEN 1 END) as passed_attempts,
    ROUND(
        COUNT(CASE WHEN qa.score_percentage >= q.passing_score THEN 1 END)::DECIMAL / 
        NULLIF(COUNT(qa.id), 0) * 100, 2
    ) as pass_rate
FROM quizzes q
LEFT JOIN modules m ON q.module_id = m.id
LEFT JOIN quiz_attempts qa ON q.id = qa.quiz_id AND qa.is_completed = true
GROUP BY q.id, m.name, m.display_name, q.quiz_number, q.title, q.total_questions, q.passing_score;

-- View for user performance summary
CREATE OR REPLACE VIEW user_performance AS
SELECT 
    u.id as user_id,
    u.username,
    u.full_name,
    COUNT(DISTINCT qa.quiz_id) as quizzes_taken,
    COUNT(qa.id) as total_attempts,
    ROUND(AVG(qa.score_percentage), 2) as average_score,
    MAX(qa.score_percentage) as best_score,
    COUNT(CASE WHEN qa.score_percentage >= 60 THEN 1 END) as passed_quizzes,
    SUM(qa.time_spent_seconds) as total_time_spent,
    MAX(qa.completed_at) as last_quiz_date
FROM users u
LEFT JOIN quiz_attempts qa ON u.id = qa.user_id AND qa.is_completed = true
GROUP BY u.id, u.username, u.full_name;

-- View for module progress
CREATE OR REPLACE VIEW module_progress_view AS
SELECT 
    m.id as module_id,
    m.name as module_name,
    m.display_name,
    m.color,
    m.icon,
    COUNT(q.id) as total_quizzes,
    COUNT(CASE WHEN q.is_active = true THEN 1 END) as active_quizzes,
    COUNT(DISTINCT qa.user_id) as users_participated,
    ROUND(AVG(qa.score_percentage), 2) as module_average_score
FROM modules m
LEFT JOIN quizzes q ON m.id = q.module_id
LEFT JOIN quiz_attempts qa ON q.id = qa.quiz_id AND qa.is_completed = true
GROUP BY m.id, m.name, m.display_name, m.color, m.icon
ORDER BY m.sort_order;

-- View for recent quiz attempts
CREATE OR REPLACE VIEW recent_attempts AS
SELECT 
    qa.id as attempt_id,
    u.username,
    u.full_name,
    m.display_name as module_name,
    q.title as quiz_title,
    qa.score_percentage,
    qa.correct_answers,
    qa.total_questions,
    qa.time_spent_seconds,
    qa.completed_at,
    CASE 
        WHEN qa.score_percentage >= 90 THEN 'Excellent'
        WHEN qa.score_percentage >= 80 THEN 'Great'
        WHEN qa.score_percentage >= 70 THEN 'Good'
        WHEN qa.score_percentage >= 60 THEN 'Passed'
        ELSE 'Failed'
    END as performance_level
FROM quiz_attempts qa
JOIN users u ON qa.user_id = u.id
JOIN quizzes q ON qa.quiz_id = q.id
JOIN modules m ON q.module_id = m.id
WHERE qa.is_completed = true
ORDER BY qa.completed_at DESC;

-- View for question difficulty analysis
CREATE OR REPLACE VIEW question_difficulty AS
SELECT 
    qu.id as question_id,
    qu.question_text,
    q.title as quiz_title,
    m.display_name as module_name,
    COUNT(ua.id) as total_attempts,
    COUNT(CASE WHEN ua.is_correct = true THEN 1 END) as correct_attempts,
    ROUND(
        COUNT(CASE WHEN ua.is_correct = true THEN 1 END)::DECIMAL / 
        NULLIF(COUNT(ua.id), 0) * 100, 2
    ) as success_rate,
    CASE 
        WHEN COUNT(CASE WHEN ua.is_correct = true THEN 1 END)::DECIMAL / NULLIF(COUNT(ua.id), 0) > 0.8 THEN 'Easy'
        WHEN COUNT(CASE WHEN ua.is_correct = true THEN 1 END)::DECIMAL / NULLIF(COUNT(ua.id), 0) > 0.5 THEN 'Medium'
        ELSE 'Hard'
    END as difficulty_level
FROM questions qu
JOIN quizzes q ON qu.quiz_id = q.id
JOIN modules m ON q.module_id = m.id
LEFT JOIN user_answers ua ON qu.id = ua.question_id
GROUP BY qu.id, qu.question_text, q.title, m.display_name
HAVING COUNT(ua.id) > 0
ORDER BY success_rate ASC;

-- View for leaderboard
CREATE OR REPLACE VIEW leaderboard AS
SELECT 
    ROW_NUMBER() OVER (ORDER BY AVG(qa.score_percentage) DESC, COUNT(qa.id) DESC) as rank,
    u.id as user_id,
    u.username,
    u.full_name,
    COUNT(qa.id) as total_quizzes,
    ROUND(AVG(qa.score_percentage), 2) as average_score,
    MAX(qa.score_percentage) as best_score,
    SUM(qa.time_spent_seconds) as total_time_spent
FROM users u
JOIN quiz_attempts qa ON u.id = qa.user_id
WHERE qa.is_completed = true AND u.role = 'student'
GROUP BY u.id, u.username, u.full_name
HAVING COUNT(qa.id) >= 3  -- Only users with at least 3 completed quizzes
ORDER BY average_score DESC, total_quizzes DESC;