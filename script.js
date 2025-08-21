function createQuizFromDoc() {
  // Change this to your Google Doc ID
  var docId = "1dXpsqFd7XcKvW6NxqCcinxNkugvWEe66hMco7aKYtD8";
  k
  // Open the doc
  var doc = DocumentApp.openById(docId);
  var body = doc.getBody();
  var text = body.getText();
  
  // Split by lines
  var lines = text.split('\n');
  
  // Create a Google Form
  var form = FormApp.create('My Practice Quiz');
  form.setIsQuiz(true);
  form.setAllowResponseEdits(true);
  form.setShowLinkToRespondAgain(true);
  form.setConfirmationMessage("Quiz submitted! You can view your marks and correct answers.");
  
  var currentQuestion = null;
  var correctAnswer = null;
  var options = [];
  
  // Very simple format:
  // Q: Question text
  // A: option (correct one marked with *)
  // Example:
  // Q: What is 2+2?
  // A: 3
  // A: 4*
  // A: 5
  
  lines.forEach(function(line) {
    line = line.trim();
    if (line.startsWith("Q:")) {
      // If a previous question exists, save it
      if (currentQuestion && options.length > 0) {
        addQuestion(form, currentQuestion, options, correctAnswer);
      }
      currentQuestion = line.substring(2).trim();
      options = [];
      correctAnswer = null;
    } else if (line.startsWith("A:")) {
      var ans = line.substring(2).trim();
      if (ans.endsWith("*")) {
        ans = ans.slice(0, -1).trim();
        correctAnswer = ans;
      }
      options.push(ans);
    }
  });
  
  // Add last question
  if (currentQuestion && options.length > 0) {
    addQuestion(form, currentQuestion, options, correctAnswer);
  }
  
  Logger.log("Quiz created: " + form.getEditUrl());
  Logger.log("Take the quiz here: " + form.getPublishedUrl());
}

function addQuestion(form, question, options, correct) {
  var item = form.addMultipleChoiceItem();
  item.setTitle(question)
      .setChoiceValues(options)
      .showOtherOption(false);
  
  // Mark correct answer
  var feedback = FormApp.createFeedback().setText("Review the correct answer.").build();
  var choices = options.map(opt => item.createChoice(opt, opt === correct));
  item.setChoices(choices);
  item.setPoints(1);
  item.setFeedbackForIncorrect(feedback);
}
