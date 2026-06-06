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
  { left: '20%', bottom: '10%' },
  { left: '60%', bottom: '20%' },
  { left: '30%', bottom: '30%' },
  { left: '70%', bottom: '40%' },
  { left: '25%', bottom: '50%' },
  { left: '65%', bottom: '65%' },
  { left: '35%', bottom: '78%' },
  { left: '75%', bottom: '88%' },
  { left: '45%', bottom: '96%' }, // New position for Extension Node
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

interface SentencePair {
  english: string;
  chinese: string;
}

const getStorySentencePairs = (story: string, storyTranslation: string): SentencePair[] => {
  if (!story) return [];
  // Split on sentence terminals: ., !, ? followed by whitespace or quote or end of string
  const engMatches = story.match(/[^.!?]+(?:[.!?]["'”]?|\s*)/g) || [];
  const engSentences = engMatches.map(s => s.trim()).filter(s => s.length > 0);

  const chiMatches = storyTranslation.match(/[^。！？]+(?:[。！？]["'”]?|\s*)/g) || [];
  const chiSentences = chiMatches.map(s => s.trim()).filter(s => s.length > 0);

  if (engSentences.length === chiSentences.length && engSentences.length > 0) {
    return engSentences.map((eng, idx) => ({
      english: eng,
      chinese: chiSentences[idx]
    }));
  }

  // Fallback if mismatch: pair up manually or put as single block
  if (engSentences.length > 0 && chiSentences.length > 0) {
    const pairs: SentencePair[] = [];
    const minLen = Math.min(engSentences.length, chiSentences.length);
    for (let i = 0; i < minLen; i++) {
       pairs.push({ english: engSentences[i], chinese: chiSentences[i] });
    }
    // Append any extra English sentences
    if (engSentences.length > minLen) {
      for (let i = minLen; i < engSentences.length; i++) {
        pairs.push({ english: engSentences[i], chinese: '' });
      }
    }
    // Append any extra Chinese sentences to the last pair
    if (chiSentences.length > minLen && pairs.length > 0) {
      pairs[pairs.length - 1].chinese += ' ' + chiSentences.slice(minLen).join(' ');
    }
    return pairs;
  }

  return [{ english: story, chinese: storyTranslation }];
};

const PREDEFINED_GRAMMAR_POINTS: Record<number | string, { title: string; desc: string }[]> = {
  1: [
    { title: "Let's + 动词原形", desc: "表示提议或建议，“让我们一起做某事吧！”。例如：Let's go to the park! (我们去公园吧！)" },
    { title: "Don't forget to + 动词原形", desc: "表示温柔地提醒或命令，“别忘了做某事”。例如：Don't forget to wash hands! (别忘了洗手！)" },
    { title: "一般现在时第三人称单数形式", desc: "当主语是单个的人或事物时，后面的动作要加词尾。例如：Lily wears... (莉莉穿着……), She runs... (她跑……)" }
  ],
  2: [
    { title: "It's time to + 动词原形", desc: "表示“该到做某事的时间了！”。例如：It's time to hurry to school! (该赶紧去学校了！)" },
    { title: "It's time for + 名词", desc: "表示“该到某样事物的时间了”。例如：time for bed (该上床睡觉了)" },
    { title: "小学必备时间表达法", desc: "整点用 o'clock；半点用 half past 加上小时。例如：half past eight (八点半), seven o'clock (七点整)" }
  ],
  3: [
    { title: "Maybe 开头表达推测", desc: "Maybe表示‘大概、也许’，通常直接放在句子开头来猜测。例如：Maybe I can join a sport club." },
    { title: "spend [时间] to do sth", desc: "表示“花费多长时间去做某事”。例如：spend one hour to pack books (花一个小时收拾书)" },
    { title: "年龄的常用表达法", desc: "数字后面直接接 years old，或者直接写数字。例如：forty years old (四十岁了)" }
  ],
  4: [
    { title: "loves/likes to + 动词原形", desc: "用来表达非常喜爱、热爱做某事。例如：She loves to eat yummy things. (她特别喜欢吃美味的东西。)" },
    { title: "Can I + 动词原形? 的疑问句", desc: "用于礼貌地征得别人的同意，“我可以……吗？”。例如：Can I join your game? (我能加入你们的游戏吗？)" },
    { title: "动名词 -ing 充当主语", desc: "将动作变成 -ing 后作为高大上的主语，谓语动词用 is。例如：Playing football is... (学踢足球是……)" }
  ],
  5: [
    { title: "must + 动词原形", desc: "表示“必须、一定要”做某事，具有很强的规章和语气。例如：We must follow rules. (我们必须遵守规则。)" },
    { title: "need to + 动词原形", desc: "表示“需要、应当”做某事，语气更温和。例如：we need to clean... (我们需要打扫……)" },
    { title: "must not（绝对不行）", desc: "表示绝对禁止，绝对不可以做的事。例如：must not run away (不可以跑开)" }
  ],
  6: [
    { title: "常用动作的过去式", desc: "用来描述过去发生的事情，动词要变过去式。例如：went (go的过去式), ate (eat的过去式), said (say的过去式)" },
    { title: "情态动词 should（应该）", desc: "表应该、应当做某事，通常用来给出好的建议。例如：You should carry out... (大家应该拿出……)" },
    { title: "祈使句（命令和指令）", desc: "直接以动词原形开头，省略主语you，对别人发号施令。例如：Stand in a line, please. (请排排队。)" }
  ],
  7: [
    { title: "礼貌用语二人组", desc: "Excuse me 在打扰、让路或问询时说代表“请问”；Sorry 在做错了事或表达歉意时说代表“对不起”。" },
    { title: "选择疑问句 (使用 or)", desc: "使用 or（或者）连接两个选择让我们挑选其一。例如：go to the toilet or drink some water? (去洗手间还是喝点水？)" },
    { title: "多动作的并列表示法", desc: "有三个或以上连续动作时，前面动作加逗号，最后一个前加 and。例如：walk there, knock on the door, and turn off... " }
  ],
  8: [
    { title: "Before（在……之前）时间状语从句", desc: "表示在一个动作做之前发生的事。例如：Before we use the computer... (在我们用电脑前……)" },
    { title: "When（当……时）时间状语从句", desc: "表示当时间处于某处、做某事的时候。例如：When you go outside... (当你走到外面的时候……)" },
    { title: "绝对禁止与劝阻 (使用 never)", desc: "使用 never（千万别）或 don't 开头表示强烈的禁止劝说。例如：never litter! (千万不要乱扔垃圾！)" }
  ]
};

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
  const [voicesLoaded, setVoicesLoaded] = useState(false);

  // Speech Synthesis Unlocker and Voice Loader
  useEffect(() => {
    const loadVoices = () => {
      const voices = window.speechSynthesis.getVoices();
      if (voices.length > 0) {
        setVoicesLoaded(true);
      }
    };
    
    const unlockSpeech = () => {
      const utterance = new SpeechSynthesisUtterance("");
      window.speechSynthesis.speak(utterance);
      console.log("Speech synthesis unlocked");
      document.removeEventListener('touchstart', unlockSpeech);
      document.removeEventListener('click', unlockSpeech);
    };

    loadVoices();
    window.speechSynthesis.onvoiceschanged = loadVoices;
    document.addEventListener('touchstart', unlockSpeech);
    document.addEventListener('click', unlockSpeech);

    return () => {
      window.speechSynthesis.onvoiceschanged = null;
      document.removeEventListener('touchstart', unlockSpeech);
      document.removeEventListener('click', unlockSpeech);
    };
  }, []);
  const [extensionInput, setExtensionInput] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [customUnit, setCustomUnit] = useState<Unit | null>(null);
  const [showStoryTranslation, setShowStoryTranslation] = useState(false);
  const [petPosition, setPetPosition] = useState({ left: '5%', bottom: '20%' });
  const [petMessage, setPetMessage] = useState(PET_MESSAGES[0]);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Generate dynamic path connecting all nodes
  const mapPath = useMemo(() => {
    const points = wordData.map((_, i) => {
      const pos = ADVENTURE_POSITIONS[i % ADVENTURE_POSITIONS.length];
      const x = parseFloat(pos.left) * 4.5; // 450 / 100
      const y = 800 - (parseFloat(pos.bottom) * 8); // 800 / 100
      return { x, y };
    });
    
    // Add extension node at the end (Magical Gate)
    const extPos = ADVENTURE_POSITIONS[8];
    points.push({
      x: parseFloat(extPos.left) * 4.5,
      y: 800 - (parseFloat(extPos.bottom) * 8)
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
        audioRef.current.muted = false; // Ensure it's not muted
        audioRef.current.volume = 0.3;
        
        const playPromise = audioRef.current.play();
        if (playPromise !== undefined) {
          playPromise.catch(e => {
            console.error("Audio play blocked or failed:", e);
            // Fallback: wait and try again
            setTimeout(() => {
              if (audioRef.current) {
                audioRef.current.muted = false;
                audioRef.current.play().catch(err => console.error("Still blocked:", err));
              }
            }, 300);
          });
        }
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
      const apiKey = process.env.GEMINI_API_KEY;
      
      // Check for missing API key which is common after deployment to other platforms
      if (!apiKey || apiKey === 'undefined' || apiKey === '') {
        throw new Error('API_KEY_MISSING');
      }

      const ai = new GoogleGenAI({ apiKey });
      const prompt = `You are a helpful English teacher for kids. 
      Based on the provided input (either a list of words or an image containing words), extract or generate a list of 5-10 English words suitable for children to learn.
      For each word, provide:
      1. The word itself.
      2. Its IPA (International Phonetic Alphabet) pronunciation.
      3. Its Chinese meaning.
      4. A simple example sentence in English.
      5. The Chinese translation of that sentence.

      Also, create a short, lively and interesting story (2-4 sentences) that integrates all of the extracted/generated words. The story should use simple English suitable for 3rd-grade primary school students, and provide its Chinese translation.
      In addition, extract 2-3 key grammar/knowledge points (语法/知识点) used in the story, and explain them in a very simple, lively, engaging child-friendly tone.

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
        ],
        "story": "A short, engaging English story...",
        "storyTranslation": "该英语小故事的中文翻译...",
        "grammarPoints": [
          {
            "title": "语法点标题",
            "desc": "简单活泼的中文解释，并附带例句..."
          }
        ]
      }
      Only return the JSON object, no other text.`;

      const contents = typeof input === 'string' 
        ? [{ parts: [{ text: `${prompt}\n\nInput words: ${input}` }] }]
        : [{ parts: [{ text: prompt }, { inlineData: input }] }];

      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents,
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
              },
              story: { type: Type.STRING },
              storyTranslation: { type: Type.STRING },
              grammarPoints: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    title: { type: Type.STRING },
                    desc: { type: Type.STRING }
                  },
                  required: ["title", "desc"]
                }
              }
            },
            required: ["id", "title", "words", "story", "storyTranslation", "grammarPoints"]
          }
        }
      });

      if (!response.text) {
        throw new Error('EMPTY_RESPONSE');
      }

      const result = JSON.parse(response.text);
      setCustomUnit(result);
      handleSelectUnit(result, 'learning');
    } catch (error: any) {
      console.error("AI Generation Error:", error);
      if (error.message === 'API_KEY_MISSING') {
        alert("检测到未配置 API 密匙。请在部署平台的环境变量中添加 GEMINI_API_KEY。");
      } else {
        alert("生成失败，请稍后再试或检查输入内容。如果多次失败，请检查 API 密匙是否正确且具有配额。");
      }
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
    if (!text) return;
    
    // Ensure speech synthesis is not paused
    if (window.speechSynthesis.paused) {
      window.speechSynthesis.resume();
    }

    try {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      
      const voices = window.speechSynthesis.getVoices();
      // Look for high-quality British voices first, then any English
      let voice = voices.find(v => v.lang.includes('en-GB') && v.name.includes('Google'));
      if (!voice) voice = voices.find(v => v.lang.includes('en-GB'));
      if (!voice) voice = voices.find(v => v.lang.includes('en') && v.name.includes('Female'));
      if (!voice) voice = voices.find(v => v.lang.includes('en'));

      if (voice) {
        utterance.voice = voice;
      }
      
      utterance.lang = 'en-GB';
      utterance.rate = 0.7; // Standard learning speed
      utterance.pitch = 1.0;
      utterance.volume = 1.0;
      
      window.speechSynthesis.speak(utterance);
    } catch (e) {
      console.error("Speech Synthesis failed:", e);
    }
  };

  const renderHighlightedStory = (story: string, words: Word[]) => {
    if (!story) return null;
    
    // Sort words by length descending to match longer words first
    const sortedWords = [...words].sort((a, b) => b.word.length - a.word.length);
    
    // Build a regex pattern matching any of the words (case insensitive, word boundary checks)
    const escapedWords = sortedWords.map(w => w.word.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&'));
    
    // We match words with boundaries properly
    const regex = new RegExp(`\\b(${escapedWords.join('|')})\\b`, 'gi');
    
    const parts = story.split(regex);
    if (parts.length === 1) return <span className="inline-block align-middle text-gray-800 font-extrabold text-lg sm:text-xl leading-relaxed select-text py-2">{story}</span>;
    
    return parts.map((part, index) => {
      const isMatched = words.some(w => w.word.toLowerCase() === part.toLowerCase());
      if (isMatched) {
        const matchWord = words.find(w => w.word.toLowerCase() === part.toLowerCase());
        return (
          <span 
            key={index} 
            onClick={() => speak(part)}
            className="inline-flex flex-col items-center justify-center align-middle mx-1 cursor-pointer transform hover:scale-105 active:scale-95 transition-all select-none"
            title={`点击发音: ${matchWord?.meaning || ''}`}
          >
            <span className="bg-red-50 text-red-600 border border-red-200/50 hover:bg-red-500 hover:text-white px-2.5 py-0.5 rounded-xl font-extrabold transition-all shadow-sm text-base sm:text-lg lg:text-xl leading-none mb-0.5">
              {part}
            </span>
            {showStoryTranslation && matchWord && (
              <span className="text-[10px] font-bold text-red-500 bg-red-50 px-1 py-0.5 rounded border border-red-200/50 leading-none shadow-sm mt-0.5">
                {matchWord.meaning}
              </span>
            )}
          </span>
        );
      }
      return <span key={index} className="inline-block align-middle text-gray-800 font-bold text-base sm:text-lg leading-relaxed select-text py-1">{part}</span>;
    });
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
    const maxIndex = (!isReviewingMistakes && mode === 'learning' && selectedUnit?.story) ? list.length + 1 : list.length - 1;
    if (currentWordIndex < maxIndex) {
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
    <div className="min-h-screen bg-pattern flex flex-col items-center p-4 sm:p-6">
      {/* Background Music Element */}
      <audio 
        ref={audioRef}
        src="https://assets.mixkit.co/music/preview/mixkit-funny-paws-507.mp3"
        loop
        preload="auto"
        crossOrigin="anonymous"
      />

      {/* Header with Stats */}
      <header className="w-full max-w-[480px] flex justify-between items-center mb-6 px-1">
        <motion.div 
          initial={{ x: -20, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          className="flex items-center gap-2 cursor-pointer"
          onClick={goHome}
        >
          <div className="bg-[#D4A373] p-1 rounded-lg sm:p-1.5 sm:rounded-xl shadow-lg">
            <Star className="text-white fill-white" size={20} sm:size={24} />
          </div>
          <h1 className="text-lg sm:text-xl font-bold text-[#A98467] tracking-tight">奶油单词</h1>
        </motion.div>

        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* Music Toggle */}
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={toggleMusic}
            className={`flex items-center gap-1.5 sm:gap-2 px-2 sm:px-3 py-1 sm:py-1.5 rounded-full font-bold shadow-md transition-all border-2 ${
              isMusicPlaying ? 'bg-yellow-50 border-yellow-200 text-yellow-600' : 'bg-gray-50 border-gray-200 text-gray-400'
            }`}
          >
            <Music size={14} sm:size={16} className={isMusicPlaying ? 'animate-bounce' : ''} />
            <span className="text-[9px] sm:text-[10px] hidden xs:inline">{isMusicPlaying ? 'ON' : 'OFF'}</span>
          </motion.button>

          <motion.div 
            animate={{ scale: points > 0 ? [1, 1.2, 1] : 1 }}
            className="bg-white px-2 sm:px-3 py-1 sm:py-1.5 rounded-full shadow-md flex items-center gap-1 sm:gap-1.5 border-2 border-[#F5EBE0]"
          >
            <Sparkles className="text-yellow-500" size={14} sm:size={16} />
            <span className="font-bold text-[#A98467] text-xs sm:text-sm">{points}</span>
          </motion.div>
          
          {mode !== 'home' && (
            <button onClick={goHome} className="p-1 sm:p-1.5 bg-white rounded-full shadow-md text-gray-400 hover:text-[#D4A373] transition-colors">
              <HomeIcon size={18} sm:size={20} />
            </button>
          )}
        </div>
      </header>

      <main className="w-full max-w-[480px] flex-1 flex flex-col items-center justify-center relative">
        {/* Feedback Overlay */}
        <AnimatePresence>
          {showFeedback && (
            <motion.div 
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0, opacity: 0 }}
              className="fixed inset-0 z-50 flex flex-col items-center justify-center pointer-events-none"
            >
              <div className={`p-6 sm:p-8 rounded-full ${showFeedback === 'correct' ? 'bg-green-500' : 'bg-red-500'} shadow-2xl mb-4`}>
                {showFeedback === 'correct' ? <CheckCircle2 size={60} sm:size={80} className="text-white" /> : <XCircle size={60} sm:size={80} className="text-white" />}
              </div>
              
              <motion.div 
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                className={`text-2xl sm:text-3xl font-bold text-center bg-white px-6 sm:px-8 py-3 sm:py-4 rounded-[30px] shadow-xl border-4 ${
                  showFeedback === 'correct' ? 'text-green-600 border-green-100' : 'text-red-600 border-red-100'
                }`}
              >
                {showFeedback === 'correct' ? (
                  encouragement
                ) : (
                  <div className="flex flex-col gap-1 sm:gap-2">
                    <p className="text-lg sm:text-xl text-gray-400">正确答案是：</p>
                    <p className="text-3xl sm:text-4xl font-black text-red-500 mb-1 sm:mb-2">{correctWordHint}</p>
                    <p className="text-base sm:text-lg text-red-400">{encouragement}</p>
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
              className="w-full relative min-h-[700px] sm:min-h-[800px] bg-gradient-to-b from-emerald-900 via-green-800 to-emerald-950 rounded-[40px] sm:rounded-[50px] border-4 sm:border-8 border-emerald-100 shadow-2xl overflow-hidden p-4 sm:p-6"
            >
              {/* Magic Forest Background Elements */}
              <div className="absolute inset-0 pointer-events-none">
                {/* Magical Glows */}
                <div className="absolute top-10 left-10 w-48 h-48 bg-emerald-400/20 rounded-full blur-[80px]" />
                <div className="absolute bottom-20 right-20 w-64 h-64 bg-lime-300/20 rounded-full blur-[80px]" />
                
                {/* Floating Particles */}
                {[...Array(15)].map((_, i) => (
                  <motion.div
                    key={i}
                    className="absolute w-1 h-1 bg-yellow-200 rounded-full"
                    animate={{
                      y: [0, -100, 0],
                      x: [0, Math.random() * 40 - 20, 0],
                      opacity: [0, 0.8, 0],
                      scale: [0, 1.2, 0]
                    }}
                    transition={{
                      duration: 4 + Math.random() * 4,
                      repeat: Infinity,
                      delay: Math.random() * 4
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
                  <Trees size={200} />
                </div>
                <div className="absolute -bottom-20 -right-10 text-emerald-700/30 -rotate-12">
                  <Trees size={250} />
                </div>
              </div>

              {/* Map Path Decoration */}
              <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 450 800">
                <motion.path
                  d={mapPath}
                  fill="none"
                  stroke="rgba(255, 255, 255, 0.3)"
                  strokeWidth="6"
                  strokeDasharray="12 12"
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
                  strokeWidth="10"
                  className="blur-md"
                />
              </svg>

              <div className="relative z-10 flex flex-col items-center">
                <div className="text-center mb-8">
                  <h2 className="text-3xl font-black text-emerald-50 mb-1 drop-shadow-md">魔法森林单词</h2>
                  <p className="text-emerald-300 text-sm font-bold opacity-80">寻找失落的单词吧！</p>
                </div>

                {/* Adventure Nodes */}
                <div className="relative w-full h-[650px]">
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
                            className="w-14 h-14 bg-white rounded-2xl shadow-xl border-4 border-[#E6CCB2] flex items-center justify-center text-xl font-black text-[#A98467] z-20 relative"
                          >
                            {index + 1}
                          </motion.button>
                          
                          {/* Tooltip */}
                          <div className="absolute -top-12 left-1/2 -translate-x-1/2 bg-[#A98467] text-white px-3 py-1 rounded-xl text-sm font-bold opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap shadow-lg">
                            {unit.title}
                          </div>

                          {/* Mode Selection Mini-Menu - Always Visible */}
                          <div className="absolute top-full mt-2 left-1/2 -translate-x-1/2 flex gap-1.5 z-30">
                            <button 
                              onClick={(e) => { e.stopPropagation(); handleSelectUnit(unit, 'learning', pos); }}
                              className="bg-blue-400 p-1.5 rounded-xl text-white shadow-lg hover:bg-blue-500 hover:scale-110 transition-all border-2 border-white"
                              title="学习"
                            >
                              <BookOpen size={14} />
                            </button>
                            <button 
                              onClick={(e) => { e.stopPropagation(); handleSelectUnit(unit, 'review-select', pos); }}
                              className="bg-purple-400 p-1.5 rounded-xl text-white shadow-lg hover:bg-purple-500 hover:scale-110 transition-all border-2 border-white"
                              title="挑战"
                            >
                              <Gamepad2 size={14} />
                            </button>
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}

                  {/* Extension Node */}
                  <motion.div
                    style={{ left: ADVENTURE_POSITIONS[8].left, bottom: ADVENTURE_POSITIONS[8].bottom }}
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
                          setPetPosition(ADVENTURE_POSITIONS[8]);
                          setTimeout(() => setMode('extension'), 300);
                        }}
                        className="w-14 h-14 bg-gradient-to-br from-[#FFF9F0] to-[#F5EBE0] rounded-2xl shadow-xl border-4 border-[#E6CCB2] flex items-center justify-center text-[#A98467] z-20 relative"
                      >
                        <Sparkles size={24} className="animate-pulse" />
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
                      <div className="w-14 h-14 bg-white rounded-full border-4 border-[#F5EBE0] shadow-xl flex items-center justify-center text-3xl">
                        🐶
                      </div>
                      <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-16 h-4 bg-black/10 rounded-full blur-sm" />
                    </div>
                  </motion.div>

                  {/* Mistakes Review Entry - Adjusted to be in the far corner and match level icon size */}
                  {mistakes.length > 0 && (
                    <motion.div 
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="absolute right-4 bottom-4 z-50 group"
                    >
                      <button 
                        onClick={startMistakeReview}
                        className="relative flex items-center justify-center"
                      >
                        <div className="w-14 h-14 bg-gradient-to-br from-[#D4A373] to-[#A98467] rounded-2xl flex items-center justify-center text-white shadow-xl border-4 border-white group-hover:scale-110 transition-transform">
                          <BookOpen size={24} />
                        </div>
                        
                        {/* Notification Badge */}
                        <div className="absolute -top-2 -right-2 bg-red-500 text-white w-7 h-7 rounded-full flex items-center justify-center text-[12px] font-bold border-2 border-white shadow-md z-10">
                          {mistakes.length}
                        </div>

                        {/* Floating Label on Hover */}
                        <div className="absolute -top-10 right-0 bg-[#D4A373] text-white px-3 py-1 rounded-lg text-xs font-bold opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap shadow-lg">
                          错题复习
                        </div>
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
                  <span className="bg-[#FFF9F0] text-[#A98467] px-4 sm:px-6 py-1.5 sm:py-2 rounded-full font-black text-sm sm:text-lg shadow-sm border border-[#F5EBE0]">
                    {currentWordIndex === selectedUnit.words.length ? (
                      `${selectedUnit.title} - 故事乐园`
                    ) : currentWordIndex === selectedUnit.words.length + 1 ? (
                      `${selectedUnit.title} - 语法魔法盒`
                    ) : (
                      selectedUnit.title
                    )}
                  </span>
                </div>
                <div className="flex-1 mx-4 sm:mx-8 h-4 bg-gray-100 rounded-full overflow-hidden shadow-inner">
                  <motion.div 
                    className="bg-gradient-to-r from-[#D4A373] to-[#E6CCB2] h-full"
                    initial={{ width: 0 }}
                    animate={{ 
                      width: `${
                        ((currentWordIndex + 1) / 
                        (selectedUnit.story ? selectedUnit.words.length + 2 : selectedUnit.words.length)) * 100
                      }%` 
                    }}
                  />
                </div>
                <span className="text-gray-400 font-bold text-sm sm:text-lg whitespace-nowrap">
                  {currentWordIndex === selectedUnit.words.length ? (
                    "📖 单元故事"
                  ) : currentWordIndex === selectedUnit.words.length + 1 ? (
                    "💡 语法魔法盒"
                  ) : (
                    `${currentWordIndex + 1} / ${selectedUnit.words.length}`
                  )}
                </span>
              </div>

              {currentWordIndex < selectedUnit.words.length ? (
                // --- Individual Word Card ---
                <div className="w-full flex flex-col items-center">
                  <div className="cute-card w-full p-4 sm:p-8 flex flex-col items-center gap-4 sm:gap-8 bg-white/80 backdrop-blur-sm">
                    <div className="w-full text-center">
                      <div className="flex flex-col items-center gap-3 sm:gap-4 mb-3 sm:mb-4">
                        <h2 className="text-4xl sm:text-5xl font-black text-gray-800 tracking-tight break-words max-w-full">
                          {selectedUnit.words[currentWordIndex].word}
                        </h2>
                        <div className="flex flex-wrap justify-center gap-2 sm:gap-3">
                          <button 
                            onClick={() => speak(selectedUnit.words[currentWordIndex].word)}
                            className="p-2 sm:p-3 bg-yellow-100 text-yellow-600 rounded-xl sm:rounded-2xl hover:bg-yellow-200 transition-colors shadow-sm"
                            title="标准英音朗读"
                          >
                            <Volume2 size={24} sm:size={32} />
                          </button>
                          <div className="relative group">
                            <button 
                              onMouseDown={startRecording}
                              onMouseUp={stopRecording}
                              onMouseLeave={stopRecording}
                              onTouchStart={(e) => { e.preventDefault(); startRecording(); }}
                              onTouchEnd={(e) => { e.preventDefault(); stopRecording(); }}
                              className={`p-2 sm:p-3 rounded-xl sm:rounded-2xl transition-all shadow-sm flex items-center gap-2 select-none touch-none ${
                                isRecording ? 'bg-red-500 text-white scale-110' : 
                                isMicLoading ? 'bg-yellow-400 text-white scale-105' :
                                'bg-[#FFF9F0] text-[#A98467] hover:bg-[#F5EBE0]'
                              }`}
                              title={isMicLoading ? "正在载入..." : "长按录音"}
                            >
                              {isMicLoading ? <Loader2 size={24} sm:size={32} className="animate-spin" /> : <Mic size={24} sm:size={32} />}
                              {isRecording && <span className="text-xs sm:text-sm font-bold animate-pulse">录制中...</span>}
                              {isMicLoading && <span className="text-xs sm:text-sm font-bold animate-pulse">调取中...</span>}
                            </button>
                          </div>
                          {recordedUrl && (
                            <button 
                              onClick={playRecordedAudio}
                              className="p-2 sm:p-3 bg-green-100 text-green-600 rounded-xl sm:rounded-2xl hover:bg-green-200 transition-colors shadow-sm flex items-center gap-2"
                              title="播放我的录音"
                            >
                              <Play size={24} sm:size={32} />
                              <span className="text-xs sm:text-sm font-bold">听听我的</span>
                            </button>
                          )}
                        </div>
                      </div>
                      <p className="text-xl sm:text-2xl text-blue-500 font-bold mb-4 sm:mb-6">
                        {selectedUnit.words[currentWordIndex].ipa}
                      </p>
                      <div className="flex flex-col items-center gap-4">
                        <div className="bg-[#FFF9F0] p-3 sm:p-4 rounded-xl sm:rounded-2xl border-2 border-[#F5EBE0] inline-block">
                          <h3 className="text-xl sm:text-2xl font-bold text-[#A98467]">
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

                    <div className="w-full bg-blue-50 p-6 rounded-[30px] border-4 border-white shadow-inner">
                      <div className="flex items-center justify-center gap-3 mb-3">
                        <span className="bg-blue-200 text-blue-700 px-3 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider">Example</span>
                        <button 
                          onClick={() => speak(selectedUnit.words[currentWordIndex].sentence)}
                          className="text-blue-400 hover:text-blue-600 transition-colors"
                        >
                          <Volume2 size={20} />
                        </button>
                      </div>
                      <p className="text-xl font-bold text-gray-700 leading-relaxed mb-3 italic text-center">
                        "{selectedUnit.words[currentWordIndex].sentence}"
                      </p>
                      <p className="text-lg text-gray-500 font-medium text-center">
                        {selectedUnit.words[currentWordIndex].translation}
                      </p>
                    </div>
                  </div>
                </div>
              ) : currentWordIndex === selectedUnit.words.length ? (
                // --- Story Land Card (Main Page after last word) ---
                selectedUnit.story && (
                  <div className="w-full cute-card bg-gradient-to-br from-[#FFF9F0] to-[#F5EBE0] border-4 border-white shadow-xl p-4 sm:p-6 relative overflow-hidden" id="unit-story-panel">
                    {/* Decorative background circle */}
                    <div className="absolute -right-10 -bottom-10 w-40 h-40 bg-orange-200/20 rounded-full blur-2xl pointer-events-none" />
                    <div className="absolute -left-10 -top-10 w-40 h-40 bg-yellow-200/20 rounded-full blur-2xl pointer-events-none" />

                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-4 mb-4 border-b border-orange-100/60 relative z-10 w-full">
                      <div className="flex items-center gap-3">
                        <span className="text-3xl">📖</span>
                        <div className="text-left font-black">
                          <h3 className="text-xl sm:text-2xl font-black text-[#A98467] tracking-tight">
                            单元故事乐园 <span className="text-sm font-semibold text-gray-500 ml-1">Story Land</span>
                          </h3>
                          <p className="text-[11px] sm:text-xs text-[#D4A373] mt-0.5 font-bold">生动有趣的故事，轻松记住单元所有单词！</p>
                        </div>
                      </div>
                      <div className="flex gap-2 w-full sm:w-auto">
                        <button
                          onClick={() => speak(selectedUnit.story!)}
                          className="flex-1 sm:flex-initial flex items-center justify-center gap-1 bg-[#D4A373] hover:bg-[#A98467] text-white px-4 py-2 rounded-full font-bold text-sm shadow-sm transition-all hover:scale-105 active:scale-95 cursor-pointer"
                        >
                          <Volume2 size={16} />
                          听故事
                        </button>
                        <button
                          onClick={() => setShowStoryTranslation(!showStoryTranslation)}
                          className="flex-1 sm:flex-initial flex items-center justify-center gap-1 bg-white hover:bg-[#FFF9F0] text-[#A98467] border-2 border-[#D4A373]/30 px-4 py-2 rounded-full font-bold text-sm shadow-sm transition-all hover:scale-105 cursor-pointer"
                        >
                          {showStoryTranslation ? '隐藏翻译' : '看翻译'}
                        </button>
                      </div>
                    </div>

                    <div className="relative z-10 w-full text-left flex flex-col gap-6">
                      <div className="bg-white/85 p-4 sm:p-7 rounded-[24px] border border-[#F5EBE0]/85 shadow-inner flex flex-col gap-5">
                        {getStorySentencePairs(selectedUnit.story, selectedUnit.storyTranslation || '').map((pair, idx) => {
                          return (
                            <div key={idx} className="flex flex-col gap-2 border-b border-dashed border-[#F5EBE0]/40 last:border-0 pb-4 last:pb-0">
                              <div className="text-lg sm:text-xl text-gray-800 font-extrabold leading-relaxed text-left">
                                {renderHighlightedStory(pair.english, selectedUnit.words)}
                              </div>
                              {showStoryTranslation && pair.chinese && (
                                <motion.div 
                                  initial={{ opacity: 0, y: 4 }}
                                  animate={{ opacity: 1, y: 0 }}
                                  className="text-base sm:text-lg text-red-500 font-bold leading-relaxed text-left pl-1"
                                >
                                  {pair.chinese}
                                </motion.div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Legend of highlighted words */}
                    <div className="mt-4 flex flex-col gap-2 text-xs text-gray-500 border-t border-dashed border-[#F5EBE0] pt-4 w-full">
                      <span className="font-bold text-gray-400 self-start">故事单词速查 (点击发音，红色字体)：</span>
                      <div className="flex flex-wrap gap-1.5 sm:gap-2">
                        {selectedUnit.words.map((w) => (
                          <button 
                            key={w.id} 
                            onClick={() => speak(w.word)}
                            className="bg-white hover:bg-red-50 text-red-600 px-2.5 py-1 rounded-lg border border-red-100 hover:border-red-300 cursor-pointer transition-all hover:scale-105 shadow-sm active:scale-95 flex items-center gap-1 text-xs font-bold"
                          >
                            <span>{w.word}</span>
                            <span className="text-[10px] text-gray-400 font-normal">({w.meaning})</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                )
              ) : (
                // --- Grammar Land Card (Separate Page) ---
                (() => {
                  const grammarPoints = selectedUnit.grammarPoints || PREDEFINED_GRAMMAR_POINTS[selectedUnit.id] || [];
                  return (
                    <div className="w-full cute-card bg-gradient-to-br from-[#FFF9F5] to-[#FDF4E7] border-4 border-white shadow-xl p-4 sm:p-7 relative overflow-hidden" id="unit-grammar-panel">
                      {/* Decorative background shape */}
                      <div className="absolute -right-12 -bottom-12 w-48 h-48 bg-orange-300/10 rounded-full blur-2xl pointer-events-none" />
                      <div className="absolute -left-12 -top-12 w-48 h-48 bg-red-300/10 rounded-full blur-2xl pointer-events-none" />

                      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-4 mb-5 border-b border-orange-100/60 relative z-10 w-full">
                        <div className="flex items-center gap-3">
                          <span className="text-3xl">🪄</span>
                          <div className="text-left">
                            <h3 className="text-2xl font-black text-[#A98467] tracking-tight">
                              故事语法魔法盒 <span className="text-sm font-semibold text-gray-500 ml-1">Grammar Magic Box</span>
                            </h3>
                            <p className="text-xs text-[#D4A373] font-bold mt-0.5">轻松掌握故事里的精彩语法，变成英语小达人！</p>
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-col gap-4 relative z-10 w-full text-left">
                        {grammarPoints.length === 0 ? (
                          <div className="bg-white/80 p-6 rounded-[24px] border border-[#F5EBE0] shadow-sm text-center font-bold text-gray-500">
                            本单元的故事词汇和句型简单实用，继续加油哦！🚀
                          </div>
                        ) : (
                          grammarPoints.map((pt, pIdx) => (
                            <div key={pIdx} className="bg-white/85 p-4 sm:p-5 rounded-2xl border border-[#F5EBE0] shadow-sm hover:shadow-md hover:border-orange-200/50 transition-all flex flex-col gap-1.5">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="inline-block bg-orange-100 text-[#D4A373] text-[10px] font-black px-2 py-0.5 rounded-lg whitespace-nowrap">
                                  魔法点 {pIdx + 1}
                                </span>
                                <span className="text-[#8B5E3C] font-black text-base sm:text-lg">{pt.title}</span>
                              </div>
                              <p className="text-sm sm:text-base text-gray-600 font-bold pl-1 leading-relaxed">
                                {pt.desc}
                              </p>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  );
                })()
              )}

              <div className="flex gap-4 mt-8 w-full max-w-sm">
                <button 
                  onClick={prevWord}
                  disabled={currentWordIndex === 0}
                  className={`flex-1 cute-button flex items-center justify-center gap-2 text-lg sm:text-xl ${currentWordIndex === 0 ? 'bg-gray-300' : 'bg-[#D4A373] hover:bg-[#A98467] text-white'}`}
                >
                  <ChevronLeft size={24} />
                  上一个
                </button>
                <button 
                  onClick={nextWord}
                  className="flex-1 cute-button flex items-center justify-center gap-2 text-lg sm:text-xl bg-[#E6CCB2] hover:bg-[#D4A373] text-white"
                >
                  {currentWordIndex === selectedUnit.words.length - 1 && selectedUnit.story ? (
                    <span className="flex items-center gap-1">故事乐园 📖</span>
                  ) : currentWordIndex === selectedUnit.words.length ? (
                    <span className="flex items-center gap-1">语法魔法盒 🪄</span>
                  ) : currentWordIndex === selectedUnit.words.length + 1 ? (
                    <span>完成学习 🎉</span>
                  ) : (
                    <>
                      <span>下一个</span>
                      <ChevronRight size={24} />
                    </>
                  )}
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

              <div className="grid grid-cols-1 gap-4 w-full px-4">
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
                  <div className="text-center mb-8 px-2">
                    <h2 className="text-2xl sm:text-3xl font-bold text-gray-500 mb-4">请选择正确的中文意思：</h2>
                    <div className="text-5xl sm:text-7xl font-black text-pink-500 mb-4 tracking-tight break-words">{currentReviewWord.word}</div>
                    <button onClick={() => speak(currentReviewWord.word)} className="text-pink-300 hover:text-pink-500 transition-colors">
                      <Volume2 size={24} sm:size={32} />
                    </button>
                  </div>
                  <div className="grid grid-cols-1 gap-3 sm:gap-4 px-2 sm:px-4 w-full">
                    {reviewOptions.map((option, idx) => (
                      <motion.button
                        key={`${option.id}-${idx}`}
                        whileHover={{ scale: 1.03, y: -5 }}
                        whileTap={{ scale: 0.97 }}
                        onClick={() => handleReviewAnswer(option.id)}
                        className="cute-card p-4 sm:p-8 text-xl sm:text-2xl font-bold text-gray-700 hover:bg-pink-50 hover:border-pink-300 text-center shadow-lg"
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
                  <div className="bg-white p-6 rounded-[30px] shadow-xl border-4 border-blue-100 mb-8 mx-4">
                    <p className="text-2xl font-bold text-gray-700 leading-relaxed italic">
                      "{currentReviewWord.sentence.replace(new RegExp(currentReviewWord.word, 'gi'), '_______')}"
                    </p>
                    <p className="text-xl text-gray-400 mt-4">{currentReviewWord.translation}</p>
                  </div>
                  <div className="grid grid-cols-2 gap-3 px-4">
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
                <div className="w-full text-center px-2">
                  <h2 className="text-2xl sm:text-3xl font-bold text-gray-500 mb-6 sm:mb-8">拼写出这个单词：</h2>
                  <div className="bg-white p-4 sm:p-6 rounded-[25px] sm:rounded-[30px] shadow-xl border-4 border-yellow-100 mb-6 sm:mb-8 mx-2 sm:mx-4">
                    <div className="text-3xl sm:text-4xl font-black text-yellow-600 mb-2">{currentReviewWord.meaning}</div>
                    <button onClick={() => speak(currentReviewWord.word)} className="bg-yellow-100 p-2 sm:p-3 rounded-full text-yellow-600 hover:bg-yellow-200 transition-colors">
                      <Volume2 size={24} sm:size={32} />
                    </button>
                  </div>
                  <div className="flex flex-col items-center gap-4 sm:gap-6">
                    <input 
                      type="text"
                      value={spellingInput}
                      onChange={(e) => setSpellingInput(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && checkSpelling()}
                      placeholder="在这里输入单词..."
                      autoFocus
                      className="w-full max-w-md text-3xl sm:text-4xl font-bold text-center p-4 sm:p-6 rounded-2xl sm:rounded-3xl border-4 border-pink-200 focus:border-pink-400 outline-none shadow-inner bg-pink-50/30"
                    />
                    <button 
                      onClick={checkSpelling}
                      className="cute-button bg-pink-400 hover:bg-pink-500 text-xl sm:text-2xl px-10 sm:px-12 py-3 sm:py-4"
                    >
                      检查答案
                    </button>
                  </div>
                </div>
              )}

              {currentExerciseType === 'speaking' && (
                <div className="w-full text-center px-2">
                  <h2 className="text-2xl sm:text-3xl font-bold text-gray-500 mb-6 sm:mb-8">请大声读出这个单词：</h2>
                  <div className="bg-white p-4 sm:p-6 rounded-[25px] sm:rounded-[30px] shadow-xl border-4 border-green-100 mb-6 sm:mb-8 mx-2 sm:mx-4">
                    <div className="text-4xl sm:text-5xl font-black text-green-600 mb-2 tracking-tight">{currentReviewWord.word}</div>
                    <div className="text-lg sm:text-xl text-blue-400 font-bold mb-3 sm:mb-4">{currentReviewWord.ipa}</div>
                    <div className="flex justify-center gap-3">
                      <button onClick={() => speak(currentReviewWord.word)} className="bg-green-100 p-2 sm:p-3 rounded-full text-green-600 hover:bg-yellow-200 transition-colors">
                        <Volume2 size={24} sm:size={32} />
                      </button>
                      {recordedUrl && (
                        <button 
                          onClick={playRecordedAudio}
                          className="bg-blue-100 p-2 sm:p-3 rounded-full text-blue-600 hover:bg-blue-200 transition-colors shadow-sm flex items-center gap-2"
                        >
                          <Play size={20} sm:size={24} />
                          <span className="font-bold text-xs sm:text-sm">听听我的</span>
                        </button>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex flex-col items-center gap-6">
                    <div className="relative group p-6 sm:p-10 bg-gray-800 rounded-[40px] sm:rounded-[50px] shadow-2xl border-t-4 border-gray-700 relative overflow-hidden">
                      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-white/10 to-transparent" />
                      
                      {/* Recording Waveform Animation */}
                      {isRecording && (
                        <div className="flex items-center justify-center gap-0.5 sm:gap-1 mb-6 sm:mb-8 h-8 sm:h-12">
                          {[...Array(8)].map((_, i) => (
                            <motion.div
                              key={i}
                              animate={{ height: [8, 30, 8] }}
                              transition={{ repeat: Infinity, duration: 0.5, delay: i * 0.1 }}
                              className="w-1.5 sm:w-2 bg-red-500 rounded-full"
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
                        className={`w-24 h-24 sm:w-32 sm:h-32 rounded-full transition-all shadow-xl border-4 sm:border-8 flex items-center justify-center select-none touch-none active:scale-95 ${
                          isRecording 
                            ? 'bg-red-600 border-red-400 scale-105 shadow-[0_0_30px_rgba(220,38,38,0.5)]' 
                            : isMicLoading
                            ? 'bg-yellow-500 border-yellow-300 scale-105'
                            : 'bg-emerald-500 border-emerald-300 hover:bg-emerald-600'
                        }`}
                      >
                        {isMicLoading ? <Loader2 size={48} sm:size={64} className="text-white animate-spin" /> : <Mic size={48} sm:size={64} className="text-white" />}
                      </button>
                      
                      <div className="mt-4 sm:mt-6 text-center">
                        <p className={`font-black tracking-widest uppercase text-xs sm:text-sm ${
                          isRecording ? 'text-red-400 animate-pulse' : 
                          isMicLoading ? 'text-yellow-400 animate-pulse' :
                          'text-gray-400'
                        }`}>
                          {isRecording ? 'Recording...' : isMicLoading ? 'Initializing...' : 'Hold to Speak'}
                        </p>
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

              <div className="cute-card p-6 sm:p-10 w-full bg-white/80 backdrop-blur-sm border-4 border-[#F5EBE0]">
                <div className="text-center mb-8 sm:mb-10">
                  <div className="bg-[#FFF9F0] w-16 h-16 sm:w-20 sm:h-20 rounded-3xl flex items-center justify-center mx-auto mb-4 shadow-inner">
                    <Sparkles size={32} sm:size={40} className="text-[#D4A373]" />
                  </div>
                  <h2 className="text-2xl sm:text-3xl font-black text-[#A98467]">拓展关卡：AI 魔法单词</h2>
                  <p className="text-sm sm:text-base text-gray-500 mt-2">拍照或输入单词，AI 老师为你生成专属关卡！</p>
                </div>

                <div className="flex flex-col gap-6 mb-8 w-full">
                  <div className="space-y-4 w-full">
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
                      <div className="cute-card p-6 border-dashed border-4 border-[#E6CCB2] flex flex-col items-center gap-3 hover:bg-[#FFF9F0] transition-colors">
                        <Camera size={32} className="text-[#D4A373]" />
                        <span className="font-bold text-[#A98467] text-sm">点击拍照或上传</span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4 w-full">
                    <label className="block text-lg font-bold text-[#A98467] ml-2">方式二：手动输入</label>
                    <div className="flex flex-col gap-4">
                      <textarea 
                        value={extensionInput}
                        onChange={(e) => setExtensionInput(e.target.value)}
                        placeholder="输入你想学习的单词，用空格或逗号分隔..."
                        className="w-full h-[100px] p-4 rounded-2xl border-4 border-[#F5EBE0] focus:border-[#D4A373] outline-none resize-none font-medium text-gray-700 shadow-inner text-sm"
                        disabled={isGenerating}
                      />
                      <button 
                        onClick={() => generateCustomUnit(extensionInput)}
                        disabled={!extensionInput.trim() || isGenerating}
                        className={`cute-button flex items-center justify-center gap-2 text-lg ${
                          !extensionInput.trim() || isGenerating ? 'bg-gray-300' : 'bg-[#D4A373] hover:bg-[#A98467]'
                        }`}
                      >
                        {isGenerating ? <Loader2 size={20} className="animate-spin" /> : <TypeIcon size={20} />}
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
              className="cute-card p-8 text-center max-w-[400px] w-full relative overflow-hidden mx-4"
            >
              <motion.div 
                animate={{ y: [0, -10, 0] }}
                transition={{ repeat: Infinity, duration: 2 }}
                className="bg-green-100 w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner"
              >
                <BookOpen size={48} className="text-green-500" />
              </motion.div>
              <h2 className="text-3xl font-black text-gray-800 mb-2">学习完成！</h2>
              <p className="text-lg text-gray-500 mb-8 px-4">你已经学完了 {selectedUnit.title} 的所有单词，太棒了！</p>
              
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
                {selectedUnit.id === 'custom-unit' && (
                  <button 
                    onClick={() => setMode('extension')}
                    className="cute-button bg-orange-400 hover:bg-orange-500 w-full flex items-center justify-center gap-3 text-xl"
                  >
                    <Sparkles size={24} />
                    返回拓展关卡
                  </button>
                )}
              </div>
              <PartyPopper size={150} className="absolute -bottom-10 -left-10 text-[#F5EBE0] -rotate-12 pointer-events-none" />
              <Sparkles size={150} className="absolute -top-10 -right-10 text-yellow-100 rotate-12 pointer-events-none" />
            </motion.div>
          )}

          {mode === 'review-result' && (selectedUnit || isReviewingMistakes) && (
            <motion.div 
              key="result"
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="cute-card p-8 text-center max-w-[400px] w-full relative overflow-hidden mx-4"
            >
              <motion.div 
                animate={{ rotate: [0, 10, -10, 0] }}
                transition={{ repeat: Infinity, duration: 2 }}
                className="bg-yellow-100 w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner"
              >
                <Trophy size={48} className="text-yellow-500" />
              </motion.div>
              <h2 className="text-3xl font-black text-gray-800 mb-2">
                {isReviewingMistakes ? "复习完成！" : "挑战大成功！"}
              </h2>
              <div className="space-y-2 mb-8">
                <p className="text-xl text-gray-500">
                  {isReviewingMistakes ? "你清扫了所有错题！" : (
                    <>总积分: <span className="text-[#A98467] font-black text-3xl">{points}</span></>
                  )}
                </p>
                {!isReviewingMistakes && (
                  <div className="flex justify-center gap-1">
                    {[...Array(Math.min(stars, 5))].map((_, i) => (
                      <motion.div
                        key={i}
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ delay: i * 0.1 }}
                      >
                        <Star size={24} className="text-yellow-400 fill-yellow-400" />
                      </motion.div>
                    ))}
                  </div>
                )}
              </div>
              
              <div className="space-y-4 relative z-10">
                {!isReviewingMistakes && selectedUnit && (
                  <button 
                    onClick={() => handleSelectUnit(selectedUnit, 'review')}
                    className="cute-button bg-[#D4A373] hover:bg-[#A98467] w-full flex items-center justify-center gap-3 text-xl"
                  >
                    <RotateCcw size={24} />
                    再挑战一次
                  </button>
                )}
                
                {isReviewingMistakes && (
                  <button 
                    onClick={startMistakeReview}
                    className="cute-button bg-[#D4A373] hover:bg-[#A98467] w-full flex items-center justify-center gap-3 text-xl"
                  >
                    <RotateCcw size={24} />
                    重新练习
                  </button>
                )}

                <button 
                  onClick={goHome}
                  className="cute-button bg-[#E6CCB2] hover:bg-[#D4A373] w-full flex items-center justify-center gap-3 text-xl"
                >
                  <HomeIcon size={24} />
                  返回首页
                </button>
                {selectedUnit?.id === 'custom-unit' && !isReviewingMistakes && (
                  <button 
                    onClick={() => setMode('extension')}
                    className="cute-button bg-orange-400 hover:bg-orange-500 w-full flex items-center justify-center gap-3 text-xl"
                  >
                    <Sparkles size={24} />
                    返回拓展关卡
                  </button>
                )}
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
