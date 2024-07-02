document.addEventListener('DOMContentLoaded', function() {
    const startButton1 = document.getElementById('start1');
    const startButton2 = document.getElementById('start2');
    const startButton3 = document.getElementById('start3');
    const startButton4 = document.getElementById('start4');
    const startButton5 = document.getElementById('start5');
    const suspendButton = document.getElementById('suspend');
    const resumeButton = document.getElementById('resume');
    const quizContainer = document.getElementById('quiz-container');
    const startPage = document.getElementById('start-page');
    const resultsContainer = document.getElementById('results');
    const timerDisplay = document.getElementById('timer');
    const questionContainer = document.getElementById('quiz');
    const prevButton = document.getElementById('prev');
    const nextButton = document.getElementById('next');
    const submitButton = document.getElementById('submitQuiz');
    const doneButton = document.getElementById('done');
    const reviewPage = document.getElementById('review-page');
    const allQuestionsContainer = document.getElementById('all-questions');
    const closeReviewButton = document.getElementById('close-review');
    const endButton = document.getElementById('end'); // New end button

    const header1 = document.getElementById('header1');
    const header2 = document.getElementById('header2');

    const userInfo = document.getElementById('user-info');
    const testId = document.getElementById('test-id');
    const examTitle = document.getElementById('exam-title');

    const calculatorBtn = document.getElementById('calculator-btn');
    const notepadBtn = document.getElementById('notepad-btn');
    const highlightBtn = document.getElementById('highlight-btn');
    const markBtn = document.getElementById('mark-btn');

    const calculatorModal = document.getElementById('calculator-modal');
    const calcDisplay = document.getElementById('calc-display');
    const calcButtons = document.querySelectorAll('.calc-btn');
    const closeCalculator = document.querySelector('.close');

    let currentSlide = 0;
    let slides;
    let intervalId;
    let timeRemaining = 7200; // Total exam time in seconds
    let currentQuestions = [];
    let markedQuestions = new Set(); // Store marked questions
    let startTime;

    // Add user information and test ID
    const userName = "Greg Figaro"; // Example user name
    const testID = "Test1234"; // Example test ID
    userInfo.textContent = `User: ${userName}`;
    testId.textContent = `Test ID: ${testID}`;

    // Event listener for the suspend button
    suspendButton.addEventListener('click', function() {
        Swal.fire({
            title: 'Do you want to suspend the exam?',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#3085d6',
            cancelButtonColor: '#d33',
            confirmButtonText: 'Yes, suspend it!',
            cancelButtonText: 'No, continue'
        }).then((result) => {
            if (result.isConfirmed) {
                saveQuizProgress();
                clearInterval(intervalId);
                startPage.style.display = 'block';
                quizContainer.style.display = 'none';
                header1.style.display = 'none';
                header2.style.display = 'none';
            }
        });
    });

    // Event listener for the end button
    endButton.addEventListener('click', function() {
        Swal.fire({
            title: 'Do you want to end the exam?',
            text: 'Ending the exam will automatically give you a grade.',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#3085d6',
            cancelButtonColor: '#d33',
            confirmButtonText: 'Yes, end it!',
            cancelButtonText: 'No, continue'
        }).then((result) => {
            if (result.isConfirmed) {
                showResults();
                const timeSpent = 7200 - timeRemaining;
                const grade = calculateGrade();
                const level = getPreparednessLevel(grade);
                localStorage.setItem('timeSpent', timeSpent);
                localStorage.setItem('grade', grade);
                localStorage.setItem('level', level);
                window.location.href = 'results.html';
            }
        });
    });

    // Event listener for the submit button
    submitButton.addEventListener('click', function() {
        const confirmSubmit = confirm("Do you want to end the exam? Ending the exam will automatically give you a grade.");
        if (confirmSubmit) {
            endTest();
        }
    });

    function saveQuizProgress() {
        const selectedAnswers = [];
        currentQuestions.forEach((_, questionNumber) => {
            const answerContainer = document.querySelector(`.slide[data-question="${questionNumber}"] .answers`);
            const selector = `input[name=question${questionNumber}]:checked`;
            const userAnswers = [...answerContainer.querySelectorAll(selector)].map(input => input.value);
            selectedAnswers[questionNumber] = userAnswers;
        });
        const progress = {
            currentSlide,
            selectedAnswers,
            timeRemaining,
            currentQuestions
        };
        localStorage.setItem('quizProgress', JSON.stringify(progress));
    }

    function loadQuizProgress() {
        const progress = JSON.parse(localStorage.getItem('quizProgress'));
        if (progress) {
            currentSlide = progress.currentSlide;
            timeRemaining = progress.timeRemaining;
            currentQuestions = progress.currentQuestions;
            buildQuiz();
            progress.selectedAnswers.forEach((answers, questionNumber) => {
                answers.forEach(answer => {
                    const answerInput = document.querySelector(`.slide[data-question="${questionNumber}"] .answers input[value="${answer}"]`);
                    if (answerInput) {
                        answerInput.checked = true;
                    }
                });
            });
            showSlide(currentSlide);
            startTimer();
        } else {
            startExam(myQuestions1); // Start a new exam if no progress is found
        }
    }

    function buildQuiz() {
        const output = [];
        currentQuestions.forEach((currentQuestion, questionNumber) => {
            const answers = [];
            const inputType = Array.isArray(currentQuestion.correctAnswer) ? 'checkbox' : 'radio';

            for (const letter in currentQuestion.answers) {
                answers.push(
                    `<label>
                        <input type="${inputType}" name="question${questionNumber}" value="${letter}">
                        ${currentQuestion.answers[letter]}
                    </label>`
                );
            }
            output.push(
                `<div class="slide" data-question="${questionNumber}">
                    <div class="question"> ${currentQuestion.question} </div>
                    <div class="answers"> ${answers.join('')} </div>
                </div>`
            );
        });
        questionContainer.innerHTML = output.join('');
        slides = document.querySelectorAll(".slide");

        // Attach event listeners to inputs to save progress on change
        slides.forEach((slide, questionNumber) => {
            const inputs = slide.querySelectorAll('input');
            inputs.forEach(input => {
                input.addEventListener('change', () => {
                    saveQuizProgress();
                });
            });
        });

        showSlide(currentSlide);
    }

    function updateQuestionNumber() {
        const questionNumberDisplay = document.getElementById('question-number');
        questionNumberDisplay.textContent = `Question ${currentSlide + 1} of ${slides.length}`;
    }
    
    // Call this function inside showSlide to update the question number whenever the slide changes
    function showSlide(n) {
        slides.forEach((slide, index) => {
            slide.style.display = index === n ? 'block' : 'none';
        });
        currentSlide = n;
        updateNavigationButtons();
        updateQuestionNumber(); // Add this line to update the question number
    }
    

    function updateNavigationButtons() {
        prevButton.style.display = currentSlide === 0 ? 'none' : 'inline';
        nextButton.style.display = currentSlide === slides.length - 1 ? 'none' : 'inline';
        submitButton.style.display = currentSlide === slides.length - 1 ? 'inline' : 'none';
    }

    function startTimer() {
        startTime = Date.now();
        timerDisplay.textContent = formatTime(timeRemaining);
        intervalId = setInterval(() => {
            timeRemaining--;
            timerDisplay.textContent = formatTime(timeRemaining);
            if (timeRemaining <= 0) {
                clearInterval(intervalId);
                endTest();
            }
        }, 1000);
    }

    function formatTime(seconds) {
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        const secs = seconds % 60;
        return `${hours}:${minutes < 10 ? '0' : ''}${minutes}:${secs < 10 ? '0' : ''}${secs}`;
    }

    function endTest() {
        showResults();
        const timeSpent = 7200 - timeRemaining;
        const grade = calculateGrade();
        const level = getPreparednessLevel(grade);
        localStorage.setItem('timeSpent', timeSpent);
        localStorage.setItem('grade', grade);
        localStorage.setItem('level', level);
        window.location.href = 'results.html';
    }

    function showResults() {
        const answerContainers = quizContainer.querySelectorAll('.answers');
        let numCorrect = 0;
        let totalQuestions = currentQuestions.length;

        currentQuestions.forEach((question, index) => {
            const answerContainer = answerContainers[index];
            const selector = `input[name=question${index}]:checked`;
            const userAnswers = [...answerContainer.querySelectorAll(selector)].map(input => input.value);

            if (Array.isArray(question.correctAnswer)) {
                let correctAnswers = 0;
                question.correctAnswer.forEach(answer => {
                    if (userAnswers.includes(answer)) {
                        correctAnswers++;
                    }
                });
                if (correctAnswers === question.correctAnswer.length && correctAnswers === userAnswers.length) {
                    numCorrect++;
                }
            } else {
                if (userAnswers.includes(question.correctAnswer)) {
                    numCorrect++;
                }
            }
        });

        const scorePercent = (numCorrect / totalQuestions) * 100;
        resultsContainer.innerHTML = `Your score: ${scorePercent.toFixed(2)}%`;
    }

    function calculateGrade() {
        const answerContainers = quizContainer.querySelectorAll('.answers');
        let numCorrect = 0;
        let totalQuestions = currentQuestions.length;

        currentQuestions.forEach((question, index) => {
            const answerContainer = answerContainers[index];
            const selector = `input[name=question${index}]:checked`;
            const userAnswers = [...answerContainer.querySelectorAll(selector)].map(input => input.value);

            if (Array.isArray(question.correctAnswer)) {
                let correctAnswers = 0;
                question.correctAnswer.forEach(answer => {
                    if (userAnswers.includes(answer)) {
                        correctAnswers++;
                    }
                });
                if (correctAnswers === question.correctAnswer.length && correctAnswers === userAnswers.length) {
                    numCorrect++;
                }
            } else {
                if (userAnswers.includes(question.correctAnswer)) {
                    numCorrect++;
                }
            }
        });

        return (numCorrect / totalQuestions) * 100;
    }

    function getPreparednessLevel(grade) {
        if (grade >= 90) {
            return 'Excellent';
        } else if (grade >= 75) {
            return 'Good';
        } else if (grade >= 50) {
            return 'Fair';
        } else {
            return 'Needs Improvement';
        }
    }

    // Add event listeners for starting and navigating the quiz
    startButton1.addEventListener('click', function() {
        startExam(myQuestions1);
    });

    startButton2.addEventListener('click', function() {
        startExam(myQuestions2);
    });

    startButton3.addEventListener('click', function() {
        startExam(myQuestions3);
    });

    startButton4.addEventListener('click', function() {
        startExam(myQuestions4);
    });

    startButton5.addEventListener('click', function() {
        startExam(myQuestions5);
    });

    prevButton.addEventListener('click', function() {
        showSlide(currentSlide - 1);
    });

    nextButton.addEventListener('click', function() {
        showSlide(currentSlide + 1);
    });

    doneButton.addEventListener('click', () => {
        populateReviewPage();
        quizContainer.style.display = 'none';
        reviewPage.style.display = 'block';
    });

    closeReviewButton.addEventListener('click', () => {
        reviewPage.style.display = 'none';
        startPage.style.display = 'block';
    });

    calculatorBtn.addEventListener('click', () => {
        calculatorModal.style.display = 'block';
    });

    closeCalculator.addEventListener('click', () => {
        calculatorModal.style.display = 'none';
    });

    window.addEventListener('click', (event) => {
        if (event.target === calculatorModal) {
            calculatorModal.style.display = 'none';
        }
    });

    calcButtons.forEach(button => {
        button.addEventListener('click', () => {
            const value = button.value;
            if (value === 'C') {
                calcDisplay.value = '';
            } else if (value === '=') {
                try {
                    calcDisplay.value = eval(calcDisplay.value);
                } catch {
                    calcDisplay.value = 'Error';
                }
            } else {
                calcDisplay.value += value;
            }
        });
    });

    notepadBtn.addEventListener('click', () => {
        // Add notepad functionality here
        alert("Notepad button clicked!");
    });

    highlightBtn.addEventListener('click', () => {
        // Add highlighter functionality here
        alert("Highlighter button clicked!");
    });

    markBtn.addEventListener('click', () => {
        // Mark the current question for review
        markedQuestions.add(currentSlide);
        alert("Question marked for review!");
    });

    function startExam(questions) {
        startPage.style.display = 'none';
        quizContainer.style.display = 'block';
        header1.style.display = 'block';
        header2.style.display = 'block';
        currentQuestions = questions;
        buildQuiz();
        startTimer();
    }

    function populateReviewPage() {
        let content = '';
        currentQuestions.forEach((question, index) => {
            content += `<div class="question-result">
                            <h2>Question ${index + 1}: ${question.question}</h2>`;
            Object.keys(question.answers).forEach(key => {
                const isCorrect = Array.isArray(question.correctAnswer) ?
                    question.correctAnswer.includes(key) : question.correctAnswer === key;
                const checkMark = isCorrect ? '<span class="correct-icon">&#10004;</span>' : '';
                const className = isCorrect ? 'correct-answer' : '';
                content += `<label class="${className}">${key}: ${question.answers[key]} ${checkMark}</label>`;
            });
            content += '</div>';
        });
        allQuestionsContainer.innerHTML = content;
    }

    loadQuizProgress();
});




