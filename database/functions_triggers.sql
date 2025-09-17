-- Database Functions and Triggers for Quiz Application

-- Function to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers for updated_at columns
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_modules_updated_at BEFORE UPDATE ON modules
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_quizzes_updated_at BEFORE UPDATE ON quizzes
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_questions_updated_at BEFORE UPDATE ON questions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_progress_updated_at BEFORE UPDATE ON user_progress
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_app_settings_updated_at BEFORE UPDATE ON app_settings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to calculate quiz score
CREATE OR REPLACE FUNCTION calculate_quiz_score(attempt_uuid UUID)
RETURNS DECIMAL(5,2) AS $$
DECLARE
    total_questions INTEGER;
    correct_answers INTEGER;
    score_percentage DECIMAL(5,2);
BEGIN
    -- Get total questions for this attempt
    SELECT qa.total_questions INTO total_questions
    FROM quiz_attempts qa
    WHERE qa.id = attempt_uuid;
    
    -- Count correct answers
    SELECT COUNT(*) INTO correct_answers
    FROM user_answers ua
    WHERE ua.attempt_id = attempt_uuid AND ua.is_correct = true;
    
    -- Calculate percentage
    IF total_questions > 0 THEN
        score_percentage := (correct_answers::DECIMAL / total_questions::DECIMAL) * 100;
    ELSE
        score_percentage := 0;
    END IF;
    
    -- Update the quiz_attempts table
    UPDATE quiz_attempts 
    SET correct_answers = correct_answers,
        score_percentage = score_percentage
    WHERE id = attempt_uuid;
    
    RETURN score_percentage;
END;
$$ LANGUAGE plpgsql;

-- Function to get grade message based on score
CREATE OR REPLACE FUNCTION get_grade_message(score_percentage DECIMAL)
RETURNS TABLE(grade VARCHAR(50), message TEXT) AS $$
BEGIN
    IF score_percentage >= 90 THEN
        RETURN QUERY SELECT 'Excellent!'::VARCHAR(50), 'Outstanding performance! You have mastered this topic.'::TEXT;
    ELSIF score_percentage >= 80 THEN
        RETURN QUERY SELECT 'Great Job!'::VARCHAR(50), 'Very good work! You have a solid understanding of the material.'::TEXT;
    ELSIF score_percentage >= 70 THEN
        RETURN QUERY SELECT 'Good Work!'::VARCHAR(50), 'Good job! You understand most of the concepts.'::TEXT;
    ELSIF score_percentage >= 60 THEN
        RETURN QUERY SELECT 'Passed'::VARCHAR(50), 'You passed! Consider reviewing the material to improve your understanding.'::TEXT;
    ELSE
        RETURN QUERY SELECT 'Keep Trying!'::VARCHAR(50), 'Don''t give up! Review the material and try again.'::TEXT;
    END IF;
END;
$$ LANGUAGE plpgsql;

-- Function to update user progress
CREATE OR REPLACE FUNCTION update_user_progress(user_uuid UUID, module_uuid UUID)
RETURNS VOID AS $$
DECLARE
    total_quizzes_in_module INTEGER;
    completed_quizzes INTEGER;
    best_score DECIMAL(5,2);
    avg_score DECIMAL(5,2);
    total_attempts_count INTEGER;
    total_time INTEGER;
BEGIN
    -- Get total quizzes in module
    SELECT COUNT(*) INTO total_quizzes_in_module
    FROM quizzes q
    WHERE q.module_id = module_uuid AND q.is_active = true;
    
    -- Get completed quizzes (at least one completed attempt)
    SELECT COUNT(DISTINCT qa.quiz_id) INTO completed_quizzes
    FROM quiz_attempts qa
    JOIN quizzes q ON qa.quiz_id = q.id
    WHERE qa.user_id = user_uuid 
      AND q.module_id = module_uuid 
      AND qa.is_completed = true;
    
    -- Get best score for this user in this module
    SELECT COALESCE(MAX(qa.score_percentage), 0) INTO best_score
    FROM quiz_attempts qa
    JOIN quizzes q ON qa.quiz_id = q.id
    WHERE qa.user_id = user_uuid 
      AND q.module_id = module_uuid 
      AND qa.is_completed = true;
    
    -- Get average score
    SELECT COALESCE(AVG(qa.score_percentage), 0) INTO avg_score
    FROM quiz_attempts qa
    JOIN quizzes q ON qa.quiz_id = q.id
    WHERE qa.user_id = user_uuid 
      AND q.module_id = module_uuid 
      AND qa.is_completed = true;
    
    -- Get total attempts
    SELECT COUNT(*) INTO total_attempts_count
    FROM quiz_attempts qa
    JOIN quizzes q ON qa.quiz_id = q.id
    WHERE qa.user_id = user_uuid 
      AND q.module_id = module_uuid;
    
    -- Get total time spent
    SELECT COALESCE(SUM(qa.time_spent_seconds), 0) INTO total_time
    FROM quiz_attempts qa
    JOIN quizzes q ON qa.quiz_id = q.id
    WHERE qa.user_id = user_uuid 
      AND q.module_id = module_uuid 
      AND qa.is_completed = true;
    
    -- Insert or update user progress
    INSERT INTO user_progress (
        user_id, module_id, quizzes_completed, total_quizzes, 
        best_score_percentage, average_score_percentage, 
        total_attempts, total_time_spent_seconds, last_activity
    )
    VALUES (
        user_uuid, module_uuid, completed_quizzes, total_quizzes_in_module,
        best_score, avg_score, total_attempts_count, total_time, CURRENT_TIMESTAMP
    )
    ON CONFLICT (user_id, module_id) 
    DO UPDATE SET
        quizzes_completed = EXCLUDED.quizzes_completed,
        total_quizzes = EXCLUDED.total_quizzes,
        best_score_percentage = EXCLUDED.best_score_percentage,
        average_score_percentage = EXCLUDED.average_score_percentage,
        total_attempts = EXCLUDED.total_attempts,
        total_time_spent_seconds = EXCLUDED.total_time_spent_seconds,
        last_activity = EXCLUDED.last_activity;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update user progress after quiz completion
CREATE OR REPLACE FUNCTION trigger_update_progress()
RETURNS TRIGGER AS $$
DECLARE
    module_uuid UUID;
BEGIN
    -- Only update progress when quiz is completed
    IF NEW.is_completed = true AND (OLD.is_completed IS NULL OR OLD.is_completed = false) THEN
        -- Get the module_id for this quiz
        SELECT q.module_id INTO module_uuid
        FROM quizzes q
        WHERE q.id = NEW.quiz_id;
        
        -- Update user progress
        PERFORM update_user_progress(NEW.user_id, module_uuid);
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_quiz_completion AFTER UPDATE ON quiz_attempts
    FOR EACH ROW EXECUTE FUNCTION trigger_update_progress();

-- Function to clean up expired sessions
CREATE OR REPLACE FUNCTION cleanup_expired_sessions()
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM user_sessions WHERE expires_at < CURRENT_TIMESTAMP;
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;