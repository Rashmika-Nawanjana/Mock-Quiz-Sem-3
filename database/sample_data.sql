-- Sample Data for Quiz Application
-- Insert sample data based on your current quiz modules

-- Insert Modules (based on your folder structure)
INSERT INTO modules (name, display_name, description, icon, color, sort_order) VALUES
('intro-ai', 'Introduction to AI', 'Explore the fundamentals of artificial intelligence, machine learning, and neural networks.', 'fas fa-brain', '#FF6B6B', 1),
('database', 'Database Systems', 'Master SQL, database design, normalization, and transaction management.', 'fas fa-database', '#4ECDC4', 2),
('differential', 'Differential Equations', 'Practice solving ordinary and partial differential equations.', 'fas fa-calculator', '#45B7D1', 3),
('statistics', 'Applied Statistics', 'Learn probability, hypothesis testing, and statistical analysis.', 'fas fa-chart-bar', '#96CEB4', 4),
('os', 'Operating Systems', 'Understand processes, memory management, and system architecture.', 'fas fa-desktop', '#FFEAA7', 5),
('architecture', 'Computer Architecture', 'Study CPU design, instruction sets, and system organization.', 'fas fa-microchip', '#DDA0DD', 6),
('networking', 'Data Communication', 'Master networking protocols, OSI model, and data transmission.', 'fas fa-network-wired', '#98D8C8', 7),
('thermodynamics', 'Thermodynamics', 'Practice thermodynamic laws, cycles, and energy transfer.', 'fas fa-fire', '#F7DC6F', 8);

-- Sample App Settings
INSERT INTO app_settings (setting_key, setting_value, setting_type, description) VALUES
('app_name', 'Mock Quiz System', 'string', 'Application name'),
('app_version', '1.0.0', 'string', 'Current application version'),
('default_quiz_time_limit', '30', 'number', 'Default time limit for quizzes in minutes'),
('passing_score', '60', 'number', 'Default passing score percentage'),
('max_attempts_per_quiz', '3', 'number', 'Maximum attempts allowed per quiz'),
('enable_explanations', 'true', 'boolean', 'Show explanations after quiz completion'),
('enable_timer', 'true', 'boolean', 'Enable timer for quizzes'),
('enable_progress_tracking', 'true', 'boolean', 'Enable user progress tracking');

INSERT INTO users (email, password_hash, username, full_name, role) VALUES
('hhhbhuwaneka@gmail.com', '$2b$12$o49gcWwMQFHaChA.1mij.uUe3/8k3VmHTHKwoX9DbxFxsYoai.Yg6', 'admin', 'System Administrator', 'admin');

-- Sample Student User (password: student123)
INSERT INTO users (email, password_hash, username, full_name, role) VALUES
('student@quiz.com', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/XQG5L2xM3c4d5e6f7h', 'student', 'John Doe', 'student');

-- You can add more sample data here as needed
-- For quizzes and questions, you'll need to migrate from your JSON files