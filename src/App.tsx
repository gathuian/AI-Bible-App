import React, { useState, useEffect, useRef } from 'react';
import { 
  BookOpen, 
  Mic, 
  MicOff, 
  Music, 
  Baby, 
  Search, 
  Brain, 
  Volume2, 
  VolumeX, 
  Loader2, 
  ChevronRight, 
  History,
  Settings,
  ShieldCheck,
  Cross
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import ReactMarkdown from 'react-markdown';
import { 
  generateSermon, 
  generateSong, 
  generateStory, 
  generateMnemonics, 
  queryBible, 
  textToSpeech 
} from './lib/gemini';

type Feature = 'sermon' | 'song' | 'story' | 'mnemonic' | 'query';

interface Message {
  id: string;
  type: 'user' | 'ai';
  content: string;
  feature: Feature;
  timestamp: number;
}

export default function App() {
  const [activeFeature, setActiveFeature] = useState<Feature>('query');
  const [bibleVersion, setBibleVersion] = useState('KJV');
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    // Initialize Web Speech API
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = false;
      recognitionRef.current.lang = 'en-US';

      recognitionRef.current.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setInput(transcript);
        setIsListening(false);
      };

      recognitionRef.current.onerror = () => {
        setIsListening(false);
      };

      recognitionRef.current.onend = () => {
        setIsListening(false);
      };
    }
  }, []);

  const toggleListening = () => {
    if (isListening) {
      recognitionRef.current?.stop();
    } else {
      setInput('');
      recognitionRef.current?.start();
      setIsListening(true);
    }
  };

  const handleAction = async () => {
    if (!input.trim() || isLoading) return;

    setIsLoading(true);
    const userMessage: Message = {
      id: Date.now().toString(),
      type: 'user',
      content: input,
      feature: activeFeature,
      timestamp: Date.now(),
    };
    setMessages(prev => [userMessage, ...prev]);
    const currentInput = input;
    setInput('');

    try {
      let result = '';
      switch (activeFeature) {
        case 'sermon':
          result = await generateSermon(currentInput, bibleVersion);
          break;
        case 'song':
          result = await generateSong(currentInput, bibleVersion);
          break;
        case 'story':
          result = await generateStory(currentInput, bibleVersion);
          break;
        case 'mnemonic':
          result = await generateMnemonics(currentInput, bibleVersion);
          break;
        case 'query':
          result = await queryBible(currentInput, bibleVersion);
          break;
      }

      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: 'ai',
        content: result,
        feature: activeFeature,
        timestamp: Date.now(),
      };
      setMessages(prev => [aiMessage, ...prev]);
    } catch (error) {
      console.error('AI Error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const speak = async (text: string) => {
    if (isSpeaking) {
      audioRef.current?.pause();
      setIsSpeaking(false);
      return;
    }

    try {
      setIsSpeaking(true);
      const url = await textToSpeech(text.substring(0, 1000)); // Limit for TTS
      if (url) {
        setAudioUrl(url);
        if (audioRef.current) {
          audioRef.current.src = url;
          audioRef.current.play();
        }
      }
    } catch (error) {
      console.error('TTS Error:', error);
      setIsSpeaking(false);
    }
  };

  const features = [
    { id: 'query', icon: Search, label: 'Bible Query', color: 'bg-blue-500', description: 'Ask anything about the Bible' },
    { id: 'sermon', icon: BookOpen, label: 'Sermon Gen', color: 'bg-purple-500', description: 'Generate a sermon on any topic' },
    { id: 'song', icon: Music, label: 'Song Creator', color: 'bg-pink-500', description: 'Create praise and worship lyrics' },
    { id: 'story', icon: Baby, label: 'Bible Stories', color: 'bg-orange-500', description: 'Stories for children' },
    { id: 'mnemonic', icon: Brain, label: 'Mnemonics', color: 'bg-green-500', description: 'Verse memorization aids' },
  ];

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans selection:bg-blue-100">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-200 px-4 py-3">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-200">
              <Cross className="text-white w-6 h-6" />
            </div>
            <div>
              <h1 className="font-bold text-lg tracking-tight">AI Bible</h1>
              <p className="text-[10px] text-slate-500 uppercase tracking-widest font-semibold flex items-center gap-1">
                <ShieldCheck className="w-3 h-3" /> Secure Voice App
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <select 
              value={bibleVersion}
              onChange={(e) => setBibleVersion(e.target.value)}
              className="text-xs font-bold bg-slate-100 border-none rounded-lg px-2 py-1.5 outline-none focus:ring-2 focus:ring-blue-500/20"
            >
              <option value="KJV">KJV</option>
              <option value="NIV">NIV</option>
              <option value="ESV">ESV</option>
              <option value="NKJV">NKJV</option>
              <option value="NLT">NLT</option>
            </select>
            <button className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-500">
              <History className="w-5 h-5" />
            </button>
            <button className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-500">
              <Settings className="w-5 h-5" />
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8 pb-32">
        {/* Feature Selector */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mb-8">
          {features.map((f) => (
            <button
              key={f.id}
              onClick={() => setActiveFeature(f.id as Feature)}
              className={`relative p-4 rounded-2xl border transition-all duration-300 flex flex-col items-center gap-2 group ${
                activeFeature === f.id 
                  ? 'bg-white border-blue-200 shadow-xl shadow-blue-100/50 -translate-y-1' 
                  : 'bg-slate-50 border-transparent hover:bg-white hover:border-slate-200'
              }`}
            >
              <div className={`p-2.5 rounded-xl ${activeFeature === f.id ? f.color : 'bg-slate-200'} text-white transition-colors`}>
                <f.icon className="w-5 h-5" />
              </div>
              <span className={`text-xs font-bold ${activeFeature === f.id ? 'text-slate-900' : 'text-slate-500'}`}>
                {f.label}
              </span>
              {activeFeature === f.id && (
                <motion.div 
                  layoutId="active-pill"
                  className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 bg-blue-600 rounded-full"
                />
              )}
            </button>
          ))}
        </div>

        {/* Chat/Content Area */}
        <div className="space-y-6 min-h-[400px]">
          <AnimatePresence mode="popLayout">
            {messages.length === 0 ? (
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex flex-col items-center justify-center py-20 text-center space-y-4"
              >
                <div className="w-20 h-20 bg-blue-50 rounded-full flex items-center justify-center">
                  <BookOpen className="w-10 h-10 text-blue-500" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-slate-800">Welcome to AI Bible</h2>
                  <p className="text-slate-500 max-w-xs mx-auto mt-2">
                    Select a feature above and start by typing or using your voice.
                  </p>
                </div>
              </motion.div>
            ) : (
              messages.map((msg) => (
                <motion.div
                  key={msg.id}
                  initial={{ opacity: 0, y: 20, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  className={`flex ${msg.type === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`max-w-[85%] rounded-3xl p-5 shadow-sm ${
                    msg.type === 'user' 
                      ? 'bg-blue-600 text-white rounded-tr-none' 
                      : 'bg-white border border-slate-100 rounded-tl-none'
                  }`}>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[10px] font-bold uppercase tracking-wider opacity-60">
                        {msg.type === 'user' ? 'You' : 'AI Assistant'} • {msg.feature}
                      </span>
                      {msg.type === 'ai' && (
                        <button 
                          onClick={() => speak(msg.content)}
                          className="p-1 hover:bg-slate-100 rounded-full transition-colors"
                        >
                          {isSpeaking ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                        </button>
                      )}
                    </div>
                    <div className={`prose prose-sm max-w-none ${msg.type === 'user' ? 'prose-invert' : 'prose-slate'}`}>
                      <ReactMarkdown>{msg.content}</ReactMarkdown>
                    </div>
                  </div>
                </motion.div>
              ))
            )}
          </AnimatePresence>
          {isLoading && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex justify-start"
            >
              <div className="bg-white border border-slate-100 rounded-3xl rounded-tl-none p-4 shadow-sm flex items-center gap-3">
                <Loader2 className="w-4 h-4 animate-spin text-blue-500" />
                <span className="text-xs font-medium text-slate-500">AI is thinking...</span>
              </div>
            </motion.div>
          )}
        </div>
      </main>

      {/* Input Bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-white/80 backdrop-blur-xl border-t border-slate-200 p-4 pb-8">
        <div className="max-w-4xl mx-auto">
          <div className="relative flex items-center gap-2">
            <div className="flex-1 relative group">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleAction()}
                placeholder={features.find(f => f.id === activeFeature)?.description}
                className="w-full bg-slate-100 border-none rounded-2xl py-4 pl-6 pr-12 text-sm font-medium focus:ring-2 focus:ring-blue-500/20 transition-all outline-none"
              />
              <button
                onClick={toggleListening}
                className={`absolute right-3 top-1/2 -translate-y-1/2 p-2 rounded-xl transition-all ${
                  isListening ? 'bg-red-500 text-white animate-pulse' : 'bg-slate-200 text-slate-500 hover:bg-slate-300'
                }`}
              >
                {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
              </button>
            </div>
            <button
              onClick={handleAction}
              disabled={!input.trim() || isLoading}
              className="bg-blue-600 text-white p-4 rounded-2xl hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-blue-200 transition-all active:scale-95"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
          <p className="text-[10px] text-center mt-3 text-slate-400 font-medium">
            Powered by Gemini AI • Secure & Encrypted
          </p>
        </div>
      </div>

      <audio 
        ref={audioRef} 
        onEnded={() => setIsSpeaking(false)} 
        className="hidden" 
      />
    </div>
  );
}
