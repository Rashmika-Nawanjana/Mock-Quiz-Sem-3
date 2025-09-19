// Dashboard route (protected)

// Auth middleware to protect routes
function requireAuth(req, res, next) {
    if (!req.session || !req.session.user) {
        return res.redirect('/');
    }
    next();
}
import express from 'express';
import supabase from './database/supabase-client.js';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from "fs";
import 'dotenv/config';
import session from 'express-session';
const app = express();
// Session middleware
app.use(session({
        secret: process.env.SESSION_SECRET || 'your-secret-key',
        resave: false,
        saveUninitialized: false,
        cookie: {
            secure: false, // Set to true if using HTTPS in production
            sameSite: 'lax' // Allows cookies to be sent from LAN IPs
        }
}));
// Config
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// View engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));


// Root route: show login if not logged in, else redirect to /home
app.get('/', (req, res) => {
    if (req.session && req.session.user) {
        return res.redirect('/home');
    }
    res.render('login', { user: req.session.user });
});


// Home page (main page after login)
app.get('/home', (req, res) => {
    if (!req.session || !req.session.user) {
        return res.redirect('/');
    }
    res.render('index', { title: 'Home', user: req.session.user });
});

//modules
app.get('/modules/intro-ai', requireAuth, (req, res) => {
    res.render('modules/intro-ai', { user: req.session.user });
});
app.get('/modules/database', requireAuth, (req, res) => {
    res.render('modules/database', { user: req.session.user });
});
app.get('/modules/differential', requireAuth, (req, res) => {
    res.render('modules/differential', { user: req.session.user });
});
app.get('/modules/statistics', requireAuth, (req, res) => {
    res.render('modules/statistics', { user: req.session.user });
});
app.get('/modules/os', requireAuth, (req, res) => {
    res.render('modules/os', { user: req.session.user });
});
app.get('/modules/architecture', requireAuth, (req, res) => {
    res.render('modules/architecture', { user: req.session.user });
});
app.get('/modules/networking', requireAuth, (req, res) => {
    res.render('modules/networking', { user: req.session.user });
});
app.get('/modules/thermodynamics', requireAuth, (req, res) => {
    res.render('modules/thermodynamics', { user: req.session.user });
});

app.get('/dashboard', requireAuth, (req, res) => {
    (async () => {
        const user = req.session.user;
        // Fetch all modules
        const { data: modules, error: modulesError } = await supabase
            .from('modules')
            .select('*');

        // Fetch user progress for all modules
        const { data: progressRows, error: progressError } = await supabase
            .from('user_progress')
            .select('*')
            .eq('user_id', user.id);

        // Fetch recent quiz attempts (with quiz and module info)
        const { data: attempts, error: attemptsError } = await supabase
            .from('quiz_attempts')
            .select('*, quizzes(title, module_id), modules(display_name, name)')
            .eq('user_id', user.id)
            .order('started_at', { ascending: false })
            .limit(10);

        // Map progress by module_id for quick lookup
        const progressByModule = {};
        (progressRows || []).forEach(row => {
            progressByModule[row.module_id] = row;
        });

        // Compose module progress for all modules (show 0s if no attempts)
        let moduleProgress = (modules || []).map(m => {
            const p = progressByModule[m.id] || {};
            // Calculate progress percent (completed/total)
            const completed = p.quizzes_completed || 0;
            const total = p.total_quizzes || m.total_quizzes || 0;
            const progressPercent = total > 0 ? Math.round((completed / total) * 100) : 0;
            // Format time spent
            let timeSpent = '0m';
            if (p.total_time_spent_seconds) {
                const h = Math.floor(p.total_time_spent_seconds / 3600);
                const m = Math.floor((p.total_time_spent_seconds % 3600) / 60);
                timeSpent = h > 0 ? `${h}h ${m}m` : `${m}m`;
            }
            return {
                id: m.id,
                name: m.display_name,
                code: m.name,
                icon: m.icon || 'fas fa-book',
                progress: progressPercent,
                completedQuizzes: completed,
                totalQuizzes: total,
                averageScore: p.average_score_percentage ? Math.round(p.average_score_percentage) : 0,
                bestScore: p.best_score_percentage ? Math.round(p.best_score_percentage) : 0,
                timeSpent
            };
        });

        // Calculate stats
        const totalQuizzes = (progressRows || []).reduce((sum, p) => sum + (p.quizzes_completed || 0), 0);
        const totalModules = modules ? modules.length : 0;
        const allScores = (progressRows || []).map(p => p.average_score_percentage || 0);
        const averageScore = allScores.length ? Math.round(allScores.reduce((a, b) => a + b, 0) / allScores.length) : 0;
        // Streak logic can be implemented later
        const stats = {
            totalQuizzes,
            averageScore,
            totalModules,
            streak: 0
        };

        // Prepare recentAttempts for EJS
        let recentAttempts = (attempts || []).map(a => ({
            id: a.id,
            quizName: a.quizzes?.title || 'Quiz',
            moduleName: a.modules?.display_name || 'Module',
            score: a.score_percentage || 0,
            scoreClass: a.score_percentage >= 90 ? 'excellent' : a.score_percentage >= 75 ? 'good' : a.score_percentage >= 60 ? 'average' : 'poor',
            duration: a.time_spent_seconds ? `${Math.floor(a.time_spent_seconds/60)}m ${a.time_spent_seconds%60}s` : '',
            date: a.started_at ? a.started_at.split('T')[0] : '',
            quizId: a.quiz_id
        }));

        // Achievements: keep as dummy for now
        let achievements = [];

        res.render('dashboard', {
            user,
            stats,
            modules: moduleProgress,
            recentAttempts,
            achievements
        });
    })();
});


