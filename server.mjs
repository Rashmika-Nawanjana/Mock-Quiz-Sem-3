// Middleware: inject session user into res.locals for all routes

// Leaderboard route (protected)


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

app.use((req, res, next) => {
    res.locals.user = req.session && req.session.user ? req.session.user : null;
    next();
});
// Root route: show login if not logged in, else redirect to /home
app.get('/', (req, res) => {
    if (req.session && req.session.user) {
        return res.redirect('/home');
    }
    res.render('login', { user: req.session.user });
});



app.get('/leaderboard', requireAuth, async (req, res) => {
    // Get all users
    const { data: allUsers, error: usersError } = await supabase
        .from('users')
        .select('id, full_name, username, avatar_url');

    // Get all quiz attempts (first attempt per user per quiz)
    const { data: allAttempts, error: attemptsError } = await supabase
        .from('quiz_attempts')
        .select('id, user_id, quiz_id, score_percentage, time_spent_seconds, started_at')
        .order('started_at', { ascending: true });

    // For each user, for each quiz, keep only the first attempt
    const firstAttemptsMap = {};
    (allAttempts || []).forEach(a => {
        const key = a.user_id + '|' + a.quiz_id;
        if (!firstAttemptsMap[key]) {
            firstAttemptsMap[key] = a;
        }
    });

    // Aggregate: for each user, sum marks, time spent, quizzes completed, average score, last active
    const leaderboardMap = {};
    Object.values(firstAttemptsMap).forEach(a => {
        if (!leaderboardMap[a.user_id]) {
            leaderboardMap[a.user_id] = {
                marks: 0,
                time: 0,
                quizzes_completed: 0,
                scores: [],
                last_active: null
            };
        }
        leaderboardMap[a.user_id].marks += a.score_percentage || 0;
        leaderboardMap[a.user_id].time += a.time_spent_seconds || 0;
        leaderboardMap[a.user_id].quizzes_completed += 1;
        leaderboardMap[a.user_id].scores.push(a.score_percentage || 0);
        // Track most recent attempt
        if (!leaderboardMap[a.user_id].last_active || new Date(a.started_at) > new Date(leaderboardMap[a.user_id].last_active)) {
            leaderboardMap[a.user_id].last_active = a.started_at;
        }
    });

    // Build leaderboard array with user info
    // Optimize avatar URL: use public URL if possible, else fallback to default
    const getAvatarUrl = (avatar_url) => {
        if (!avatar_url) return '/images/avatar.jpg';
        // If already a public URL, return as is
        if (avatar_url.startsWith('http')) return avatar_url;
        // If using Supabase Storage, construct public URL (adjust bucket name if needed)
        const supabaseUrl = process.env.SUPABASE_URL;
        // Example: avatars bucket
        return `${supabaseUrl}/storage/v1/object/public/avatars/${avatar_url}`;
    };

    const leaderboard = (allUsers || []).map(u => {
        const userStats = leaderboardMap[u.id] || {};
        // Calculate average score
        let avgScore = 0;
        if (userStats.scores && userStats.scores.length > 0) {
            avgScore = userStats.scores.reduce((a, b) => a + b, 0) / userStats.scores.length;
        }
        // Calculate last active (hours ago)
        let lastActive = '';
        let lastActiveHours = undefined;
        if (userStats.last_active) {
            const last = new Date(userStats.last_active);
            const now = new Date();
            const diffMs = now - last;
            lastActiveHours = diffMs / (1000 * 60 * 60);
            if (lastActiveHours < 1) lastActive = 'Just now';
            else if (lastActiveHours < 24) lastActive = Math.floor(lastActiveHours) + ' hours ago';
            else lastActive = Math.floor(lastActiveHours / 24) + ' days ago';
        }
        return {
            user_id: u.id,
            name: u.full_name || u.username || 'User',
            avatar: getAvatarUrl(u.avatar_url),
            marks: userStats.marks || 0,
            time: userStats.time || 0,
            quizzes_completed: userStats.quizzes_completed || 0,
            average_score: avgScore ? avgScore.toFixed(1) : 0,
            last_active: lastActive,
            last_active_hours: lastActiveHours
        };
    });

    // Sort by marks descending, then time ascending
    leaderboard.sort((a, b) => b.marks - a.marks || a.time - b.time);

    res.render('leaderboard', {
        user: req.session.user,
        leaderboard
    });
});

