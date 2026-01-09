
import React, { useState, useEffect, useCallback } from 'react';
import { AppStep, HistoryItem } from './types';
import ImageCard from './components/ImageCard';
import { generateClothingImage, tryOnClothing } from './services/geminiService';

const App: React.FC = () => {
  const [activeStep, setActiveStep] = useState<AppStep>(AppStep.UPLOAD_PERSON);
  const [personImage, setPersonImage] = useState<string | undefined>();
  const [clothingImage, setClothingImage] = useState<string | undefined>();
  const [resultImage, setResultImage] = useState<string | undefined>();
  const [clothingPrompt, setClothingPrompt] = useState('');
  const [isGeneratingClothes, setIsGeneratingClothes] = useState(false);
  const [isProcessingTryOn, setIsProcessingTryOn] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [history, setHistory] = useState<HistoryItem[]>([]);

  // Load history from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem('ai_tryon_history');
    if (saved) {
      setHistory(JSON.parse(saved));
    }
  }, []);

  const saveToHistory = useCallback((newItem: HistoryItem) => {
    const updated = [newItem, ...history].slice(0, 10); // Keep last 10
    setHistory(updated);
    localStorage.setItem('ai_tryon_history', JSON.stringify(updated));
  }, [history]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, type: 'person' | 'clothes') => {
    const file = e.target.files?.[0];
    if (file) {
      setErrorMsg(null);
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = reader.result as string;
        if (type === 'person') {
          setPersonImage(base64);
          setActiveStep(AppStep.CHOOSE_CLOTHES);
        } else {
          setClothingImage(base64);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleGenerateClothes = async () => {
    if (!clothingPrompt) return;
    setIsGeneratingClothes(true);
    setErrorMsg(null);
    try {
      const result = await generateClothingImage(clothingPrompt);
      if (result) {
        setClothingImage(result);
      } else {
        setErrorMsg("未能生成图片，请重试。");
      }
    } catch (e: any) {
      setErrorMsg(e.message || "生成失败，可能已达到 API 限制。");
    } finally {
      setIsGeneratingClothes(false);
    }
  };

  const handleTryOn = async () => {
    if (!personImage || !clothingImage) return;
    setIsProcessingTryOn(true);
    setErrorMsg(null);
    try {
      const result = await tryOnClothing(personImage, clothingImage);
      if (result) {
        setResultImage(result);
        saveToHistory({
          id: Date.now().toString(),
          personImage,
          clothingImage,
          resultImage: result,
          timestamp: Date.now()
        });
      } else {
        setErrorMsg("试穿合成失败，请重试。");
      }
    } catch (e: any) {
      setErrorMsg(e.message || "换装失败，可能已达到 API 限制。");
    } finally {
      setIsProcessingTryOn(false);
    }
  };

  return (
    <div className="min-h-screen pb-24 relative bg-gray-50 flex flex-col">
      {/* Header */}
      <header className="pt-8 pb-4 text-center">
        <h1 className="text-3xl font-extrabold text-gray-800 tracking-tight">AI 换装大师</h1>
        <p className="text-gray-500 mt-2">基于 Nano Banana 的智能试穿实验室</p>
      </header>

      {/* Top Display Area - Tilted Cards */}
      <div className="flex flex-wrap justify-center gap-6 px-4 py-10">
        <ImageCard 
          title="模特人像" 
          image={personImage} 
          step={1} 
          rotation="-rotate-2" 
          isActive={activeStep === AppStep.UPLOAD_PERSON}
          onClick={() => {
            setErrorMsg(null);
            setActiveStep(AppStep.UPLOAD_PERSON);
          }}
        />
        <ImageCard 
          title="梦想服装" 
          image={clothingImage} 
          step={2} 
          rotation="rotate-1" 
          isActive={activeStep === AppStep.CHOOSE_CLOTHES}
          onClick={() => {
            setErrorMsg(null);
            setActiveStep(AppStep.CHOOSE_CLOTHES);
          }}
        />
        <ImageCard 
          title="生成结果" 
          image={resultImage} 
          step={3} 
          rotation="-rotate-1" 
          isActive={activeStep === AppStep.GENERATE_RESULT}
          onClick={() => {
            setErrorMsg(null);
            setActiveStep(AppStep.GENERATE_RESULT);
          }}
        />
      </div>

      {/* Main Operation Area */}
      <main className="flex-1 max-w-4xl mx-auto w-full px-6">
        {/* Error Message Toast-like banner */}
        {errorMsg && (
          <div className="mb-6 bg-red-50 border-l-4 border-red-400 p-4 rounded-r-xl shadow-sm animate-bounce-short">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <i className="fas fa-exclamation-circle text-red-400"></i>
              </div>
              <div className="ml-3">
                <p className="text-sm text-red-700 font-medium">
                  {errorMsg}
                </p>
              </div>
              <button 
                className="ml-auto text-red-400 hover:text-red-500"
                onClick={() => setErrorMsg(null)}
              >
                <i className="fas fa-times"></i>
              </button>
            </div>
          </div>
        )}

        <div className="bg-white rounded-3xl shadow-xl p-8 border border-gray-100 mb-10 min-h-[400px]">
          {activeStep === AppStep.UPLOAD_PERSON && (
            <div className="space-y-6 text-center">
              <h2 className="text-2xl font-bold text-gray-800">第一步：上传您的照片</h2>
              <p className="text-gray-500">上传一张清晰的正脸或全身照，效果最佳</p>
              <div className="mt-8 border-2 border-dashed border-gray-200 rounded-2xl p-12 hover:border-blue-400 transition-colors group cursor-pointer relative">
                <input 
                  type="file" 
                  accept="image/*" 
                  onChange={(e) => handleFileUpload(e, 'person')}
                  className="absolute inset-0 opacity-0 cursor-pointer"
                />
                <div className="flex flex-col items-center">
                  <div className="w-20 h-20 bg-blue-50 text-blue-500 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                    <i className="fas fa-cloud-upload-alt text-3xl"></i>
                  </div>
                  <span className="text-gray-600 font-medium">点击或拖拽上传照片</span>
                  <span className="text-gray-400 text-xs mt-2">支持 JPG, PNG, WEBP</span>
                </div>
              </div>
            </div>
          )}

          {activeStep === AppStep.CHOOSE_CLOTHES && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-gray-800">第二步：选择服装</h2>
                {personImage && (
                  <div className="flex items-center gap-2 text-sm text-blue-500 font-medium bg-blue-50 px-3 py-1 rounded-full">
                    <i className="fas fa-check-circle"></i> 已上传人像
                  </div>
                )}
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-gray-50 p-6 rounded-2xl border border-gray-100 flex flex-col items-center text-center">
                  <h3 className="font-bold text-gray-700 mb-4">上传服装图片</h3>
                  <input 
                    type="file" 
                    accept="image/*" 
                    id="clothes-upload"
                    onChange={(e) => handleFileUpload(e, 'clothes')}
                    className="hidden"
                  />
                  <label htmlFor="clothes-upload" className="w-full py-4 px-6 bg-white border-2 border-gray-200 rounded-xl text-gray-600 font-medium hover:border-blue-400 hover:text-blue-500 transition-all cursor-pointer">
                    <i className="fas fa-upload mr-2"></i> 上传图片
                  </label>
                  <p className="text-gray-400 text-xs mt-4">从本地文件夹选择一件衣服</p>
                </div>

                <div className="bg-gray-50 p-6 rounded-2xl border border-gray-100">
                  <h3 className="font-bold text-gray-700 mb-4 text-center">AI 创意生成</h3>
                  <div className="flex gap-2">
                    <input 
                      type="text" 
                      value={clothingPrompt}
                      onChange={(e) => setClothingPrompt(e.target.value)}
                      placeholder="例如：丝绸红色连衣裙..."
                      className="flex-1 px-4 py-2 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-400"
                    />
                    <button 
                      onClick={handleGenerateClothes}
                      disabled={isGeneratingClothes || !clothingPrompt}
                      className="bg-blue-600 text-white px-4 py-2 rounded-xl font-bold shadow-lg shadow-blue-200 hover:bg-blue-700 disabled:bg-gray-300 disabled:shadow-none transition-all"
                    >
                      {isGeneratingClothes ? <i className="fas fa-spinner fa-spin"></i> : '生成'}
                    </button>
                  </div>
                  <p className="text-gray-400 text-xs mt-4 text-center italic">使用 Nano Banana 创造你梦想的服装</p>
                </div>
              </div>

              {clothingImage && (
                <div className="flex justify-center pt-6">
                  <button 
                    onClick={() => {
                      setErrorMsg(null);
                      setActiveStep(AppStep.GENERATE_RESULT);
                    }}
                    className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-10 py-4 rounded-2xl font-bold shadow-xl hover:shadow-2xl transition-all"
                  >
                    准备好了，下一步 <i className="fas fa-arrow-right ml-2"></i>
                  </button>
                </div>
              )}
            </div>
          )}

          {activeStep === AppStep.GENERATE_RESULT && (
            <div className="space-y-6 text-center">
              <h2 className="text-2xl font-bold text-gray-800">第三步：魔法生成</h2>
              <div className="flex flex-col items-center justify-center gap-8 py-8">
                {!resultImage ? (
                  <>
                    <div className="flex items-center gap-4 justify-center">
                      <div className="w-24 h-24 rounded-xl overflow-hidden shadow-lg border-2 border-white ring-2 ring-gray-100">
                        <img src={personImage} className="w-full h-full object-cover" alt="person" />
                      </div>
                      <div className="text-gray-300 text-2xl">
                        <i className="fas fa-plus"></i>
                      </div>
                      <div className="w-24 h-24 rounded-xl overflow-hidden shadow-lg border-2 border-white ring-2 ring-gray-100">
                        <img src={clothingImage} className="w-full h-full object-cover" alt="clothes" />
                      </div>
                    </div>
                    <button 
                      onClick={handleTryOn}
                      disabled={isProcessingTryOn || !personImage || !clothingImage}
                      className="relative group bg-gray-900 text-white px-12 py-5 rounded-2xl font-bold text-lg shadow-2xl overflow-hidden transition-all hover:scale-105 active:scale-95 disabled:bg-gray-400 disabled:scale-100"
                    >
                      {isProcessingTryOn ? (
                        <span className="flex items-center gap-3">
                          <i className="fas fa-magic fa-spin text-xl"></i>
                          AI 正在试穿中...
                        </span>
                      ) : (
                        <span className="flex items-center gap-3">
                          <i className="fas fa-magic text-xl"></i>
                          立即开始换装
                        </span>
                      )}
                      <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"></div>
                    </button>
                  </>
                ) : (
                  <div className="space-y-8 animate-in fade-in zoom-in duration-500">
                    <div className="relative inline-block">
                      <img src={resultImage} className="max-h-[500px] rounded-3xl shadow-2xl border-4 border-white" alt="Result" />
                      <div className="absolute top-4 right-4 bg-white/90 backdrop-blur p-2 rounded-xl shadow-lg">
                        <a href={resultImage} download="ai_try_on.png" className="text-gray-800 flex items-center gap-2 px-2">
                          <i className="fas fa-download"></i> <span className="text-sm font-bold">下载</span>
                        </a>
                      </div>
                    </div>
                    <div className="flex gap-4 justify-center">
                      <button 
                        onClick={() => {
                          setResultImage(undefined);
                          setErrorMsg(null);
                          setActiveStep(AppStep.CHOOSE_CLOTHES);
                        }}
                        className="bg-gray-100 text-gray-700 px-6 py-3 rounded-xl font-bold hover:bg-gray-200 transition-colors"
                      >
                        更换服装
                      </button>
                      <button 
                        onClick={() => {
                          setResultImage(undefined);
                          setClothingImage(undefined);
                          setPersonImage(undefined);
                          setErrorMsg(null);
                          setActiveStep(AppStep.UPLOAD_PERSON);
                        }}
                        className="bg-blue-600 text-white px-8 py-3 rounded-xl font-bold shadow-lg hover:bg-blue-700 transition-colors"
                      >
                        开始新创作
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Footer / Gallery Area */}
      <section className="bg-white/50 backdrop-blur-md border-t border-gray-200 fixed bottom-0 left-0 right-0 py-4 px-6">
        <div className="max-w-6xl mx-auto flex items-center gap-6 overflow-x-auto pb-2 scrollbar-hide">
          <div className="flex-shrink-0 flex items-center gap-3 pr-6 border-r border-gray-200">
            <div className="w-10 h-10 bg-gray-800 rounded-lg flex items-center justify-center text-white">
              <i className="fas fa-history"></i>
            </div>
            <div>
              <p className="font-bold text-gray-800 text-sm">生成历史</p>
              <p className="text-xs text-gray-400">最近 10 次记录</p>
            </div>
          </div>
          
          <div className="flex gap-4">
            {history.length === 0 ? (
              <div className="h-14 flex items-center text-gray-300 italic text-sm">
                还没有记录，快去尝试生成吧...
              </div>
            ) : (
              history.map((item) => (
                <div 
                  key={item.id} 
                  className="w-14 h-14 rounded-lg overflow-hidden border border-gray-200 flex-shrink-0 cursor-pointer hover:ring-2 hover:ring-blue-400 transition-all shadow-sm"
                  onClick={() => {
                    setPersonImage(item.personImage);
                    setClothingImage(item.clothingImage);
                    setResultImage(item.resultImage);
                    setErrorMsg(null);
                    setActiveStep(AppStep.GENERATE_RESULT);
                  }}
                >
                  <img src={item.resultImage} className="w-full h-full object-cover" alt="History" />
                </div>
              ))
            )}
          </div>
        </div>
      </section>

      {/* Global CSS for scrollbar and animation */}
      <style>{`
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        @keyframes bounce-short {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-4px); }
        }
        .animate-bounce-short {
          animation: bounce-short 1s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
};

export default App;
