
        // Quiz Configuration (Replace with your data)
        const quizConfig = {
            questions: [
                {
                    id: 'q1',
                    text: 'What is the primary goal of artificial intelligence?',
                    options: [
                        'To replace human intelligence completely',
                        'To create systems that can perform tasks requiring human intelligence',
                        'To build robots only',
                        'To process data faster than humans'
                    ],
                    correctAnswer: 1
                },
                {
                    id: 'q2',
                    text: 'Which of the following is a type of machine learning?',
                    options: [
                        'Supervised Learning',
                        'Unsupervised Learning',
                        'Reinforcement Learning',
                        'All of the above'
                    ],
                    correctAnswer: 3
                },
                {
                    id: 'q3',
                    text: 'What does GPU stand for in the context of AI computing?',
                    options: [
                        'General Processing Unit',
                        'Graphics Processing Unit',
                        'Global Processing Unit',
                        'Game Processing Unit'
                    ],
                    correctAnswer: 1
                },
                {
                    id: 'q4',
                    text: 'Which algorithm is commonly used for decision making in AI?',
                    options: [
                        'Linear Search',
                        'Bubble Sort',
                        'Decision Tree',
                        'Hash Table'
                    ],
                    correctAnswer: 2
                }
            ],
            totalQuestions: 4,
            title: 'Introduction to AI - Quiz 1',
            estimatedTime: 10
        };

        // Quiz State
        let currentQuestion = 0;
        let selectedOption = null;
        let userAnswers = JSON.parse(localStorage.getItem('quizAnswers') || '{}');
        let score = 0;

        // Initialize quiz
        document.addEventListener('DOMContentLoaded', function() {
            initializeQuiz();
            loadQuestion();
            setupEventListeners();
        });

        function initializeQuiz() {
            // Clear previous quiz data
            localStorage.removeItem('quizAnswers');
            userAnswers = {};
        }

        function setupEventListeners() {
            // Add click listeners to options
            document.querySelectorAll('.option-item').forEach((item, index) => {
                item.addEventListener('click', () => selectOption(index));
            });

            // Add click listeners to buttons
            const nextBtn = document.getElementById('nextBtn');
            const submitBtn = document.getElementById('submitBtn');
            const exitBtn = document.getElementById('exitBtn');
            const backBtn = document.getElementById('backBtn');

            if (nextBtn) {
                nextBtn.addEventListener('click', nextQuestion);
            }
            if (submitBtn) {
                submitBtn.addEventListener('click', submitQuiz);
            }
            if (exitBtn) {
                exitBtn.addEventListener('click', function(e) {
                    e.preventDefault();
                    if (confirmExit()) {
                        exitQuiz();
                    }
                });
            }
            if (backBtn) {
                backBtn.addEventListener('click', function(e) {
                    e.preventDefault();
                    previousQuestion();
                });
            }

            // Keyboard navigation
            document.addEventListener('keydown', handleKeyPress);

            // Prevent accidental page refresh
            window.addEventListener('beforeunload', function(e) {
                if (Object.keys(userAnswers).length > 0) {
                    e.preventDefault();
                    e.returnValue = '';
                }
            });
        }

        function loadQuestion() {
            const question = quizConfig.questions[currentQuestion];
            
            // Update question display
            document.getElementById('questionNumber').textContent = `Question ${currentQuestion + 1}`;
            document.getElementById('questionText').textContent = question.text;
            
            // Update options
            question.options.forEach((option, index) => {
                const optionElement = document.getElementById(`option-${index}`);
                optionElement.querySelector('.option-text').textContent = option;
                optionElement.classList.remove('selected');
            });

            // Update progress
            updateProgress();

            // Load previously selected answer if exists
            const questionId = question.id;
            if (userAnswers[questionId] !== undefined) {
                selectOption(userAnswers[questionId], false);
            } else {
                selectedOption = null;
                document.getElementById('nextBtn').disabled = true;
                const submitBtn = document.getElementById('submitBtn');
                if (submitBtn) submitBtn.disabled = true;
            }

            // Show/hide submit button on last question
            toggleSubmitButton();
        }

        function updateProgress() {
            const progressText = document.getElementById('progressText');
            const progressFill = document.getElementById('progressFill');
            
            progressText.textContent = `Progress: Question ${currentQuestion + 1} of ${quizConfig.totalQuestions}`;
            const percentage = ((currentQuestion + 1) / quizConfig.totalQuestions) * 100;
            progressFill.style.width = `${percentage}%`;
        }

        function toggleSubmitButton() {
            const nextBtn = document.getElementById('nextBtn');
            let submitBtn = document.getElementById('submitBtn');
            
            if (currentQuestion === quizConfig.totalQuestions - 1) {
                // Last question - show submit button
                nextBtn.style.display = 'none';
                
                if (!submitBtn) {
                    submitBtn = document.createElement('button');
                    submitBtn.id = 'submitBtn';
                    submitBtn.className = 'btn-quiz btn-submit';
                    submitBtn.disabled = true;
                    submitBtn.innerHTML = '<i class="fas fa-check"></i>Submit Quiz';
                    submitBtn.addEventListener('click', submitQuiz);
                    nextBtn.parentNode.appendChild(submitBtn);
                } else {
                    submitBtn.style.display = 'inline-flex';
                }
            } else {
                // Not last question - show next button
                nextBtn.style.display = 'inline-flex';
                if (submitBtn) {
                    submitBtn.style.display = 'none';
                }
            }
        }

        function selectOption(optionIndex, animate = true) {
            // Remove previous selection
            document.querySelectorAll('.option-item').forEach(item => {
                item.classList.remove('selected');
            });

            // Select new option
            const selectedElement = document.getElementById(`option-${optionIndex}`);
            selectedElement.classList.add('selected');
            
            if (animate) {
                selectedElement.style.transform = 'scale(0.98)';
                setTimeout(() => {
                    selectedElement.style.transform = 'scale(1)';
                }, 100);
            }

            selectedOption = optionIndex;

            // Save answer
            const questionId = quizConfig.questions[currentQuestion].id;
            userAnswers[questionId] = optionIndex;
            localStorage.setItem('quizAnswers', JSON.stringify(userAnswers));

            // Enable next/submit button
            const nextBtn = document.getElementById('nextBtn');
            const submitBtn = document.getElementById('submitBtn');
            
            if (nextBtn) {
                nextBtn.disabled = false;
            }
            if (submitBtn) {
                submitBtn.disabled = false;
            }
        }

        function nextQuestion() {
            if (selectedOption === null) {
                alert('Please select an answer before proceeding.');
                return;
            }

            // Move to next question
            currentQuestion++;
            
            if (currentQuestion < quizConfig.totalQuestions) {
                selectedOption = null;
                loadQuestion();
                setupEventListeners(); // Re-setup listeners for new options
            } else {
                // Should not happen as submit button should be shown instead
                submitQuiz();
            }
        }

        function previousQuestion() {
            if (currentQuestion > 0) {
                currentQuestion--;
                selectedOption = null;
                loadQuestion();
                setupEventListeners(); // Re-setup listeners for new options
            } else {
                // Go back to quiz list or module page
                if (confirm('Go back to quiz selection?')) {
                    window.location.href = '#'; // Replace with your quiz list URL
                }
            }
        }

        function submitQuiz() {
            if (selectedOption === null) {
                alert('Please select an answer before submitting.');
                return;
            }

            if (confirm('Are you sure you want to submit your quiz? You cannot change your answers after submission.')) {
                // Calculate score
                calculateScore();
                
                // Show results
                showResults();

                // Clear stored answers
                localStorage.removeItem('quizAnswers');
            }
        }

        function calculateScore() {
            score = 0;
            quizConfig.questions.forEach((question, index) => {
                if (userAnswers[question.id] === question.correctAnswer) {
                    score++;
                }
            });
        }

        function showResults() {
            const percentage = Math.round((score / quizConfig.totalQuestions) * 100);
            let message = `Quiz Complete!\n\n`;
            message += `Score: ${score}/${quizConfig.totalQuestions} (${percentage}%)\n\n`;
            
            if (percentage >= 80) {
                message += 'Excellent work! 🎉';
            } else if (percentage >= 60) {
                message += 'Good job! 👍';
            } else {
                message += 'Keep studying! 📚';
            }

            alert(message);
            
            // Redirect to results page or quiz list
            // window.location.href = '/quiz/results'; // Replace with your results URL
        }

        function exitQuiz() {
            localStorage.removeItem('quizAnswers');
            // window.location.href = '/modules'; // Replace with your modules URL
            alert('Quiz exited. You would be redirected to the modules page.');
        }

        function confirmExit() {
            return confirm('Are you sure you want to exit the quiz? Your progress will be lost.');
        }

        function handleKeyPress(e) {
            // Numbers 1-4 to select options
            if (e.key >= '1' && e.key <= '4') {
                const optionIndex = parseInt(e.key) - 1;
                if (optionIndex < quizConfig.questions[currentQuestion].options.length) {
                    selectOption(optionIndex);
                }
            }
            
            // Enter to proceed to next question
            if (e.key === 'Enter' && selectedOption !== null) {
                const nextBtn = document.getElementById('nextBtn');
                const submitBtn = document.getElementById('submitBtn');
                
                if (nextBtn && !nextBtn.disabled && nextBtn.style.display !== 'none') {
                    nextQuestion();
                } else if (submitBtn && !submitBtn.disabled && submitBtn.style.display !== 'none') {
                    submitQuiz();
                }
            }
            
            // Escape to show exit confirmation
            if (e.key === 'Escape') {
                if (confirmExit()) {
                    exitQuiz();
                }
            }

            // Arrow keys for navigation
            if (e.key === 'ArrowLeft' && currentQuestion > 0) {
                previousQuestion();
            }
        }
    