// ============================================
// FILE 6: src/App.jsx (MAIN APPLICATION)
// ============================================
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

  // All component renders here (LoginScreen, AdminLoginScreen, etc.)
  // Copy from the artifact above
  
  return (
    <div className={`min-h-screen ${t.bg} ${t.text} transition-all duration-300`}>
      {/* Rest of JSX - copy from artifact */}
    </div>
  );
};

export default QuizApp;