const myQuestions1 = [
    
    {
        question: "A policy requiring the removal of acrylic nails by all nursing personnel was implemented 6 months ago. Which assessment measure best determines if the intended outcome of the policy is being achieved?",
        answers: {
            a: "Number of staff induced injury",
            b: "Client satisfaction survey",
            c: "Health care-associated infection rate",
            d: "Rate of needle-stick injuries by nurse"
        },
        correctAnswer: "c"
    },
    {
        question: "The nurse is preparing to assist a newly admitted client with aspiration precautions. Which action should the nurse take to check the client's gag reflex?",
        answers: {
            a: "Offer small sips of water through a straw",
            b: "Place tongue blade on back half of tongue",
            c: "Use a penlight to observe back of oral cavity",
            d: "Auscultate breath sounds after client swallows"
        },
        correctAnswer: "b"
    },
    {
        question: "The nurse explains to an older adult male the procedure for collecting a 24-hour urine specimen for creatinine clearance. Which action should the nurse take?",
        answers: {
            a: "Assess the client for confusion and reteach the procedure",
            b: "Check the urine for color and texture",
            c: "Empty the urinal contents into the 24-hour collection container",
            d: "Discard the contents of the urinal"
        },
        correctAnswer: "c"
    },
    {
        question: "A 54-year-old male client and his wife were informed this morning that he has terminal cancer. Which nursing intervention is likely to be most effective?",
        answers: {
            a: "Ask her how she would like to participate in the client’s care",
            b: "Provide the wife with information about hospice",
            c: "Encourage the wife to visit after painful treatments are completed",
            d: "Refer her to support group for family members of those dying of cancer"
        },
        correctAnswer: "d"
    },
    {
        question: "A client who has a body mass index (BMI) of 30 is requesting information on the initial approach to a weight loss plan. Which action should the nurse recommend?",
        answers: {
            a: "Plan low carbohydrate and high protein meals",
            b: "Engage in strenuous activity for an hour daily",
            c: "Keep a record of food and drinks consumed daily",
            d: "Participate in a group exercise class 3 times a week"
        },
        correctAnswer: "c"
    },
        {
        question: "The nurse assesses a client who has a nasal cannula delivering oxygen at 2 L/min. To assess for skin damage related to the cannula, which areas should the nurse observe?",
        answers: {
            a: "Tops of the ears",
            b: "Bridge of the nose",
            c:"Around the nostril",
            d: "Over the cheeks",
            e: "Across the forehead"
        },
        correctAnswers: ["a", "c", "d"]
    },
    {
        question: "The nurse observes an unlicensed assistive personnel (UAP) who is providing a total bed bath for a confused and lethargic client. The UAP is soaking the client’s foot in a basin of warm water placed on the bed. What action should the nurse take?",
        answers: {
            a: "Remove the basin of water from the client’s bed immediately",
            b: "Remind the UAP to dry between the client’s toes completely",
            c: "Advise the UAP that this procedure is damaging to the skin",
            d: "Add skin cream to the basin of water while the foot is soaking"
        },
        correctAnswer: "b"
    },
    {
        question: "The nurse in the emergency department observes a colleague viewing the electronic health record (EHR) of a client who holds an elected position in the community. The client is not a part of the colleague’s assignment. Which action should the nurse implement?",
        answers: {
            a: "Communicate the colleague’s actions to the unit charge nurse",
            b: "Send an email to facility administration reporting the action",
            c: "Write an anonymous complaint to a professional website",
            d: "Post a comment about the action on a staff discussion board"
        },
        correctAnswer: "a"
    },
    {
        question: "At 0100 on a male client’s second postoperative night, the client states he is unable to sleep and plans to read until feeling sleepy. What action should the nurse implement?",
        answers: {
            a: "Leave the room and close the door to the client’s room",
            b: "Assess the appearance of the client’s surgical dressing",
            c: "Bring the client a prescribed PRN sedative-hypnotic",
            d: "Discuss symptoms of sleep deprivation with the client"
        },
        correctAnswer: "c"
    },
    {
        question: "The nursing staff in the cardiovascular intensive care unit are creating a continuous quality improvement project on social media that addresses coronary artery disease (CAD). Which action should the nurse implement to protect client privacy?",
        answers: {
            a: "Remove identifying information of the clients who participated",
            b: "Recall that authored content may be legally discoverable",
            c: "Share material from credible, peer-reviewed sources only",
            d: "Respect all copyright laws when adding website content"
        },
        correctAnswer: "a"
    },
    {
        question: "A male client with unstable angina needs a cardiac catheterization, so the healthcare provider explains the risks and benefits of the procedure, and then leaves to set up for the procedure. When the nurse presents the consent form for signature, the client hesitates and asks how the wires will keep his heart going. Which action should the nurse take?",
        answers: {
            a: "Answer the client’s specific questions with a short understandable explanation",
            b: "Postpone the procedure until the client understands the risks and benefits",
            c: "Call the client’s next of kin and ask them to provide verbal consent",
            d: "Page the healthcare provider to return and provide additional explanation"
        },
        correctAnswer: "b"
    },
    {
        question: "The nurse is teaching a client how to do active range of motion (ROM) exercises. To exercise the hinge joints, which action should the nurse instruct the client to perform?",
        answers: {
            a: "Tilt the pelvis forwards and backwards",
            b: "Bend the arm by flexing the ulna to the humerus",
            c: "Turn the head to the right and left",
            d: "Extend the arm at the side and rotate in circles"
        },
        correctAnswer: "b"
    },
    {
        question: "A postoperative client has three different PRN analgesics prescribed for different levels of pain. The nurse inadvertently administers a dose that is not within the prescribed parameters. What actions should the nurse take first?",
        answers: {
            a: "Assess for side effects of the medication",
            b: "Document the client’s responses",
            c: "Complete a medication error report",
            d: "Determine if the pain was relieved"
        },
        correctAnswer: "a"
    },
    {
        question: "When assessing a male client, the nurse finds that he is fatigued and is experiencing muscle weakness, leg cramps, and cardiac dysrhythmias. Based on these findings, the nurse plans to check the client’s laboratory values to validate the existence of which?",
        answers: {
            a: "Hyperphosphatemia",
            b: "Hypocalcemia",
            c: "Hypermagnesemia",
            d: "Hypokalemia"
        },
        correctAnswer: "d"
    },
    {
        question: "A female client’s significant other has been at her bedside providing reassurances and support for the past 3 days, as desired by the client. The client’s estranged husband arrives and demands that the significant other not be allowed to visit or be given condition updates. Which intervention should the nurse implement?",
        answers: {
            a: "Obtain a perception from the healthcare provider regarding visitation privileges",
            b: "Request a consultation with the ethics committee for resolution of the situation",
            c: "Encourage the client to speak with her husband regarding his disruptive behavior",
            d: "Communicate the client’s wishes to all members of the multidisciplinary team"
        },
        correctAnswer: "b"
    },
    {
        question: "When measuring vital signs, the nurse observes that a client is using accessory neck muscles during respirations. What follow-up action should the nurse take first?",
        answers: {
            a: "Determine pulse pressure",
            b: "Auscultate heart sounds",
            c: "Measure oxygen saturation",
            d: "Check for neck vein distention"
        },
        correctAnswer: "d"
    },
    {
        question: "To avoid nerve injury, what location should the nurse select to administer a 3 mL IM injection?",
        answers: {
            a: "Ventrogluteal",
            b: "Outer upper quadrant of the buttock",
            c: "Two inches below the acromion process",
            d: "Vastus lateralis"
        },
        correctAnswer: "b"
    },
    {
        question: "Which instruction should the nurse include in the discharge teaching plan for an adult client with hypernatremia?",
        answers: {
            a: "Monitor daily urine output volume",
            b: "Drink plenty of water whenever thirsty",
            c: "Use salt tablets for sodium content",
            d: "Review food labels for sodium content"
        },
        correctAnswer: "d"
    },
    {
        question: "While changing a client's postoperative dressing, the nurse observes a red and swollen wound with a moderate amount of yellow and green drainage and a foul odor. Given there is a positive MRSA, which is the most important action for the nurse to take?",
        answers: {
            a: "Force oral fluids",
            b: "Request a nutrition consult",
            c: "Initiate contact precautions",
            d: "Limit visitors to immediate family only"
        },
        correctAnswer: "c"
    },
    {
        question: "To prepare a client for the potential side effects of a newly prescribed medication, what action should the nurse implement?",
        answers: {
            a: "Assess the client for health alterations that may be impacted by the effects of the medication",
            b: "Teach the client how to administer the medication to promote the best absorption",
            c: "Administer a half dose and observe the client for side effects before administering a full dosage",
            d: "Encourage the client to drink plenty of fluids to promote effective drug distribution"
        },
        correctAnswer: "a"
    },
    
    {
        question: "A client is 2 days post-op from a thoracic surgery and is complaining of incisional pain. The client last received pain medication 2 hours ago. He is rating his pain a 5 on a 1-10 scale. After calling the provider, what is the nurse's next action?",
        answers: {
            a: "Instruct the client to use guided imagery and slow rhythmic breathing",
            b: "Provide at least 20 minutes of back massage and gentle effleurage",
            c: "Encourage the client to watch TV",
            d: "Place a hot water circulation device, such as an Aqua K pad, to operative site"
        },
        correctAnswer: "a"
    },
    {
        question: "A client with cirrhosis and ascites is receiving furosemide 40 mg BID. The pharmacy provides 20 mg tablets. How many tablets should the client receive each day?",
        answers: {
            a: "2 tablets",
            b: "4 tablets",
            c: "6 tablets",
            d: "8 tablets"
        },
        correctAnswer: "b"
    },
    {
        question: "An older adult male client is admitted to the medical unit following a fall at home. When undressing him, the nurse notes that he is wearing an adult diaper and skin breakdown is obvious over his sacral area. What action should the nurse implement first?",
        answers: {
            a: "Establish a toileting schedule to decrease episodes of incontinence",
            b: "Complete a functional assessment of the client’s self-care abilities",
            c: "Apply a barrier ointment to intact areas that may be exposed to moisture",
            d: "Determine the size and depth of skin breakdown over the sacral area"
        },
        correctAnswer: "d"
    },
    {
        question: "While interviewing a client, the nurse records the assessment in the electronic health record. Which statement is most accurate regarding electronic documentation during an interview?",
        answers: {
            a: "The client’s comfort level is increased when the nurse breaks eye contact to type notes into the record",
            b: "The interview process is enhanced with electronic documentation and allows the client to speak at a normal pace",
            c: "Completing the electronic record during an interview is a legal obligation of the examining nurse",
            d: "The nurse has limited ability to observe nonverbal communication while entering the assessment electronically"
        },
        correctAnswer: "d"
    },
    {
        question: "A female client with chronic back pain has been taking muscle relaxants and analgesics to manage the discomfort, but is now experiencing an acute episode of pain that is not relieved by this medication regime. The client tells the nurse that she does not want to have back surgery for a herniated intervertebral disk, and reports that she has found acupuncture effective in resolving past acute episodes. Which response is best for the nurse to provide?",
        answers: {
            a: "Surgery removes the disk and is the only treatment that can totally resolve the pain",
            b: "The medication regimen you previously used should be re-evaluated for dose adjustment",
            c: "Massage and hot pack treatments are less invasive and can provide temporary relief",
            d: "Acupuncture is a complementary therapy that is often effective for management of pain"
        },
        correctAnswer: "d"
    },
    {
        question: "The nurse is providing wound care to a client with a stage 3 pressure ulcer that has a large amount of eschar. The wound care prescription states 'clean the wound and then apply collagenase.' Collagenase is a debriding agent. The prescription does not specify a cleaning method. Which technique should the nurse cleanse the pressure ulcer?",
        answers: {
            a: "Lightly coat the wound with povidone-iodine solution",
            b: "Irrigate the wound with sterile normal saline",
            c: "Flush the wound with sterile hydrogen peroxide",
            d: "Remove the eschar with a wet-to-dry dressing"
        },
        correctAnswer: "b"
    },
    {
        question: "A client is admitted with a fever of unknown origin. To assess fever patterns, which intervention should the nurse implement?",
        answers: {
            a: "Document the client's circadian rhythms",
            b: "Assess for flushed, warm skin regularly",
            c: "Measure temperature at regular intervals",
            d: "Vary sites for temperature measurement"
        },
        correctAnswer: "c"
    },
    {
        question: "When performing blood pressure measurement to assess for orthostatic hypotension, which action should the nurse implement first?",
        answers: {
            a: "Position the client supine for a few minutes",
            b: "Assist the client to stand at the bedside",
            c: "Apply the blood pressure cuff securely",
            d: "Record the client's pulse rate and rhythm"
        },
        correctAnswer: "a"
    },
    {
        question: "The nurse retrieves hydromorphone 4mg/mL from the Pyxis MedStation, an automated dispensing system, for a client who is receiving hydromorphone 3 mg IM 6 hours PRN severe pain. How many mL should the nurse administer to the client?",
        answers: {
            a: "0.75 mL",
            b: "0.8 mL",
            c: "1 mL",
            d: "1.2 mL"
        },
        correctAnswer: "b"
    },
    {
        question: "The unlicensed assistive personnel (UAP) describes the appearance of the bowel movement of several clients. Which description warrants additional follow up by the nurse? (select all that apply)",
        answers: {
            a: "Solid with red streaks.",
            b: "Brown liquid.",
            c: "Multiple hard pellets.",
            d: "Formed soft.",
            e: "Tarry appearance."
        },
        correctAnswer: ["a", "b", "c", "e"]  // Correct answers for 'select all that apply' type question
    },
    {
        question: "A female UAP is assigned to take the vital signs of a client with pertussis for whom droplet precautions have been implemented. The UAP requests a change in assignment because she has not yet been fitted for a particulate filter mask. Which action should the nurse take?",
        answers: {
            a: "Advise the UAP to wear a standard face mask to take vital signs, and then get fitted for a filter mask before providing personal care",
            b: "Send the UAP to be fitted for a particulate filter mask immediately so she can provide care to this client",
            c: "Instruct the UAP that a standard mask is sufficient for the provision of care for the assigned client",
            d: "Before changing assignments, determine which staff members have been fitted for particulate filter masks"
        },
        correctAnswer: "b"
    },
    {
        question: "In-home hospice care is arranged for a client with stage 4 lung cancer. While the palliative nurse is arranging for discharge, the client verbalizes concerns about pain. What action should the nurse implement?",
        answers: {
            a: "Explain the respiratory problems that can occur with morphine use",
            b: "Teach family how to evaluate the effectiveness of analgesics",
            c: "Recommend asking the healthcare professional for a patient-controlled analgesic (PCA) pump",
            d: "Provide client with a schedule of around-the-clock prescribed analgesic use"
        },
        correctAnswer: "d"
    },
    {
        question: "What assessment finding places a client at risk for problems associated with impaired skin integrity?",
        answers: {
            a: "Scattered maculae of the face",
            b: "Capillary refill 5 seconds",
            c: "Smooth nail texture",
            d: "Absence of skin tenting"
        },
        correctAnswer: "b"
    },
    {
        question: "When evaluating the effectiveness of a client’s nursing care, the nurse first reviews the expected outcomes identified in the plan of care. What action should the nurse take next?",
        answers: {
            a: "Determine if the expected outcomes were realistic",
            b: "Obtain current client data to compare with expected outcomes",
            c: "Modify the nursing interventions to achieve the client’s goals",
            d: "Review related professional standards of care"
        },
        correctAnswer: "a"
    },
    {
        question: "The nurse attaches a pulse oximeter to a client’s fingers and obtains an oxygen saturation reading of 91%. Which assessment finding most likely contributes to this reading?",
        answers: {
            a: "BP 142/88 mmHg",
            b: "2+ edema of fingers and hands",
            c: "Radial pulse volume is +3",
            d: "Capillary refill time is 2 seconds"
        },
        correctAnswer: "b"
    },
    {
        question: "The nurse is caring for a hospitalized client who was placed in restraints due to confusion. The family removes the restraints while they are with the client. When the family leaves, what action should the nurse take first?",
        answers: {
            a: "Apply the restraints to maintain the client’s safety",
            b: "Reassess the client to determine the need for continuing restraints",
            c: "Document the time the family left and continue to monitor the client",
            d: "Call the healthcare provider for a new prescription"
        },
        correctAnswer: "b"
    },
    {
        question: "The nurse is discharging an adult woman who was hospitalized for 6 days for treatment of pneumonia. While the nurse is reviewing the prescribed medications, the client appears anxious. What action is most important for the nurse to implement?",
        answers: {
            a: "Instruct the client to repeat the medication plan",
            b: "Encourage the client to take a PRN anti-anxiety drug",
            c: "Provide written instructions that are easy to follow",
            d: "Include a family member in the teaching session"
        },
        correctAnswer: "a"
    },
    {
        question: "What instruction should the nurse provide for an UAP caring for a client with MRSA who has a prescription for contact precautions?",
        answers: {
            a: "Do not allow visitors until precautions are discontinued",
            b: "Wear sterile gloves when handling the client’s body fluids",
            c: "Have the client wear a mask whenever someone enters the room",
            d: "Don a gown and gloves when entering the room"
        },
        correctAnswer: "d"
    },
    {
        question: "While suctioning a client’s nasopharynx, the nurse observes that the client’s oxygen saturation remains at 94%, which is the same reading obtained prior to starting the procedure. What action should the nurse take in response to this finding?",
        answers: {
            a: "Complete the intermittent suction of the nasopharynx",
            b: "Reposition the pulse oximeter clip to obtain a new reading",
            c: "Stop suctioning until the pulse oximeter reading is above 95%",
            d: "Apply an oxygen mask over the client’s nose and mouth"
        },
        correctAnswer: "a"
    },
    {
        question: "UAP has lowered the head of the bed to change the linens for a client who is bedbound. Which observation requires the most immediate intervention by the nurse?",
        answers: {
            a: "A feeding is infusing at 40 mL/hr through an enteral feeding tube",
            b: "The urine meter attached to the urinary drainage bag is completely full",
            c: "There is a large dependent loop in the client’s urinary drainage tubing",
            d: "Purulent drainage is present around the insertion site of the feeding tube"
        },
        correctAnswer: "d"
    },
    {
        question: "A male client presents to the clinic stating that he has a high stress job and is having difficulty falling asleep at night. The client reports having a constant headache and is seeking medication to help sleep. Which intervention should the nurse implement?",
        answers: {
            a: "Determine the client’s sleep and activity pattern",
            b: "Obtain a prescription for the client to take when stressed",
            c: "Refer the client for a sleep study and neurological follow-up",
            d: "Teach coping strategies to use when feeling stressed"
        },
        correctAnswer: "d"
    },
    {
        question: "The nurse is teaching a client about the use of syringes and needles for home administration of medications. Which action by the client indicates an understanding of standard precautions?",
        answers: {
            a: "Remove the needle before discarding used syringes",
            b: "Wear gloves to dispose of the needle and syringe",
            c: "Don a face mask before administering the medication",
            d: "Wash hands before handling the needle and syringe"
        },
        correctAnswer: "d"
    },
    {
        question: "The nurse observes an UAP positioning a newly admitted client who has a seizure disorder. The client is supine and the UAP is placing soft pillows along the side rails. Which action should the nurse implement?",
        answers: {
            a: "Instruct the UAP to obtain soft blankets to secure to the side rails instead of pillows",
            b: "Ensure that the UAP has placed pillows effectively to protect the client",
            c: "Ask the UAP to use some pillows to prop the client in a side-lying position",
            d: "Assume responsibility for placing the pillows while the UAP completes another task"
        },
        correctAnswer: "d"
    },
    {
        question: "A cerebrovascular accident client is placed on a ventilator. The client’s daughter arrives with a durable power of attorney, and a living will that indicates the client does not wish for extraordinary life-saving measures. What action should the nurse take?",
        answers: {
            a: "Refer to the risk manager",
            b: "Notify the healthcare provider",
            c: "Discontinue the ventilator",
            d: "Review the medical record"
        },
        correctAnswer: "b"
    },
    {
        question: "Earlier this morning, an elderly Hispanic female was discharged to a long-term care facility. The family members are now gathered in the hallway outside her room. What is the best action for the nurse?",
        answers: {
            a: "Ask the family to wait in the cafeteria while the next of kin makes the necessary arrangements",
            b: "Provide space and privacy for the family to share their concerns about the client’s discharge",
            c: "Ask the social worker to encourage the family to clear the hallway",
            d: "Explain to the family the client’s need for privacy so that she can make independent decisions"
        },
        correctAnswer: "b"
    },
    {
        question: "A client with rheumatoid arthritis is experiencing chronic pain in both hands and wrists. Which information about the client is most important for the nurse to obtain when planning care?",
        answers: {
            a: "Amount of support provided by family members",
            b: "Measurement of pain using a scale of 0 to 10",
            c: "The ability to perform ADLs",
            d: "Nonverbal behaviors exhibited when pain occurs"
        },
        correctAnswer: "c"
    },
    {
        question: "A male Native American presents to the clinic with complaints of frequent abdominal cramping and nausea. He states that the chronic constipation and had not had a bowel movement in five days, despite trying several home remedies. Which intervention is most important for the nurse to implement?",
        answers: {
            a: "Evaluate the stool samples for presence of blood",
            b: "Assess for the presence of an impaction",
            c: "Determine what home remedies were used",
            d: "Obtain a list of prescribed home medication"
        },
        correctAnswer: "c"
    },
    {
        question: "Which assessment data reflects the need for the nurses to include the problem, 'Risk for falls' in a client’s plan of care?",
        answers: {
            a: "Recent serum hemoglobin level of 16g/dL",
            b: "Opioid analgesic received one hour ago",
            c: "Stooped posture with a steady gait",
            d: "Expressed feelings of depression"
        },
        correctAnswer: "b"
    },
    {
        question: "The nurse receives a report that a client with an indwelling urinary catheter has an output of 150 mL for the previous 6-hour shift. Which intervention should the nurse implement first?",
        answers: {
            a: "Check the drainage tubing for a kink",
            b: "Review the intake and output record",
            c: "Notify the healthcare provider",
            d: "Give the client 8 oz of water to drink"
        },
        correctAnswer: "b"
    },
    {
        question: "The nurse is conducting an initial admission assessment for a woman who is Mexican-American and who is scheduled to deliver a baby by C-section in the next 24 hours. What should the nurse include in the assessment?",
        answers: {
            a: "Provide an interpreter to convey the meaning of words and messages in translation",
            b: "Commend the client for her patience after a long wait in the admission process",
            c: "Arrange for the hospital chaplain to visit the client during her hospital stay",
            d: "Rely on cultural norms as the basis for providing nursing care for this client"
        },
        correctAnswer: "d"
    },
    {
        question: "During the admission assessment of a terminally ill male client, he mentions that he is an agnostic. What is the best nursing action in response to this statement?",
        answers: {
            a: "Provide information about the hours and location of the chapel",
            b: "Document the statement in the client’s spiritual assessment",
            c: "Invite the client to a healing service for people of all religions",
            d: "Offer to contact a spiritual advisor of the client’s choice"
        },
        correctAnswer: "b"
    },
    {
        question: "The nurse is reviewing the signed operative consent with a client who is admitted for the removal of a lipoma on the left leg. The client states that the permit should include...",
        answers: {
            a: "Notify the OR staff of the client’s confusion",
            b: "Have the client sign a new surgical permit",
            c: "Add the additional information to the permit",
            d: "Inform the surgeon about the client’s concern"
        },
        correctAnswer: "d"
    },
    {
        question: "The nurse plans to assist a male client out of bed for the first time since his surgery yesterday. His wife objects and tells the nurse to get out of the room because her husband is too ill to get out of bed.",
        answers: {
            a: "Administer nasal oxygen at a rate of 5 L/min",
            b: "Help the client to lie back down in the bed",
            c: "Quickly pivot the client to the chair and elevate the legs",
            d: "Check the client’s blood pressure and pulse deficit"
        },
        correctAnswer: "d"
    },
    {
        question: "When entering the room of an adult male, the nurse finds that the client is very anxious. Before providing care, what action should the nurse take?",
        answers: {
            a: "Divert the client’s attention",
            b: "Call for additional help from staff",
            c: "Document the planned action",
            d: "Re-assess the client situation"
        },
        correctAnswer: "d"
    }
 ];

