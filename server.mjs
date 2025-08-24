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

app.get("/quiz/:module/:quizId", (req, res) => {
    const { module, quizId } = req.params;

    // Build the file path
    const filePath = path.join('quizes', module, `${quizId}.json`);

    // Check if file exists
    if (!fs.existsSync(filePath)) {
        return res.status(404).send("Quiz not found");
    }

    // Read the quiz JSON
    const quizData = JSON.parse(fs.readFileSync(filePath, 'utf8'));

    // Send or render quiz
   res.render("quize", { quiz: quizData});
});


// app.get('/quize', (req, res) => {
//   res.render('quize', { title: 'Quize' }); 
// }); 

// Start server
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});