// Review route: renders results page from review_json
app.get('/review/:attemptId', async (req, res) => {
    const { attemptId } = req.params;
    try {
        // Fetch the quiz attempt by ID, join quizzes to get quiz title
        const { data, error } = await supabase
            .from('quiz_attempts')
            .select('review_json, quiz_id, quizzes(title)')
            .eq('id', attemptId)
            .single();
        if (error || !data) {
            return res.status(404).send('Attempt not found');
        }
        // Parse the review_json
        let review;
        try {
            review = typeof data.review_json === 'string' ? JSON.parse(data.review_json) : data.review_json;
        } catch (e) {
            return res.status(500).send('Corrupted review data');
        }
        // Render the results page with quiz title
        const quizTitle = data.quizzes?.title || 'Quiz';
        res.render('results', {
            quiz: {
                title: `${quizTitle}`,
                description: `${quizTitle} Results`
            },
            results: review,
            module: '',
            quizId: data.quiz_id,
            user: req.session.user
        });
    } catch (err) {
        console.error('Error fetching review:', err);
        res.status(500).send('Server error');
    }
});
// Dashboard route (protected)

// Auth middleware to protect routes
function requireAuth(req, res, next) {
    if (!req.session || !req.session.user) {
        return res.redirect('/');
    }
    next();
}
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
    // (No groupedRecentAttempts or attempts in this outer scope)
    (async () => {
    const user = req.session.user;
    console.log('Dashboard user:', user);
        // Fetch all modules
        const { data: modules, error: modulesError } = await supabase
            .from('modules')
            .select('*');

        // Ensure user_progress is up to date for each module
        if (modules && modules.length) {
            for (const m of modules) {
                await supabase.rpc('update_user_progress', {
                    user_uuid: user.id,
                    module_uuid: m.id
                });
            }
        }

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
            .order('started_at', { ascending: false });

        // Fetch all attempts for the user (for card display)
        const { data: userAttempts, error: userAttemptsError } = await supabase
            .from('quiz_attempts')
            .select('*')
            .eq('user_id', user.id)
            .order('started_at', { ascending: false });

        // (Removed duplicate groupedRecentAttempts logic; only one block remains below)

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

        // Prepare groupedRecentAttempts for EJS
        let groupedRecentAttempts = {};
        (attempts || []).forEach((a, idx) => {
            const moduleKey = a.modules?.name || 'unknown';
            const quizKey = a.quiz_id;
            const groupKey = `${moduleKey}__${quizKey}`;
            if (!groupedRecentAttempts[groupKey]) {
                groupedRecentAttempts[groupKey] = {
                    module: moduleKey,
                    moduleName: a.modules?.display_name || 'Module',
                    quizNumber: quizKey,
                    quizName: a.quizzes?.title || 'Quiz',
                    attempts: []
                };
            }
            groupedRecentAttempts[groupKey].attempts.push({
                id: a.id,
                attemptNumber: groupedRecentAttempts[groupKey].attempts.length + 1,
                date: a.started_at ? a.started_at.split('T')[0] : '',
                marks: a.score_percentage || 0,
                scoreClass: a.score_percentage >= 90 ? 'excellent' : a.score_percentage >= 75 ? 'good' : a.score_percentage >= 60 ? 'average' : 'poor',
                duration: a.time_spent_seconds ? `${Math.floor(a.time_spent_seconds/60)}m ${a.time_spent_seconds%60}s` : '',
                quizId: a.quiz_id,
                attemptId: a.id // for review button
            });
        });
        // Convert to array for easier EJS iteration
        groupedRecentAttempts = Object.values(groupedRecentAttempts);

        // Achievements: keep as dummy for now
        let achievements = [];

        // --- USER ANALYTICS ---
        // User's overall stats from user_progress
        const userAnalytics = {
            totalQuizzes: (progressRows || []).reduce((sum, p) => sum + (p.quizzes_completed || 0), 0),
            totalTime: (progressRows || []).reduce((sum, p) => sum + (p.total_time_spent_seconds || 0), 0),
            avgScore: (progressRows || []).length ? Math.round((progressRows.reduce((a, p) => a + (p.average_score_percentage || 0), 0)) / progressRows.length) : 0,
            bestScore: (progressRows || []).reduce((max, p) => Math.max(max, p.best_score_percentage || 0), 0)
        };

        // --- MODULE ANALYTICS ---
        // For each module, get average and best score across all users
        const { data: allProgress, error: allProgressError } = await supabase
            .from('user_progress')
            .select('*');
        const moduleAnalytics = (modules || []).map(m => {
            const allForModule = (allProgress || []).filter(p => p.module_id === m.id);
            const avgScore = allForModule.length ? Math.round(allForModule.reduce((a, p) => a + (p.average_score_percentage || 0), 0) / allForModule.length) : 0;
            const bestScore = allForModule.length ? Math.round(Math.max(...allForModule.map(p => p.best_score_percentage || 0))) : 0;
            const totalAttempts = allForModule.reduce((a, p) => a + (p.total_attempts || 0), 0);
            return {
                module: m.display_name,
                avgScore,
                bestScore,
                totalAttempts
            };
        });

        res.render('dashboard', {
            user,
            stats,
            modules: moduleProgress,
            groupedRecentAttempts,
            achievements,
            userAttempts,
            userAnalytics,
            moduleAnalytics
        });
    })();
});