const myQuestions2 = [
    {
        question: "A client who is in hospice care complains of increasing amounts of pain. The healthcare provider prescribes an analgesic every four hours as needed. Which action should the LPN/LVN implement?",
        answers: {
            a: "Give an around-the-clock schedule for administration of analgesics.",
            b: "Administer analgesic medication as needed when the pain is severe.",
            c: "Provide medication to keep the client sedated and unaware of stimuli.",
            d: "Offer a medication-free period so that the client can do daily activities."
        },
        correctAnswer: "a"
    },
    {
        question: "When assessing a client with wrist restraints, the nurse observes that the fingers on the right hand are blue. What action should the LPN implement first?",
        answers: {
            a: "Loosen the right wrist restraint.",
            b: "Apply a pulse oximeter to the right hand.",
            c: "Compare hand color bilaterally.",
            d: "Palpate the right radial pulse."
        },
        correctAnswer: "a"
    },
    {
        question: "The LPN/LVN is assessing the nutritional status of several clients. Which client has the greatest nutritional need for additional intake of protein?",
        answers: {
            a: "A college-age track runner with a sprained ankle.",
            b: "A lactating woman nursing her 3-day-old infant.",
            c: "A school-aged child with Type 2 diabetes.",
            d: "An elderly man being treated for a peptic ulcer."
        },
        correctAnswer: "b"
    },
    {
        question: "A client is in the radiology department at 0900 when the prescription levofloxacin (Levaquin) 500 mg IV q24h is scheduled to be administered. The client returns to the unit at 1300. What is the best intervention for the LPN/LVN to implement?",
        answers: {
            a: "Contact the healthcare provider and complete a medication variance form.",
            b: "Administer the Levaquin at 1300 and resume the 0900 schedule in the morning.",
            c: "Notify the charge nurse and complete an incident report to explain the missed dose.",
            d: "Give the missed dose at 1300 and change the schedule to administer daily at 1300."
        },
        correctAnswer: "d"
    },
    {
        question: "While instructing a male client's wife in the performance of passive range-of-motion exercises to his contracted shoulder, the nurse observes that she is holding his arm above and below the elbow. What nursing action should the LPN/LVN implement?",
        answers: {
            a: "Acknowledge that she is supporting the arm correctly.",
            b: "Encourage her to keep the joint covered to maintain warmth.",
            c: "Reinforce the need to grip directly under the joint for better support.",
            d: "Instruct her to grip directly over the joint for better motion."
        },
        correctAnswer: "a"
    },
    {
        question: "What is the most important reason for starting intravenous infusions in the upper extremities rather than the lower extremities of adults?",
        answers: {
            a: "It is more difficult to find a superficial vein in the feet and ankles.",
            b: "A decreased flow rate could result in the formation of a thrombosis.",
            c: "A cannulated extremity is more difficult to move when the leg or foot is used.",
            d: "Veins are located deep in the feet and ankles, resulting in a more painful procedure."
        },
        correctAnswer: "b"
    },
    {
        question: "The LPN observes an unlicensed assistive personnel (UAP) taking a client's blood pressure with a cuff that is too small, but the blood pressure reading obtained is within the client's usual range. What action is most important for the nurse to implement?",
        answers: {
            a: "Tell the UAP to use a larger cuff at the next scheduled assessment.",
            b: "Reassess the client's blood pressure using a larger cuff.",
            c: "Have the unit educator review this procedure with the UAPs.",
            d: "Teach the UAP the correct technique for assessing blood pressure."
        },
        correctAnswer: "b"
    },
{
        question: "A client is to receive cimetidine (Tagamet) 300 mg q6h IVPB. The preparation arrives from the pharmacy diluted in 50 ml of 0.9% NaCl. The LPN plans to administer the IVPB dose over 20 minutes. For how many ml/hr should the infusion pump be set to deliver the secondary infusion?",
    answers:{
         a:"200.",
         b:"150.",
         c:"175.",
         d:"250."
},
        correctAnswer: "b"
},
{
        question: "Twenty minutes after beginning a heat application, the client states that the heating pad no longer feels warm enough. What is the best response by the LPN/LVN?",
        answers: {
            a: "That means you have derived the maximum benefit, and the heat can be removed.",
            b: "Your blood vessels are becoming dilated and removing the heat from the site.",
            c: "We will increase the temperature 5 degrees when the pad no longer feels warm.",
            d: "The body's receptors adapt over time as they are exposed to heat."
        },
        correctAnswer: "d"
    },
    {
        question: "The LPN is instructing a client with high cholesterol about diet and lifestyle modification. What comment from the client indicates that the teaching has been effective?",
        answers: {
            a: "If I exercise at least two times weekly for one hour, I will lower my cholesterol.",
            b: "I need to avoid eating proteins, including red meat.",
            c: "I will limit my intake of beef to 4 ounces per week.",
            d: "My blood level of low-density lipoproteins needs to increase."
        },
        correctAnswer: "c"
    },
    {
        question: "The UAPs working on a chronic neuro unit ask the LPN/LVN to help them determine the safest way to transfer an elderly client with left-sided weakness from the bed to the chair. What method describes the correct transfer procedure for this client?",
        answers: {
            a: "Place the chair at a right angle to the bed on the client's left side before moving.",
            b: "Assist the client to a standing position, then place the right hand on the armrest.",
            c: "Have the client place the left foot next to the chair and pivot to the left before sitting.",
            d: "Move the chair parallel to the right side of the bed, and stand the client on the right foot."
        },
        correctAnswer: "d"
    },
    {
        question: "An unlicensed assistive personnel (UAP) places a client in a left lateral position prior to administering a soap suds enema. Which instruction should the LPN/LVN provide the UAP?",
        answers: {
            a: "Position the client on the right side of the bed in reverse Trendelenburg.",
            b: "Fill the enema container with 1000 ml of warm water and 5 ml of castile soap.",
            c: "Reposition in a Sim's position with the client's weight on the anterior ilium.",
            d: "Raise the side rails on both sides of the bed and elevate the bed to waist level."
        },
        correctAnswer: "c"
    },
    {
        question: "A client who is a Jehovah's Witness is admitted to the nursing unit. Which concern should the LPN have for planning care in terms of the client's beliefs?",
        answers: {
            a: "Autopsy of the body is prohibited.",
            b: "Blood transfusions are forbidden.",
            c: "Alcohol use in any form is not allowed.",
            d: "A vegetarian diet must be followed."
        },
        correctAnswer: "b"
    },
    {
        question: "The LPN/LVN observes that a male client has removed the covering from an ice pack applied to his knee. What action should the nurse take first?",
        answers: {
            a: "Observe the appearance of the skin under the ice pack.",
            b: "Instruct the client regarding the need for the covering.",
            c: "Reapply the covering after filling with fresh ice.",
            d: "Ask the client how long the ice was applied to the skin."
        },
        correctAnswer: "a"
    },
    {
        question: "The LPN/LVN mixes 50 mg of Nipride in 250 ml of D5W and plans to administer the solution at a rate of 5 mcg/kg/min to a client weighing 182 pounds. Using a drip factor of 60 gtt/ml, how many drops per minute should the client receive?",
        answers: {
            a: "31 gtt/min.",
            b: "62 gtt/min.",
            c: "93 gtt/min.",
            d: "124 gtt/min."
        },
        correctAnswer: "d"
    },
    {
        question: "A hospitalized male client is receiving nasogastric tube feedings via a small-bore tube and a continuous pump infusion. He reports that he had a bad bout of severe coughing a few minutes ago, but feels fine now. What action is best for the LPN/LVN to take?",
        answers: {
            a: "Record the coughing incident. No further action is required at this time.",
            b: "Stop the feeding, explain to the family why it is being stopped, and notify the healthcare provider.",
            c: "After clearing the tube with 30 ml of air, check the pH of fluid withdrawn from the tube.",
            d: "Inject 30 ml of air into the tube while auscultating the epigastrium for gurgling."
        },
        correctAnswer: "c"
    },
    {
        question: "A male client being discharged with a prescription for the bronchodilator theophylline tells the nurse that he understands he is to take three doses of the medication each day. Since, at the time of discharge, timed-release capsules are not available, which dosing schedule should the LPN advise the client to follow?",
        answers: {
            a: "9 a.m., 1 p.m., and 5 p.m.",
            b: "8 a.m., 4 p.m., and midnight.",
            c: "Before breakfast, before lunch and before dinner.",
            d: "With breakfast, with lunch, and with dinner."
        },
        correctAnswer: "b"
    },
    {
        question: "A client is to receive 10 mEq of KCl diluted in 250 ml of normal saline over 4 hours. At what rate should the LPN/LVN set the client's intravenous infusion pump?",
        answers: {
            a: "13 ml/hour.",
            b: "63 ml/hour.",
            c: "80 ml/hour.",
            d: "125 ml/hour."
        },
        correctAnswer: "b"
    },
    {
        question: "An obese male client discusses with the LPN/LVN his plans to begin a long-term weight loss regimen. In addition to dietary changes, he plans to begin an intensive aerobic exercise program 3 to 4 times a week and to take stress management classes. After praising the client for his decision, which instruction is most important for the nurse to provide?",
        answers: {
            a: "Be sure to have a complete physical examination before beginning your planned exercise program.",
            b: "Be careful that the exercise program doesn't simply add to your stress level, making you want to eat more.",
            c: "Increased exercise helps to reduce stress, so you may not need to spend money on a stress management class.",
            d: "Make sure to monitor your weight loss regularly to provide a sense of accomplishment and motivation."
        },
        correctAnswer: "a"
    },
    {
        question: "The LPN is teaching a client proper use of an inhaler. When should the client administer the inhaler-delivered medication to demonstrate correct use of the inhaler?",
        answers: {
            a: "Immediately after exhalation.",
            b: "During the inhalation.",
            c: "At the end of three inhalations.",
            d: "Immediately after inhalation."
        },
        correctAnswer: "b"
    },
    {
        question: "The healthcare provider prescribes the diuretic metolazone (Zaroxolyn) 7.5 mg PO. Zaroxolyn is available in 5 mg tablets. How much should the LPN/LVN plan to administer?",
        answers: {
            a: "½ tablet.",
            b: "1 tablet.",
            c: "1½ tablets.",
            d: "2 tablets."
        },
        correctAnswer: "c"
    },
    {
        question: "The healthcare provider prescribes furosemide (Lasix) 15 mg IV stat. On hand is Lasix 20 mg/2 ml. How many milliliters should the LPN/LVN administer?",
        answers: {
            a: "1 ml.",
            b: "1.5 ml.",
            c: "1.75 ml.",
            d: "2 ml."
        },
        correctAnswer: "b"
    },
    {
        question: "Heparin 20,000 units in 500 ml D5W at 50 ml/hour has been infusing for 5½ hours. How much heparin has the client received?",
        answers: {
            a: "11,000 units.",
            b: "13,000 units.",
            c: "15,000 units.",
            d: "17,000 units."
        },
        correctAnswer: "a"
    },
    {
        question: "The healthcare provider prescribes morphine sulfate 4mg IM STAT. Morphine comes in 8 mg per ml. How many ml should the LPN/LVN administer?",
        answers: {
            a: "0.5 ml.",
            b: "1 ml.",
            c: "1.5 ml.",
            d: "2 ml."
        },
        correctAnswer: "a"
    },
    {
        question: "The LPN prepares a 1,000 ml IV of 5% dextrose and water to be infused over 8 hours. The infusion set delivers 10 drops per milliliter. The nurse should regulate the IV to administer approximately how many drops per minute?",
        answers: {
            a: "80",
            b: "8",
            c: "21",
            d: "25"
        },
        correctAnswer: "c"
    },
    {
        question: "Which action is most important for the LPN/LVN to implement when donning sterile gloves?",
        answers: {
            a: "Maintain thumb at a ninety degree angle.",
            b: "Hold hands with fingers down while gloving.",
            c: "Keep gloved hands above the elbows.",
            d: "Put the glove on the dominant hand first."
        },
        correctAnswer: "c"
    },
    {
        question: "A client's infusion of normal saline infiltrated earlier today, and approximately 500 ml of saline infused into the subcutaneous tissue. The client is now complaining of excruciating arm pain and demanding 'stronger pain medications.' What initial action is most important for the LPN/LVN to take?",
        answers: {
            a: "Ask about any past history of drug abuse or addiction.",
            b: "Measure the pulse volume and capillary refill distal to the infiltration.",
            c: "Compress the infiltrated tissue to measure the degree of edema.",
            d: "Evaluate the extent of ecchymosis over the forearm area."
        },
        correctAnswer: "b"
    },
    {
        question: "An elderly male client who is unresponsive following a cerebral vascular accident (CVA) is receiving bolus enteral feedings though a gastrostomy tube. What is the best client position for administration of the bolus tube feedings?",
        answers: {
            a: "Prone.",
            b: "Fowler's.",
            c: "Sims'.",
            d: "Supine."
        },
        correctAnswer: "b"
    },
    {
        question: "A 73-year-old female client had a hemiarthroplasty of the left hip yesterday due to a fracture resulting from a fall. In reviewing hip precautions with the client, which instruction should the LPN/LVN include in this client's teaching plan?",
        answers: {
            a: "In 8 weeks you will be able to bend at the waist to reach items on the floor.",
            b: "Place a pillow between your knees while lying in bed to prevent hip dislocation.",
            c: "It is safe to use a walker to get out of bed, but you need assistance when walking.",
            d: "Take pain medication 30 minutes after your physical therapy sessions."
        },
        correctAnswer: "b"
    },
    {
        question: "A client with pneumonia has a decrease in oxygen saturation from 94% to 88% while ambulating. Based on these findings, which intervention should the LPN/LVN implement first?",
        answers: {
            a: "Assist the ambulating client back to the bed.",
            b: "Encourage the client to ambulate to resolve pneumonia.",
            c: "Obtain a prescription for portable oxygen while ambulating.",
            d: "Move the oximetry probe from the finger to the earlobe."
        },
        correctAnswer: "a"
    },
    {
        question: "A client with chronic renal failure selects a scrambled egg for his breakfast. What action should the LPN/LVN take?",
        answers: {
            a: "Commend the client for selecting a high biologic value protein.",
            b: "Remind the client that protein in the diet should be avoided.",
            c: "Suggest that the client also select orange juice, to promote absorption.",
            d: "Encourage the client to attend classes on dietary management of CRF."
        },
        correctAnswer: "a"
    },
    {
        question: "A client who is 5' 5\" tall and weighs 200 pounds is scheduled for surgery the next day. What question is most important for the LPN to include during the preoperative assessment?",
        answers: {
            a: "What is your daily calorie consumption?",
            b: "What vitamin and mineral supplements do you take?",
            c: "Do you feel that you are overweight?",
            d: "Will a clear liquid diet be okay after surgery?"
        },
        correctAnswer: "b"
    },
    {
        question: "During the initial morning assessment, a male client denies dysuria but reports that his urine appears dark amber. Which intervention should the LPN/LVN implement?",
        answers: {
            a: "Provide additional coffee on the client's breakfast tray.",
            b: "Exchange the client's grape juice for cranberry juice.",
            c: "Bring the client additional fruit at mid-morning.",
            d: "Encourage additional oral intake of juices and water."
        },
        correctAnswer: "d"
    },
    {
        question: "Which intervention is most important for the LPN/LVN to implement for a male client who is experiencing urinary retention?",
        answers: {
            a: "Apply a condom catheter.",
            b: "Apply a skin protectant.",
            c: "Encourage increased fluid intake.",
            d: "Assess for bladder distention."
        },
        correctAnswer: "d"
    },
    {
        question: "A client with acute hemorrhagic anemia is to receive four units of packed RBCs (red blood cells) as rapidly as possible. Which intervention is most important for the LPN/LVN to implement?",
        answers: {
            a: "Obtain the pre-transfusion hemoglobin level.",
            b: "Prime the tubing and prepare a blood pump set-up.",
            c: "Monitor vital signs q15 minutes for the first hour.",
            d: "Ensure the accuracy of the blood type match."
        },
        correctAnswer: "d"
    },
    {
        question: "Which snack food is best for the LPN/LVN to provide a client with myasthenia gravis who is at risk for altered nutritional status?",
        answers: {
            a: "Chocolate pudding.",
            b: "Graham crackers.",
            c: "Sugar free gelatin.",
            d: "Apple slices."
        },
        correctAnswer: "a"
    },
    {
        question: "The nurse is evaluating client learning about a low-sodium diet. Selection of which meal would indicate to the LPN that this client understands the dietary restrictions?",
        answers: {
            a: "Tossed salad, low-sodium dressing, bacon and tomato sandwich.",
            b: "New England clam chowder, no-salt crackers, fresh fruit salad.",
            c: "Skim milk, turkey salad, roll, and vanilla ice cream.",
            d: "Macaroni and cheese, diet Coke, a slice of cherry pie."
        },
        correctAnswer: "c"
    },
    {
        question: "Which nutritional assessment data should the LPN/LVN collect to best reflect total muscle mass in an adolescent?",
        answers: {
            a: "Height in inches or centimeters.",
            b: "Weight in kilograms or pounds.",
            c: "Triceps skin fold thickness.",
            d: "Upper arm circumference."
        },
        correctAnswer: "d"
    },
    {
        question: "An elderly resident of a long-term care facility is no longer able to perform self-care and is becoming progressively weaker. The resident previously requested that no resuscitative efforts be performed, and the family requests hospice care. What action should the LPN/LVN implement first?",
        answers: {
            a: "Reaffirm the client's desire for no resuscitative efforts.",
            b: "Transfer the client to a hospice inpatient facility.",
            c: "Prepare the family for the client's impending death.",
            d: "Notify the healthcare provider of the family's request."
        },
        correctAnswer: "d"
    },
    {
        question: "After completing an assessment and determining that a client has a problem, which action should the LPN/LVN perform next?",
        answers: {
            a: "Determine the etiology of the problem.",
            b: "Prioritize nursing care interventions.",
            c: "Plan appropriate interventions.",
            d: "Collaborate with the client to set goals."
        },
        correctAnswer: "a"
    },
    {
        question: "An elderly client who requires frequent monitoring fell and fractured a hip. Which LPN/LVN is at greatest risk for a malpractice judgment?",
        answers: {
            a: "A nurse who worked the 7 to 3 shift at the hospital and wrote poor nursing notes.",
            b: "The nurse assigned to care for the client who was at lunch at the time of the fall.",
            c: "The nurse who transferred the client to the chair when the fall occurred.",
            d: "The charge nurse who completed rounds 30 minutes before the fall occurred."
        },
        correctAnswer: "c"
    },
    {
        question: "A postoperative client will need to perform daily dressing changes after discharge. Which outcome statement best demonstrates the client's readiness to manage his wound care after discharge? The client",
        answers: {
            a: "asks relevant questions regarding the dressing change.",
            b: "states he will be able to complete the wound care regimen.",
            c: "demonstrates the wound care procedure correctly.",
            d: "has all the necessary supplies for wound care."
        },
        correctAnswer: "c"
    },
    {
        question: "When evaluating a client's plan of care, the LPN determines that a desired outcome was not achieved. Which action will the LPN implement first?",
        answers: {
            a: "Establish a new nursing diagnosis.",
            b: "Note which actions were not implemented.",
            c: "Add additional nursing orders to the plan.",
            d: "Collaborate with the healthcare provider to make changes."
        },
        correctAnswer: "b"
    },
    {
        question: "The healthcare provider prescribes 1,000 ml of Ringer's Lactate with 30 Units of Pitocin to run in over 4 hours for a client who has just delivered a 10 pound infant by cesarean section. The tubing has been changed to a 20 gtt/ml administration set. The LPN/LVN plans to set the flow rate at how many gtt/min?",
        answers: {
            a: "42 gtt/min.",
            b: "83 gtt/min.",
            c: "125 gtt/min.",
            d: "250 gtt/min."
        },
        correctAnswer: "b"
    },
    {
        question: "Seconal 0.1 gram PRN at bedtime is prescribed to a client for rest. The scored tablets are labeled grain 1.5 per tablet. How many tablets should the LPN/LVN plan to administer?",
        answers: {
            a: "0.5 tablet.",
            b: "1 tablet.",
            c: "1.5 tablets.",
            d: "2 tablets."
        },
        correctAnswer: "b"
    },
    {
        question: "Which assessment data would provide the most accurate determination of proper placement of a nasogastric tube?",
        answers: {
            a: "Aspirating gastric contents to assure a pH value of 4 or less.",
            b: "Hearing air pass in the stomach after injecting air into the tubing.",
            c: "Examining a chest x-ray obtained after the tubing was inserted.",
            d: "Checking the remaining length of tubing to ensure that the correct length was inserted."
        },
        correctAnswer: "c"
    },
    {
        question: "The nurse is caring for a client who is receiving 24-hour total parenteral nutrition (TPN) via a central line at 54 ml/hr. When initially assessing the client, the nurse notes that the TPN solution has run out and the next TPN solution is not available. What immediate action should the LPN/LVN take?",
        answers: {
            a: "Infuse normal saline at a keep vein open rate.",
            b: "Discontinue the IV and flush the port with heparin.",
            c: "Infuse 10 percent dextrose and water at 54 ml/hr.",
            d: "Obtain a stat blood glucose level and notify the healthcare provider."
        },
        correctAnswer: "c"
    },
    {
        question: "When assisting an 82-year-old client to ambulate, it is important for the LPN/LVN to realize that the center of gravity for an elderly person is the",
        answers: {
            a: "Arms.",
            b: "Upper torso.",
            c: "Head.",
            d: "Feet."
        },
        correctAnswer: "b"
    },
    {
        question: "In developing a plan of care for a client with dementia, the LPN/LVN should remember that confusion in the elderly",
        answers: {
            a: "is to be expected, and progresses with age.",
            b: "often follows relocation to new surroundings.",
            c: "is a result of irreversible brain pathology.",
            d: "can be prevented with adequate sleep."
        },
        correctAnswer: "b"
    },
    {
        question: "An elderly male client who suffered a cerebral vascular accident is receiving tube feedings via a gastrostomy tube. The LPN knows that the best position for this client during administration of the feedings is",
        answers: {
            a: "prone.",
            b: "Fowler's.",
            c: "Sims'.",
            d: "supine."
        },
        correctAnswer: "b"
    },
    {
        question: "The nurse notices that the mother of a 9-year-old Vietnamese child always looks at the floor when she talks to the nurse. What action should the LPN take?",
        answers: {
            a: "Talk directly to the child instead of the mother.",
            b: "Continue asking the mother questions about the child.",
            c: "Ask another nurse to interview the mother now.",
            d: "Tell the mother politely to look at you when answering."
        },
        correctAnswer: "b"
    },
    {
        question: "When conducting an admission assessment, the LPN should ask the client about the use of complimentary healing practices. Which statement is accurate regarding the use of these practices?",
        answers: {
            a: "Complimentary healing practices interfere with the efficacy of the medical model of treatment.",
            b: "Conventional medications are likely to interact with folk remedies and cause adverse effects.",
            c: "Many complimentary healing practices can be used in conjunction with conventional practices.",
            d: "Conventional medical practices will ultimately replace the use of complimentary healing practices."
        },
        correctAnswer: "c"
    },
    {
        question: "A young mother of three children complains of increased anxiety during her annual physical exam. What information should the LPN/LVN obtain first?",
        answers: {
            a: "Sexual activity patterns.",
            b: "Nutritional history.",
            c: "Leisure activities.",
            d: "Financial stressors."
        },
        correctAnswer: "b"
    },
    {
        question: "Three days following surgery, a male client observes his colostomy for the first time. He becomes quite upset and tells the LPN that it is much bigger than he expected. What is the best response by the nurse?",
        answers: {
            a: "Reassure the client that he will become accustomed to the stoma appearance in time.",
            b: "Instruct the client that the stoma will become smaller when the initial swelling diminishes.",
            c: "Offer to contact a member of the local ostomy support group to help him with his concerns.",
            d: "Encourage the client to handle the stoma equipment to gain confidence with the procedure."
        },
        correctAnswer: "b"
    },
    {
        question: "At the time of the first dressing change, the client refuses to look at her mastectomy incision. The LPN tells the client that the incision is healing well, but the client refuses to talk about it. What would be an appropriate response to this client's silence?",
        answers: {
            a: "It is normal to feel angry and depressed, but the sooner you deal with this surgery, the better you will feel.",
            b: "Looking at your incision can be frightening, but facing this fear is a necessary part of your recovery.",
            c: "It is OK if you don't want to talk about your surgery. I will be available when you are ready.",
            d: "I will ask a woman who has had a mastectomy to come by and share her experiences with you."
        },
        correctAnswer: "c"
    }
];

