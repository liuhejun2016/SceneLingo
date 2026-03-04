import { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Scene, Word } from '../types';
import { generateTTS } from '../services/geminiService';
import { Play as PlayIcon, Pause, Volume2, EyeOff, Mic, CheckCircle2, ArrowLeft, Heart } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useTheme } from '../contexts/ThemeContext';

type Mode = 'learn' | 'game' | 'speak';

export default function Play() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { activeTheme } = useTheme();
  const [scene, setScene] = useState<Scene | null>(null);
  const [loading, setLoading] = useState(true);
  const [mode, setMode] = useState<Mode>('learn');
  const [activeIndex, setActiveIndex] = useState<number>(-1);
  const [isPlaying, setIsPlaying] = useState(false);
  const [audioCache, setAudioCache] = useState<Record<string, string>>({});
  const [revealedWords, setRevealedWords] = useState<Set<string>>(new Set());
  const [passedWords, setPassedWords] = useState<Set<string>>(new Set());
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  
  const audioContextRef = useRef<AudioContext | null>(null);
  const recognitionRef = useRef<any>(null);
  const currentAudioSourceRef = useRef<AudioBufferSourceNode | null>(null);

  useEffect(() => {
    fetch(`/api/scenes/${id}`)
      .then(res => res.json())
      .then(data => {
        setScene(data);
        setLoading(false);
      });
      
    // Setup speech recognition
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      
      recognition.onresult = (event: any) => {
        const newTranscript = Array.from(event.results)
          .map((result: any) => result[0].transcript.toLowerCase())
          .join(' ');
          
        setTranscript(newTranscript);
          
        if (scene) {
          scene.words.forEach(word => {
            const cleanTranscript = newTranscript.replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g,"").toLowerCase();
            const cleanWord = word.word.replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g,"").toLowerCase();
            const cleanPronunciation = word.pronunciation.replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g,"").toLowerCase();
            
            if (cleanTranscript.includes(cleanWord) || cleanTranscript.includes(cleanPronunciation)) {
              setPassedWords(prev => new Set(prev).add(word.id));
            }
          });
        }
      };
      
      recognition.onerror = (event: any) => {
        console.error('Speech recognition error', event.error);
        setIsListening(false);
      };
      
      recognitionRef.current = recognition;
    }
    
    return () => {
      stopAudio();
    };
  }, [id, scene?.words]);

  useEffect(() => {
    if (scene && recognitionRef.current) {
      recognitionRef.current.lang = getLangCode(scene.language);
    }
  }, [scene]);

  const getLangCode = (lang: string) => {
    const map: Record<string, string> = {
      'Japanese': 'ja-JP',
      'Spanish': 'es-ES',
      'French': 'fr-FR',
      'German': 'de-DE',
      'Korean': 'ko-KR',
      'English': 'en-US'
    };
    return map[lang] || 'en-US';
  };

  const stopAudio = () => {
    if (currentAudioSourceRef.current) {
      try {
        currentAudioSourceRef.current.stop();
      } catch (e) {
        // Ignore errors if already stopped
      }
      currentAudioSourceRef.current = null;
    }
    if (window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
  };

  const playNativeTTS = async (text: string, lang: string) => {
    return new Promise<void>(async (resolve) => {
      if (!window.speechSynthesis) {
        resolve();
        return;
      }
      
      const langCode = getLangCode(lang);
      const voices = window.speechSynthesis.getVoices();
      const availableVoices = voices.filter(v => v.lang.startsWith(langCode) || v.lang.startsWith(langCode.split('-')[0]));
      
      let voice1 = availableVoices.length > 0 ? availableVoices[0] : null;
      let voice2 = availableVoices.length > 1 ? availableVoices[1] : voice1;

      const speak = (v: SpeechSynthesisVoice | null) => {
        return new Promise<void>((res) => {
          const utterance = new SpeechSynthesisUtterance(text);
          utterance.lang = langCode;
          if (v) utterance.voice = v;
          utterance.onend = () => res();
          utterance.onerror = () => res();
          window.speechSynthesis.speak(utterance);
        });
      };

      await speak(voice1);
      await new Promise(r => setTimeout(r, 600)); // slight pause
      await speak(voice2);
      resolve();
    });
  };

  const playAudio = async (word: Word) => {
    if (!scene) return;
    
    stopAudio();
    
    let base64Audio = audioCache[word.id];
    if (!base64Audio) {
      try {
        base64Audio = await generateTTS(word.word, scene.language);
        setAudioCache(prev => ({ ...prev, [word.id]: base64Audio }));
      } catch (e) {
        console.error("Failed to generate TTS", e);
        // Fallback to native speech synthesis
        return playNativeTTS(word.word, scene.language);
      }
    }
    
    try {
      const binaryString = window.atob(base64Audio);
      const len = binaryString.length;
      const bytes = new Uint8Array(len);
      for (let i = 0; i < len; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      
      const buffer = new ArrayBuffer(bytes.length);
      const view = new DataView(buffer);
      for (let i = 0; i < bytes.length; i++) {
        view.setUint8(i, bytes[i]);
      }
      
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }
      const audioContext = audioContextRef.current;
      
      if (audioContext.state === 'suspended') {
        await audioContext.resume();
      }
      
      const float32Data = new Float32Array(bytes.length / 2);
      for (let i = 0; i < float32Data.length; i++) {
        const int16 = view.getInt16(i * 2, true);
        float32Data[i] = int16 < 0 ? int16 / 0x8000 : int16 / 0x7FFF;
      }
      
      const audioBuffer = audioContext.createBuffer(1, float32Data.length, 24000);
      audioBuffer.getChannelData(0).set(float32Data);
      
      const source = audioContext.createBufferSource();
      currentAudioSourceRef.current = source;
      source.buffer = audioBuffer;
      source.connect(audioContext.destination);
      source.start();
      
      return new Promise<void>((resolve) => {
        source.onended = () => {
          if (currentAudioSourceRef.current === source) {
            currentAudioSourceRef.current = null;
          }
          resolve();
        };
      });
    } catch (e) {
      console.error("Failed to play audio", e);
      // Fallback if audio decoding fails
      return playNativeTTS(word.word, scene.language);
    }
  };

  // Auto-play loop logic
  useEffect(() => {
    let active = true;
    
    const loopPlay = async () => {
      if (!isPlaying || !scene || mode !== 'learn') return;
      
      for (let i = 0; i < scene.words.length; i++) {
        if (!active || !isPlaying) break;
        setActiveIndex(i);
        await playAudio(scene.words[i]);
        if (!active || !isPlaying) break;
        await new Promise(r => setTimeout(r, 1500)); // Pause between words
      }
      
      if (active && isPlaying) {
        setActiveIndex(-1);
        setTimeout(() => {
          if (active && isPlaying) loopPlay();
        }, 1000);
      }
    };

    if (isPlaying) {
      loopPlay();
    } else {
      stopAudio();
    }

    return () => {
      active = false;
    };
  }, [isPlaying, scene, mode]);

  const toggleListen = () => {
    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
    } else {
      setPassedWords(new Set());
      setTranscript('');
      recognitionRef.current?.start();
      setIsListening(true);
    }
  };

  const handleWordClick = async (word: Word, index: number) => {
    setIsPlaying(false);
    
    if (mode === 'game') {
      const isCurrentlyRevealed = revealedWords.has(word.id);
      setRevealedWords(prev => {
        const next = new Set(prev);
        if (isCurrentlyRevealed) next.delete(word.id);
        else next.add(word.id);
        return next;
      });
      
      if (!isCurrentlyRevealed) {
        setActiveIndex(index);
        await playAudio(word);
        setActiveIndex(prev => prev === index ? -1 : prev);
      }
    } else {
      setActiveIndex(index);
      await playAudio(word);
      setActiveIndex(prev => prev === index ? -1 : prev);
    }
  };

  if (loading || !scene) {
    return <div className="flex items-center justify-center h-full">Loading scene...</div>;
  }

  return (
    <div className="h-full flex flex-col bg-black relative">
      {/* Header */}
      <div className="absolute top-0 left-0 right-0 z-20 p-4 flex items-center justify-between bg-gradient-to-b from-black/80 to-transparent">
        <button onClick={() => navigate(-1)} className="w-10 h-10 bg-black/50 backdrop-blur-md rounded-full flex items-center justify-center text-white hover:bg-white/20 transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="flex items-center gap-2">
          <span className="px-3 py-1 bg-indigo-600/80 backdrop-blur-md rounded-full text-xs font-bold text-white uppercase tracking-wider">
            {scene.language}
          </span>
          <button className="w-10 h-10 bg-black/50 backdrop-blur-md rounded-full flex items-center justify-center text-white hover:bg-pink-500/50 transition-colors">
            <Heart className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Image Container */}
      <div className="relative flex-1 overflow-hidden">
        <img src={scene.image_data} alt={scene.title} className="w-full h-full object-cover" />
        
        {/* Words Overlay */}
        {scene.words.map((word, index) => {
          const isActive = activeIndex === index;
          const isRevealed = mode !== 'game' || revealedWords.has(word.id);
          const isPassed = mode === 'speak' && passedWords.has(word.id);
          
          return (
            <motion.div
              key={word.id}
              className="absolute -translate-x-1/2 -translate-y-1/2 cursor-pointer"
              style={{ left: `${word.x}%`, top: `${word.y}%` }}
              onClick={() => handleWordClick(word, index)}
              animate={isActive ? { scale: 1.1, zIndex: 10 } : { scale: 1, zIndex: 1 }}
            >
              {/* Pointer line to object (optional, simplified here as a dot) */}
              <div className="w-2 h-2 bg-white rounded-full shadow-[0_0_10px_rgba(0,0,0,0.5)] absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2" />
              
              <motion.div 
                className="mt-4 px-3 py-2 rounded-xl backdrop-blur-md shadow-lg border transition-colors flex flex-col items-center min-w-[100px]"
                style={{
                  backgroundColor: isActive ? activeTheme.highlightBgColor : isPassed ? activeTheme.passedBgColor : activeTheme.wordBgColor,
                  borderColor: isActive ? activeTheme.highlightBorderColor : isPassed ? activeTheme.passedBorderColor : 'rgba(255,255,255,0.2)',
                  color: activeTheme.wordTextColor
                }}
                animate={isActive ? { y: -5 } : { y: 0 }}
              >
                {isPassed && (
                  <div className="absolute -top-3 -right-3 w-6 h-6 rounded-full flex items-center justify-center border-2 border-white shadow-lg" style={{ backgroundColor: activeTheme.passedBorderColor }}>
                    <CheckCircle2 className="w-4 h-4 text-white" />
                  </div>
                )}
                
                {isRevealed ? (
                  <>
                    <span className="font-bold text-lg leading-none mb-1">{word.word}</span>
                    <span className="text-xs font-medium mb-1" style={{ opacity: 0.8 }}>{word.pronunciation}</span>
                    <span className="text-xs bg-black/30 px-2 py-0.5 rounded-full" style={{ opacity: 0.9 }}>{word.translation}</span>
                  </>
                ) : (
                  <div className="flex flex-col items-center justify-center py-2">
                    <EyeOff className="w-5 h-5 mb-1" style={{ opacity: 0.6 }} />
                    <span className="text-xs font-medium" style={{ opacity: 0.6 }}>Tap to reveal</span>
                  </div>
                )}
              </motion.div>
            </motion.div>
          );
        })}
      </div>

      {/* Controls */}
      <div className="bg-zinc-950 border-t border-zinc-900 p-4 pb-8 rounded-t-3xl shadow-[0_-10px_40px_rgba(0,0,0,0.5)] relative z-10">
        <h2 className="text-xl font-bold text-center mb-6">{scene.title}</h2>
        
        <div className="flex justify-center gap-4 mb-6">
          <button
            onClick={() => { setMode('learn'); setIsPlaying(false); }}
            className={`flex-1 py-3 rounded-xl font-medium flex flex-col items-center gap-1 transition-colors ${mode === 'learn' ? 'bg-indigo-600 text-white' : 'bg-zinc-900 text-zinc-400 hover:bg-zinc-800'}`}
          >
            <Volume2 className="w-5 h-5" />
            <span className="text-xs">Learn</span>
          </button>
          <button
            onClick={() => { setMode('game'); setIsPlaying(false); setRevealedWords(new Set()); }}
            className={`flex-1 py-3 rounded-xl font-medium flex flex-col items-center gap-1 transition-colors ${mode === 'game' ? 'bg-purple-600 text-white' : 'bg-zinc-900 text-zinc-400 hover:bg-zinc-800'}`}
          >
            <EyeOff className="w-5 h-5" />
            <span className="text-xs">Game</span>
          </button>
          <button
            onClick={() => { setMode('speak'); setIsPlaying(false); setPassedWords(new Set()); setIsListening(false); }}
            className={`flex-1 py-3 rounded-xl font-medium flex flex-col items-center gap-1 transition-colors ${mode === 'speak' ? 'bg-emerald-600 text-white' : 'bg-zinc-900 text-zinc-400 hover:bg-zinc-800'}`}
          >
            <Mic className="w-5 h-5" />
            <span className="text-xs">Speak</span>
          </button>
        </div>

        {/* Mode specific controls */}
        <div className="flex justify-center">
          {mode === 'learn' && (
            <button
              onClick={() => {
                setIsPlaying(!isPlaying);
                if (isPlaying) setActiveIndex(-1);
              }}
              className="w-16 h-16 bg-white text-black rounded-full flex items-center justify-center shadow-[0_0_20px_rgba(255,255,255,0.3)] hover:scale-105 transition-transform"
            >
              {isPlaying ? <Pause className="w-8 h-8" /> : <PlayIcon className="w-8 h-8 pl-1" />}
            </button>
          )}
          
          {mode === 'game' && (
            <div className="text-center text-zinc-400 text-sm">
              Tap the hidden cards to reveal the words and hear them.
            </div>
          )}
          
          {mode === 'speak' && (
            <button
              onClick={toggleListen}
              className={`w-16 h-16 rounded-full flex items-center justify-center shadow-lg transition-all ${isListening ? 'bg-red-500 text-white animate-pulse shadow-[0_0_20px_rgba(239,68,68,0.5)]' : 'bg-emerald-600 text-white hover:bg-emerald-500'}`}
            >
              <Mic className="w-8 h-8" />
            </button>
          )}
        </div>
        
        {mode === 'speak' && isListening && (
          <div className="text-center mt-4">
            <div className="text-emerald-400 text-sm font-medium animate-pulse mb-2">
              Listening... Read the words aloud!
            </div>
            {transcript && (
              <div className="text-zinc-300 text-xs bg-zinc-900 p-2 rounded-lg max-w-xs mx-auto break-words">
                Heard: "{transcript}"
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
