# Quiz Application Database

This directory contains all the PostgreSQL database scripts needed to set up your quiz application database.

## Files Overview

- **`setup.sql`** - Main setup script that runs all other scripts in order
- **`create_tables.sql`** - Creates all database tables with proper relationships
- **`create_indexes.sql`** - Creates performance indexes for faster queries
- **`functions_triggers.sql`** - Creates database functions and triggers for automation
- **`views.sql`** - Creates useful views for reporting and analytics
- **`sample_data.sql`** - Inserts sample data for modules and settings

## Quick Setup

To set up the entire database, run:

```bash
psql -d your_database_name -f setup.sql
```

Or run each script individually:

```bash
psql -d your_database_name -f create_tables.sql
psql -d your_database_name -f create_indexes.sql
psql -d your_database_name -f functions_triggers.sql
psql -d your_database_name -f views.sql
psql -d your_database_name -f sample_data.sql
```

## Database Schema

### Core Tables

1. **users** - User accounts and authentication
2. **modules** - Quiz subjects/categories (OS, Database, AI, etc.)
3. **quizzes** - Individual quizzes within modules
4. **questions** - Quiz questions with metadata
5. **question_options** - Multiple choice options for questions
6. **quiz_attempts** - User quiz sessions and scores
7. **user_answers** - Individual answers for each question
8. **user_progress** - Progress tracking per user per module
9. **app_settings** - Application configuration
10. **user_sessions** - Session management

### Key Features

- **UUID Primary Keys** - For better security and scalability
- **Automatic Timestamps** - Created/updated timestamps with triggers
- **Progress Tracking** - Automatic calculation of user progress
- **Score Calculation** - Built-in functions for grade calculation
- **Performance Indexes** - Optimized for common queries
- **Data Integrity** - Foreign key constraints and check constraints

### Useful Views

- **quiz_stats** - Quiz performance statistics
- **user_performance** - Individual user performance metrics
- **module_progress_view** - Module completion overview
- **recent_attempts** - Latest quiz attempts
- **question_difficulty** - Question success rate analysis
- **leaderboard** - User rankings

### Database Functions

- **calculate_quiz_score()** - Calculates final quiz scores
- **get_grade_message()** - Returns grade and message based on score
- **update_user_progress()** - Updates user progress automatically
- **cleanup_expired_sessions()** - Removes old user sessions

## Data Migration

After setting up the database, you'll need to migrate your existing JSON quiz data. You can create a migration script to:

1. Parse your JSON files in the `quizes/` directory
2. Insert quizzes into the `quizzes` table
3. Insert questions into the `questions` table
4. Insert options into the `question_options` table

Example migration for a single quiz:

```sql
-- Insert quiz
INSERT INTO quizzes (module_id, quiz_number, title, total_questions) 
SELECT id, '1', 'Operating Systems Quiz 1', 30 
FROM modules WHERE name = 'os';

-- Insert questions and options (you'll need to loop through your JSON)
-- This would typically be done with a script in your preferred language
```

## Connection Example

For Node.js with pg:

```javascript
import pkg from 'pg';
const { Pool } = pkg;

const pool = new Pool({
  user: 'your_username',
  host: 'localhost',
  database: 'quiz_app',
  password: 'your_password',
  port: 5432,
});
```

## Security Notes

- All tables use UUID primary keys for better security
- Implement proper password hashing (bcrypt recommended)
- Use environment variables for database credentials
- Consider implementing row-level security if needed
- Regularly clean up expired sessions with the provided function

## Performance

The database includes comprehensive indexing for:
- User lookups (email, username)
- Quiz queries (module, quiz number)
- Attempt tracking (user, quiz, completion status)
- Progress calculation (user, module)

Monitor query performance and add additional indexes as needed based on your usage patterns.