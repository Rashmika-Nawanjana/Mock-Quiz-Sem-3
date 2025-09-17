-- Performance Indexes for Quiz Application
-- Performance indexes for better query performance

-- Users table indexes
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_users_is_active ON users(is_active);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_last_login ON users(last_login);

-- Modules table indexes
CREATE INDEX idx_modules_name ON modules(name);
CREATE INDEX idx_modules_is_active ON modules(is_active);
CREATE INDEX idx_modules_sort_order ON modules(sort_order);

-- Quizzes table indexes
CREATE INDEX idx_quizzes_module_id ON quizzes(module_id);
CREATE INDEX idx_quizzes_quiz_number ON quizzes(quiz_number);
CREATE INDEX idx_quizzes_is_active ON quizzes(is_active);
CREATE INDEX idx_quizzes_difficulty ON quizzes(difficulty_level);
CREATE INDEX idx_quizzes_module_number ON quizzes(module_id, quiz_number);

-- Questions table indexes
CREATE INDEX idx_questions_quiz_id ON questions(quiz_id);
CREATE INDEX idx_questions_question_number ON questions(question_number);
CREATE INDEX idx_questions_quiz_question ON questions(quiz_id, question_number);

-- Question Options table indexes
CREATE INDEX idx_question_options_question_id ON question_options(question_id);
CREATE INDEX idx_question_options_is_correct ON question_options(is_correct);

-- Quiz Attempts table indexes
CREATE INDEX idx_quiz_attempts_user_id ON quiz_attempts(user_id);
CREATE INDEX idx_quiz_attempts_quiz_id ON quiz_attempts(quiz_id);
CREATE INDEX idx_quiz_attempts_completed ON quiz_attempts(is_completed);
CREATE INDEX idx_quiz_attempts_user_quiz ON quiz_attempts(user_id, quiz_id);
CREATE INDEX idx_quiz_attempts_started_at ON quiz_attempts(started_at);
CREATE INDEX idx_quiz_attempts_completed_at ON quiz_attempts(completed_at);
CREATE INDEX idx_quiz_attempts_score ON quiz_attempts(score_percentage);

-- User Answers table indexes
CREATE INDEX idx_user_answers_attempt_id ON user_answers(attempt_id);
CREATE INDEX idx_user_answers_question_id ON user_answers(question_id);
CREATE INDEX idx_user_answers_is_correct ON user_answers(is_correct);

-- User Progress table indexes
CREATE INDEX idx_user_progress_user_id ON user_progress(user_id);
CREATE INDEX idx_user_progress_module_id ON user_progress(module_id);
CREATE INDEX idx_user_progress_last_activity ON user_progress(last_activity);
CREATE INDEX idx_user_progress_best_score ON user_progress(best_score_percentage);

-- App Settings table indexes
CREATE INDEX idx_app_settings_key ON app_settings(setting_key);
CREATE INDEX idx_app_settings_type ON app_settings(setting_type);

-- User Sessions table indexes
CREATE INDEX idx_user_sessions_user_id ON user_sessions(user_id);
CREATE INDEX idx_user_sessions_token ON user_sessions(session_token);
CREATE INDEX idx_user_sessions_expires ON user_sessions(expires_at);
CREATE INDEX idx_user_sessions_last_accessed ON user_sessions(last_accessed);

-- Composite indexes for common queries
CREATE INDEX idx_quiz_attempts_user_completed ON quiz_attempts(user_id, is_completed, completed_at);
CREATE INDEX idx_questions_quiz_order ON questions(quiz_id, question_number);
CREATE INDEX idx_user_answers_attempt_correct ON user_answers(attempt_id, is_correct);