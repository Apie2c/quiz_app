import React, { useState, useEffect, useRef } from 'react';
import { Clock, Edit2, Trash2, Plus, Download, Eye, EyeOff, RotateCcw, SkipForward, X, Moon, Sun, LogOut, Settings, Award, Trophy, Target } from 'lucide-react';

// ============================================
// CONFIGURATION - CHANGE THIS TO SHOW/HIDE ADMIN BUTTON
// ============================================
const SHOW_ADMIN_BUTTON = true; // Set to false to hide admin login button
// ============================================

const THEMES = {
  light: {
    bg: 'bg-gradient-to-br from-blue-50 to-indigo-100',
    card: 'bg-white',
    text: 'text-gray-800',
    textSecondary: 'text-gray-600',
    border: 'border-gray-200',
    primary: 'bg-blue-600 hover:bg-blue-700',
    secondary: 'bg-gray-600 hover:bg-gray-700',
    danger: 'bg-red-600 hover:bg-red-700',
    success: 'bg-green-600 hover:bg-green-700',
    input: 'bg-white border-gray-300',
    shadow: 'shadow-lg'
  },
  dark: {
    bg: 'bg-gradient-to-br from-gray-900 to-gray-800',
    card: 'bg-gray-800',
    text: 'text-gray-100',
    textSecondary: 'text-gray-400',
    border: 'border-gray-700',
    primary: 'bg-blue-700 hover:bg-blue-600',
    secondary: 'bg-gray-700 hover:bg-gray-600',
    danger: 'bg-red-700 hover:bg-red-600',
    success: 'bg-green-700 hover:bg-green-600',
    input: 'bg-gray-700 border-gray-600 text-white',
    shadow: 'shadow-2xl'
  },
  ocean: {
    bg: 'bg-gradient-to-br from-cyan-100 to-blue-200',
    card: 'bg-gradient-to-br from-white to-cyan-50',
    text: 'text-cyan-900',
    textSecondary: 'text-cyan-700',
    border: 'border-cyan-300',
    primary: 'bg-cyan-600 hover:bg-cyan-700',
    secondary: 'bg-teal-600 hover:bg-teal-700',
    danger: 'bg-red-600 hover:bg-red-700',
    success: 'bg-emerald-600 hover:bg-emerald-700',
    input: 'bg-white border-cyan-300',
    shadow: 'shadow-lg shadow-cyan-200'
  }
};