// UPDATED QUIZ ROUTES - Replace your existing quiz routes with these:

// Quiz route - display quiz
app.get("/quiz/:module/:quizId", requireAuth, (req, res) => {
    const { module, quizId } = req.params;
    
    console.log('=== QUIZ DISPLAY DEBUG ===');
    console.log('Module:', module);
    console.log('Quiz ID:', quizId);
    
    // Build the file path with __dirname
    const filePath = path.join(__dirname, 'quizes', module, `${quizId}.json`);
    console.log('Looking for quiz file at:', filePath);
    
    // Check if file exists
    if (!fs.existsSync(filePath)) {
        console.error('Quiz file not found at:', filePath);
        return res.status(404).send("Quiz not found");
    }
    
    try {
        // Read the quiz JSON
        const quizData = JSON.parse(fs.readFileSync(filePath, 'utf8'));
        console.log('Quiz loaded successfully with', quizData.length, 'questions');
        
        // Send or render quiz
        res.render("quize", { 
            quiz: quizData,
            req: req, // Pass req object to template for URL building
            user: req.session.user
        });
    } catch (error) {
        console.error('Error reading quiz file:', error);
        return res.status(500).send("Error loading quiz");
    }
});

// Quiz submission route - handle answers and show results
app.post("/quiz/:module/:quizId/submit", requireAuth, (req, res) => {
    const { module, quizId } = req.params;
    const userAnswers = req.body.answers; 
    const answersArray = req.body.answersArray; // New complete array
    const timeSpent = req.body.timeSpent || "0:00";
    
    // DEBUG: Log the incoming request data
    console.log('=== QUIZ SUBMISSION DEBUG ===');
    console.log('Module:', module);
    console.log('Quiz ID:', quizId);
    console.log('User Answers (traditional):', userAnswers);
    console.log('Answers Array (position-aware):', answersArray);
    console.log('Request Body:', req.body);
    console.log('Time Spent:', timeSpent);
    
    try {
        // Build the file path with __dirname
        const filePath = path.join(__dirname, 'quizes', module, `${quizId}.json`);
        console.log('Looking for quiz file at:', filePath);
        
        // Check if file exists
        if (!fs.existsSync(filePath)) {
            console.error('Quiz file not found at:', filePath);
            return res.status(404).send("Quiz not found");
        }
        
        // Read the quiz JSON
        const quizData = JSON.parse(fs.readFileSync(filePath, 'utf8'));
        console.log('Quiz data loaded successfully');
        console.log('Number of questions:', quizData.length);
        
        // Validate and process answers
        let processedAnswers;
        
        // Prioritize the complete position-aware array if available
        if (answersArray) {
            try {
                processedAnswers = JSON.parse(answersArray);
                console.log('Using position-aware answers array:', processedAnswers);
            } catch (error) {
                console.error('Error parsing answersArray:', error);
                processedAnswers = null;
            }
        }
        
        // Fallback to traditional format if position-aware array not available
        if (!processedAnswers) {
            console.log('Falling back to traditional answer processing');
            if (!userAnswers || typeof userAnswers !== 'object') {
                console.error('Invalid user answers format:', userAnswers);
                return res.status(400).send("Invalid answers format");
            }
            
            // Convert userAnswers object to array if needed
            if (Array.isArray(userAnswers)) {
                processedAnswers = userAnswers;
            } else {
                // Convert object to array (answers[0], answers[1] format)
                processedAnswers = [];
                for (let i = 0; i < quizData.length; i++) {
                    processedAnswers[i] = userAnswers[i] || userAnswers[i.toString()] || -1;
                }
            }
        }
        
        // Ensure processedAnswers has the right length
        while (processedAnswers.length < quizData.length) {
            processedAnswers.push(-1);
        }
        
        console.log('Final processed answers array:', processedAnswers);
        
        // Calculate results
        const results = calculateQuizResults(quizData, processedAnswers, timeSpent);
        console.log('Results calculated:', {
            totalQuestions: results.totalQuestions,
            correctCount: results.correctCount,
            percentage: results.percentage
        });
        
        // --- SUPABASE: Save quiz attempt ---
        // 1. Get user_id (assume req.session.user.id is the UUID from Supabase users table)
        const user_id = req.session.user && req.session.user.id;
        // 2. Prepare attempt data
        const attemptData = {
            user_id: user_id,
            // quiz_id: quizId, // If you have the UUID, use it here
            // For now, you can add module and quizId as extra fields if needed
            total_questions: results.totalQuestions,
            correct_answers: results.correctCount,
            score_percentage: results.percentage,
            grade: results.grade,
            grade_message: results.message,
            time_spent_seconds: (typeof timeSpent === 'string' && timeSpent.includes(':')) ? (parseInt(timeSpent.split(':')[0], 10) * 60 + parseInt(timeSpent.split(':')[1], 10)) : null,
            is_completed: true,
            created_at: new Date().toISOString(),
        };
        // 3. Insert into Supabase
        if (user_id) {
            (async () => {
                const { data, error } = await supabase.from('quiz_attempts').insert([attemptData]);
                if (error) {
                    console.error('Error saving quiz attempt to Supabase:', error);
                } else {
                    console.log('Quiz attempt saved to Supabase:', data);
                }
            })();
        } else {
            console.warn('No user_id found in session, skipping attempt save.');
        }
        // Render results page
        res.render("results", { 
            quiz: {
                title: `${module.charAt(0).toUpperCase() + module.slice(1)} Quiz - ${quizId}`,
                description: `${module.charAt(0).toUpperCase() + module.slice(1)} Quiz Results`
            },
            results: results,
            module: module,
            quizId: quizId,
            user: req.session.user
        });
        
    } catch (error) {
        console.error('Error processing quiz submission:', error);
        console.error('Stack trace:', error.stack);
        res.status(500).send(`Error processing quiz submission: ${error.message}`);
    }
});

