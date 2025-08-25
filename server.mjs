import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from "fs";

// Config
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// View engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.get('/', (req, res) => {
  res.render('index', { title: 'Home' });
});

//modules
app.get('/modules/intro-ai', (req, res) => {
  res.render('modules/intro-ai');
});
app.get('/modules/database', (req, res) => {
  res.render('modules/database');
});
app.get('/modules/differential', (req, res) => {
  res.render('modules/differential');
});
app.get('/modules/statistics', (req, res) => {
  res.render('modules/statistics');
});
app.get('/modules/os', (req, res) => {
  res.render('modules/os');
});
app.get('/modules/architecture', (req, res) => {
  res.render('modules/architecture');
});
app.get('/modules/networking', (req, res) => {
  res.render('modules/networking');
});
app.get('/modules/thermodynamics', (req, res) => {
  res.render('modules/thermodynamics');
});

// UPDATED QUIZ ROUTES - Replace your existing quiz routes with these:

// Quiz route - display quiz
app.get("/quiz/:module/:quizId", (req, res) => {
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
            req: req // Pass req object to template for URL building
        });
    } catch (error) {
        console.error('Error reading quiz file:', error);
        return res.status(500).send("Error loading quiz");
    }
});

// Quiz submission route - handle answers and show results
app.post("/quiz/:module/:quizId/submit", (req, res) => {
    const { module, quizId } = req.params;
    const userAnswers = req.body.answers; 
    const timeSpent = req.body.timeSpent || "0:00";
    
    // DEBUG: Log the incoming request data
    console.log('=== QUIZ SUBMISSION DEBUG ===');
    console.log('Module:', module);
    console.log('Quiz ID:', quizId);
    console.log('User Answers:', userAnswers);
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
        
        // Validate userAnswers
        if (!userAnswers || typeof userAnswers !== 'object') {
            console.error('Invalid user answers format:', userAnswers);
            return res.status(400).send("Invalid answers format");
        }
        
        // Convert userAnswers object to array if needed
        let answersArray;
        if (Array.isArray(userAnswers)) {
            answersArray = userAnswers;
        } else {
            // Convert object to array (answers[0], answers[1] format)
            answersArray = [];
            for (let i = 0; i < quizData.length; i++) {
                answersArray[i] = userAnswers[i] || userAnswers[i.toString()] || -1;
            }
        }
        
        console.log('Processed answers array:', answersArray);
        
        // Calculate results
        const results = calculateQuizResults(quizData, answersArray, timeSpent);
        console.log('Results calculated:', {
            totalQuestions: results.totalQuestions,
            correctCount: results.correctCount,
            percentage: results.percentage
        });
        
        // Render results page
        res.render("results", { 
            quiz: {
                title: `${module.charAt(0).toUpperCase() + module.slice(1)} Quiz - ${quizId}`,
                description: `${module.charAt(0).toUpperCase() + module.slice(1)} Quiz Results`
            },
            results: results,
            module: module,
            quizId: quizId
        });
        
    } catch (error) {
        console.error('Error processing quiz submission:', error);
        console.error('Stack trace:', error.stack);
        res.status(500).send(`Error processing quiz submission: ${error.message}`);
    }
});

// Alternative GET route for results (if you want to access results directly)
app.get("/quiz/:module/:quizId/results", (req, res) => {
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

// Start server
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});