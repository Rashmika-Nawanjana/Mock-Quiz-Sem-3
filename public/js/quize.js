// Quiz State - Using in-memory storage instead of localStorage
let currentQuestion = 0;
let selectedOption = null;
let userAnswers = {}; // Store answers in memory
let score = 0;
let quizData = null;
let startTime = null;

// Initialize quiz when page loads
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM loaded, initializing quiz...');
    
    // Record start time for quiz duration
    startTime = new Date();
    
    initializeQuizData();
    
    if (!quizData || !quizData.questions || quizData.questions.length === 0) {
        console.error('Quiz data not found or invalid');
        return;
    }
    
    console.log('Quiz data loaded:', quizData);
    initializeQuiz();
    setupEventListeners();
    
    // Load the first question
    loadQuestion();
});

// Initialize quiz data - Now expects all questions to be loaded
function initializeQuizData() {
    // Method 1: Try global quiz variable (full quiz array) - PREFERRED
    if (typeof quiz !== 'undefined' && quiz && Array.isArray(quiz)) {
        quizData = {
            totalQuestions: quiz.length,
            questions: quiz,
            isMultiQuestionPage: true
        };
        console.log('Quiz data loaded from global variable - full quiz array:', quizData);
        return;
    }
    
    // Method 2: If you need to fetch all questions via AJAX
    // fetchAllQuestions();
    
    // Method 3: Fallback - single question (not recommended for dynamic navigation)
    const questionText = document.querySelector('.question-text');
    const optionElements = document.querySelectorAll('.option-text');
    
    if (questionText && optionElements.length > 0) {
        console.warn('Only single question found. Dynamic navigation requires all questions to be loaded.');
        quizData = {
            totalQuestions: 1,
            questions: [{
                id: 1,
                text: questionText.textContent.trim(),
                options: Array.from(optionElements).map(el => el.textContent.trim()),
                correctAnswer: 0 // This should come from your server
            }],
            isMultiQuestionPage: false
        };
        console.log('Single question fallback:', quizData);
        return;
    }
    
    console.error('Could not initialize quiz data');
}

// Fetch all questions via AJAX (if needed)
function fetchAllQuestions() {
    // Example AJAX call - adjust URL and handling based on your backend
    fetch('/api/quiz/questions')
        .then(response => response.json())
        .then(data => {
            quizData = {
                totalQuestions: data.length,
                questions: data,
                isMultiQuestionPage: true
            };
            console.log('Questions fetched via AJAX:', quizData);
            loadQuestion();
        })
        .catch(error => {
            console.error('Error fetching questions:', error);
        });
}

function initializeQuiz() {
    currentQuestion = 0;
    selectedOption = null;
    userAnswers = {};
    score = 0;
    console.log('Quiz state initialized');
}

// Setup event listeners
function setupEventListeners() {
    console.log('Setting up event listeners...');
    
    const optionsContainer = document.querySelector('.options-container');
    
    if (optionsContainer) {
        // Add click listener to container for event delegation
        optionsContainer.addEventListener('click', function(e) {
            console.log('Click detected on:', e.target);
            
            // Find the option item
            let optionItem = e.target.closest('.option-item');
            
            if (!optionItem) {
                console.log('No option item found');
                return;
            }
            
            const optionIndex = parseInt(optionItem.dataset.option);
            console.log('Option index:', optionIndex);
            
            if (!isNaN(optionIndex)) {
                selectOption(optionIndex);
            }
        });
        
        console.log('Event listeners attached to options container');
    }

    // Button event listeners
    setupButtonListeners();
    
    // Keyboard navigation
    document.addEventListener('keydown', handleKeyPress);
    
    console.log('All event listeners set up');
}

function setupButtonListeners() {
    const nextBtn = document.getElementById('nextBtn');
    const submitBtn = document.getElementById('submitBtn');
    const exitBtn = document.getElementById('exitBtn');
    const backBtn = document.getElementById('backBtn');
    
    if (nextBtn) {
        nextBtn.addEventListener('click', function(e) {
            e.preventDefault();
            console.log('Next button clicked');
            nextQuestion();
        });
    }
    
    if (submitBtn) {
        submitBtn.addEventListener('click', function(e) {
            e.preventDefault();
            console.log('Submit button clicked');
            submitQuiz();
        });
    }
    
    if (exitBtn) {
        exitBtn.addEventListener('click', function(e) {
            e.preventDefault();
            console.log('Exit button clicked');
            if (confirmExit()) {
                exitQuiz();
            }
        });
    }
    
    if (backBtn) {
        backBtn.addEventListener('click', function(e) {
            e.preventDefault();
            console.log('Back button clicked');
            previousQuestion();
        });
    }
}

