import React, { useState, useMemo, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { GoogleGenAI, Type } from "@google/genai";
import { 
  BookOpen, 
  RotateCcw, 
  ChevronLeft, 
  ChevronRight, 
  Home as HomeIcon, 
  Star, 
  Heart, 
  Music, 
  Volume2,
  Trophy,
  Sparkles,
  Gamepad2,
  CheckCircle2,
  XCircle,
  PartyPopper,
  Mic,
  Play,
  Camera,
  Upload,
  Type as TypeIcon,
  Loader2,
  Trees
} from 'lucide-react';
import { wordData, Unit, Word } from './data/words';

type Mode = 'home' | 'learning' | 'learn-result' | 'review-select' | 'review' | 'review-result' | 'mistakes' | 'extension';
type ExerciseType = 'choice' | 'fill' | 'spelling' | 'speaking' | 'mixed';

const ENCOURAGEMENTS = [
  "太棒了！继续加油！",
  "你真聪明！",
  "做得好！你是最棒的！",
  "哇，你记住了！",
  "进步神速！",
  "你是单词小天才！"
];

const MISTAKE_ENCOURAGEMENTS = [
  "没关系，下次一定行！",
  "离成功只差一点点啦！",
  "再接再厉，你行的！",
  "别灰心，你是最棒的！",
  "多练习几次就记住啦！"
];

const ADVENTURE_POSITIONS = [
  { left: '15%', bottom: '15%' },
  { left: '40%', bottom: '25%' },
  { left: '65%', bottom: '35%' },
  { left: '55%', bottom: '60%' },
  { left: '30%', bottom: '75%' },
  { left: '70%', bottom: '80%' },
  { left: '85%', bottom: '55%' },
  { left: '10%', bottom: '45%' },
];

const PET_MESSAGES = [
  "主人，你今天真棒！✨",
  "加油加油，你是最聪明的孩子！💪",
  "哇！又学会了一个新单词，太厉害了！🎉",
  "魔法森林里藏着好多知识，快去找找吧！🌳",
  "别灰心，小狗会一直陪着你的！🐶",
  "你是我的超级小英雄！🦸‍♂️",
  "今天也要元气满满地学习哦！☀️",
  "看！那颗星星在为你闪烁！⭐"
];

export default function App() {
  const [mode, setMode] = useState<Mode>('home');
  const [selectedUnit, setSelectedUnit] = useState<Unit | null>(null);
  const [currentWordIndex, setCurrentWordIndex] = useState(0);
  const [points, setPoints] = useState(0);
  const [stars, setStars] = useState(0);
  const [selectedExerciseType, setSelectedExerciseType] = useState<ExerciseType>('mixed');
  const [currentExerciseType, setCurrentExerciseType] = useState<ExerciseType>('choice');
  const [spellingInput, setSpellingInput] = useState('');
  const [showFeedback, setShowFeedback] = useState<'correct' | 'wrong' | null>(null);
  const [encouragement, setEncouragement] = useState('');
  const [correctWordHint, setCorrectWordHint] = useState('');
  const [mistakes, setMistakes] = useState<{ word: Word, type: ExerciseType }[]>([]);
  const [isReviewingMistakes, setIsReviewingMistakes] = useState(false);

  const [isRecording, setIsRecording] = useState(false);
  const [isMicLoading, setIsMicLoading] = useState(false);
  const isPressingRef = useRef(false);
  const [pronunciationFeedback, setPronunciationFeedback] = useState<{ 
    text: string, 
    type: 'good' | 'try' | null, 
    score?: number,
    stars?: number,
    teacherTip?: string 
  }>({ text: '', type: null });
  const [recordedUrl, setRecordedUrl] = useState<string | null>(null);
  const [speakingHistory, setSpeakingHistory] = useState<{[key: string]: any}>({});
  
  const [isMusicPlaying, setIsMusicPlaying] = useState(false);
  const [extensionInput, setExtensionInput] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [customUnit, setCustomUnit] = useState<Unit | null>(null);
  const [petPosition, setPetPosition] = useState({ left: '5%', bottom: '20%' });
  const [petMessage, setPetMessage] = useState(PET_MESSAGES[0]);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Generate dynamic path connecting all nodes
  const mapPath = useMemo(() => {
    const points = wordData.map((_, i) => {
      const pos = ADVENTURE_POSITIONS[i % ADVENTURE_POSITIONS.length];
      const x = parseFloat(pos.left) * 8; // 800 / 100
      const y = 600 - (parseFloat(pos.bottom) * 6); // 600 / 100
      return { x, y };
    });
    
    // Add extension node at the end
    points.push({
      x: 85 * 8,
      y: 600 - (85 * 6)
    });

    if (points.length < 2) return "";

    let d = `M ${points[0].x} ${points[0].y}`;
    for (let i = 1; i < points.length; i++) {
      // Use smooth curves (quadratic bezier)
      const prev = points[i - 1];
      const curr = points[i];
      const midX = (prev.x + curr.x) / 2;
      const midY = (prev.y + curr.y) / 2;
      d += ` Q ${prev.x} ${prev.y}, ${midX} ${midY} T ${curr.x} ${curr.y}`;
    }
    return d;
  }, []);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recognitionRef = useRef<any>(null);

  // Background Music Control
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = 0.3; // Set a reasonable default volume
    }
  }, []);

  const toggleMusic = () => {
    if (audioRef.current) {
      if (!isMusicPlaying) {
        audioRef.current.volume = 0.3;
        audioRef.current.play().catch(e => {
          console.error("Audio play blocked or failed:", e);
          // Fallback: try playing after a short delay
          setTimeout(() => {
            audioRef.current?.play().catch(err => console.error("Still blocked:", err));
          }, 100);
        });
      } else {
        audioRef.current.pause();
      }
    }
    setIsMusicPlaying(!isMusicPlaying);
  };

  // Sync exercise type for mistakes
  useEffect(() => {
    if (isReviewingMistakes && mistakes[currentWordIndex]) {
      setCurrentExerciseType(mistakes[currentWordIndex].type);
    }
  }, [isReviewingMistakes, currentWordIndex, mistakes]);

  // Pet message cycling
  useEffect(() => {
    if (mode === 'home') {
      const interval = setInterval(() => {
        const randomMsg = PET_MESSAGES[Math.floor(Math.random() * PET_MESSAGES.length)];
        setPetMessage(randomMsg);
      }, 5000);
      return () => clearInterval(interval);
    }
  }, [mode]);

  const handleSelectUnit = (unit: Unit, startMode: Mode, pos?: { left: string, bottom: string }) => {
    if (pos) setPetPosition(pos);
    
    // Small delay to show pet movement if on home screen
    const delay = mode === 'home' ? 300 : 0;
    
    setTimeout(() => {
      setSelectedUnit(unit);
      setMode(startMode);
      setCurrentWordIndex(0);
      setSpellingInput('');
      setShowFeedback(null);
      setPronunciationFeedback({ text: '', type: null });
      setCorrectWordHint('');
      setRecordedUrl(null);
      setIsReviewingMistakes(false);
      setSpeakingHistory({});
    }, delay);
  };

  const startReview = (type: ExerciseType) => {
    setSelectedExerciseType(type);
    setCurrentExerciseType(type === 'mixed' ? 'choice' : type);
    setMode('review');
    setCurrentWordIndex(0);
    setSpellingInput('');
    setCorrectWordHint('');
    setIsReviewingMistakes(false);
    setSpeakingHistory({}); // Clear history on new session
  };

  const startMistakeReview = () => {
    if (mistakes.length === 0) return;
    setMode('review');
    setIsReviewingMistakes(true);
    setCurrentWordIndex(0);
    setSelectedExerciseType('mixed'); // Doesn't matter much as we'll override currentExerciseType
    setCurrentExerciseType(mistakes[0].type);
    setSpellingInput('');
    setSpeakingHistory({}); // Clear history on new session
  };

  const goHome = () => {
    setMode('home');
    setSelectedUnit(null);
    setPronunciationFeedback({ text: '', type: null });
    setCorrectWordHint('');
    setSpeakingHistory({}); // Clear history on home
  };

  const generateCustomUnit = async (input: string | { mimeType: string, data: string }) => {
    setIsGenerating(true);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      const prompt = `You are a helpful English teacher for kids. 
      Based on the provided input (either a list of words or an image containing words), extract or generate a list of 5-10 English words suitable for children to learn.
      For each word, provide:
      1. The word itself.
      2. Its IPA (International Phonetic Alphabet) pronunciation.
      3. Its Chinese meaning.
      4. A simple example sentence in English.
      5. The Chinese translation of that sentence.

      Return the result as a JSON object matching this structure:
      {
        "id": "custom-unit",
        "title": "我的专属关卡",
        "words": [
          {
            "id": "unique-id",
            "word": "apple",
            "ipa": "/ˈæp.əl/",
            "meaning": "苹果",
            "sentence": "I like to eat a red apple.",
            "translation": "我喜欢吃红苹果。"
          }
        ]
      }
      Only return the JSON object, no other text.`;

      const contents = typeof input === 'string' 
        ? input 
        : { parts: [{ text: prompt }, { inlineData: input }] };

      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: typeof input === 'string' ? [{ parts: [{ text: prompt + "\n\nInput words: " + input }] }] : contents,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              id: { type: Type.STRING },
              title: { type: Type.STRING },
              words: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    id: { type: Type.STRING },
                    word: { type: Type.STRING },
                    ipa: { type: Type.STRING },
                    meaning: { type: Type.STRING },
                    sentence: { type: Type.STRING },
                    translation: { type: Type.STRING },
                  },
                  required: ["id", "word", "ipa", "meaning", "sentence", "translation"]
                }
              }
            },
            required: ["id", "title", "words"]
          }
        }
      });

      const result = JSON.parse(response.text);
      setCustomUnit(result);
      handleSelectUnit(result, 'learning');
    } catch (error) {
      console.error("AI Generation Error:", error);
      alert("生成失败，请稍后再试或检查输入内容。");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      const base64Data = (reader.result as string).split(',')[1];
      generateCustomUnit({ mimeType: file.type, data: base64Data });
    };
    reader.readAsDataURL(file);
  };

  const speak = (text: string) => {
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    
    const voices = window.speechSynthesis.getVoices();
    const ukVoice = voices.find(v => v.lang.includes('GB') || v.name.includes('United Kingdom') || v.name.includes('British'));
    if (ukVoice) utterance.voice = ukVoice;
    
    utterance.lang = 'en-GB';
    utterance.rate = 0.7;
    utterance.pitch = 1.1;
    window.speechSynthesis.speak(utterance);
  };

  const startRecording = async () => {
    if (isPressingRef.current) return;
    console.log("Start recording attempt...");
    isPressingRef.current = true;
    setIsMicLoading(true);
    setPronunciationFeedback({ text: '正在调取麦克风...', type: null });
    
    try {
      console.log("Requesting microphone access...");
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      console.log("Microphone access granted.");
      
      // Check if user is still pressing the button
      if (!isPressingRef.current) {
        console.log("User released button before access granted.");
        stream.getTracks().forEach(track => track.stop());
        setIsMicLoading(false);
        return;
      }

      setIsMicLoading(false);
      setIsRecording(true);
      setRecordedUrl(null);
      setPronunciationFeedback({ text: '正在录音中... 松手结束', type: null });

      // Play start sound
      const startSound = new Audio('https://assets.mixkit.co/sfx/preview/mixkit-simple-notification-alert-2630.mp3');
      startSound.volume = 0.5;
      startSound.play().catch(e => console.error("Audio play error:", e));

      // Setup MediaRecorder
      audioChunksRef.current = [];
      const mimeType = MediaRecorder.isTypeSupported('audio/webm') ? 'audio/webm' : 'audio/ogg';
      console.log(`Using mimeType: ${mimeType}`);
      const mediaRecorder = new MediaRecorder(stream, { mimeType });
      mediaRecorderRef.current = mediaRecorder;
      
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };
      
      mediaRecorder.onstop = () => {
        console.log("MediaRecorder stopped.");
        const audioBlob = new Blob(audioChunksRef.current, { type: mimeType });
        const url = URL.createObjectURL(audioBlob);
        setRecordedUrl(url);
        stream.getTracks().forEach(track => track.stop());
      };
      
      mediaRecorder.start(100);
      console.log("MediaRecorder started.");

      // Setup Speech Recognition
      if ('webkitSpeechRecognition' in window) {
        console.log("SpeechRecognition supported.");
        // Small delay to avoid capturing the "start beep"
        setTimeout(() => {
          if (!isPressingRef.current) return;
          
          const SpeechRecognition = (window as any).webkitSpeechRecognition;
          const recognition = new SpeechRecognition();
          recognitionRef.current = recognition;
          recognition.lang = 'en-GB';
          recognition.interimResults = false;
          recognition.maxAlternatives = 1;

        recognition.onresult = (event: any) => {
          const speechToText = event.results[0][0].transcript.toLowerCase();
          const confidence = event.results[0][0].confidence;
          const targetWordObj = (isReviewingMistakes ? mistakes[currentWordIndex].word : selectedUnit?.words[currentWordIndex]);
          const targetWord = targetWordObj?.word.toLowerCase() || '';
          
          let score = 0;
          let stars = 0;
          
          if (speechToText.includes(targetWord)) {
            score = Math.round(85 + (confidence * 15));
            if (score >= 96) stars = 5;
            else if (score >= 90) stars = 4;
            else stars = 3;
            setPoints(prev => prev + 5);
          } else {
            score = Math.round(confidence * 60);
            if (score >= 40) stars = 2;
            else stars = 1;
          }
          
          const feedbackData = { 
            text: 'Result', 
            type: score >= 60 ? 'good' : 'try' as 'good' | 'try',
            score: score,
            stars: stars,
            teacherTip: ""
          };

          // Set feedback immediately to ensure every recording has stars
          setPronunciationFeedback(feedbackData);
          
          // Save to record history right away
          const currentWord = targetWordObj?.word || '';
          setSpeakingHistory(prev => ({
            ...prev,
            [currentWord]: feedbackData
          }));

          if (mode === 'review' && stars >= 4) {
            setTimeout(() => {
              handleCorrect();
            }, 2000);
          }
        };

        recognition.onerror = (event: any) => {
          console.error("Speech recognition error:", event.error);
          // If it's not a deliberate abort, give a fallback 1-star rating so no recording goes unrated
          if (event.error !== 'aborted') {
            const fallbackFeedback = { 
              text: 'Result', 
              type: 'try' as 'good' | 'try',
              score: 0,
              stars: 1,
              teacherTip: ""
            };
            setPronunciationFeedback(fallbackFeedback);
            
            const targetWordObj = (isReviewingMistakes ? mistakes[currentWordIndex].word : selectedUnit?.words[currentWordIndex]);
            const currentWord = targetWordObj?.word || '';
            setSpeakingHistory(prev => ({
              ...prev,
              [currentWord]: fallbackFeedback
            }));
          }
        };

        recognition.onnomatch = () => {
          const fallbackFeedback = { 
            text: 'Result', 
            type: 'try' as 'good' | 'try',
            score: 0,
            stars: 1,
            teacherTip: ""
          };
          setPronunciationFeedback(fallbackFeedback);
          
          const targetWordObj = (isReviewingMistakes ? mistakes[currentWordIndex].word : selectedUnit?.words[currentWordIndex]);
          const currentWord = targetWordObj?.word || '';
          setSpeakingHistory(prev => ({
            ...prev,
            [currentWord]: fallbackFeedback
          }));
        };

          recognition.start();
          console.log("SpeechRecognition started.");
        }, 300);
      } else {
        console.warn("SpeechRecognition not supported in this browser.");
      }
    } catch (err) {
      console.error("Error accessing microphone:", err);
      setIsRecording(false);
      setIsMicLoading(false);
      isPressingRef.current = false;
      alert("无法访问麦克风。请确保：\n1. 已授予麦克风权限\n2. 正在使用 HTTPS 安全连接\n3. 浏览器支持录音功能");
    }
  };

  const stopRecording = () => {
    console.log("Stop recording called.");
    isPressingRef.current = false;
    setIsMicLoading(false);
    
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
      
      // Play stop sound
      const stopSound = new Audio('https://assets.mixkit.co/sfx/preview/mixkit-interface-hint-notification-911.mp3');
      stopSound.volume = 0.5;
      stopSound.play().catch(e => console.error("Audio play error:", e));
    }
    
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (e) {
        console.error("Recognition stop error:", e);
      }
    }
    
    setIsRecording(false);
  };

  const playRecordedAudio = () => {
    if (recordedUrl) {
      const audio = new Audio(recordedUrl);
      audio.play();
    }
  };

  // Learning Mode Logic
  const nextWord = () => {
    const list = isReviewingMistakes ? mistakes : selectedUnit?.words || [];
    if (currentWordIndex < list.length - 1) {
      setCurrentWordIndex(prev => prev + 1);
      setPronunciationFeedback({ text: '', type: null });
      setSpellingInput('');
      setCorrectWordHint('');
      setRecordedUrl(null);
      
      if (!isReviewingMistakes && mode === 'review' && selectedExerciseType === 'mixed') {
        const types: ExerciseType[] = ['choice', 'fill', 'spelling', 'speaking'];
        setCurrentExerciseType(types[Math.floor(Math.random() * types.length)]);
      }
    } else {
      if (mode === 'review') {
        setMode('review-result');
      } else if (mode === 'learning') {
        setMode('learn-result');
      }
    }
  };

  const prevWord = () => {
    if (currentWordIndex > 0) {
      setCurrentWordIndex(prev => prev - 1);
      setPronunciationFeedback({ text: '', type: null });
      setSpellingInput('');
      setCorrectWordHint('');
      setRecordedUrl(null);
    }
  };

  // Review Mode Logic
  const currentReviewWord = useMemo(() => {
    const list = isReviewingMistakes ? mistakes.map(m => m.word) : selectedUnit?.words || [];
    return list[currentWordIndex] || null;
  }, [selectedUnit, mistakes, currentWordIndex, isReviewingMistakes]);

  const reviewOptions = useMemo(() => {
    if (!currentReviewWord) return [];
    // Use all words for options to make it more challenging
    const allWords = wordData.flatMap(u => u.words);
    const others = allWords.filter(w => w.id !== currentReviewWord.id);
    const shuffled = [...others].sort(() => 0.5 - Math.random()).slice(0, 3);
    return [...shuffled, currentReviewWord].sort(() => 0.5 - Math.random());
  }, [currentReviewWord]);

  const handleCorrect = () => {
    setShowFeedback('correct');
    setPoints(prev => prev + 10);
    setStars(prev => prev + 1);
    setEncouragement(ENCOURAGEMENTS[Math.floor(Math.random() * ENCOURAGEMENTS.length)]);
    
    const wasLastMistake = isReviewingMistakes && mistakes.length === 1;
    const wasAtEnd = isReviewingMistakes && currentWordIndex === mistakes.length - 1;

    if (isReviewingMistakes) {
      setMistakes(prev => prev.filter((_, i) => i !== currentWordIndex));
      if (wasAtEnd && currentWordIndex > 0) {
        setCurrentWordIndex(prev => prev - 1);
      }
    }

    setTimeout(() => {
      setShowFeedback(null);
      if (wasLastMistake) {
        setMode('review-result');
      } else if (!isReviewingMistakes) {
        nextWord();
      }
    }, 1500);
  };

  const handleWrong = () => {
    setShowFeedback('wrong');
    setEncouragement(MISTAKE_ENCOURAGEMENTS[Math.floor(Math.random() * MISTAKE_ENCOURAGEMENTS.length)]);
    
    // For choice questions, show the Chinese meaning as the correct answer
    const hint = currentExerciseType === 'choice' 
      ? currentReviewWord?.meaning 
      : currentReviewWord?.word;
    
    setCorrectWordHint(hint || '');
    
    // Add to mistakes if not already there with same type
    if (currentReviewWord && !mistakes.find(m => m.word.id === currentReviewWord.id && m.type === currentExerciseType)) {
      setMistakes(prev => [...prev, { word: currentReviewWord, type: currentExerciseType }]);
    }

    setTimeout(() => {
      setShowFeedback(null);
      setCorrectWordHint('');
    }, 2500);
  };

  const handleReviewAnswer = (wordId: string) => {
    if (wordId === currentReviewWord?.id) {
      handleCorrect();
    } else {
      handleWrong();
    }
  };

  const checkSpelling = () => {
    if (spellingInput.toLowerCase().trim() === currentReviewWord?.word.toLowerCase()) {
      handleCorrect();
    } else {
      handleWrong();
    }
  };

  const checkFill = (wordId: string) => {
    if (wordId === currentReviewWord?.id) {
      handleCorrect();
    } else {
      handleWrong();
    }
  };

  return (
    <div className="min-h-screen bg-pattern flex flex-col items-center p-4 md:p-8">
      {/* Background Music Element */}
      <audio 
        ref={audioRef}
        src="https://assets.mixkit.co/music/preview/mixkit-funny-paws-507.mp3"
        loop
        preload="auto"
      />

      {/* Header with Stats */}
      <header className="w-full max-w-4xl flex justify-between items-center mb-8">
        <motion.div 
          initial={{ x: -20, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          className="flex items-center gap-2 cursor-pointer"
          onClick={goHome}
        >
          <div className="bg-[#D4A373] p-2 rounded-2xl shadow-lg">
            <Star className="text-white fill-white" size={28} />
          </div>
          <h1 className="text-2xl md:text-3xl font-bold text-[#A98467] tracking-tight">奶油单词本</h1>
        </motion.div>

        <div className="flex items-center gap-4">
          {/* Music Toggle */}
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={toggleMusic}
            className={`flex items-center gap-2 px-4 py-2 rounded-full font-bold shadow-md transition-all border-2 ${
              isMusicPlaying ? 'bg-yellow-50 border-yellow-200 text-yellow-600' : 'bg-gray-50 border-gray-200 text-gray-400'
            }`}
          >
            <Music size={20} className={isMusicPlaying ? 'animate-bounce' : ''} />
            <span className="text-sm hidden sm:inline">{isMusicPlaying ? '音乐开' : '音乐关'}</span>
          </motion.button>

          <motion.div 
            animate={{ scale: points > 0 ? [1, 1.2, 1] : 1 }}
            className="bg-white px-4 py-2 rounded-full shadow-md flex items-center gap-2 border-2 border-[#F5EBE0]"
          >
            <Sparkles className="text-yellow-500" size={20} />
            <span className="font-bold text-[#A98467]">{points} 分</span>
          </motion.div>
          <motion.div 
            animate={{ scale: stars > 0 ? [1, 1.2, 1] : 1 }}
            className="bg-white px-4 py-2 rounded-full shadow-md flex items-center gap-2 border-2 border-yellow-200"
          >
            <Star className="text-yellow-400 fill-yellow-400" size={20} />
            <span className="font-bold text-yellow-600">{stars}</span>
          </motion.div>
          {mode !== 'home' && (
            <button onClick={goHome} className="p-2 bg-white rounded-full shadow-md text-gray-400 hover:text-[#D4A373] transition-colors">
              <HomeIcon size={24} />
            </button>
          )}
        </div>
      </header>

      <main className="w-full max-w-4xl flex-1 flex flex-col items-center justify-center relative">
        {/* Feedback Overlay */}
        <AnimatePresence>
          {showFeedback && (
            <motion.div 
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0, opacity: 0 }}
              className="fixed inset-0 z-50 flex flex-col items-center justify-center pointer-events-none"
            >
              <div className={`p-8 rounded-full ${showFeedback === 'correct' ? 'bg-green-500' : 'bg-red-500'} shadow-2xl mb-4`}>
                {showFeedback === 'correct' ? <CheckCircle2 size={80} className="text-white" /> : <XCircle size={80} className="text-white" />}
              </div>
              
              <motion.div 
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                className={`text-3xl font-bold text-center bg-white px-8 py-4 rounded-[30px] shadow-xl border-4 ${
                  showFeedback === 'correct' ? 'text-green-600 border-green-100' : 'text-red-600 border-red-100'
                }`}
              >
                {showFeedback === 'correct' ? (
                  encouragement
                ) : (
                  <div className="flex flex-col gap-2">
                    <p className="text-xl text-gray-400">正确答案是：</p>
                    <p className="text-4xl font-black text-red-500 mb-2">{correctWordHint}</p>
                    <p className="text-lg text-red-400">{encouragement}</p>
                  </div>
                )}
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence mode="wait">
          {mode === 'home' && (
            <motion.div 
              key="home"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="w-full relative min-h-[600px] bg-gradient-to-b from-emerald-900 via-green-800 to-emerald-950 rounded-[50px] border-8 border-emerald-100 shadow-2xl overflow-hidden p-8"
            >
              {/* Magic Forest Background Elements */}
              <div className="absolute inset-0 pointer-events-none">
                {/* Magical Glows */}
                <div className="absolute top-10 left-10 w-64 h-64 bg-emerald-400/20 rounded-full blur-[100px]" />
                <div className="absolute bottom-20 right-20 w-80 h-80 bg-lime-300/20 rounded-full blur-[100px]" />
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-teal-500/10 rounded-full blur-[120px]" />
                
                {/* Floating Particles */}
                {[...Array(20)].map((_, i) => (
                  <motion.div
                    key={i}
                    className="absolute w-1 h-1 bg-yellow-200 rounded-full"
                    animate={{
                      y: [0, -100, 0],
                      x: [0, Math.random() * 50 - 25, 0],
                      opacity: [0, 0.8, 0],
                      scale: [0, 1.5, 0]
                    }}
                    transition={{
                      duration: 5 + Math.random() * 5,
                      repeat: Infinity,
                      delay: Math.random() * 5
                    }}
                    style={{
                      left: `${Math.random() * 100}%`,
                      top: `${Math.random() * 100}%`
                    }}
                  />
                ))}

                {/* Tree Silhouettes */}
                <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-emerald-950 to-transparent opacity-60" />
                <div className="absolute -bottom-10 -left-10 text-emerald-700/30 rotate-12">
                  <Trees size={300} />
                </div>
                <div className="absolute -bottom-20 -right-10 text-emerald-700/30 -rotate-12">
                  <Trees size={400} />
                </div>
              </div>

              {/* Map Path Decoration */}
              <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 800 600">
                <motion.path
                  d={mapPath}
                  fill="none"
                  stroke="rgba(255, 255, 255, 0.3)"
                  strokeWidth="8"
                  strokeDasharray="15 15"
                  strokeLinecap="round"
                  initial={{ pathLength: 0 }}
                  animate={{ pathLength: 1 }}
                  transition={{ duration: 2, ease: "easeInOut" }}
                />
                {/* Glowing Path Overlay */}
                <motion.path
                  d={mapPath}
                  fill="none"
                  stroke="rgba(110, 231, 183, 0.4)"
                  strokeWidth="12"
                  className="blur-md"
                />
              </svg>

              <div className="relative z-10 flex flex-col items-center">
                <div className="text-center mb-12">
                  <h2 className="text-4xl font-black text-emerald-50 mb-2 drop-shadow-[0_2px_10px_rgba(0,0,0,0.5)]">魔法森林单词大冒险</h2>
                  <p className="text-emerald-300 font-bold drop-shadow-sm">在神秘森林中寻找失落的单词吧！</p>
                </div>

                {/* Adventure Nodes */}
                <div className="relative w-full h-[450px]">
                  {wordData.map((unit, index) => {
                    const pos = ADVENTURE_POSITIONS[index % ADVENTURE_POSITIONS.length];

                    return (
                      <motion.div
                        key={unit.id}
                        style={{ left: pos.left, bottom: pos.bottom }}
                        className="absolute group"
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ delay: index * 0.1 }}
                      >
                        <div className="relative">
                          <motion.button
                            whileHover={{ scale: 1.2, rotate: 5 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={() => handleSelectUnit(unit, 'learning', pos)}
                            className="w-20 h-20 bg-white rounded-3xl shadow-xl border-4 border-[#E6CCB2] flex items-center justify-center text-2xl font-black text-[#A98467] z-20 relative"
                          >
                            {index + 1}
                          </motion.button>
                          
                          {/* Tooltip */}
                          <div className="absolute -top-12 left-1/2 -translate-x-1/2 bg-[#A98467] text-white px-3 py-1 rounded-xl text-sm font-bold opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap shadow-lg">
                            {unit.title}
                          </div>

                          {/* Mode Selection Mini-Menu */}
                          <div className="absolute top-full mt-2 left-1/2 -translate-x-1/2 flex gap-2 opacity-0 group-hover:opacity-100 transition-all scale-75 group-hover:scale-100">
                            <button 
                              onClick={(e) => { e.stopPropagation(); handleSelectUnit(unit, 'learning', pos); }}
                              className="bg-blue-400 p-2 rounded-full text-white shadow-md hover:bg-blue-500"
                              title="学习"
                            >
                              <BookOpen size={16} />
                            </button>
                            <button 
                              onClick={(e) => { e.stopPropagation(); handleSelectUnit(unit, 'review-select', pos); }}
                              className="bg-purple-400 p-2 rounded-full text-white shadow-md hover:bg-purple-500"
                              title="挑战"
                            >
                              <Gamepad2 size={16} />
                            </button>
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}

                  {/* Extension Node */}
                  <motion.div
                    style={{ left: '85%', bottom: '85%' }}
                    className="absolute group"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: wordData.length * 0.1 }}
                  >
                    <div className="relative">
                      <motion.button
                        whileHover={{ scale: 1.2, rotate: -5 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={() => {
                          setPetPosition({ left: '85%', bottom: '85%' });
                          setTimeout(() => setMode('extension'), 300);
                        }}
                        className="w-24 h-24 bg-gradient-to-br from-[#FFF9F0] to-[#F5EBE0] rounded-full shadow-2xl border-4 border-[#E6CCB2] flex items-center justify-center text-[#A98467] z-20 relative"
                      >
                        <Sparkles size={40} className="animate-pulse" />
                      </motion.button>
                      
                      {/* Tooltip */}
                      <div className="absolute -top-12 left-1/2 -translate-x-1/2 bg-[#A98467] text-white px-4 py-1 rounded-xl text-sm font-bold opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap shadow-lg">
                        拓展关卡: 自定义单词
                      </div>
                    </div>
                  </motion.div>

                  {/* Pet Companion */}
                  <motion.div 
                    className="absolute z-30 pointer-events-none"
                    layout
                    initial={false}
                    animate={{ 
                      left: petPosition.left,
                      bottom: petPosition.bottom,
                      x: [0, 10, 0],
                      y: [0, -15, 0],
                    }}
                    transition={{ 
                      left: { type: "spring", stiffness: 100, damping: 20 },
                      bottom: { type: "spring", stiffness: 100, damping: 20 },
                      x: { repeat: Infinity, duration: 3, ease: "easeInOut" },
                      y: { repeat: Infinity, duration: 3, ease: "easeInOut" }
                    }}
                  >
                    <div className="relative">
                      {/* Speech Bubble */}
                      <AnimatePresence mode="wait">
                        <motion.div 
                          key={petMessage}
                          initial={{ opacity: 0, scale: 0, y: 10 }}
                          animate={{ opacity: 1, scale: 1, y: 0 }}
                          exit={{ opacity: 0, scale: 0, y: -10 }}
                          className="absolute -top-16 left-12 bg-white p-3 rounded-2xl rounded-bl-none shadow-lg border-2 border-[#F5EBE0] whitespace-nowrap z-40"
                        >
                          <p className="text-sm font-bold text-[#A98467]">{petMessage}</p>
                        </motion.div>
                      </AnimatePresence>
                      
                      {/* Cute Pet (Emoji-based for consistency) */}
                      <div className="w-24 h-24 bg-white rounded-full border-4 border-[#F5EBE0] shadow-xl flex items-center justify-center text-6xl">
                        🐶
                      </div>
                      <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-16 h-4 bg-black/10 rounded-full blur-sm" />
                    </div>
                  </motion.div>

                  {/* Mistakes Review Entry */}
                  {mistakes.length > 0 && (
                    <motion.div 
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="absolute right-10 bottom-10 z-30"
                    >
                      <button 
                        onClick={startMistakeReview}
                        className="flex flex-col items-center gap-2 group"
                      >
                        <div className="relative">
                          <div className="w-20 h-20 bg-[#D4A373] rounded-full flex items-center justify-center text-white shadow-xl border-4 border-white group-hover:scale-110 transition-transform">
                            <BookOpen size={32} />
                          </div>
                          <div className="absolute -top-2 -right-2 bg-orange-400 text-white w-8 h-8 rounded-full flex items-center justify-center font-bold border-2 border-white shadow-md">
                            {mistakes.length}
                          </div>
                        </div>
                        <span className="bg-white px-3 py-1 rounded-full text-[#A98467] font-bold text-sm shadow-md">错题本</span>
                      </button>
                    </motion.div>
                  )}
                </div>
              </div>
            </motion.div>
          )}

          {mode === 'learning' && selectedUnit && (
            <motion.div 
              key="learning"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 1.1, opacity: 0 }}
              className="w-full flex flex-col items-center"
            >
              <div className="w-full mb-8 flex items-center justify-between px-4">
                <div className="flex items-center gap-3">
                  {selectedUnit.id === 'custom-unit' && (
                    <button 
                      onClick={() => setMode('extension')}
                      className="flex items-center gap-1 text-gray-400 hover:text-orange-500 transition-colors font-bold bg-white/50 px-4 py-2 rounded-full shadow-sm mr-2"
                    >
                      <ChevronLeft size={20} />
                      返回拓展关卡
                    </button>
                  )}
                  <span className="bg-[#FFF9F0] text-[#A98467] px-6 py-2 rounded-full font-bold text-lg shadow-sm border border-[#F5EBE0]">
                    {selectedUnit.title}
                  </span>
                </div>
                <div className="flex-1 mx-8 h-4 bg-gray-100 rounded-full overflow-hidden shadow-inner">
                  <motion.div 
                    className="bg-gradient-to-r from-[#D4A373] to-[#E6CCB2] h-full"
                    initial={{ width: 0 }}
                    animate={{ width: `${((currentWordIndex + 1) / selectedUnit.words.length) * 100}%` }}
                  />
                </div>
                <span className="text-gray-400 font-bold text-lg">
                  {currentWordIndex + 1} / {selectedUnit.words.length}
                </span>
              </div>

              <div className="cute-card w-full p-8 md:p-12 flex flex-col md:flex-row items-center gap-12 bg-white/80 backdrop-blur-sm">
                <div className="flex-1 text-center md:text-left">
                  <div className="flex items-center justify-center md:justify-start gap-4 mb-4">
                    <h2 className="text-6xl font-black text-gray-800 tracking-tight">
                      {selectedUnit.words[currentWordIndex].word}
                    </h2>
                    <div className="flex gap-2">
                      <button 
                        onClick={() => speak(selectedUnit.words[currentWordIndex].word)}
                        className="p-3 bg-yellow-100 text-yellow-600 rounded-2xl hover:bg-yellow-200 transition-colors shadow-sm"
                        title="标准英音朗读"
                      >
                        <Volume2 size={32} />
                      </button>
                      <div className="relative group">
                        <button 
                          onMouseDown={startRecording}
                          onMouseUp={stopRecording}
                          onMouseLeave={stopRecording}
                          onTouchStart={(e) => { e.preventDefault(); startRecording(); }}
                          onTouchEnd={(e) => { e.preventDefault(); stopRecording(); }}
                          className={`p-3 rounded-2xl transition-all shadow-sm flex items-center gap-2 select-none touch-none ${
                            isRecording ? 'bg-red-500 text-white scale-110' : 
                            isMicLoading ? 'bg-yellow-400 text-white scale-105' :
                            'bg-[#FFF9F0] text-[#A98467] hover:bg-[#F5EBE0]'
                          }`}
                          title={isMicLoading ? "正在载入..." : "长按录音"}
                        >
                          {isMicLoading ? <Loader2 size={32} className="animate-spin" /> : <Mic size={32} />}
                          {isRecording && <span className="text-sm font-bold animate-pulse">录制中...</span>}
                          {isMicLoading && <span className="text-sm font-bold animate-pulse">调取中...</span>}
                        </button>
                        {!isRecording && !recordedUrl && (
                          <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-gray-800 text-white text-xs py-1 px-2 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                            长按录音
                          </div>
                        )}
                      </div>
                      {recordedUrl && (
                        <button 
                          onClick={playRecordedAudio}
                          className="p-3 bg-green-100 text-green-600 rounded-2xl hover:bg-green-200 transition-colors shadow-sm flex items-center gap-2"
                          title="播放我的录音"
                        >
                          <Play size={32} />
                          <span className="text-sm font-bold">听听我的</span>
                        </button>
                      )}
                    </div>
                  </div>
                  <p className="text-2xl text-blue-500 font-bold mb-6">
                    {selectedUnit.words[currentWordIndex].ipa}
                  </p>
                  <div className="flex flex-col items-center md:items-start gap-4">
                    <div className="bg-[#FFF9F0] p-6 rounded-3xl border-2 border-[#F5EBE0] inline-block">
                      <h3 className="text-3xl font-bold text-[#A98467]">
                        {selectedUnit.words[currentWordIndex].meaning}
                      </h3>
                    </div>
                    
                    {/* Pronunciation Feedback Bubble */}
                    <AnimatePresence>
                      {pronunciationFeedback.text && (
                        <motion.div
                          initial={{ x: -20, opacity: 0 }}
                          animate={{ x: 0, opacity: 1 }}
                          exit={{ opacity: 0 }}
                          className={`px-6 py-4 rounded-3xl font-bold shadow-md border-2 flex flex-col gap-2 ${
                            pronunciationFeedback.type === 'good' ? 'bg-green-50 border-green-200 text-green-700' : 
                            pronunciationFeedback.type === 'try' ? 'bg-orange-50 border-orange-200 text-orange-700' : 
                            'bg-blue-50 border-blue-200 text-blue-700'
                          }`}
                        >
                          <div className="flex items-center justify-between gap-4">
                            <div className="flex items-center gap-2">
                              <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center shadow-sm text-lg">👩‍🏫</div>
                              <span>{pronunciationFeedback.text}</span>
                            </div>
                            {pronunciationFeedback.stars !== undefined && (
                              <div className="flex gap-1 ml-auto bg-white/50 px-3 py-1 rounded-full shadow-inner border border-black/5">
                                {[...Array(5)].map((_, i) => (
                                  <Star 
                                    key={i} 
                                    size={16} 
                                    className={i < pronunciationFeedback.stars! ? 'text-yellow-500 fill-yellow-500' : 'text-gray-300'} 
                                  />
                                ))}
                              </div>
                            )}
                          </div>
                          {pronunciationFeedback.teacherTip && (
                            <div className="text-sm font-medium italic border-t border-black/5 pt-2 mt-1 opacity-80">
                              " {pronunciationFeedback.teacherTip} "
                            </div>
                          )}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>

                <div className="flex-1 w-full bg-blue-50 p-8 rounded-[40px] border-4 border-white shadow-inner">
                  <div className="flex items-center gap-3 mb-4">
                    <span className="bg-blue-200 text-blue-700 px-4 py-1 rounded-full text-sm font-bold uppercase tracking-wider">Example</span>
                    <button 
                      onClick={() => speak(selectedUnit.words[currentWordIndex].sentence)}
                      className="text-blue-400 hover:text-blue-600 transition-colors"
                    >
                      <Volume2 size={24} />
                    </button>
                  </div>
                  <p className="text-2xl font-bold text-gray-700 leading-relaxed mb-4 italic">
                    "{selectedUnit.words[currentWordIndex].sentence}"
                  </p>
                  <p className="text-xl text-gray-500 font-medium">
                    {selectedUnit.words[currentWordIndex].translation}
                  </p>
                </div>
              </div>

              <div className="flex gap-8 mt-12">
                <button 
                  onClick={prevWord}
                  disabled={currentWordIndex === 0}
                  className={`cute-button flex items-center gap-2 text-xl ${currentWordIndex === 0 ? 'bg-gray-300' : 'bg-[#D4A373] hover:bg-[#A98467]'}`}
                >
                  <ChevronLeft size={28} />
                  上一个
                </button>
                <button 
                  onClick={nextWord}
                  disabled={currentWordIndex === selectedUnit.words.length - 1}
                  className={`cute-button flex items-center gap-2 text-xl ${currentWordIndex === selectedUnit.words.length - 1 ? 'bg-gray-300' : 'bg-[#E6CCB2] hover:bg-[#D4A373]'}`}
                >
                  下一个
                  <ChevronRight size={28} />
                </button>
              </div>
            </motion.div>
          )}

          {mode === 'review-select' && selectedUnit && (
            <motion.div 
              key="review-select"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              className="w-full max-w-2xl flex flex-col items-center"
            >
              <div className="w-full flex justify-start mb-4">
                <button 
                  onClick={() => selectedUnit.id === 'custom-unit' ? setMode('extension') : goHome()}
                  className="flex items-center gap-1 text-gray-400 hover:text-purple-500 transition-colors font-bold bg-white/50 px-4 py-2 rounded-full shadow-sm"
                >
                  <ChevronLeft size={20} />
                  {selectedUnit.id === 'custom-unit' ? '返回拓展关卡' : '返回'}
                </button>
              </div>

              <div className="text-center mb-12">
                <h2 className="text-4xl font-black text-[#A98467] mb-2">{selectedUnit.title} 挑战模式</h2>
                <p className="text-gray-500 font-bold">请选择你想要练习的模块：</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => startReview('choice')}
                  className="cute-card p-8 bg-[#FFFDF9] border-[#F5EBE0] flex flex-col items-center gap-4"
                >
                  <div className="bg-[#D4A373] p-4 rounded-2xl text-white">
                    <CheckCircle2 size={32} />
                  </div>
                  <div className="text-center">
                    <h3 className="text-2xl font-bold text-[#A98467]">选择题</h3>
                    <p className="text-[#D4A373] text-sm">根据单词选意思</p>
                  </div>
                </motion.button>

                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => startReview('fill')}
                  className="cute-card p-8 bg-[#FFFDF9] border-[#F5EBE0] flex flex-col items-center gap-4"
                >
                  <div className="bg-[#E6CCB2] p-4 rounded-2xl text-white">
                    <BookOpen size={32} />
                  </div>
                  <div className="text-center">
                    <h3 className="text-2xl font-bold text-[#A98467]">填空题</h3>
                    <p className="text-[#D4A373] text-sm">在句子中填入单词</p>
                  </div>
                </motion.button>

                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => startReview('spelling')}
                  className="cute-card p-8 bg-[#FFFDF9] border-[#F5EBE0] flex flex-col items-center gap-4"
                >
                  <div className="bg-yellow-400 p-4 rounded-2xl text-white">
                    <Music size={32} />
                  </div>
                  <div className="text-center">
                    <h3 className="text-2xl font-bold text-[#A98467]">拼写题</h3>
                    <p className="text-[#D4A373] text-sm">手动输入正确拼写</p>
                  </div>
                </motion.button>

                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => startReview('speaking')}
                  className="cute-card p-8 bg-[#FFFDF9] border-[#F5EBE0] flex flex-col items-center gap-4"
                >
                  <div className="bg-green-400 p-4 rounded-2xl text-white">
                    <Mic size={32} />
                  </div>
                  <div className="text-center">
                    <h3 className="text-2xl font-bold text-[#A98467]">口语挑战</h3>
                    <p className="text-[#D4A373] text-sm">长按录音并跟读单词</p>
                  </div>
                </motion.button>

                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => startReview('mixed')}
                  className="cute-card p-8 bg-[#FFFDF9] border-[#F5EBE0] flex flex-col items-center gap-4"
                >
                  <div className="bg-purple-400 p-4 rounded-2xl text-white">
                    <Gamepad2 size={32} />
                  </div>
                  <div className="text-center">
                    <h3 className="text-2xl font-bold text-[#A98467]">综合挑战</h3>
                    <p className="text-[#D4A373] text-sm">随机混合所有题型</p>
                  </div>
                </motion.button>
              </div>
            </motion.div>
          )}

          {mode === 'review' && currentReviewWord && (
            <motion.div 
              key="review"
              initial={{ x: 100, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: -100, opacity: 0 }}
              className="w-full max-w-3xl flex flex-col items-center"
            >
              <div className="w-full flex justify-start mb-4">
                <button 
                  onClick={() => {
                    if (isReviewingMistakes) {
                      goHome();
                    } else if (selectedUnit?.id === 'custom-unit') {
                      setMode('extension');
                    } else {
                      setMode('review-select');
                    }
                  }}
                  className="flex items-center gap-1 text-gray-400 hover:text-purple-500 transition-colors font-bold bg-white/50 px-4 py-2 rounded-full shadow-sm"
                >
                  <ChevronLeft size={20} />
                  {selectedUnit?.id === 'custom-unit' ? '返回拓展关卡' : '返回挑战模式'}
                </button>
              </div>

              <div className="w-full mb-8 flex items-center justify-between px-4">
                <div className="flex items-center gap-3">
                  <span className={`px-6 py-2 rounded-full font-bold text-lg shadow-sm ${isReviewingMistakes ? 'bg-red-100 text-red-600' : 'bg-[#FFF9F0] text-[#A98467] border border-[#F5EBE0]'}`}>
                    {isReviewingMistakes ? '错题复习' : selectedUnit?.title}
                  </span>
                </div>
                <div className="flex-1 mx-8 h-4 bg-gray-100 rounded-full overflow-hidden shadow-inner">
                  <motion.div 
                    className="bg-gradient-to-r from-[#D4A373] to-[#E6CCB2] h-full"
                    initial={{ width: 0 }}
                    animate={{ width: `${((currentWordIndex + 1) / (isReviewingMistakes ? mistakes.length : selectedUnit?.words.length || 1)) * 100}%` }}
                  />
                </div>
                <span className="text-gray-400 font-bold text-lg">
                  {currentWordIndex + 1} / {isReviewingMistakes ? mistakes.length : selectedUnit?.words.length}
                </span>
              </div>

              {currentExerciseType === 'choice' && (
                <div className="w-full">
                  <div className="text-center mb-12">
                    <h2 className="text-3xl font-bold text-gray-500 mb-4">请选择正确的中文意思：</h2>
                    <div className="text-7xl font-black text-pink-500 mb-4 tracking-tight">{currentReviewWord.word}</div>
                    <button onClick={() => speak(currentReviewWord.word)} className="text-pink-300 hover:text-pink-500 transition-colors">
                      <Volume2 size={32} />
                    </button>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {reviewOptions.map((option, idx) => (
                      <motion.button
                        key={`${option.id}-${idx}`}
                        whileHover={{ scale: 1.03, y: -5 }}
                        whileTap={{ scale: 0.97 }}
                        onClick={() => handleReviewAnswer(option.id)}
                        className="cute-card p-8 text-2xl font-bold text-gray-700 hover:bg-pink-50 hover:border-pink-300 text-center shadow-lg"
                      >
                        {option.meaning}
                      </motion.button>
                    ))}
                  </div>
                </div>
              )}

              {currentExerciseType === 'fill' && (
                <div className="w-full text-center">
                  <h2 className="text-3xl font-bold text-gray-500 mb-8">根据例句选择缺失的单词：</h2>
                  <div className="bg-white p-10 rounded-[40px] shadow-xl border-4 border-blue-100 mb-12">
                    <p className="text-4xl font-bold text-gray-700 leading-relaxed italic">
                      "{currentReviewWord.sentence.replace(new RegExp(currentReviewWord.word, 'gi'), '_______')}"
                    </p>
                    <p className="text-2xl text-gray-400 mt-6">{currentReviewWord.translation}</p>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {reviewOptions.map((option, idx) => (
                      <motion.button
                        key={`${option.id}-${idx}`}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => checkFill(option.id)}
                        className="cute-card p-6 text-2xl font-bold text-blue-600 hover:bg-blue-50 hover:border-blue-300 shadow-md"
                      >
                        {option.word}
                      </motion.button>
                    ))}
                  </div>
                </div>
              )}

              {currentExerciseType === 'spelling' && (
                <div className="w-full text-center">
                  <h2 className="text-3xl font-bold text-gray-500 mb-8">拼写出这个单词：</h2>
                  <div className="bg-white p-10 rounded-[40px] shadow-xl border-4 border-yellow-100 mb-12">
                    <div className="text-5xl font-black text-yellow-600 mb-4">{currentReviewWord.meaning}</div>
                    <button onClick={() => speak(currentReviewWord.word)} className="bg-yellow-100 p-4 rounded-full text-yellow-600 hover:bg-yellow-200 transition-colors">
                      <Volume2 size={40} />
                    </button>
                  </div>
                  <div className="flex flex-col items-center gap-6">
                    <input 
                      type="text"
                      value={spellingInput}
                      onChange={(e) => setSpellingInput(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && checkSpelling()}
                      placeholder="在这里输入单词..."
                      autoFocus
                      className="w-full max-w-md text-4xl font-bold text-center p-6 rounded-3xl border-4 border-pink-200 focus:border-pink-400 outline-none shadow-inner bg-pink-50/30"
                    />
                    <button 
                      onClick={checkSpelling}
                      className="cute-button bg-pink-400 hover:bg-pink-500 text-2xl px-12 py-4"
                    >
                      检查答案
                    </button>
                  </div>
                </div>
              )}

              {currentExerciseType === 'speaking' && (
                <div className="w-full text-center">
                  <h2 className="text-3xl font-bold text-gray-500 mb-8">请大声读出这个单词：</h2>
                  <div className="bg-white p-10 rounded-[40px] shadow-xl border-4 border-green-100 mb-12">
                    <div className="text-7xl font-black text-green-600 mb-4 tracking-tight">{currentReviewWord.word}</div>
                    <div className="text-2xl text-blue-400 font-bold mb-6">{currentReviewWord.ipa}</div>
                    <div className="flex justify-center gap-4">
                      <button onClick={() => speak(currentReviewWord.word)} className="bg-green-100 p-4 rounded-full text-green-600 hover:bg-green-200 transition-colors">
                        <Volume2 size={40} />
                      </button>
                      {recordedUrl && (
                        <button 
                          onClick={playRecordedAudio}
                          className="bg-blue-100 p-4 rounded-full text-blue-600 hover:bg-blue-200 transition-colors shadow-sm flex items-center gap-2"
                        >
                          <Play size={40} />
                          <span className="font-bold">听听我的</span>
                        </button>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex flex-col items-center gap-6">
                    <div className="relative group">
                      {/* Professional Recorder UI */}
                      <div className="bg-gray-800 p-10 rounded-[50px] shadow-2xl border-t-4 border-gray-700 relative overflow-hidden">
                        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-white/10 to-transparent" />
                        
                        {/* Recording Waveform Animation */}
                        {isRecording && (
                          <div className="flex items-center justify-center gap-1 mb-8 h-12">
                            {[...Array(8)].map((_, i) => (
                              <motion.div
                                key={i}
                                animate={{ height: [10, 40, 10] }}
                                transition={{ repeat: Infinity, duration: 0.5, delay: i * 0.1 }}
                                className="w-2 bg-red-500 rounded-full"
                              />
                            ))}
                          </div>
                        )}

                        <button 
                          onMouseDown={startRecording}
                          onMouseUp={stopRecording}
                          onMouseLeave={stopRecording}
                          onTouchStart={(e) => { e.preventDefault(); startRecording(); }}
                          onTouchEnd={(e) => { e.preventDefault(); stopRecording(); }}
                          className={`w-32 h-32 rounded-full transition-all shadow-xl border-8 flex items-center justify-center select-none touch-none ${
                            isRecording 
                              ? 'bg-red-600 border-red-400 scale-105 shadow-[0_0_30px_rgba(220,38,38,0.5)]' 
                              : isMicLoading
                              ? 'bg-yellow-500 border-yellow-300 scale-105'
                              : 'bg-emerald-500 border-emerald-300 hover:bg-emerald-600'
                          }`}
                        >
                          {isMicLoading ? <Loader2 size={64} className="text-white animate-spin" /> : <Mic size={64} className="text-white" />}
                        </button>
                        
                        <div className="mt-6 text-center">
                          <p className={`font-black tracking-widest uppercase text-sm ${
                            isRecording ? 'text-red-400 animate-pulse' : 
                            isMicLoading ? 'text-yellow-400 animate-pulse' :
                            'text-gray-400'
                          }`}>
                            {isRecording ? 'Recording...' : isMicLoading ? 'Initializing...' : 'Hold to Speak'}
                          </p>
                        </div>
                      </div>

                      {isRecording && (
                        <motion.div 
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ opacity: 1, scale: 1 }}
                          className="absolute -top-16 left-1/2 -translate-x-1/2 bg-red-600 text-white px-6 py-2 rounded-full font-black shadow-xl flex items-center gap-2"
                        >
                          <div className="w-3 h-3 bg-white rounded-full animate-ping" />
                          LIVE REC
                        </motion.div>
                      )}

                      {/* Hint for recording */}
                      <AnimatePresence>
                        {isRecording && (
                          <motion.div 
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0 }}
                            className="absolute -top-12 left-1/2 -translate-x-1/2 bg-red-500 text-white px-4 py-1 rounded-full text-xs font-bold whitespace-nowrap shadow-lg animate-pulse"
                          >
                            正在录音中...
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                    
                    <AnimatePresence>
                      {(pronunciationFeedback.text || pronunciationFeedback.stars !== undefined) && (
                        <motion.div
                          initial={{ y: 20, opacity: 0 }}
                          animate={{ y: 0, opacity: 1 }}
                          className={`px-8 py-6 rounded-[40px] font-bold shadow-lg border-4 text-xl flex flex-col items-center gap-4 w-full max-w-lg ${
                            pronunciationFeedback.type === 'good' ? 'bg-green-50 border-green-200 text-green-700' : 
                            'bg-orange-50 border-orange-200 text-orange-700'
                          }`}
                        >
                          <div className="flex items-center gap-4 w-full justify-center">
                            <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-md text-2xl">👩‍🏫</div>
                            
                            {pronunciationFeedback.stars !== undefined && (
                              <div className="bg-white px-6 py-3 rounded-2xl shadow-inner border-2 border-black/5 flex flex-col items-center">
                                <span className="text-[10px] uppercase opacity-40 mb-1">British Coach Rating</span>
                                <div className="flex gap-2">
                                  {[...Array(5)].map((_, i) => (
                                    <Star 
                                      key={i} 
                                      size={28} 
                                      className={i < pronunciationFeedback.stars! ? 'text-yellow-500 fill-yellow-500' : 'text-gray-200'}
                                    />
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    {/* Historical Records Section */}
                    {Object.keys(speakingHistory).length > 0 && (
                      <div className="mt-12 w-full max-w-2xl bg-white/40 p-6 rounded-[40px] border-4 border-dashed border-gray-200/50">
                        <h3 className="text-xs font-black text-gray-400 mb-4 uppercase tracking-[0.2em] text-center">本次挑战评分历史 / SESSION HISTORY</h3>
                        <div className="flex flex-wrap gap-3 justify-center">
                          {Object.entries(speakingHistory).map(([word, feedback]: [string, any]) => (
                            <motion.div 
                              key={word} 
                              initial={{ scale: 0.8, opacity: 0 }}
                              animate={{ scale: 1, opacity: 1 }}
                              className={`px-4 py-2 rounded-2xl flex items-center gap-2 shadow-sm border-2 ${
                                feedback.stars >= 4 ? 'bg-green-100 border-green-200 text-green-700' : 
                                feedback.stars >= 3 ? 'bg-blue-100 border-blue-200 text-blue-700' :
                                'bg-orange-100 border-orange-200 text-orange-700'
                              }`}
                            >
                              <span className="font-black text-sm">{word}</span>
                              <div className="flex gap-0.5">
                                {[...Array(5)].map((_, i) => (
                                  <Star 
                                    key={i} 
                                    size={10} 
                                    className={i < (feedback.stars || 0) ? 'text-yellow-500 fill-yellow-500' : 'text-gray-300 opacity-30'}
                                  />
                                ))}
                              </div>
                            </motion.div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              <div className="flex gap-8 mt-12">
                <button 
                  onClick={prevWord}
                  disabled={currentWordIndex === 0}
                  className={`cute-button flex items-center gap-2 text-xl ${currentWordIndex === 0 ? 'bg-gray-300' : 'bg-blue-400 hover:bg-blue-500'}`}
                >
                  <ChevronLeft size={28} />
                  上一个
                </button>
                <button 
                  onClick={nextWord}
                  className="cute-button flex items-center gap-2 text-xl bg-pink-400 hover:bg-pink-500"
                >
                  下一个
                  <ChevronRight size={28} />
                </button>
              </div>
            </motion.div>
          )}

          {mode === 'extension' && (
            <motion.div 
              key="extension"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              className="w-full max-w-2xl flex flex-col items-center"
            >
              <div className="w-full flex justify-start mb-4">
                <button 
                  onClick={goHome}
                  className="flex items-center gap-1 text-gray-400 hover:text-[#D4A373] transition-colors font-bold bg-white/50 px-4 py-2 rounded-full shadow-sm"
                >
                  <ChevronLeft size={20} />
                  返回首页
                </button>
              </div>

              <div className="cute-card p-10 w-full bg-white/80 backdrop-blur-sm border-4 border-[#F5EBE0]">
                <div className="text-center mb-10">
                  <div className="bg-[#FFF9F0] w-20 h-20 rounded-3xl flex items-center justify-center mx-auto mb-4 shadow-inner">
                    <Sparkles size={40} className="text-[#D4A373]" />
                  </div>
                  <h2 className="text-3xl font-black text-[#A98467]">拓展关卡：AI 魔法单词</h2>
                  <p className="text-gray-500 mt-2">拍照或输入单词，AI 老师为你生成专属关卡！</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                  <div className="space-y-4">
                    <label className="block text-lg font-bold text-[#A98467] ml-2">方式一：拍照/上传</label>
                    <div className="relative">
                      <input 
                        type="file" 
                        accept="image/*" 
                        capture="environment"
                        onChange={handleImageUpload}
                        className="absolute inset-0 opacity-0 cursor-pointer z-10"
                        disabled={isGenerating}
                      />
                      <div className="cute-card p-8 border-dashed border-4 border-[#E6CCB2] flex flex-col items-center gap-3 hover:bg-[#FFF9F0] transition-colors">
                        <Camera size={48} className="text-[#D4A373]" />
                        <span className="font-bold text-[#A98467]">点击拍照或上传</span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <label className="block text-lg font-bold text-[#A98467] ml-2">方式二：手动输入</label>
                    <div className="flex flex-col gap-4">
                      <textarea 
                        value={extensionInput}
                        onChange={(e) => setExtensionInput(e.target.value)}
                        placeholder="输入你想学习的单词，用空格或逗号分隔..."
                        className="w-full h-[120px] p-4 rounded-2xl border-4 border-[#F5EBE0] focus:border-[#D4A373] outline-none resize-none font-medium text-gray-700 shadow-inner"
                        disabled={isGenerating}
                      />
                      <button 
                        onClick={() => generateCustomUnit(extensionInput)}
                        disabled={!extensionInput.trim() || isGenerating}
                        className={`cute-button flex items-center justify-center gap-2 text-xl ${
                          !extensionInput.trim() || isGenerating ? 'bg-gray-300' : 'bg-[#D4A373] hover:bg-[#A98467]'
                        }`}
                      >
                        {isGenerating ? <Loader2 size={24} className="animate-spin" /> : <TypeIcon size={24} />}
                        开始生成
                      </button>
                    </div>
                  </div>
                </div>

                {isGenerating && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-center p-6 bg-[#FFF9F0] rounded-2xl border-2 border-[#F5EBE0]"
                  >
                    <div className="flex items-center justify-center gap-3 text-[#D4A373] font-bold text-xl mb-2">
                      <Loader2 size={28} className="animate-spin" />
                      AI 老师正在施魔法...
                    </div>
                    <p className="text-[#A98467]">正在为你准备专属的学习和挑战模块，请稍等片刻</p>
                  </motion.div>
                )}
              </div>
            </motion.div>
          )}

          {mode === 'learn-result' && selectedUnit && (
            <motion.div 
              key="learn-result"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="cute-card p-12 text-center max-w-md w-full relative overflow-hidden"
            >
              <motion.div 
                animate={{ y: [0, -10, 0] }}
                transition={{ repeat: Infinity, duration: 2 }}
                className="bg-green-100 w-32 h-32 rounded-full flex items-center justify-center mx-auto mb-8 shadow-inner"
              >
                <BookOpen size={64} className="text-green-500" />
              </motion.div>
              <h2 className="text-4xl font-black text-gray-800 mb-4">学习完成！</h2>
              <p className="text-xl text-gray-500 mb-10">你已经学完了 {selectedUnit.title} 的所有单词，太棒了！</p>
              
              <div className="space-y-4 relative z-10">
                <button 
                  onClick={() => handleSelectUnit(selectedUnit, 'learning')}
                  className="cute-button bg-[#D4A373] hover:bg-[#A98467] w-full flex items-center justify-center gap-3 text-xl"
                >
                  <RotateCcw size={24} />
                  再学一次
                </button>
                <button 
                  onClick={goHome}
                  className="cute-button bg-[#E6CCB2] hover:bg-[#D4A373] w-full flex items-center justify-center gap-3 text-xl"
                >
                  <HomeIcon size={24} />
                  返回首页
                </button>
              </div>
              <PartyPopper size={150} className="absolute -bottom-10 -left-10 text-[#F5EBE0] -rotate-12 pointer-events-none" />
              <Sparkles size={150} className="absolute -top-10 -right-10 text-yellow-100 rotate-12 pointer-events-none" />
            </motion.div>
          )}

          {mode === 'review-result' && selectedUnit && (
            <motion.div 
              key="result"
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="cute-card p-12 text-center max-w-md w-full relative overflow-hidden"
            >
              <motion.div 
                animate={{ rotate: [0, 10, -10, 0] }}
                transition={{ repeat: Infinity, duration: 2 }}
                className="bg-yellow-100 w-32 h-32 rounded-full flex items-center justify-center mx-auto mb-8 shadow-inner"
              >
                <Trophy size={64} className="text-yellow-500" />
              </motion.div>
              <h2 className="text-4xl font-black text-gray-800 mb-4">挑战大成功！</h2>
              <div className="space-y-4 mb-10">
                <p className="text-2xl text-gray-500">
                  总积分: <span className="text-[#A98467] font-black text-4xl">{points}</span>
                </p>
                <div className="flex justify-center gap-2">
                  {[...Array(Math.min(stars, 5))].map((_, i) => (
                    <motion.div
                      key={i}
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ delay: i * 0.1 }}
                    >
                      <Star size={32} className="text-yellow-400 fill-yellow-400" />
                    </motion.div>
                  ))}
                </div>
              </div>
              
              <div className="space-y-4 relative z-10">
                <button 
                  onClick={() => handleSelectUnit(selectedUnit, 'review')}
                  className="cute-button bg-[#D4A373] hover:bg-[#A98467] w-full flex items-center justify-center gap-3 text-xl"
                >
                  <RotateCcw size={24} />
                  再挑战一次
                </button>
                <button 
                  onClick={goHome}
                  className="cute-button bg-[#E6CCB2] hover:bg-[#D4A373] w-full flex items-center justify-center gap-3 text-xl"
                >
                  <HomeIcon size={24} />
                  返回首页
                </button>
              </div>
              <PartyPopper size={150} className="absolute -bottom-10 -left-10 text-[#F5EBE0] -rotate-12 pointer-events-none" />
              <Sparkles size={150} className="absolute -top-10 -right-10 text-yellow-100 rotate-12 pointer-events-none" />
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Footer Decoration */}
      <footer className="mt-12 opacity-30 flex gap-12">
        <Heart className="text-pink-400 fill-pink-400 bouncy" style={{ animationDelay: '0.2s' }} />
        <Music className="text-blue-400 fill-blue-400 bouncy" style={{ animationDelay: '0.5s' }} />
        <Star className="text-yellow-400 fill-yellow-400 bouncy" style={{ animationDelay: '0.8s' }} />
        <Sparkles className="text-purple-400 fill-purple-400 bouncy" style={{ animationDelay: '1.1s' }} />
      </footer>

      <style>{`
        .perspective-1000 { perspective: 1000px; }
        .preserve-3d { transform-style: preserve-3d; }
        .backface-hidden { backface-visibility: hidden; }
        .rotate-y-180 { transform: rotateY(180deg); }
      `}</style>
    </div>
  );
}