// Alternative GET route for results (if you want to access results directly)
app.get("/quiz/:module/:quizId/results", requireAuth, (req, res) => {
    // This could be used to show sample results or redirect to quiz
    res.redirect(`/quiz/${req.params.module}/${req.params.quizId}`);
});

// UPDATED Helper function to calculate quiz results
function calculateQuizResults(quizData, userAnswers, timeSpent) {
    console.log('=== CALCULATING RESULTS ===');
    console.log('Quiz data length:', quizData.length);
    console.log('User answers length:', userAnswers.length);
    console.log('User answers:', userAnswers);
    
    let correctCount = 0;
    let totalQuestions = quizData.length;
    
    // Process each question
    const questionResults = quizData.map((question, index) => {
        console.log(`Processing question ${index + 1}:`, {
            questionText: question.text?.substring(0, 50) + '...',
            userAnswerRaw: userAnswers[index],
            correctAnswer: question.correctAnswer
        });
        
        const userAnswer = userAnswers[index] !== undefined ? parseInt(userAnswers[index]) : -1;
        const correctAnswer = question.correctAnswer;
        const isCorrect = userAnswer === correctAnswer && userAnswer !== -1;
        
        if (isCorrect) {
            correctCount++;
        }
        
        return {
            questionIndex: index,
            id: question.id,
            question: question.text,
            options: question.options,
            userAnswer: userAnswer,
            correctAnswer: correctAnswer,
            isCorrect: isCorrect,
            userAnswerText: userAnswer >= 0 && userAnswer < question.options.length ? 
                           question.options[userAnswer] : "No answer selected",
            correctAnswerText: question.options[correctAnswer],
            explanation: question.explanation || ""
        };
    });
    
    // Calculate percentage
    const percentage = Math.round((correctCount / totalQuestions) * 100);
    
    // Determine grade and message
    let grade = "";
    let message = "";
    
    if (percentage >= 90) {
        grade = "Excellent!";
        message = "Outstanding performance! You've mastered these concepts.";
    } else if (percentage >= 80) {
        grade = "Great Job!";
        message = "Very good understanding of the material.";
    } else if (percentage >= 70) {
        grade = "Good Work!";
        message = "You've shown solid understanding of the concepts.";
    } else if (percentage >= 60) {
        grade = "Fair";
        message = "You have basic understanding, but there's room for improvement.";
    } else {
        grade = "Needs Improvement";
        message = "Consider reviewing the material and trying again.";
    }
    
    const finalResults = {
        totalQuestions: totalQuestions,
        correctCount: correctCount,
        incorrectCount: totalQuestions - correctCount,
        percentage: percentage,
        grade: grade,
        message: message,
        timeSpent: timeSpent,
        questionResults: questionResults
    };
    
    console.log('Final results calculated:', finalResults);
    return finalResults;
}


import authRoutes from './routes/auth.js'; // Note the .js extension, even if the file is .mjs or .js // or './routes/authRoutes'
app.use('/auth', authRoutes);


// Home page (main page after login)
app.get('/home', (req, res) => {
    if (!req.session || !req.session.user) {
        return res.redirect('/');
    }
    res.render('index', { title: 'Home' });
});

app.get('/logout', async (req, res) => {
  await supabase.auth.signOut();
  req.session.destroy(() => {
    res.redirect('/auth/login');
  });
});

// Start server
app.listen(PORT,'0.0.0.0', () => {
  console.log(`Server running at http://localhost:${PORT}`);
});