const QuizApp = () => {
  const [theme, setTheme] = useState('light');
  const [screen, setScreen] = useState('login');
  const [user, setUser] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [categories, setCategories] = useState({});
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedSubCategory, setSelectedSubCategory] = useState('');
  const [questions, setQuestions] = useState([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState([]);
  const [timeLeft, setTimeLeft] = useState(30);
  const [quizStartTime, setQuizStartTime] = useState(null);
  const [showTranscript, setShowTranscript] = useState(false);
  const [loading, setLoading] = useState(false);
  const timerRef = useRef(null);

  const t = THEMES[theme];

  useEffect(() => {
    loadDataFromDatabase();
  }, []);

  useEffect(() => {
    if (screen === 'quiz' && questions.length > 0) {
      const currentQ = questions[currentQuestionIndex];
      setTimeLeft(currentQ.timeLimit || 30);
      startTimer();
    }
    return () => clearTimer();
  }, [currentQuestionIndex, screen]);

  const loadDataFromDatabase = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/get-categories');
      const data = await response.json();
      
      if (data.success && data.categories) {
        setCategories(data.categories);
      } else {
        const defaultData = getDefaultCategories();
        setCategories(defaultData);
        await saveDataToDatabase(defaultData);
      }
    } catch (error) {
      console.error('Failed to load data:', error);
      setCategories(getDefaultCategories());
    }
    setLoading(false);
  };

  const saveDataToDatabase = async (data) => {
    try {
      const response = await fetch('/api/save-categories', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ categories: data }),
      });
      
      const result = await response.json();
      if (!result.success) {
        console.error('Failed to save data:', result.error);
      }
    } catch (error) {
      console.error('Failed to save data:', error);
    }
  };

  const getDefaultCategories = () => ({
    'General Knowledge': {
      'History': [
        {
          question: 'What year did World War II end?',
          options: ['1943', '1944', '1945', '1946'],
          correct: 2,
          timeLimit: 30
        },
        {
          question: 'Who was the first President of the United States?',
          options: ['Thomas Jefferson', 'George Washington', 'John Adams', 'Benjamin Franklin'],
          correct: 1,
          timeLimit: 30
        }
      ],
      'Geography': [
        {
          question: 'What is the capital of France?',
          options: ['London', 'Berlin', 'Paris', 'Madrid'],
          correct: 2,
          timeLimit: 20
        },
        {
          question: 'Which is the largest ocean on Earth?',
          options: ['Atlantic Ocean', 'Indian Ocean', 'Arctic Ocean', 'Pacific Ocean'],
          correct: 3,
          timeLimit: 25
        }
      ]
    },
    'Science': {
      'Physics': [
        {
          question: 'What is the speed of light in vacuum?',
          options: ['300,000 km/s', '150,000 km/s', '450,000 km/s', '200,000 km/s'],
          correct: 0,
          timeLimit: 35
        }
      ],
      'Biology': [
        {
          question: 'What is the powerhouse of the cell?',
          options: ['Nucleus', 'Mitochondria', 'Ribosome', 'Chloroplast'],
          correct: 1,
          timeLimit: 25
        }
      ]
    }
  });

  const startTimer = () => {
    clearTimer();
    timerRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          handleTimeUp();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const clearTimer = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };

  const handleTimeUp = () => {
    clearTimer();
    const timeTaken = (questions[currentQuestionIndex].timeLimit || 30);
    const newAnswer = {
      questionIndex: currentQuestionIndex,
      selectedAnswer: null,
      timeTaken,
      correct: false,
      timedOut: true
    };
    setAnswers([...answers, newAnswer]);
    
    setTimeout(() => {
      if (currentQuestionIndex < questions.length - 1) {
        setCurrentQuestionIndex(currentQuestionIndex + 1);
      } else {
        finishQuiz([...answers, newAnswer]);
      }
    }, 3000);
  };

  const handleLogin = (username, adminLogin = false, showAdminScreen = false) => {
    if (showAdminScreen) {
      setScreen('adminLogin');
      return;
    }
    setUser(username);
    setIsAdmin(adminLogin);
    if (adminLogin) {
      setScreen('admin');
    } else {
      setScreen('categorySelect');
    }
  };

  const handleLogout = () => {
    setUser(null);
    setIsAdmin(false);
    setScreen('login');
    setSelectedCategory('');
    setSelectedSubCategory('');
    setQuestions([]);
    setAnswers([]);
  };

  const shuffleArray = (array) => {
    const newArray = [...array];
    for (let i = newArray.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
    }
    return newArray;
  };

  const startQuiz = () => {
    if (!selectedCategory || !selectedSubCategory) return;
    
    const categoryQuestions = categories[selectedCategory][selectedSubCategory];
    const shuffledQuestions = shuffleArray(categoryQuestions).map(q => ({
      ...q,
      options: shuffleArray(q.options)
    }));
    
    setQuestions(shuffledQuestions);
    setCurrentQuestionIndex(0);
    setAnswers([]);
    setQuizStartTime(Date.now());
    setScreen('quiz');
  };

  const handleAnswer = (answerIndex) => {
    clearTimer();
    const currentQ = questions[currentQuestionIndex];
    const originalQuestion = categories[selectedCategory][selectedSubCategory].find(
      q => q.question === currentQ.question
    );
    const correctAnswerText = originalQuestion.options[originalQuestion.correct];
    const isCorrect = currentQ.options[answerIndex] === correctAnswerText;
    
    const timeTaken = (currentQ.timeLimit || 30) - timeLeft;
    const newAnswer = {
      questionIndex: currentQuestionIndex,
      selectedAnswer: answerIndex,
      timeTaken,
      correct: isCorrect
    };
    
    setAnswers([...answers, newAnswer]);
    
    setTimeout(() => {
      if (currentQuestionIndex < questions.length - 1) {
        setCurrentQuestionIndex(currentQuestionIndex + 1);
      } else {
        finishQuiz([...answers, newAnswer]);
      }
    }, 2000);
  };

  const skipQuestion = () => {
    clearTimer();
    const timeTaken = (questions[currentQuestionIndex].timeLimit || 30) - timeLeft;
    const newAnswer = {
      questionIndex: currentQuestionIndex,
      selectedAnswer: null,
      timeTaken,
      correct: false,
      skipped: true
    };
    setAnswers([...answers, newAnswer]);
    
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    } else {
      finishQuiz([...answers, newAnswer]);
    }
  };

  const finishQuiz = (finalAnswers) => {
    clearTimer();
    setAnswers(finalAnswers);
    setScreen('results');
  };

  const calculateScore = () => {
    const correct = answers.filter(a => a.correct).length;
    const total = questions.length;
    const percentage = Math.round((correct / total) * 100);
    return { correct, total, percentage };
  };

  const getGrade = (percentage) => {
    if (percentage >= 90) return 'A+';
    if (percentage >= 85) return 'A';
    if (percentage >= 80) return 'A-';
    if (percentage >= 75) return 'B+';
    if (percentage >= 70) return 'B';
    if (percentage >= 65) return 'B-';
    if (percentage >= 60) return 'C+';
    if (percentage >= 55) return 'C';
    if (percentage >= 50) return 'C-';
    return 'F';
  };

  const getRemarks = (percentage) => {
    if (percentage >= 90) return 'Outstanding performance! You have mastered this topic excellently.';
    if (percentage >= 75) return 'Great job! You have a strong understanding of the subject.';
    if (percentage >= 60) return 'Good effort! Keep practicing to improve your knowledge.';
    return 'Keep studying! Review the material and try again to improve your score.';
  };

  const downloadTranscript = () => {
    const { correct, total, percentage } = calculateScore();
    const grade = getGrade(percentage);
    const remarks = getRemarks(percentage);
    const totalTime = answers.reduce((sum, a) => sum + a.timeTaken, 0);

    let transcriptText = `QUIZ TRANSCRIPT\n\n`;
    transcriptText += `Student: ${user}\n`;
    transcriptText += `Category: ${selectedCategory}\n`;
    transcriptText += `Sub-Category: ${selectedSubCategory}\n`;
    transcriptText += `Date: ${new Date().toLocaleDateString()}\n\n`;
    transcriptText += `SCORE: ${correct}/${total} (${percentage}%)\n`;
    transcriptText += `GRADE: ${grade}\n`;
    transcriptText += `REMARKS: ${remarks}\n\n`;
    transcriptText += `Total Time: ${Math.floor(totalTime / 60)}m ${totalTime % 60}s\n\n`;
    transcriptText += `DETAILED RESULTS:\n\n`;

    answers.forEach((answer, idx) => {
      const q = questions[answer.questionIndex];
      const originalQ = categories[selectedCategory][selectedSubCategory].find(
        quest => quest.question === q.question
      );
      const correctAnswerText = originalQ.options[originalQ.correct];
      
      transcriptText += `Question ${idx + 1}: ${q.question}\n`;
      transcriptText += `Your Answer: ${answer.selectedAnswer !== null ? q.options[answer.selectedAnswer] : 'Not answered'}\n`;
      transcriptText += `Correct Answer: ${correctAnswerText}\n`;
      transcriptText += `Time Taken: ${answer.timeTaken}s\n`;
      transcriptText += `Result: ${answer.correct ? 'Correct ✓' : 'Incorrect ✗'}\n\n`;
    });

    const blob = new Blob([transcriptText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `quiz-transcript-${user}-${Date.now()}.txt`;
    a.click();
  };

  const addCategory = async (categoryName) => {
    const newCategories = { ...categories, [categoryName]: {} };
    setCategories(newCategories);
    await saveDataToDatabase(newCategories);
  };

  const deleteCategory = async (categoryName) => {
    const newCategories = { ...categories };
    delete newCategories[categoryName];
    setCategories(newCategories);
    await saveDataToDatabase(newCategories);
  };

  const addSubCategory = async (category, subCategoryName) => {
    const newCategories = {
      ...categories,
      [category]: {
        ...categories[category],
        [subCategoryName]: []
      }
    };
    setCategories(newCategories);
    await saveDataToDatabase(newCategories);
  };

  const deleteSubCategory = async (category, subCategory) => {
    const newCategories = { ...categories };
    delete newCategories[category][subCategory];
    setCategories(newCategories);
    await saveDataToDatabase(newCategories);
  };

  const addQuestion = async (category, subCategory, question) => {
    const newCategories = {
      ...categories,
      [category]: {
        ...categories[category],
        [subCategory]: [...(categories[category][subCategory] || []), question]
      }
    };
    setCategories(newCategories);
    await saveDataToDatabase(newCategories);
  };

  const deleteQuestion = async (category, subCategory, questionIndex) => {
    const newCategories = {
      ...categories,
      [category]: {
        ...categories[category],
        [subCategory]: categories[category][subCategory].filter((_, idx) => idx !== questionIndex)
      }
    };
    setCategories(newCategories);
    await saveDataToDatabase(newCategories);
  };

  const updateQuestion = async (category, subCategory, questionIndex, updatedQuestion) => {
    const newCategories = {
      ...categories,
      [category]: {
        ...categories[category],
        [subCategory]: categories[category][subCategory].map((q, idx) => 
          idx === questionIndex ? updatedQuestion : q
        )
      }
    };
    setCategories(newCategories);
    await saveDataToDatabase(newCategories);
  };

  return (
    <div className={`min-h-screen ${t.bg} ${t.text} transition-all duration-300`}>
      <div className="absolute top-4 right-4 flex gap-2">
        <button
          onClick={() => setTheme(theme === 'light' ? 'dark' : theme === 'dark' ? 'ocean' : 'light')}
          className={`p-2 rounded-full ${t.card} ${t.shadow} transition-all hover:scale-110`}
        >
          {theme === 'light' ? <Moon size={20} /> : theme === 'dark' ? <Sun size={20} /> : '🌊'}
        </button>
        {user && (
          <button
            onClick={handleLogout}
            className={`p-2 rounded-full ${t.card} ${t.shadow} transition-all hover:scale-110`}
          >
            <LogOut size={20} />
          </button>
        )}
      </div>

      {screen === 'login' && <LoginScreen onLogin={handleLogin} theme={t} />}
      {screen === 'adminLogin' && <AdminLoginScreen onLogin={handleLogin} onBack={() => setScreen('login')} theme={t} />}
      {screen === 'admin' && <AdminPanel categories={categories} onAddCategory={addCategory} onDeleteCategory={deleteCategory} onAddSubCategory={addSubCategory} onDeleteSubCategory={deleteSubCategory} onAddQuestion={addQuestion} onDeleteQuestion={deleteQuestion} onUpdateQuestion={updateQuestion} theme={t} />}
      {screen === 'categorySelect' && <CategorySelect categories={categories} selectedCategory={selectedCategory} setSelectedCategory={setSelectedCategory} selectedSubCategory={selectedSubCategory} setSelectedSubCategory={setSelectedSubCategory} onStart={startQuiz} theme={t} user={user} />}
      {screen === 'quiz' && <QuizScreen question={questions[currentQuestionIndex]} questionNumber={currentQuestionIndex + 1} totalQuestions={questions.length} timeLeft={timeLeft} onAnswer={handleAnswer} onSkip={skipQuestion} onEnd={() => finishQuiz(answers)} theme={t} answers={answers} />}
      {screen === 'results' && <ResultsScreen answers={answers} questions={questions} user={user} category={selectedCategory} subCategory={selectedSubCategory} onRetake={startQuiz} onNewQuiz={() => setScreen('categorySelect')} onExit={handleLogout} showTranscript={showTranscript} setShowTranscript={setShowTranscript} onDownload={downloadTranscript} theme={t} calculateScore={calculateScore} getGrade={getGrade} getRemarks={getRemarks} categories={categories} />}
    </div>
  );
};

const LoginScreen = ({ onLogin, theme }) => {
  const [username, setUsername] = useState('');

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className={`${theme.card} ${theme.shadow} rounded-2xl p-8 max-w-md w-full`}>
        <div className="text-center mb-8">
          <div className="w-24 h-24 mx-auto mb-4 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
            <Trophy size={48} className="text-white" />
          </div>
          <h1 className="text-3xl font-bold mb-2">Quiz Master</h1>
          <p className={theme.textSecondary}>Test your knowledge and track your progress</p>
        </div>
        
        <input
          type="text"
          placeholder="Enter your name"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          className={`w-full p-3 rounded-lg ${theme.input} border ${theme.border} mb-4 focus:outline-none focus:ring-2 focus:ring-blue-500`}
          onKeyPress={(e) => e.key === 'Enter' && username && onLogin(username)}
        />
        
        <button
          onClick={() => username && onLogin(username)}
          disabled={!username}
          className={`w-full ${theme.primary} text-white p-3 rounded-lg font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed`}
        >
          Start Quiz
        </button>

        {SHOW_ADMIN_BUTTON && (
          <button
            onClick={() => onLogin(null, false, true)}
            className={`w-full ${theme.secondary} text-white p-3 rounded-lg font-semibold mt-3 transition-all`}
          >
            <Settings size={18} className="inline mr-2" />
            Admin Login
          </button>
        )}
      </div>
    </div>
  );
};