const myQuestions3 = [
    {
        "question": "The doctor orders Lasix 40mg to be given BID, but you have 20mg tablets on hand. How many tablets will you administer per dose?",
        "answers": {
            "a": "1 tablet",
            "b": "2 tablets",
            "c": "3 tablets",
            "d": "4 tablets"
        },
        "correctAnswer": "b"
    },
    {
        "question": "A doctor orders 10mg of an antiemetic medication. The medication available is in a liquid form with a concentration of 50mg/ml. How many milliliters will you administer?",
        "answers": {
            "a": "0.1 ml",
            "b": "0.2 ml",
            "c": "0.5 ml",
            "d": "1 ml"
        },
        "correctAnswer": "b"
    },
    {
        "question": "The order is for 10-30ml of aluminum hydroxide, and the dose required is 13.5ml. How many tablespoons will you administer?",
        "answers": {
            "a": "1 tablespoon",
            "b": "2 tablespoons",
            "c": "3 tablespoons",
            "d": "4 tablespoons"
        },
        "correctAnswer": "a"
    },
    {
        "question": "What is an appropriate intervention to prevent urinary tract infections in patients?",
        "answers": {
            "a": "Limit fluid intake",
            "b": "Encourage fluid intake",
            "c": "Apply heat to the abdomen",
            "d": "Administer antibiotics prophylactically"
        },
        "correctAnswer": "b"
    },
    {
        "question": "What should the nurse do to prevent infection in a patient with a urinary catheter?",
        "answers": {
            "a": "Clean the catheter with alcohol daily",
            "b": "Replace the catheter weekly",
            "c": "Irrigate the catheter with 20ml of normal saline",
            "d": "Keep the catheter insertion site dry"
        },
        "correctAnswer": "b"
    },
    {
        "question": "A family asks the nurse to administer a high dose of medication to hasten a hospice patient’s death. What should the nurse understand about this request?",
        "answers": {
            "a": "It is a legal and ethical practice",
            "b": "The family has the right to request this",
            "c": "Administering a high dose to hasten death would be considered murder",
            "d": "The patient’s comfort should always come first"
        },
        "correctAnswer": "c"
    },
    {
        "question": "What should the nurse encourage a spouse to do when the patient is at the end of life and feeling hopeless?",
        "answers": {
            "a": "Spend time with the patient and listen to fulfill the patient’s expectations",
            "b": "Leave the patient alone to rest",
            "c": "Discuss financial arrangements",
            "d": "Make future plans to uplift the patient’s spirits"
        },
        "correctAnswer": "a"
    },
    {
        "question": "When checking a patient’s input and output, which item should be measured as fluid intake?",
        "answers": {
            "a": "Pudding",
            "b": "Milk",
            "c": "Bread",
            "d": "Applesauce"
        },
        "correctAnswer": "b"
    },
    {
        "question": "What should a nurse do if a patient’s restraint is attached to the bed wheel?",
        "answers": {
            "a": "Leave it as it is",
            "b": "Adjust it to the bed frame",
            "c": "Remove the restraint completely",
            "d": "Attach it to the side rail"
        },
        "correctAnswer": "b"
    },
    {
        "question": "What is the next step after holding a patient’s ear for administering medication?",
        "answers": {
            "a": "Clean the ear canal",
            "b": "Administer the medication into the ear canal",
            "c": "Apply a cotton ball to the ear",
            "d": "Check for earwax blockage"
        },
        "correctAnswer": "b"
    },
    {
        "question": "What should the nurse do for a patient who is agitated before dialysis and speaks very little English?",
        "answers": {
            "a": "Administer a sedative",
            "b": "Cancel the dialysis session",
            "c": "Find a translator to determine the reason for agitation",
            "d": "Ignore the agitation and proceed"
        },
        "correctAnswer": "c"
    },
    {
        "question": "If a patient’s oxygen saturation remains at 94% during a suctioning procedure, what should the nurse do?",
        "answers": {
            "a": "Stop suctioning immediately",
            "b": "Continue suctioning",
            "c": "Increase oxygen flow rate",
            "d": "Reposition the patient"
        },
        "correctAnswer": "b"
    },
    {
        "question": "A patient reports difficulty sleeping and mentions having a glass of wine before bed. What should the nurse advise?",
        "answers": {
            "a": "Continue having wine before bed",
            "b": "Avoid alcohol completely",
            "c": "Have wine 3 hours before going to bed",
            "d": "Increase wine intake"
        },
        "correctAnswer": "b"
    },
    {
        "question": "What should the nurse do if a patient is confused about their religion?",
        "answers": {
            "a": "Refer them to a religious leader",
            "b": "Ignore the confusion",
            "c": "Determine the patient’s spiritual orientation",
            "d": "Provide religious pamphlets"
        },
        "correctAnswer": "c"
    },
    {
        "question": "How should the nurse document a patient’s statement of being an unbeliever (agnostic)?",
        "answers": {
            "a": "Note it in the medical record as 'agnostic'",
            "b": "Disregard the statement",
            "c": "Encourage the patient to reconsider",
            "d": "Report it to the healthcare team"
        },
        "correctAnswer": "a"
    },
    {
        "question": "If the medication on hand is more than the ordered dose, what should the nurse do?",
        "answers": {
            "a": "Administer the higher dose",
            "b": "Calculate to adjust to the proper dose",
            "c": "Ask the pharmacy for a new medication",
            "d": "Consult the doctor"
        },
        "correctAnswer": "b"
    },
    {
        "question": "If a UAP is caring for a patient with Clostridium difficile and only wearing gloves, what should the nurse instruct the UAP to do?",
        "answers": {
            "a": "Continue wearing just gloves",
            "b": "Put on a gown",
            "c": "Wear a mask",
            "d": "Leave the room immediately"
        },
        "correctAnswer": "b"
    },
    {
        "question": "A patient with diabetic ketoacidosis has a potassium level of 6.3. What medication should the nurse administer to treat hyperkalemia?",
        "answers": {
            "a": "Insulin",
            "b": "Sodium bicarbonate",
            "c": "Kayexalate",
            "d": "Dextrose"
        },
        "correctAnswer": "c"
    },
    {
        "question": "If a patient’s blood pressure was normal but suddenly becomes high, what should the nurse do? (Select all that apply)",
        "answers": {
            "a": "Retake BP in the opposite arm",
            "b": "Find out the activity the patient was involved in",
            "c": "Increase the patient’s medications",
            "d": "Administer oxygen",
            "e": "Reassure the patient"
        },
        "correctAnswers": ["a", "b"]
    },
    {
        "question": "How should the nurse assess a radial pulse deficit?",
        "answers": {
            "a": "Take the radial pulse only",
            "b": "Compare radial and apical pulses simultaneously",
            "c": "Measure the pulse for a full minute",
            "d": "Use a Doppler device"
        },
        "correctAnswer": "b"
    },
    {
        "question": "What interventions should the nurse consider for a patient with chronic pain? (Select all that apply)",
        "answers": {
            "a": "Administer analgesics around the clock",
            "b": "Provide massages and warm compresses",
            "c": "Use a pain scale for assessment",
            "d": "Encourage the patient to ignore the pain",
            "e": "Refer to physical therapy",
            "f": "Suggest complete bed rest"
        },
        "correctAnswers": ["a", "b", "c"]
    },
    {
        "question": "What is the best way to evaluate the appropriate usage of a blood pressure cuff?",
        "answers": {
            "a": "Body mass index (BMI)",
            "b": "Patient’s age",
            "c": "Patient’s height",
            "d": "Patient’s gender"
        },
        "correctAnswer": "a"
    },
    {
        "question": "What should the nurse say to a patient who interrupts during a group meeting?",
        "answers": {
            "a": "Please wait until the meeting is over.",
            "b": "Let me finish, and you will have your turn.",
            "c": "This is not the right time.",
            "d": "Can you come back later?"
        },
        "correctAnswer": "b"
    },
    {
        "question": "How should the nurse prioritize care for a patient with multiple diagnoses?",
        "answers": {
            "a": "Address the patient’s preference first",
            "b": "Focus on the most critical diagnosis",
            "c": "Start with the easiest diagnosis to manage",
            "d": "Rotate between diagnoses"
        },
        "correctAnswer": "b"
    },
    {
        "question": "What is the best therapeutic behavior for a nurse to exhibit when a patient is crying after a mastectomy?",
        "answers": {
            "a": "Stay in the room with the patient in silence and place a hand on their forearm",
            "b": "Leave the patient alone to process emotions",
            "c": "Encourage the patient to talk about their feelings",
            "d": "Provide educational materials about mastectomy"
        },
        "correctAnswer": "a"
    },
    {
        "question": "How should the nurse assess pain quality and intensity in an adolescent?",
        "answers": {
            "a": "Use a numeric pain scale",
            "b": "Ask the patient to describe their pain",
            "c": "Rely on facial expressions",
            "d": "Consult with parents"
        },
        "correctAnswer": "b"
    },
    {
        "question": "What should the nurse do if a patient makes a mistake and drops urine during a 24-hour urine collection?",
        "answers": {
            "a": "Continue with the collection",
            "b": "Start the collection over",
            "c": "Estimate the lost amount",
            "d": "Discard the collection"
        },
        "correctAnswer": "b"
    },
    {
        "question": "What should the nurse check if a patient with a nasogastric tube was coughing a few minutes ago but is not anymore?",
        "answers": {
            "a": "Check the tube for proper placement",
            "b": "Remove the tube immediately",
            "c": "Increase the tube’s suction",
            "d": "Administer antitussive medication"
        },
        "correctAnswer": "a"
    },
    {
        "question": "What should the nurse do if a patient gives a normal brown stool when a specimen for occult blood is needed?",
        "answers": {
            "a": "Discard the stool and wait for the next one",
            "b": "Collect a specimen from the current stool",
            "c": "Ask the patient to produce another sample",
            "d": "Mix the stool with a reagent"
        },
        "correctAnswer": "b"
    },
    {
        "question": "What should the nurse do if a patient becomes agitated and needs restraint?",
        "answers": {
            "a": "Secure the restraint properly to the bed frame",
            "b": "Attach the restraint to the bed wheel",
            "c": "Leave the patient unrestrained",
            "d": "Call security"
        },
        "correctAnswer": "a"
    },
    {
        "question": "How should the nurse clean around a surgical site like a cholecystectomy?",
        "answers": {
            "a": "Clean from the center outward",
            "b": "Clean from the outer edges inward",
            "c": "Use a circular motion around the site",
            "d": "Clean only the area directly over the incision"
        },
        "correctAnswer": "a"
    },
    {
        "question": "What should the nurse check when a visitor like a grandmother wants to see a patient?",
        "answers": {
            "a": "The patient’s preferences",
            "b": "The visiting hours",
            "c": "The approved visitor list",
            "d": "The visitor’s identification"
        },
        "correctAnswer": "c"
    },
    {
        "question": "How should the nurse transport a patient with a catheter?",
        "answers": {
            "a": "Hold the catheter above the bladder level",
            "b": "Transport the patient with the catheter at bladder level",
            "c": "Clamp the catheter during transport",
            "d": "Remove the catheter before transport"
        },
        "correctAnswer": "b"
    },
    {
        "question": "What measures should be taken to address an elderly patient who is wandering? (Select all that apply)",
        "answers": {
            "a": "Place a call light or bell on the mattress",
            "b": "Escort the patient to their room",
            "c": "Orient the patient to their surroundings",
            "d": "Administer a sedative",
            "e": "Use physical restraints"
        },
        "correctAnswers": ["a", "b", "c"]
    },
    {
        "question": "What should the nurse demonstrate when teaching proper hand washing technique?",
        "answers": {
            "a": "The duration of hand washing",
            "b": "The correct hand washing technique",
            "c": "The type of soap to use",
            "d": "The frequency of hand washing"
        },
        "correctAnswer": "b"
    },
    {
        "question": "What should the nurse do if the pulse oximetry alarm goes off?",
        "answers": {
            "a": "Ignore the alarm",
            "b": "Reposition the sensor",
            "c": "Assess lung sounds and check capillary refill",
            "d": "Increase the oxygen flow rate"
        },
        "correctAnswer": "c"
    },
    {
        "question": "What should the nurse assess if a patient has cyanosis in the foot and fingertips?",
        "answers": {
            "a": "Heart rate",
            "b": "Blood pressure",
            "c": "Respiration",
            "d": "Temperature"
        },
        "correctAnswer": "c"
    },
    {
        "question": "What should the nurse ensure when a patient is pouring medication into a bottle?",
        "answers": {
            "a": "Ensure the bottle is properly closed",
            "b": "Ensure the patient measures the correct dose",
            "c": "Ensure the bottle is labeled correctly",
            "d": "Ensure the medication is mixed well"
        },
        "correctAnswer": "b"
    },
    {
        "question": "What should the nurse do if a patient is about to get up and looks for help?",
        "answers": {
            "a": "Ignore the patient",
            "b": "Help the patient lie back down in bed",
            "c": "Assist the patient in getting up",
            "d": "Call for additional help"
        },
        "correctAnswer": "b"
    },
    {
        "question": "What is a desired outcome for a patient after surgery in relation to pain?",
        "answers": {
            "a": "The patient should be able to ambulate without discomfort",
            "b": "The patient should experience no pain at all",
            "c": "The patient should be able to sleep through the pain",
            "d": "The patient should avoid using pain medication"
        },
        "correctAnswer": "a"
    },
    {
        "question": "What should the nurse check when performing ear irrigation?",
        "answers": {
            "a": "The temperature of the water",
            "b": "The size of the irrigation syringe",
            "c": "The patient’s hearing ability",
            "d": "The presence of earwax"
        },
        "correctAnswer": "a"
    },
    {
        "question": "What should the nurse advise a patient with leg inflammation after surgery who is now at home?",
        "answers": {
            "a": "Apply ice packs to the legs",
            "b": "Elevate the legs while sitting",
            "c": "Move the legs while lying on the bed and perform flexion exercises",
            "d": "Use compression stockings"
        },
        "correctAnswer": "b"
    },
    {
        "question": "What intervention can help an elderly patient who is having trouble sleeping?",
        "answers": {
            "a": "Offer a sleeping pill",
            "b": "Provide back rubs",
            "c": "Turn off all lights",
            "d": "Encourage daytime naps"
        },
        "correctAnswer": "b"
    },
    {
        "question": "How should the nurse guide an overweight patient who wants to lose weight?",
        "answers": {
            "a": "Suggest a high-protein diet",
            "b": "Discuss BMI and the importance of maintaining a BMI between 20-30",
            "c": "Advise complete fasting",
            "d": "Encourage exercise without dietary changes"
        },
        "correctAnswer": "b"
    },
    {
        "question": "What should the nurse do if the family is upset about ambulating a patient after surgery?",
        "answers": {
            "a": "Ignore the family’s concerns",
            "b": "Check the patient’s blood pressure",
            "c": "Reschedule the ambulation",
            "d": "Explain the benefits of early ambulation"
        },
        "correctAnswer": "d"
    },
    {
        "question": "What should the nurse do if the residual from a patient’s feeding tube is 150ml?",
        "answers": {
            "a": "Continue the feeding",
            "b": "Hold the feeding",
            "c": "Flush the tube with water",
            "d": "Reduce the feeding rate"
        },
        "correctAnswer": "b"
    },
    {
        "question": "What should the nurse do if a patient’s potassium level is 2.5?",
        "answers": {
            "a": "Monitor the patient",
            "b": "Administer a potassium supplement",
            "c": "Inform the doctor to administer potassium",
            "d": "Increase the patient’s fluid intake"
        },
        "correctAnswer": "c"
    },
    {
        "question": "What distinguishes objective data from subjective data in patient assessment?",
        "answers": {
            "a": "Objective data is what the patient reports",
            "b": "Objective data is what the nurse observes",
            "c": "Subjective data is measurable",
            "d": "Subjective data is observable"
        },
        "correctAnswer": "b"
    },
    {
        "question": "What should the nurse check if a COPD patient has clammy skin?",
        "answers": {
            "a": "Blood pressure",
            "b": "Heart rate",
            "c": "Respiration",
            "d": "Temperature"
        },
        "correctAnswer": "c"
    },
    {
        "question": "What is the first thing the nurse should do when receiving a patient transferred from another unit?",
        "answers": {
            "a": "Assess the patient’s ability to chew and swallow",
            "b": "Check the patient’s vital signs",
            "c": "Review the patient’s medical history",
            "d": "Introduce themselves to the patient"
        },
        "correctAnswer": "b"
    },
    {
        "question": "What should the nurse do if the medication received from the pharmacy is a higher dose than ordered?",
        "answers": {
            "a": "Administer the higher dose",
            "b": "Call the pharmacy to clarify",
            "c": "Ask the doctor for a new order",
            "d": "Discard the medication"
        },
        "correctAnswer": "b"
    },
    {
        "question": "How should the nurse respond if a CNA improperly tightens a patient’s restraint on the side of the bed?",
        "answers": {
            "a": "Leave the restraint as is",
            "b": "Demonstrate to the CNA how to properly apply the restraint",
            "c": "Remove the restraint",
            "d": "Tighten the restraint further"
        },
        "correctAnswer": "b"
    },
    {
        "question": "What should the nurse do to properly administer ear drops?",
        "answers": {
            "a": "Clean the ear canal thoroughly",
            "b": "Bring the medication closer to the ear",
            "c": "Use a cotton ball to cover the ear after administration",
            "d": "Shake the medication bottle well"
        },
        "correctAnswer": "b"
    },
    {
        "question": "What is the appropriate treatment for a patient with deep vein thrombosis in the leg?",
        "answers": {
            "a": "Ambulate the patient frequently",
            "b": "Keep the patient on bed rest",
            "c": "Apply ice packs to the leg",
            "d": "Elevate the leg"
        },
        "correctAnswer": "b"
    },
    {
        "question": "What should the nurse check if a patient in pain reports receiving medication?",
        "answers": {
            "a": "Check the last time the medication was given",
            "b": "Administer another dose immediately",
            "c": "Increase the patient’s activity level",
            "d": "Provide a warm compress"
        },
        "correctAnswer": "a"
    },
    {
        "question": "What could be a potential cause for a patient’s sodium level of 123?",
        "answers": {
            "a": "Did you drink a lot of water with ice?",
            "b": "Have you been eating salty foods?",
            "c": "Are you taking any diuretics?",
            "d": "Have you been exercising heavily?"
        },
        "correctAnswer": "c"
    },
    {
        "question": "How should the nurse document a patient’s statement of being an unbeliever (agnostic)?",
        "answers": {
            "a": "Document the statement as 'agnostic'",
            "b": "Disregard the statement",
            "c": "Encourage the patient to reconsider",
            "d": "Report it to the healthcare team"
        },
        "correctAnswer": "a"
    },
    {
        "question": "What should a CNA do if they need to pull the patient up in bed?",
        "answers": {
            "a": "Put the head of the bed down before pulling the patient up",
            "b": "Leave the head of the bed up",
            "c": "Call for assistance",
            "d": "Remove the patient’s pillows"
        },
        "correctAnswer": "a"
    },
    {
        "question": "What should the nurse do if a patient at the end of life refuses life support?",
        "answers": {
            "a": "Follow the guidelines of the ethics committee or hospital policy",
            "b": "Ignore the patient’s wishes",
            "c": "Encourage the patient to reconsider",
            "d": "Administer life support anyway"
        },
        "correctAnswer": "a"
    },
    {
        "question": "How would a nurse identify a stage 2 pressure ulcer?",
        "answers": {
            "a": "Intact skin with non-blanchable redness",
            "b": "Partial-thickness skin loss with exposed dermis",
            "c": "Full-thickness tissue loss with visible fat",
            "d": "Full-thickness tissue loss with exposed bone, tendon, or muscle"
        },
        "correctAnswer": "b"
    },
    {
        "question": "What position should the patient be in for ear irrigation?",
        "answers": {
            "a": "Affected ear upright",
            "b": "Affected ear downward",
            "c": "Lying flat on the back",
            "d": "Head tilted to the side"
        },
        "correctAnswer": "d"
    },
    {
        "question": "What should the nurse do if the skin is red after removing a dressing?",
        "answers": {
            "a": "Apply a new dressing immediately",
            "b": "Use cotton balls with an appropriate solution to clean the area",
            "c": "Leave the skin exposed to air",
            "d": "Consult a dermatologist"
        },
        "correctAnswer": "b"
    },
    {
        "question": "What is the first thing to know when transferring a patient from bed to wheelchair?",
        "answers": {
            "a": "Assess if the patient can bear weight on their lower extremities",
            "b": "Check the patient’s vital signs",
            "c": "Ensure the wheelchair is nearby",
            "d": "Get assistance from another staff member"
        },
        "correctAnswer": "a"
    },
    {
        "question": "What should the nurse do if a grandmother requests information about a young adult patient admitted to a psychiatric clinic?",
        "answers": {
            "a": "Provide the information requested",
            "b": "Ensure the patient has signed a consent form to release information to the grandmother",
            "c": "Refuse to provide any information",
            "d": "Contact the patient’s doctor for approval"
        },
        "correctAnswer": "b"
    }
]

const myQuestions4 = [
    {
        question: "Easy question for Exam 4?",
        answers: {
            a: "Answer 1",
            b: "Answer 2",
            c: "Answer 3",
            d: "Answer 4"
        },
        correctAnswer: "c"
    }
];

const myQuestions5 = [
    {
        question: "Easy question for Exam 5?",
        answers: {
            a: "Answer 1",
            b: "Answer 2",
            c: "Answer 3",
            d: "Answer 4"
        },
        correctAnswer: "d"
    }
];


  