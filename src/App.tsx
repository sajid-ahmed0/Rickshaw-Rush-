/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useEffect, useRef, useState } from 'react';
import { GameManager, GameState } from './game/GameManager';
import { Trophy, Coins, Play, RotateCcw, ShoppingBag, User, Gift, X, BarChart3, MapPin, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { SKINS, Skin } from './game/constants';

export default function App() {
  const containerRef = useRef<HTMLDivElement>(null);
  const gameManagerRef = useRef<GameManager | null>(null);
  
  const [gameState, setGameState] = useState<GameState>('START');
  const [score, setScore] = useState(0);
  const [coins, setCoins] = useState(0);
  const [totalCoins, setTotalCoins] = useState(0);
  
  const [highScore, setHighScore] = useState(0);
  const [totalDistance, setTotalDistance] = useState(0);
  const [totalCoinsCollected, setTotalCoinsCollected] = useState(0);
  
  const [showShop, setShowShop] = useState(false);
  const [showSkins, setShowSkins] = useState(false);
  const [showDaily, setShowDaily] = useState(false);
  const [showStats, setShowStats] = useState(false);
  
  const [unlockedSkins, setUnlockedSkins] = useState<string[]>(['default']);
  const [currentSkin, setCurrentSkin] = useState('default');
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    if (toast) {
        const timer = setTimeout(() => setToast(null), 3000);
        return () => clearTimeout(timer);
    }
  }, [toast]);

  useEffect(() => {
    // Load persisted data
    const savedCoins = localStorage.getItem('totalCoins');
    const savedHighScore = localStorage.getItem('highScore');
    const savedDistance = localStorage.getItem('totalDistance');
    const savedTotalCoins = localStorage.getItem('totalCoinsCollected');
    const savedSkins = localStorage.getItem('unlockedSkins');
    const savedCurrentSkin = localStorage.getItem('currentSkin');
    
    if (savedCoins) setTotalCoins(parseInt(savedCoins));
    if (savedHighScore) setHighScore(parseInt(savedHighScore));
    if (savedDistance) setTotalDistance(parseInt(savedDistance));
    if (savedTotalCoins) setTotalCoinsCollected(parseInt(savedTotalCoins));
    if (savedSkins) setUnlockedSkins(JSON.parse(savedSkins));
    if (savedCurrentSkin) setCurrentSkin(savedCurrentSkin);

    if (containerRef.current && !gameManagerRef.current) {
      gameManagerRef.current = new GameManager(containerRef.current, (state, s, c) => {
        setGameState(state);
        setScore(s);
        setCoins(c);
        
        if (state === 'GAMEOVER') {
            // Update total coins
            setTotalCoins(prev => {
                const newValue = prev + c;
                localStorage.setItem('totalCoins', newValue.toString());
                return newValue;
            });

            // Update stats
            setTotalDistance(prev => {
                const newValue = prev + s;
                localStorage.setItem('totalDistance', newValue.toString());
                return newValue;
            });

            setTotalCoinsCollected(prev => {
                const newValue = prev + c;
                localStorage.setItem('totalCoinsCollected', newValue.toString());
                return newValue;
            });

            // Update High Score
            setHighScore(prev => {
                if (s > prev) {
                    localStorage.setItem('highScore', s.toString());
                    return s;
                }
                return prev;
            });
        }
      });
      
      if (savedCurrentSkin) {
          gameManagerRef.current.setPlayerSkin(savedCurrentSkin);
      }
    }
  }, []);

  const startGame = () => {
    if (gameState === 'PLAYING') return; // Prevent multiple clicks/resets during start transition
    gameManagerRef.current?.start();
  };

  const buySkin = (skin: Skin) => {
    if (totalCoins >= skin.price && !unlockedSkins.includes(skin.id)) {
        const newUnlocked = [...unlockedSkins, skin.id];
        setUnlockedSkins(newUnlocked);
        setTotalCoins(prev => {
            const val = prev - skin.price;
            localStorage.setItem('totalCoins', val.toString());
            return val;
        });
        localStorage.setItem('unlockedSkins', JSON.stringify(newUnlocked));
    }
  };

  const selectSkin = (skinId: string) => {
    if (unlockedSkins.includes(skinId)) {
        setCurrentSkin(skinId);
        localStorage.setItem('currentSkin', skinId);
        gameManagerRef.current?.setPlayerSkin(skinId);
    }
  };

  const claimDaily = () => {
      const lastClaim = localStorage.getItem('lastClaim');
      const now = new Date().getTime();
      if (!lastClaim || now - parseInt(lastClaim) > 86400000) {
          setTotalCoins(prev => {
              const val = prev + 50;
              localStorage.setItem('totalCoins', val.toString());
              return val;
          });
          localStorage.setItem('lastClaim', now.toString());
          setToast('Claimed 50 Daily Coins!');
      } else {
          setToast('Reward already claimed today!');
      }
      setShowDaily(false);
  };

  return (
    <div className="relative w-full h-screen overflow-hidden bg-zinc-950 font-sans">
      <div ref={containerRef} className="absolute inset-0 w-full h-full" />

      {/* HUD (Rickshaw Rush Style) */}
      <div className="absolute top-4 left-6 flex items-center gap-4 z-10">
        <button onClick={() => setGameState('START')} className="p-3 bg-blue-500/80 backdrop-blur-md rounded-xl text-white shadow-lg border-2 border-white/40 hover:bg-blue-400 transition-all active:scale-95">
          <Play className="w-6 h-6 fill-current rotate-90" /> {/* Mock pause icon */}
        </button>
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2 bg-black/30 backdrop-blur-sm px-3 py-1 rounded-lg border border-white/10">
            <User className="w-3 h-3 text-white" />
            <span className="text-white text-xs font-bold uppercase tracking-tight">Daily</span>
            <span className="text-blue-400 text-xs font-black">3/5</span>
          </div>
        </div>
      </div>

      <div className="absolute top-4 right-6 flex flex-col items-end gap-3 z-10 pointer-events-none">
        {/* Multiplier & Score */}
        <div className="flex items-center gap-3">
          <motion.div initial={{ scale: 0.8 }} animate={{ scale: [0.8, 1.1, 1] }} transition={{ duration: 0.5, repeat: Infinity, repeatType: 'reverse' }}
            className="flex items-center justify-center w-12 h-12 bg-yellow-400 rounded-full border-4 border-yellow-600 shadow-lg font-game">
            <span className="text-black font-black text-xl italic">x3</span>
          </motion.div>
          <div className="flex flex-col items-end">
            <span className="text-white text-2xl font-game tabular-nums drop-shadow-[0_2px_2px_rgba(0,0,0,0.8)] tracking-wide">
              {score.toString().padStart(6, '0')}
            </span>
          </div>
        </div>

        {/* Coins */}
        <div className="flex items-center gap-2 bg-white/10 backdrop-blur-md px-4 py-2 rounded-2xl border-2 border-white/20 shadow-xl self-end">
          <span className="text-white font-game text-2xl tracking-tighter drop-shadow-md">{coins}</span>
          <div className="w-8 h-8 bg-yellow-500 rounded-full flex items-center justify-center border-2 border-yellow-700 shadow-inner">
            <Coins className="w-5 h-5 text-yellow-100" />
          </div>
        </div>

        {/* High Score Sidebar Widget */}
        {gameState === 'PLAYING' && (
          <motion.div initial={{ x: 50, opacity: 0 }} animate={{ x: 0, opacity: 1 }}
            className="mt-8 flex flex-col items-center gap-1 bg-black/40 backdrop-blur-md p-1 rounded-xl border border-white/20">
            <div className="w-12 h-12 rounded-lg bg-blue-500 overflow-hidden border-2 border-white/40">
              <img src="https://picsum.photos/seed/avatar/64/64" alt="HS Avatar" className="w-full h-full object-cover" />
            </div>
            <div className="bg-white text-black px-2 py-0.5 rounded-md text-[10px] font-black uppercase">
              {highScore}
            </div>
          </motion.div>
        )}
      </div>

      {/* Menu Icons (Start Screen Only) */}
      {gameState === 'START' && (
          <div className="absolute top-6 right-6 flex gap-3 z-10">
              <button onClick={() => setShowStats(true)} className="p-3 bg-white/20 backdrop-blur-md rounded-full text-white hover:bg-white/40 transition-colors"><BarChart3 className="w-6 h-6" /></button>
              <button onClick={() => setShowShop(true)} className="p-3 bg-white/20 backdrop-blur-md rounded-full text-white hover:bg-white/40 transition-colors"><ShoppingBag className="w-6 h-6" /></button>
              <button onClick={() => setShowSkins(true)} className="p-3 bg-white/20 backdrop-blur-md rounded-full text-white hover:bg-white/40 transition-colors"><User className="w-6 h-6" /></button>
              <button onClick={() => setShowDaily(true)} className="p-3 bg-white/20 backdrop-blur-md rounded-full text-white hover:bg-white/40 transition-colors"><Gift className="w-6 h-6" /></button>
          </div>
      )}

      {/* Overlays */}
      <AnimatePresence>
        {gameState === 'START' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/40 backdrop-blur-sm flex flex-col items-center justify-center z-20">
            <motion.h1 initial={{ y: 20 }} animate={{ y: 0 }} className="text-6xl md:text-8xl text-white mb-6 font-game tracking-wider drop-shadow-2xl">
              RICKSHAW <span className="text-yellow-400">RUSH</span>
            </motion.h1>
            <div className="flex flex-col items-center gap-2 mb-12">
                <div className="flex items-center gap-2 bg-yellow-500 px-6 py-2 rounded-full border-4 border-yellow-700 font-game text-black text-xl shadow-xl">
                    <Coins className="w-6 h-6" /> {totalCoins}
                </div>
            </div>
            <button onClick={startGame} className="group relative flex items-center gap-4 bg-green-500 hover:bg-green-400 text-white px-16 py-6 rounded-3xl text-4xl font-game transition-all hover:scale-105 active:scale-95 shadow-[0_10px_0_rgb(22,163,74)] border-4 border-white/40">
              PLAY
            </button>
          </motion.div>
        )}

        {gameState === 'GAMEOVER' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="absolute inset-0 bg-red-950/60 backdrop-blur-md flex flex-col items-center justify-center z-20">
            <motion.h2 initial={{ scale: 0.8 }} animate={{ scale: 1 }} className="text-8xl text-white mb-8 font-game drop-shadow-2xl">CRASH!</motion.h2>
            <div className="flex gap-16 my-12 text-center text-white font-game">
              <div><p className="text-red-300 text-xl uppercase mb-2">Score</p><p className="text-6xl">{score}</p></div>
              <div><p className="text-red-300 text-xl uppercase mb-2">Coins</p><p className="text-6xl">+{coins}</p></div>
            </div>
            <button onClick={startGame} className="flex items-center gap-3 bg-white text-red-600 hover:bg-neutral-100 px-12 py-6 rounded-3xl text-3xl font-game transition-all shadow-[0_10px_0_rgb(200,200,200)] border-4 border-red-200">TRY AGAIN</button>
          </motion.div>
        )}

        {/* Shop Modal */}
        {(showShop || showSkins) && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="absolute inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-30 p-6">
                <div className="bg-zinc-900 border border-white/10 w-full max-w-2xl rounded-3xl overflow-hidden relative shadow-2xl">
                    <button onClick={() => {setShowShop(false); setShowSkins(false);}} className="absolute top-6 right-6 text-white/40 hover:text-white"><X /></button>
                    <div className="p-8">
                        <h2 className="text-4xl font-black text-white uppercase italic mb-2">{showShop ? 'The Shop' : 'Characters'}</h2>
                        <div className="flex items-center gap-2 mb-8 text-amber-400 font-bold uppercase text-sm"><Coins className="w-4 h-4" /> {totalCoins} Available</div>
                        
                        <div className="grid grid-cols-2 gap-4">
                            {SKINS.map(skin => (
                                <div key={skin.id} className={`p-6 rounded-2xl border transition-all ${currentSkin === skin.id ? 'bg-blue-600/20 border-blue-500' : 'bg-white/5 border-white/10'} flex flex-col items-center`}>
                                    <div className="w-16 h-20 mb-4 rounded-lg shadow-lg" style={{ backgroundColor: `#${skin.color.toString(16).padStart(6, '0')}` }} />
                                    <h3 className="text-zinc-100 font-bold mb-1">{skin.name}</h3>
                                    {unlockedSkins.includes(skin.id) ? (
                                        <button onClick={() => selectSkin(skin.id)} className={`w-full py-2 rounded-xl font-bold text-sm ${currentSkin === skin.id ? 'bg-blue-500 text-white' : 'bg-white/10 text-white/60 hover:bg-white/20'}`}>
                                            {currentSkin === skin.id ? 'Equipped' : 'Equip'}
                                        </button>
                                    ) : (
                                        <button onClick={() => buySkin(skin)} className="w-full py-2 bg-amber-500 hover:bg-amber-400 text-black font-bold rounded-xl text-sm flex items-center justify-center gap-2">
                                            <Coins className="w-4 h-4" /> {skin.price}
                                        </button>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </motion.div>
        )}

        {/* Daily Reward Modal */}
        {showDaily && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="absolute inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-30 p-6">
                <div className="bg-zinc-900 border border-white/10 p-12 rounded-3xl text-center relative shadow-2xl">
                    <button onClick={() => setShowDaily(false)} className="absolute top-6 right-6 text-white/40 hover:text-white"><X /></button>
                    <Gift className="w-16 h-16 text-blue-500 mx-auto mb-6" />
                    <h2 className="text-4xl font-black text-white uppercase italic mb-4">Daily Reward</h2>
                    <p className="text-zinc-400 mb-8 max-w-sm">Come back every 24 hours to claim your bonus coins!</p>
                    <button onClick={claimDaily} className="bg-blue-600 hover:bg-blue-500 text-white px-10 py-4 rounded-xl font-black uppercase shadow-lg shadow-blue-900/40">Claim 50 Coins</button>
                </div>
            </motion.div>
        )}
        {/* Stats Modal */}
        {showStats && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="absolute inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-30 p-6">
                <div className="bg-zinc-900 border border-white/10 p-10 rounded-3xl text-center relative shadow-2xl w-full max-w-md">
                    <button onClick={() => setShowStats(false)} className="absolute top-6 right-6 text-white/40 hover:text-white"><X /></button>
                    <BarChart3 className="w-12 h-12 text-blue-500 mx-auto mb-6" />
                    <h2 className="text-3xl font-black text-white uppercase italic mb-8">Your Stats</h2>
                    
                    <div className="grid grid-cols-1 gap-4 mb-8">
                        <div className="bg-white/5 p-4 rounded-xl border border-white/5 flex items-center justify-between">
                            <span className="text-white/40 text-xs font-bold uppercase flex items-center gap-2"><Trophy className="w-3 h-3" /> High Score</span>
                            <span className="text-white font-black text-xl">{highScore}</span>
                        </div>
                        <div className="bg-white/5 p-4 rounded-xl border border-white/5 flex items-center justify-between">
                            <span className="text-white/40 text-xs font-bold uppercase flex items-center gap-2"><MapPin className="w-3 h-3" /> Total Distance</span>
                            <span className="text-white font-black text-xl">{totalDistance.toLocaleString()}m</span>
                        </div>
                        <div className="bg-white/5 p-4 rounded-xl border border-white/5 flex items-center justify-between">
                            <span className="text-white/40 text-xs font-bold uppercase flex items-center gap-2"><Coins className="w-3 h-3" /> Lifetime Coins</span>
                            <span className="text-white font-black text-xl">{totalCoinsCollected}</span>
                        </div>
                    </div>

                    <button onClick={() => setShowStats(false)} className="w-full bg-blue-600 hover:bg-blue-500 text-white py-4 rounded-xl font-black uppercase">Close</button>
                </div>
            </motion.div>
        )}
      </AnimatePresence>

      {/* Toast Notification */}
      <AnimatePresence>
        {toast && (
          <motion.div initial={{ y: 50, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 50, opacity: 0 }}
            className="absolute bottom-10 left-1/2 -translate-x-1/2 bg-blue-600 text-white px-6 py-3 rounded-2xl font-bold shadow-2xl z-50 flex items-center gap-2">
            <Check className="w-5 h-5" /> {toast}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