// Select an option
function selectOption(optionIndex) {
    console.log('selectOption called with index:', optionIndex);
    
    // Remove previous selections
    document.querySelectorAll('.option-item').forEach(item => {
        item.classList.remove('selected');
    });

    // Select new option
    const selectedElement = document.getElementById(`option-${optionIndex}`);
    if (!selectedElement) {
        console.error('Could not find option element:', `option-${optionIndex}`);
        return;
    }
    
    selectedElement.classList.add('selected');
    console.log('Added selected class to:', selectedElement);

    // Animation effect
    selectedElement.style.transform = 'scale(0.98)';
    setTimeout(() => {
        selectedElement.style.transform = 'scale(1)';
    }, 100);

    selectedOption = optionIndex;
    
    // Store answer for current question
    const question = quizData.questions[currentQuestion];
    const questionId = question.id || (currentQuestion + 1);
    userAnswers[questionId] = optionIndex;
    
    console.log('Answer stored for question', questionId, ':', optionIndex);

    // Enable next/submit button
    updateNavigationButtons();
}

// Navigate to next question
function nextQuestion() {
    console.log('nextQuestion called, current:', currentQuestion);
    
    if (selectedOption === null) {
        alert('Please select an answer before proceeding.');
        return;
    }

    // Store current answer (already done in selectOption, but double-check)
    const question = quizData.questions[currentQuestion];
    const questionId = question.id || (currentQuestion + 1);
    userAnswers[questionId] = selectedOption;
    
    console.log('Moving to next question. Current answers:', userAnswers);

    // Move to next question
    if (currentQuestion < quizData.totalQuestions - 1) {
        currentQuestion++;
        loadQuestion();
        console.log('Loaded question:', currentQuestion + 1);
    } else {
        console.log('Last question reached, ready to submit');
        // Already on last question, submit button should be visible
    }
}

// Navigate to previous question
function previousQuestion() {
    console.log('previousQuestion called, current:', currentQuestion);
    
    if (currentQuestion > 0) {
        currentQuestion--;
        loadQuestion();
        console.log('Loaded previous question:', currentQuestion + 1);
    } else {
        if (confirm('Go back to quiz selection?')) {
            window.location.href = '/';
        }
    }
}

