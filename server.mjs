import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';


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




// Start server
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});

