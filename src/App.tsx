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
  Cross,
  Sparkles,
  Command,
  LayoutGrid
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
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Scroll to bottom on new message
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isLoading]);

  useEffect(() => {
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
      recognitionRef.current.onerror = () => setIsListening(false);
      recognitionRef.current.onend = () => setIsListening(false);
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
    setMessages(prev => [...prev, userMessage]);
    const currentInput = input;
    setInput('');

    try {
      let result = '';
      switch (activeFeature) {
        case 'sermon': result = await generateSermon(currentInput, bibleVersion); break;
        case 'song': result = await generateSong(currentInput, bibleVersion); break;
        case 'story': result = await generateStory(currentInput, bibleVersion); break;
        case 'mnemonic': result = await generateMnemonics(currentInput, bibleVersion); break;
        case 'query': result = await queryBible(currentInput, bibleVersion); break;
      }

      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: 'ai',
        content: result,
        feature: activeFeature,
        timestamp: Date.now(),
      };
      setMessages(prev => [...prev, aiMessage]);
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
      const url = await textToSpeech(text.substring(0, 1000));
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
    { id: 'query', icon: Search, label: 'Oracle', color: 'from-blue-600 to-cyan-400', description: 'Bible Query' },
    { id: 'sermon', icon: BookOpen, label: 'Sermon', color: 'from-purple-600 to-indigo-400', description: 'Gen' },
    { id: 'song', icon: Music, label: 'Psalms', color: 'from-pink-600 to-rose-400', description: 'Creator' },
    { id: 'story', icon: Baby, label: 'Parable', color: 'from-orange-600 to-amber-400', description: 'Stories' },
    { id: 'mnemonic', icon: Brain, label: 'Memory', color: 'from-emerald-600 to-teal-400', description: 'Aids' },
  ];

  return (
    <div className="flex flex-col lg:flex-row h-screen overflow-hidden bg-[#020205] text-slate-200">
      {/* Dynamic Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="bg-noise absolute inset-0 z-0"></div>
        <motion.div 
          animate={{ x: [0, 40, 0], y: [0, -20, 0] }}
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
          className="gradient-sphere w-[600px] h-[600px] bg-blue-600/20 -top-48 -left-48" 
        />
        <motion.div 
          animate={{ x: [0, -30, 0], y: [0, 50, 0] }}
          transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }}
          className="gradient-sphere w-[500px] h-[500px] bg-orange-600/10 bottom-0 -right-24" 
        />
      </div>

      {/* Sidebar */}
      <aside className="w-full lg:w-72 glass-dark z-20 flex flex-col border-r border-white/5">
        <div className="p-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-lg shadow-blue-500/20">
              <Cross className="text-white w-6 h-6" />
            </div>
            <div>
              <h1 className="font-bold text-lg tracking-tight text-white leading-none">AI Bible</h1>
              <p className="text-[10px] text-slate-500 uppercase tracking-widest font-bold mt-1 flex items-center gap-1">
                <ShieldCheck className="w-3 h-3" /> Secure Node
              </p>
            </div>
          </div>
        </div>

        <nav className="flex-1 px-4 py-2 space-y-1 overflow-y-auto">
          <p className="px-3 text-[10px] font-bold text-slate-600 uppercase tracking-widest mb-4">Core Protocols</p>
          {features.map((f) => (
            <button
              key={f.id}
              onClick={() => setActiveFeature(f.id as Feature)}
              className={`w-full group flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-300 relative overflow-hidden ${
                activeFeature === f.id ? 'bg-white/10 text-white' : 'text-slate-500 hover:text-slate-300 hover:bg-white/5'
              }`}
            >
              <div className={`p-2 rounded-lg bg-gradient-to-br ${f.color} shadow-lg shadow-black/20 group-hover:scale-110 transition-transform`}>
                <f.icon className="w-4 h-4 text-white" />
              </div>
              <div className="text-left">
                <p className="text-xs font-bold leading-none">{f.label}</p>
                <p className="text-[9px] opacity-60 mt-1 uppercase tracking-tighter">{f.description}</p>
              </div>
              {activeFeature === f.id && (
                <motion.div 
                  layoutId="sidebar-pill"
                  className="absolute left-0 top-1/4 bottom-1/4 w-1 bg-blue-500 rounded-r-full"
                />
              )}
            </button>
          ))}
        </nav>

        <div className="p-6 mt-auto border-t border-white/5 space-y-4">
          <div className="flex items-center justify-between text-[11px] font-bold uppercase tracking-widest text-slate-600">
            <span>Version</span>
            <select 
              value={bibleVersion}
              onChange={(e) => setBibleVersion(e.target.value)}
              className="bg-white/5 border border-white/10 rounded-lg px-2 py-1 text-slate-300 outline-none hover:bg-white/10 transition-colors"
            >
              {['KJV', 'NIV', 'ESV', 'NKJV', 'NLT'].map(v => <option key={v} value={v} className="bg-[#020205]">{v}</option>)}
            </select>
          </div>
          <div className="flex items-center gap-3">
            <button className="flex-1 bg-white/5 hover:bg-white/10 p-2.5 rounded-xl flex items-center justify-center gap-2 transition-colors border border-white/10">
              <History className="w-4 h-4 text-slate-500" />
            </button>
            <button className="flex-1 bg-white/5 hover:bg-white/10 p-2.5 rounded-xl flex items-center justify-center gap-2 transition-colors border border-white/10">
              <Settings className="w-4 h-4 text-slate-500" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 relative flex flex-col z-10">
        <div 
          ref={scrollRef}
          className="flex-1 overflow-y-auto px-6 py-8 space-y-8 scroll-smooth scrollbar-hide"
        >
          {messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center max-w-2xl mx-auto space-y-12">
              <motion.div 
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                className="relative"
              >
                <div className="absolute inset-0 bg-blue-500/20 blur-[100px] animate-pulse"></div>
                <div className="w-32 h-32 rounded-full border-2 border-blue-500/30 flex items-center justify-center relative z-10 glass">
                  <Sparkles className="w-12 h-12 text-blue-400 animate-pulse" />
                </div>
              </motion.div>
              <div className="text-center space-y-4">
                <h2 className="text-4xl font-bold tracking-tighter text-white sm:text-5xl">
                   Divine Intelligence. <br/>
                   <span className="text-blue-500">Accelerated.</span>
                </h2>
                <p className="text-slate-400 text-lg sm:text-xl font-light italic">
                  Explore scriptures with the world's most <br className="hidden sm:block" /> powerful neural Bible scholar.
                </p>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full">
                {[
                  "What is the meaning of John 3:16?",
                  "Write a sermon about hope and faith",
                  "Create a mnemonic for Psalm 23",
                  "Tell a story about David and Goliath"
                ].map((prompt) => (
                  <button 
                    key={prompt}
                    onClick={() => setInput(prompt)}
                    className="glass hover:bg-white/10 p-4 rounded-2xl text-left text-xs font-bold text-slate-400 group transition-all"
                  >
                    <span className="text-blue-500 mr-2 opacity-50">#</span> {prompt}
                    <ChevronRight className="w-3 h-3 inline float-right opacity-0 group-hover:opacity-100 transition-opacity mt-1" />
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="max-w-4xl mx-auto space-y-8">
              {messages.map((msg, i) => (
                <motion.div
                  key={msg.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className={`flex ${msg.type === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`max-w-[90%] sm:max-w-[75%] rounded-[2rem] p-6 ${
                    msg.type === 'user' 
                      ? 'bg-blue-600 text-white shadow-xl shadow-blue-500/20' 
                      : 'glass border-white/5'
                  }`}>
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-2">
                        <div className={`p-1 rounded bg-white/10 text-[10px] font-bold uppercase tracking-widest ${msg.type === 'user' ? 'text-blue-200' : 'text-blue-400'}`}>
                          {msg.type === 'user' ? 'Protocol Input' : 'Analytic Response'}
                        </div>
                        <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">
                          {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      {msg.type === 'ai' && (
                        <button 
                          onClick={() => speak(msg.content)}
                          className="p-1.5 hover:bg-white/10 rounded-full transition-colors"
                        >
                          {isSpeaking ? <VolumeX className="w-4 h-4 text-blue-400" /> : <Volume2 className="w-4 h-4 text-slate-400" />}
                        </button>
                      )}
                    </div>
                    <div className="prose">
                      <ReactMarkdown>{msg.content}</ReactMarkdown>
                    </div>
                  </div>
                </motion.div>
              ))}
              {isLoading && (
                <div className="flex justify-start">
                  <div className="glass p-4 rounded-2xl flex items-center gap-3">
                    <div className="relative">
                      <Loader2 className="w-4 h-4 animate-spin text-blue-500" />
                      <div className="absolute inset-0 bg-blue-500/20 blur-[10px] animate-pulse"></div>
                    </div>
                    <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">Processing Query...</span>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Input Terminal */}
        <div className="p-6 bg-gradient-to-t from-[#020205] to-transparent">
          <div className="max-w-4xl mx-auto relative group">
            <div className="absolute -inset-1 bg-gradient-to-r from-blue-600/20 to-purple-600/20 rounded-[2rem] blur opacity-75 group-hover:opacity-100 transition duration-1000 group-hover:duration-200"></div>
            <div className="relative glass-dark rounded-[2rem] p-2 flex items-center gap-2 border border-white/10">
              <div className="hidden sm:flex pl-4 pr-2 items-center gap-2 border-r border-white/5">
                <Command className="w-4 h-4 text-slate-600" />
                <span className="text-[10px] font-bold text-slate-600 uppercase tracking-widest leading-none">AI.Core</span>
              </div>
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleAction()}
                placeholder={`Ask Oracle about ${activeFeature}...`}
                className="flex-1 bg-transparent border-none py-3 px-4 text-sm font-medium focus:ring-0 outline-none text-white placeholder-slate-600"
              />
              <button
                onClick={toggleListening}
                className={`p-3 rounded-2xl transition-all ${
                  isListening ? 'bg-red-500 shadow-lg shadow-red-500/50 text-white animate-pulse' : 'hover:bg-white/5 text-slate-500'
                }`}
              >
                {isListening ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
              </button>
              <button
                onClick={handleAction}
                disabled={!input.trim() || isLoading}
                className="bg-blue-600 text-white p-3 rounded-2xl hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-blue-600/20 group transition-all active:scale-95"
              >
                <ChevronRight className={`w-5 h-5 ${isLoading ? 'animate-bounce' : 'group-hover:translate-x-0.5 transition-transform'}`} />
              </button>
            </div>
            <div className="flex items-center justify-between mt-3 px-6">
              <div className="flex gap-4">
                <span className="text-[9px] font-bold text-slate-600 uppercase tracking-[0.2em] flex items-center gap-1.5">
                  <div className="w-1.5 h-1.5 bg-blue-500 rounded-full shadow-[0_0_8px_rgba(59,130,246,0.5)]"></div> Network Status: Stable
                </span>
                <span className="text-[9px] font-bold text-slate-600 uppercase tracking-[0.2em]">
                  Encrypted TLS 1.3
                </span>
              </div>
              <div className="flex items-center gap-2">
                 <LayoutGrid className="w-3 h-3 text-slate-600" />
                 <span className="text-[9px] font-bold text-slate-600 uppercase tracking-[0.2em]">Alpha Build 2.0</span>
              </div>
            </div>
          </div>
        </div>
      </main>

      <audio ref={audioRef} onEnded={() => setIsSpeaking(false)} className="hidden" />
    </div>
  );
}