const AdminLoginScreen = ({ onLogin, onBack, theme }) => {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleLogin = () => {
    if (password === 'admin123') {
      onLogin('Admin', true, false);
    } else {
      setError('Invalid password');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className={`${theme.card} ${theme.shadow} rounded-2xl p-8 max-w-md w-full`}>
        <h1 className="text-3xl font-bold mb-6 text-center">Admin Login</h1>
        
        <input
          type="password"
          placeholder="Enter admin password"
          value={password}
          onChange={(e) => {setPassword(e.target.value); setError('');}}
          className={`w-full p-3 rounded-lg ${theme.input} border ${theme.border} mb-4 focus:outline-none focus:ring-2 focus:ring-blue-500`}
          onKeyPress={(e) => e.key === 'Enter' && handleLogin()}
        />
        
        {error && <p className="text-red-500 mb-4 text-sm">{error}</p>}
        <p className={`${theme.textSecondary} text-sm mb-4`}>Default password: admin123</p>
        
        <button
          onClick={handleLogin}
          className={`w-full ${theme.primary} text-white p-3 rounded-lg font-semibold mb-3 transition-all`}
        >
          Login as Admin
        </button>
        
        <button
          onClick={onBack}
          className={`w-full ${theme.secondary} text-white p-3 rounded-lg font-semibold transition-all`}
        >
          Back
        </button>
      </div>
    </div>
  );
};

const CategorySelect = ({ categories, selectedCategory, setSelectedCategory, selectedSubCategory, setSelectedSubCategory, onStart, theme, user }) => {
  const subCategories = selectedCategory ? Object.keys(categories[selectedCategory]) : [];

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className={`${theme.card} ${theme.shadow} rounded-2xl p-8 max-w-2xl w-full`}>
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold mb-2">Welcome, {user}!</h2>
          <p className={theme.textSecondary}>Select a quiz category to begin</p>
        </div>

        <div className="flex gap-3 mb-6 flex-wrap">
          <button
            onClick={() => setShowTranscript(!showTranscript)}
            className={`flex-1 min-w-[150px] ${theme.primary} text-white p-3 rounded-lg font-semibold transition-all`}
          >
            {showTranscript ? <EyeOff size={18} className="inline mr-2" /> : <Eye size={18} className="inline mr-2" />}
            {showTranscript ? 'Hide' : 'View'} Transcript
          </button>
          <button
            onClick={onDownload}
            className={`flex-1 min-w-[150px] ${theme.success} text-white p-3 rounded-lg font-semibold transition-all`}
          >
            <Download size={18} className="inline mr-2" />
            Download PDF
          </button>
        </div>

        <div className="flex gap-3 flex-wrap">
          <button
            onClick={onRetake}
            className={`flex-1 min-w-[150px] ${theme.primary} text-white p-3 rounded-lg font-semibold transition-all`}
          >
            <RotateCcw size={18} className="inline mr-2" />
            Retake Quiz
          </button>
          <button
            onClick={onNewQuiz}
            className={`flex-1 min-w-[150px] ${theme.secondary} text-white p-3 rounded-lg font-semibold transition-all`}
          >
            <Target size={18} className="inline mr-2" />
            New Category
          </button>
          <button
            onClick={onExit}
            className={`flex-1 min-w-[150px] ${theme.danger} text-white p-3 rounded-lg font-semibold transition-all`}
          >
            <LogOut size={18} className="inline mr-2" />
            Exit
          </button>
        </div>

        {showTranscript && (
          <div className={`mt-8 p-6 ${theme.input} border ${theme.border} rounded-lg max-h-96 overflow-y-auto`}>
            <h3 className="text-xl font-bold mb-4">Quiz Transcript</h3>
            <div className={`mb-4 pb-4 border-b ${theme.border}`}>
              <p><strong>Student:</strong> {user}</p>
              <p><strong>Category:</strong> {category}</p>
              <p><strong>Sub-Category:</strong> {subCategory}</p>
              <p><strong>Date:</strong> {new Date().toLocaleDateString()}</p>
              <p><strong>Total Time:</strong> {Math.floor(totalTime / 60)}m {totalTime % 60}s</p>
            </div>
            
            {answers.map((answer, idx) => {
              const q = questions[answer.questionIndex];
              const originalQ = categories[category][subCategory].find(
                quest => quest.question === q.question
              );
              const correctAnswerText = originalQ.options[originalQ.correct];
              
              return (
                <div key={idx} className={`mb-4 pb-4 border-b ${theme.border}`}>
                  <p className="font-semibold mb-2">Q{idx + 1}: {q.question}</p>
                  <p className={theme.textSecondary}>
                    Your Answer: {answer.selectedAnswer !== null ? q.options[answer.selectedAnswer] : 'Not answered'}
                    {answer.skipped && ' (Skipped)'}
                    {answer.timedOut && ' (Time expired)'}
                  </p>
                  <p className={theme.textSecondary}>Correct Answer: {correctAnswerText}</p>
                  <p className={theme.textSecondary}>Time: {answer.timeTaken}s</p>
                  <p className={answer.correct ? 'text-green-500' : 'text-red-500'}>
                    {answer.correct ? '✓ Correct' : '✗ Incorrect'}
                  </p>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

const AdminPanel = ({ categories, onAddCategory, onDeleteCategory, onAddSubCategory, onDeleteSubCategory, onAddQuestion, onDeleteQuestion, onUpdateQuestion, theme }) => {
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedSubCategory, setSelectedSubCategory] = useState('');
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newSubCategoryName, setNewSubCategoryName] = useState('');
  const [editingQuestion, setEditingQuestion] = useState(null);
  const [newQuestion, setNewQuestion] = useState({
    question: '',
    options: ['', '', '', ''],
    correct: 0,
    timeLimit: 30
  });

  const handleAddQuestion = () => {
    if (selectedCategory && selectedSubCategory && newQuestion.question && newQuestion.options.every(o => o)) {
      onAddQuestion(selectedCategory, selectedSubCategory, newQuestion);
      setNewQuestion({
        question: '',
        options: ['', '', '', ''],
        correct: 0,
        timeLimit: 30
      });
    }
  };

  const handleUpdateQuestion = () => {
    if (editingQuestion !== null) {
      onUpdateQuestion(selectedCategory, selectedSubCategory, editingQuestion, newQuestion);
      setEditingQuestion(null);
      setNewQuestion({
        question: '',
        options: ['', '', '', ''],
        correct: 0,
        timeLimit: 30
      });
    }
  };

  const startEditQuestion = (idx) => {
    const q = categories[selectedCategory][selectedSubCategory][idx];
    setNewQuestion(q);
    setEditingQuestion(idx);
  };

  return (
    <div className="min-h-screen p-4">
      <div className={`${theme.card} ${theme.shadow} rounded-2xl p-8 max-w-6xl mx-auto`}>
        <h1 className="text-3xl font-bold mb-8 text-center">Admin Panel</h1>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
          <div>
            <h2 className="text-xl font-bold mb-4">Categories</h2>
            <div className="flex gap-2 mb-4">
              <input
                type="text"
                placeholder="New category name"
                value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value)}
                className={`flex-1 p-2 rounded ${theme.input} border ${theme.border}`}
              />
              <button
                onClick={() => {onAddCategory(newCategoryName); setNewCategoryName('');}}
                className={`${theme.success} text-white px-4 py-2 rounded`}
              >
                <Plus size={18} />
              </button>
            </div>
            <div className="space-y-2">
              {Object.keys(categories).map(cat => (
                <div key={cat} className={`flex items-center justify-between p-3 rounded ${theme.input} border ${theme.border}`}>
                  <span className="font-semibold">{cat}</span>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setSelectedCategory(cat)}
                      className={`${theme.primary} text-white px-3 py-1 rounded text-sm`}
                    >
                      Select
                    </button>
                    <button
                      onClick={() => onDeleteCategory(cat)}
                      className={`${theme.danger} text-white px-3 py-1 rounded text-sm`}
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {selectedCategory && (
            <div>
              <h2 className="text-xl font-bold mb-4">Sub-Categories of {selectedCategory}</h2>
              <div className="flex gap-2 mb-4">
                <input
                  type="text"
                  placeholder="New sub-category"
                  value={newSubCategoryName}
                  onChange={(e) => setNewSubCategoryName(e.target.value)}
                  className={`flex-1 p-2 rounded ${theme.input} border ${theme.border}`}
                />
                <button
                  onClick={() => {onAddSubCategory(selectedCategory, newSubCategoryName); setNewSubCategoryName('');}}
                  className={`${theme.success} text-white px-4 py-2 rounded`}
                >
                  <Plus size={18} />
                </button>
              </div>
              <div className="space-y-2">
                {Object.keys(categories[selectedCategory]).map(subCat => (
                  <div key={subCat} className={`flex items-center justify-between p-3 rounded ${theme.input} border ${theme.border}`}>
                    <span>{subCat}</span>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setSelectedSubCategory(subCat)}
                        className={`${theme.primary} text-white px-3 py-1 rounded text-sm`}
                      >
                        Select
                      </button>
                      <button
                        onClick={() => onDeleteSubCategory(selectedCategory, subCat)}
                        className={`${theme.danger} text-white px-3 py-1 rounded text-sm`}
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {selectedCategory && selectedSubCategory && (
          <div>
            <h2 className="text-xl font-bold mb-4">
              Questions for {selectedCategory} - {selectedSubCategory}
            </h2>

            <div className={`p-6 rounded-lg ${theme.input} border ${theme.border} mb-6`}>
              <h3 className="font-bold mb-4">{editingQuestion !== null ? 'Edit Question' : 'Add New Question'}</h3>
              <input
                type="text"
                placeholder="Question"
                value={newQuestion.question}
                onChange={(e) => setNewQuestion({...newQuestion, question: e.target.value})}
                className={`w-full p-2 rounded ${theme.input} border ${theme.border} mb-3`}
              />
              
              {newQuestion.options.map((opt, idx) => (
                <div key={idx} className="flex gap-2 mb-2">
                  <input
                    type="text"
                    placeholder={`Option ${idx + 1}`}
                    value={opt}
                    onChange={(e) => {
                      const newOpts = [...newQuestion.options];
                      newOpts[idx] = e.target.value;
                      setNewQuestion({...newQuestion, options: newOpts});
                    }}
                    className={`flex-1 p-2 rounded ${theme.input} border ${theme.border}`}
                  />
                  <button
                    onClick={() => setNewQuestion({...newQuestion, correct: idx})}
                    className={`px-4 py-2 rounded ${newQuestion.correct === idx ? theme.success : theme.secondary} text-white`}
                  >
                    {newQuestion.correct === idx ? '✓ Correct' : 'Set Correct'}
                  </button>
                </div>
              ))}

              <div className="flex gap-2 items-center mt-4">
                <label className="font-semibold">Time Limit (seconds):</label>
                <input
                  type="number"
                  value={newQuestion.timeLimit}
                  onChange={(e) => setNewQuestion({...newQuestion, timeLimit: parseInt(e.target.value) || 30})}
                  className={`p-2 rounded ${theme.input} border ${theme.border} w-24`}
                  min="10"
                  max="300"
                />
              </div>

              <div className="flex gap-2 mt-4">
                <button
                  onClick={editingQuestion !== null ? handleUpdateQuestion : handleAddQuestion}
                  className={`${theme.success} text-white px-6 py-2 rounded font-semibold`}
                >
                  {editingQuestion !== null ? 'Update Question' : 'Add Question'}
                </button>
                {editingQuestion !== null && (
                  <button
                    onClick={() => {
                      setEditingQuestion(null);
                      setNewQuestion({question: '', options: ['', '', '', ''], correct: 0, timeLimit: 30});
                    }}
                    className={`${theme.secondary} text-white px-6 py-2 rounded font-semibold`}
                  >
                    Cancel
                  </button>
                )}
              </div>
            </div>

            <div className="space-y-4">
              {categories[selectedCategory][selectedSubCategory].map((q, idx) => (
                <div key={idx} className={`p-4 rounded-lg ${theme.input} border ${theme.border}`}>
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="font-bold flex-1">Q{idx + 1}: {q.question}</h4>
                    <div className="flex gap-2">
                      <button
                        onClick={() => startEditQuestion(idx)}
                        className={`${theme.primary} text-white px-3 py-1 rounded text-sm`}
                      >
                        <Edit2 size={14} />
                      </button>
                      <button
                        onClick={() => onDeleteQuestion(selectedCategory, selectedSubCategory, idx)}
                        className={`${theme.danger} text-white px-3 py-1 rounded text-sm`}
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                  <div className="space-y-1 text-sm">
                    {q.options.map((opt, optIdx) => (
                      <p key={optIdx} className={q.correct === optIdx ? 'text-green-500 font-semibold' : ''}>
                        {String.fromCharCode(65 + optIdx)}. {opt} {q.correct === optIdx && '✓'}
                      </p>
                    ))}
                  </div>
                  <p className={`text-sm ${theme.textSecondary} mt-2`}>Time: {q.timeLimit}s</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const CategorySelectContent = ({ categories, selectedCategory, setSelectedCategory, selectedSubCategory, setSelectedSubCategory, onStart, theme }) => {
  const subCategories = selectedCategory ? Object.keys(categories[selectedCategory]) : [];

  return (
    <div className="space-y-4">
      <div>
        <label className="block mb-2 font-semibold">Category</label>
        <select
          value={selectedCategory}
          onChange={(e) => {setSelectedCategory(e.target.value); setSelectedSubCategory('');}}
          className={`w-full p-3 rounded-lg ${theme.input} border ${theme.border} focus:outline-none focus:ring-2 focus:ring-blue-500`}
        >
          <option value="">Select a category</option>
          {Object.keys(categories).map(cat => (
            <option key={cat} value={cat}>{cat}</option>
          ))}
        </select>
      </div>

      {selectedCategory && (
        <div>
          <label className="block mb-2 font-semibold">Sub-Category</label>
          <select
            value={selectedSubCategory}
            onChange={(e) => setSelectedSubCategory(e.target.value)}
            className={`w-full p-3 rounded-lg ${theme.input} border ${theme.border} focus:outline-none focus:ring-2 focus:ring-blue-500`}
          >
            <option value="">Select a sub-category</option>
            {subCategories.map(subCat => (
              <option key={subCat} value={subCat}>{subCat}</option>
            ))}
          </select>
        </div>
      )}

      <button
        onClick={onStart}
        disabled={!selectedCategory || !selectedSubCategory}
        className={`w-full ${theme.success} text-white p-4 rounded-lg font-semibold text-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed mt-6`}
      >
        Start Quiz
      </button>
    </div>
  );
};

const QuizScreen = ({ question, questionNumber, totalQuestions, timeLeft, onAnswer, onSkip, onEnd, theme, answers }) => {
  const currentAnswer = answers.find(a => a.questionIndex === questionNumber - 1);
  const answered = currentAnswer !== undefined;

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className={`${theme.card} ${theme.shadow} rounded-2xl p-8 max-w-3xl w-full`}>
        <div className="flex justify-between items-center mb-6">
          <span className={`${theme.textSecondary} font-semibold`}>
            Question {questionNumber} of {totalQuestions}
          </span>
          <div className={`flex items-center gap-2 ${timeLeft <= 10 ? 'text-red-500 animate-pulse' : theme.textSecondary}`}>
            <Clock size={20} />
            <span className="font-bold text-xl">{timeLeft}s</span>
          </div>
        </div>

        <div className="mb-8">
          <h2 className="text-2xl font-bold mb-6">{question.question}</h2>
          <div className="space-y-3">
            {question.options.map((option, idx) => (
              <button
                key={idx}
                onClick={() => !answered && onAnswer(idx)}
                disabled={answered}
                className={`w-full p-4 rounded-lg text-left transition-all ${
                  answered && currentAnswer.selectedAnswer === idx
                    ? currentAnswer.correct
                      ? 'bg-green-500 text-white'
                      : 'bg-red-500 text-white'
                    : `${theme.input} border ${theme.border} hover:border-blue-500`
                } disabled:cursor-not-allowed`}
              >
                <span className="font-semibold mr-3">{String.fromCharCode(65 + idx)}.</span>
                {option}
              </button>
            ))}
          </div>
        </div>

        <div className="flex gap-3">
          <button
            onClick={onSkip}
            disabled={answered}
            className={`flex-1 ${theme.secondary} text-white p-3 rounded-lg font-semibold transition-all disabled:opacity-50`}
          >
            <SkipForward size={18} className="inline mr-2" />
            Skip
          </button>
          <button
            onClick={onEnd}
            className={`flex-1 ${theme.danger} text-white p-3 rounded-lg font-semibold transition-all`}
          >
            <X size={18} className="inline mr-2" />
            End Quiz
          </button>
        </div>
      </div>
    </div>
  );
};

const ResultsScreen = ({ answers, questions, user, category, subCategory, onRetake, onNewQuiz, onExit, showTranscript, setShowTranscript, onDownload, theme, calculateScore, getGrade, getRemarks, categories }) => {
  const { correct, total, percentage } = calculateScore();
  const grade = getGrade(percentage);
  const remarks = getRemarks(percentage);
  const totalTime = answers.reduce((sum, a) => sum + a.timeTaken, 0);
  
  const scoreColor = percentage >= 75 ? 'text-green-500 border-green-500' : percentage >= 60 ? 'text-orange-500 border-orange-500' : 'text-red-500 border-red-500';

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className={`${theme.card} ${theme.shadow} rounded-2xl p-8 max-w-4xl w-full`}>
        <div className="text-center mb-8">
          <Award size={64} className="mx-auto mb-4 text-yellow-500" />
          <h1 className="text-3xl font-bold mb-4">Quiz Complete!</h1>
          
          <div className={`w-32 h-32 mx-auto rounded-full border-8 ${scoreColor} flex items-center justify-center mb-4`}>
            <span className={`text-4xl font-bold ${scoreColor}`}>{percentage}%</span>
          </div>
          
          <div className="mb-4">
            <p className="text-2xl font-bold mb-2">Grade: {grade}</p>
            <p className={`${theme.textSecondary} text-lg mb-2`}>
              {correct} out of {total} correct
            </p>
            <p className={`${theme.textSecondary} italic`}>{remarks}</p>
          </div>
        </div>
        </div >
        </div>)}