// UPDATED QUIZ ROUTES - Replace your existing quiz routes with these:

// Quiz route - display quiz
app.get("/quiz/:module/:quizId", requireAuth, (req, res) => {
    const { module: moduleName, quizId } = req.params;

    console.log('=== QUIZ DISPLAY DEBUG ===');
    console.log('Module:', moduleName);
    console.log('Quiz ID:', quizId);

    // Build the file path with __dirname
    const filePath = path.join(__dirname, 'quizes', moduleName, `${quizId}.json`);
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
// ... (rest of your setup code above is unchanged) ...

app.post("/quiz/:module/:quizId/submit", requireAuth, async (req, res) => {
    const { module: moduleName, quizId } = req.params;
    const user_id = req.session.user && req.session.user.id;
    // Compose a unique quiz key for this module/quiz
    const quiz_key = `${moduleName}/${quizId}`;

    // Check previous attempts for this user and quiz
    const { data: prevAttempts, error: prevAttemptsError } = await supabase
        .from('quiz_attempts')
        .select('id')
        .eq('user_id', user_id)
        .eq('quiz_key', quiz_key)
        .not('quiz_key', 'is', null);
    const attempt_number = prevAttempts && prevAttempts.length ? prevAttempts.length + 1 : 1;
    // Always use the position-aware answersArray hidden field for grading
    const rawAnswers = req.body.answersArray || req.body.answers;
    const timeSpent = req.body.timeSpent || "0:00";

    // Parse answers array
    let answersArray = [];
    if (typeof rawAnswers === 'string') {
        try {
            answersArray = JSON.parse(rawAnswers);
        } catch {
            answersArray = Object.values(rawAnswers);
        }
    } else if (Array.isArray(rawAnswers)) {
        answersArray = rawAnswers;
    } else if (typeof rawAnswers === 'object') {
        answersArray = Object.values(rawAnswers);
    }

    // Load quiz data from JSON file
    const filePath = path.join(__dirname, 'quizes', moduleName, `${quizId}.json`);
    if (!fs.existsSync(filePath)) {
        return res.status(404).send("Quiz not found");
    }
    const quizData = JSON.parse(fs.readFileSync(filePath, 'utf8'));


    // -- Find module UUID from module name
    const { data: moduleRow, error: moduleError } = await supabase
        .from('modules')
        .select('id')
        .eq('name', moduleName)
        .single();
    if (moduleError || !moduleRow) {
        console.error("Module lookup failed:", moduleError);
        return res.status(500).send("Module lookup failed");
    }
    const module_id = moduleRow.id;

    // -- Find real quiz UUID from DB using module_id
    const { data: quizRow, error: quizRowError } = await supabase
        .from('quizzes')
        .select('id, module_id')
        .eq('module_id', module_id)
        .eq('quiz_number', quizId)
        .single();
    if (quizRowError || !quizRow) {
        console.error("Quiz lookup failed:", quizRowError);
        return res.status(500).send("Quiz lookup failed");
    }
    const quiz_uuid = quizRow.id;

    // -- Calculate results using quizData and answersArray only
    const results = calculateQuizResults(quizData, answersArray, timeSpent);
    const totalQuestions = results.totalQuestions;
    const correctCount = results.correctCount;
    const percentage = results.percentage;

    // -- Insert attempt (quiz_id as UUID)
    const attemptInsert = {
        user_id,
        quiz_id: quiz_uuid,
        quiz_key,
        attempt_number,
        total_questions: totalQuestions,
        correct_answers: correctCount,
        score_percentage: percentage,
        is_completed: true,
        time_spent_seconds: (typeof timeSpent === 'string' && timeSpent.includes(':')) ? (parseInt(timeSpent.split(':')[0], 10) * 60 + parseInt(timeSpent.split(':')[1], 10)) : null,
        created_at: new Date().toISOString(),
        review_json: results
    };
    const { data: attemptRows, error: attemptError } = await supabase
        .from('quiz_attempts')
        .insert([attemptInsert])
        .select();
    if (attemptError || !attemptRows || !attemptRows[0]) {
        console.error('Quiz attempt insert error:', attemptError);
        return res.status(500).send("Could not save attempt");
    }

    // -- Render results
    res.render("results", {
        quiz: {
            title: `${moduleName.charAt(0).toUpperCase() + moduleName.slice(1)} Quiz - ${quizId}`,
            description: `${moduleName.charAt(0).toUpperCase() + moduleName.slice(1)} Quiz Results`
        },
        results,
        module: moduleName,
        quizId,
        user: req.session.user
    });
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
        res.redirect('/');
    });
});

// Start server
app.listen(PORT,'0.0.0.0', () => {
  console.log(`Server running at http://localhost:${PORT}`);
});