// Load current question dynamically
function loadQuestion() {
    if (!quizData.questions || currentQuestion >= quizData.questions.length) {
        console.error('Invalid question data or index');
        return;
    }

    const question = quizData.questions[currentQuestion];
    console.log('Loading question:', currentQuestion + 1, question);
    
    // Update question number and text
    const questionNumberEl = document.querySelector('.question-number');
    const questionTextEl = document.querySelector('.question-text');
    
    if (questionNumberEl) {
        questionNumberEl.textContent = `Question ${currentQuestion + 1}`;
    }
    
    if (questionTextEl) {
        questionTextEl.textContent = question.text;
    }

    // Update options
    const optionsContainer = document.querySelector('.options-container');
    if (optionsContainer && question.options) {
        optionsContainer.innerHTML = '';
        
        question.options.forEach((option, index) => {
            const div = document.createElement('div');
            div.className = 'option-item';
            div.dataset.option = index;
            div.id = `option-${index}`;
            div.innerHTML = `
                <span class="option-label">${String.fromCharCode(65 + index)}.</span>
                <span class="option-text">${option}</span>
            `;
            optionsContainer.appendChild(div);
        });
    }

    // Reset selection state
    selectedOption = null;

    // Load previous answer if exists and highlight it
    const questionId = question.id || (currentQuestion + 1);
    if (userAnswers[questionId] !== undefined) {
        const previousAnswer = userAnswers[questionId];
        console.log('Found previous answer for question', questionId, ':', previousAnswer);
        selectOption(previousAnswer);
    }

    // Update progress and navigation
    updateProgress();
    updateNavigationButtons();
    
    // Scroll to top of question
    const questionContainer = document.querySelector('.question-container') || document.querySelector('.quiz-container');
    if (questionContainer) {
        questionContainer.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
}

// Update progress bar
function updateProgress() {
    const progressText = document.getElementById('progressText');
    const progressFill = document.getElementById('progressFill');
    
    if (progressText) {
        progressText.textContent = `Question ${currentQuestion + 1} of ${quizData.totalQuestions}`;
    }
    
    if (progressFill) {
        const percentage = ((currentQuestion + 1) / quizData.totalQuestions) * 100;
        progressFill.style.width = `${percentage}%`;
    }
}

// Update navigation buttons based on current state
function updateNavigationButtons() {
    const nextBtn = document.getElementById('nextBtn');
    const submitBtn = document.getElementById('submitBtn');
    const backBtn = document.getElementById('backBtn');
    
    const isLastQuestion = currentQuestion === quizData.totalQuestions - 1;
    const isFirstQuestion = currentQuestion === 0;
    const hasSelectedOption = selectedOption !== null;
    
    // Back button
    if (backBtn) {
        backBtn.disabled = isFirstQuestion;
        backBtn.style.display = 'inline-flex';
    }
    
    // Next/Submit button logic
    if (isLastQuestion) {
        // Last question - show submit button
        if (nextBtn) nextBtn.style.display = 'none';
        
        if (!submitBtn) {
            // Create submit button if it doesn't exist
            const submitBtn = document.createElement('button');
            submitBtn.id = 'submitBtn';
            submitBtn.className = 'btn-quiz btn-submit';
            submitBtn.innerHTML = '<i class="fas fa-check"></i>Submit Quiz';
            submitBtn.addEventListener('click', function(e) {
                e.preventDefault();
                submitQuiz();
            });
            
            if (nextBtn && nextBtn.parentNode) {
                nextBtn.parentNode.appendChild(submitBtn);
            }
        } else {
            submitBtn.style.display = 'inline-flex';
        }
        
        if (submitBtn) {
            submitBtn.disabled = !hasSelectedOption;
        }
    } else {
        // Not last question - show next button
        if (nextBtn) {
            nextBtn.style.display = 'inline-flex';
            nextBtn.disabled = !hasSelectedOption;
        }
        if (submitBtn) {
            submitBtn.style.display = 'none';
        }
    }
    
    console.log('Navigation updated - Question:', currentQuestion + 1, 'Selected:', hasSelectedOption, 'Last:', isLastQuestion);
}

// Submit quiz - Updated to send to results page
function submitQuiz() {
    if (selectedOption === null) {
        alert('Please select an answer before submitting.');
        return;
    }

    if (!confirm('Are you sure you want to submit your quiz? You cannot change your answers after submission.')) {
        return;
    }

    // Store final answer
    const question = quizData.questions[currentQuestion];
    const questionId = question.id || (currentQuestion + 1);
    userAnswers[questionId] = selectedOption;

    console.log('Final answers:', userAnswers);
    
    // Calculate time spent
    const endTime = new Date();
    const timeSpentMs = endTime - startTime;
    const timeSpentMinutes = Math.floor(timeSpentMs / 60000);
    const timeSpentSeconds = Math.floor((timeSpentMs % 60000) / 1000);
    const timeSpentFormatted = `${timeSpentMinutes.toString().padStart(2, '0')}:${timeSpentSeconds.toString().padStart(2, '0')}`;
    
    // Prepare answers array in the correct order
    const answersArray = [];
    for (let i = 0; i < quizData.totalQuestions; i++) {
        const question = quizData.questions[i];
        const questionId = question.id || (i + 1);
        const answer = userAnswers[questionId];
        answersArray[i] = answer !== undefined ? answer : null;
    }
    
    console.log('Prepared answers array:', answersArray);
    console.log('Time spent:', timeSpentFormatted);
    
    // Submit to results page
    submitToResultsPage(answersArray, timeSpentFormatted);
}

// Submit quiz data to results page
function submitToResultsPage(answersArray, timeSpent) {
    // Get current URL to extract module and quizId
    const currentPath = window.location.pathname;
    const pathParts = currentPath.split('/');
    
    // Extract module and quizId from URL (e.g., /quiz/os/1)
    let module = 'os'; // default
    let quizId = '1';   // default
    
    if (pathParts.length >= 4) {
        module = pathParts[2];
        quizId = pathParts[3];
    }
    
    console.log('Submitting to:', `/quiz/${module}/${quizId}/submit`);
    console.log('Module:', module, 'QuizId:', quizId);
    
    // Create a form and submit it
    const form = document.createElement('form');
    form.method = 'POST';
    form.action = `/quiz/${module}/${quizId}/submit`;
    form.style.display = 'none';
    
    // Add answers as form fields
    answersArray.forEach((answer, index) => {
        const input = document.createElement('input');
        input.type = 'hidden';
        input.name = `answers[${index}]`;
        input.value = answer !== null ? answer : '';
        form.appendChild(input);
    });
    
    // Add time spent
    const timeInput = document.createElement('input');
    timeInput.type = 'hidden';
    timeInput.name = 'timeSpent';
    timeInput.value = timeSpent;
    form.appendChild(timeInput);
    
    // Add to document and submit
    document.body.appendChild(form);
    
    console.log('Submitting form with data:', {
        answers: answersArray,
        timeSpent: timeSpent,
        action: form.action
    });
    
    form.submit();
}

// Calculate final score (now used for client-side validation only)
function calculateScore() {
    score = 0;
    
    quizData.questions.forEach((question, index) => {
        const questionId = question.id || (index + 1);
        const userAnswer = userAnswers[questionId];
        const correctAnswer = question.correctAnswer;
        
        if (userAnswer === correctAnswer) {
            score++;
        }
    });
    
    console.log('Quiz completed. Score:', score, '/', quizData.totalQuestions);
}

// Show results (deprecated - now handled by server)
function showResults() {
    const percentage = Math.round((score / quizData.totalQuestions) * 100);
    let message = `Quiz Complete!\n\nYour Score: ${score}/${quizData.totalQuestions} (${percentage}%)\n\n`;
    
    if (percentage >= 80) {
        message += 'Excellent work! 🎉 You have a great understanding of the material.';
    } else if (percentage >= 60) {
        message += 'Good job! 👍 You have a solid grasp of most concepts.';
    } else {
        message += 'Keep studying! 📚 Review the material and try again.';
    }
    
    alert(message);
    
    // This is now handled by server redirect to results page
}

// Exit quiz
function exitQuiz() {
    window.location.href = '/';
}

// Confirm exit
function confirmExit() {
    return confirm('Are you sure you want to exit the quiz? Your progress will be lost.');
}

// Handle keyboard navigation
function handleKeyPress(e) {
    // Number keys 1-4 for option selection
    if (e.key >= '1' && e.key <= '4') {
        const index = parseInt(e.key) - 1;
        const currentQ = quizData.questions[currentQuestion];
        if (currentQ && index < currentQ.options.length) {
            selectOption(index);
        }
    }
    
    // Enter key for next/submit
    if (e.key === 'Enter' && selectedOption !== null) {
        const nextBtn = document.getElementById('nextBtn');
        const submitBtn = document.getElementById('submitBtn');
        
        if (nextBtn && nextBtn.style.display !== 'none' && !nextBtn.disabled) {
            nextQuestion();
        } else if (submitBtn && submitBtn.style.display !== 'none' && !submitBtn.disabled) {
            submitQuiz();
        }
    }
    
    // Escape key for exit
    if (e.key === 'Escape') {
        if (confirmExit()) {
            exitQuiz();
        }
    }
    
    // Arrow keys for navigation
    if (e.key === 'ArrowLeft' && currentQuestion > 0) {
        previousQuestion();
    }
    
    if (e.key === 'ArrowRight' && selectedOption !== null) {
        if (currentQuestion < quizData.totalQuestions - 1) {
            nextQuestion();
        }
    }
}

// Additional utility functions

// Get quiz progress as percentage
function getProgress() {
    return {
        current: currentQuestion + 1,
        total: quizData.totalQuestions,
        percentage: Math.round(((currentQuestion + 1) / quizData.totalQuestions) * 100),
        answered: Object.keys(userAnswers).length
    };
}

// Jump to specific question (optional feature)
function jumpToQuestion(questionNumber) {
    const questionIndex = questionNumber - 1;
    if (questionIndex >= 0 && questionIndex < quizData.totalQuestions) {
        currentQuestion = questionIndex;
        loadQuestion();
        console.log('Jumped to question:', questionNumber);
    }
}

// Review mode - show all questions with answers (optional)
function enterReviewMode() {
    // This could be implemented to show a summary of all questions and answers
    console.log('Review mode - Current answers:', userAnswers);
}