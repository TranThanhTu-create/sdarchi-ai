
import React, { useState, useCallback, useEffect } from 'react';
import { HouseType, DesignStyle, DesignSuggestion, DesignFormData } from './types';
import { generateArchitecturalDesigns, editDesign } from './services/geminiService';

// --- Thành phần hỗ trợ ---

const LoadingOverlay: React.FC<{ message: string }> = ({ message }) => (
  <div className="fixed inset-0 bg-[#0E1F16]/90 backdrop-blur-md z-50 flex items-center justify-center p-4">
    <div className="bg-[#162C21] rounded-[2.5rem] p-12 max-w-md w-full text-center shadow-[0_0_50px_rgba(61,255,111,0.15)] border border-[#3DFF6F]/20">
      <div className="relative w-24 h-24 mx-auto mb-10">
        <div className="absolute inset-0 rounded-full border-4 border-[#3DFF6F]/10 border-t-[#3DFF6F] animate-spin shadow-[0_0_15px_rgba(61,255,111,0.4)]"></div>
        <div className="absolute inset-3 bg-[#0E1F16] rounded-full flex items-center justify-center">
          <svg className="w-10 h-10 text-[#3DFF6F]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-7h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
          </svg>
        </div>
      </div>
      <h3 className="text-3xl font-black text-white mb-4 tracking-tight neon-text-glow">Sdarchi AI thiết kế</h3>
      <p className="text-slate-400 text-sm leading-relaxed font-medium mb-6">{message}</p>
      <div className="text-[10px] text-[#3DFF6F] font-black uppercase tracking-[0.3em] opacity-80">Đang tối ưu thuật toán AI</div>
      <div className="mt-10 flex gap-2 justify-center">
        <div className="w-2 h-2 rounded-full bg-[#3DFF6F] animate-bounce shadow-[0_0_8px_#3DFF6F]"></div>
        <div className="w-2 h-2 rounded-full bg-[#3DFF6F] animate-bounce [animation-delay:-0.15s] opacity-60"></div>
        <div className="w-2 h-2 rounded-full bg-[#3DFF6F] animate-bounce [animation-delay:-0.3s] opacity-30"></div>
      </div>
    </div>
  </div>
);

const Header: React.FC<{ onReset: () => void }> = ({ onReset }) => (
  <header className="bg-[#0E1F16]/80 backdrop-blur-xl border-b border-white/5 sticky top-0 z-40">
    <div className="max-w-7xl mx-auto px-4 h-20 flex items-center justify-between">
      <div className="flex items-center gap-4 cursor-pointer group" onClick={onReset}>
        <div className="flex flex-col">
          <span className="text-2xl font-black text-white tracking-tighter leading-none">
            Sdarchi <span className="text-[#3DFF6F] neon-text-glow">AI</span>
          </span>
          <span className="text-[8px] font-black text-slate-500 uppercase tracking-[0.2em] mt-1">KIẾN TRÚC & XÂY DỰNG</span>
        </div>
      </div>
      <nav className="hidden md:flex gap-10 items-center">
        <a href="https://sdarchi.com.vn/" target="_blank" rel="noopener noreferrer" className="text-slate-400 hover:text-[#3DFF6F] font-bold transition-all uppercase text-xs tracking-widest">Công trình</a>
        <button 
          onClick={onReset}
          className="text-slate-400 hover:text-white font-bold transition-all uppercase text-xs tracking-widest flex items-center gap-2"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
          Bắt đầu lại
        </button>
        <a href="tel:0333357076" className="bg-white/5 text-white px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-[#3DFF6F] hover:text-black transition-all border border-white/10">Liên hệ</a>
      </nav>
    </div>
  </header>
);

const App: React.FC = () => {
  const initialFormData: DesignFormData = {
    houseType: HouseType.Townhouse,
    style: DesignStyle.Modern,
    budget: '2.5',
    image: null,
    landWidth: '5',
    landLength: '20',
    floors: '2',
    frontYardLength: '3',
  };

  const [formData, setFormData] = useState<DesignFormData>(initialFormData);
  const [suggestions, setSuggestions] = useState<DesignSuggestion[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('');
  const [selectedDesign, setSelectedDesign] = useState<DesignSuggestion | null>(null);
  const [editPrompt, setEditPrompt] = useState('');
  const [isEditing, setIsEditing] = useState(false);

  const ZALO_LINK = "https://zalo.me/g/exlpxk125"; // Updated Zalo group link

  const handleReset = useCallback(() => {
    if (suggestions.length > 0 || formData.image) {
      const confirmReset = window.confirm("Bạn muốn quay lại trang chủ và bắt đầu một thiết kế mới? (Mọi thiết kế hiện tại sẽ bị xóa)");
      if (!confirmReset) return;
    }

    setFormData(initialFormData);
    setSuggestions([]);
    setSelectedDesign(null);
    setEditPrompt('');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [suggestions.length, formData.image]);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData(prev => ({ ...prev, image: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleGenerate = async () => {
    if (!formData.image) {
      alert("Vui lòng tải lên hình ảnh khu đất của bạn!");
      return;
    }

    if (!formData.landWidth || !formData.landLength) {
      alert("Vui lòng nhập kích thước chiều ngang và chiều dài!");
      return;
    }

    setIsLoading(true);
    setLoadingMessage("Sdarchi AI đang tính toán giải pháp kiến trúc tối ưu...");
    
    try {
      const displayBudget = parseFloat(formData.budget) >= 10 ? "Trên 10 Tỷ VNĐ" : `${formData.budget} Tỷ VNĐ`;
      
      const results = await generateArchitecturalDesigns(
        formData.image,
        formData.houseType,
        formData.style,
        displayBudget,
        formData.landWidth,
        formData.landLength,
        formData.floors,
        formData.frontYardLength,
        3
      );

      if (results.length === 0) {
        throw new Error("Không thể tạo được thiết kế.");
      }

      const mappedSuggestions: DesignSuggestion[] = results.map((res, index) => ({
        id: `design-${Date.now()}-${index}`,
        imageUrl: res.imageUrl,
        title: `Phương án ${index + 1}: ${formData.houseType} ${formData.floors} tầng`,
        description: res.description,
        estimatedCost: displayBudget
      }));

      setSuggestions(mappedSuggestions);
      setSelectedDesign(null); 
      
      setTimeout(() => {
        document.getElementById('results-section')?.scrollIntoView({ behavior: 'smooth' });
      }, 300);
    } catch (error) {
      console.error(error);
      alert("Hệ thống đang bận hoặc gặp lỗi nhỏ. Vui lòng thử lại.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditDesign = async () => {
    if (!selectedDesign || !editPrompt.trim()) return;

    setIsEditing(true);
    setLoadingMessage(`Đang tinh chỉnh chi tiết kiến trúc...`);
    
    try {
      const updatedImageUrl = await editDesign(selectedDesign.imageUrl, editPrompt);
      if (updatedImageUrl) {
        const updatedDesign = { ...selectedDesign, imageUrl: updatedImageUrl };
        setSelectedDesign(updatedDesign);
        setSuggestions(prev => prev.map(s => s.id === selectedDesign.id ? updatedDesign : s));
        setEditPrompt('');
      }
    } catch (error) {
      console.error(error);
      alert("Không thể chỉnh sửa thiết kế. Vui lòng thử lại.");
    } finally {
      setIsEditing(false);
    }
  };

  const handleContactArchitect = () => {
    window.location.href = "tel:0333357076";
  };

  const handleJoinZalo = () => {
    window.open(ZALO_LINK, '_blank');
  };

  const calculatedArea = parseFloat(formData.landWidth) * parseFloat(formData.landLength);

  return (
    <div className="min-h-screen flex flex-col bg-[#0E1F16]">
      <Header onReset={handleReset} />

      <main className="flex-grow max-w-7xl mx-auto px-4 py-12 w-full">
        {/* Phần Giới thiệu */}
        <section className="text-center mb-20">
          <div className="inline-block px-5 py-2 mb-8 rounded-full bg-[#3DFF6F]/10 border border-[#3DFF6F]/30 text-[#3DFF6F] text-[10px] font-black tracking-[0.3em] uppercase neon-glow">
            Kiến trúc tương lai AI
          </div>
          <h1 className="text-6xl md:text-8xl font-black text-white mb-8 tracking-normal leading-[1.2] md:leading-[1.1]">
            Kiến Tạo <br/><span className="text-[#3DFF6F] neon-text-glow italic">3 Phương Án</span> Đẳng Cấp
          </h1>
          <p className="text-xl text-slate-400 max-w-2xl mx-auto leading-relaxed font-medium">
            Phân tích mảnh đất trống và tự động hóa bản vẽ 3D chân thực bằng trí tuệ nhân tạo chuyên sâu.
          </p>
        </section>

        {/* Phần Biểu mẫu Nhập liệu */}
        <section className="grid lg:grid-cols-2 gap-12 mb-24 items-stretch">
          <div className="bg-[#162C21] p-10 rounded-[3rem] shadow-2xl border border-white/5 flex flex-col justify-between">
            <div>
              <h2 className="text-2xl font-black mb-10 flex items-center gap-4 text-white">
                <span className="flex items-center justify-center bg-[#3DFF6F] text-black w-9 h-9 rounded-xl text-lg font-black shadow-[0_0_15px_rgba(61,255,111,0.4)]">1</span>
                Thông tin khu đất
              </h2>
              
              <div className="space-y-8">
                <div>
                  <div className="relative group">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="hidden"
                      id="land-upload"
                    />
                    <label
                      htmlFor="land-upload"
                      className={`flex flex-col items-center justify-center w-full h-80 border-2 border-dashed rounded-[2.5rem] cursor-pointer transition-all duration-500 ${
                        formData.image ? 'border-[#3DFF6F] bg-[#3DFF6F]/5' : 'border-white/10 hover:border-[#3DFF6F]/50 bg-black/20 hover:bg-[#3DFF6F]/5'
                      }`}
                    >
                      {formData.image ? (
                        <div className="relative w-full h-full group">
                          <img src={formData.image} alt="Xem trước" className="h-full w-full object-cover rounded-[2.5rem]" />
                          <div className="absolute inset-0 bg-[#0E1F16]/60 opacity-0 group-hover:opacity-100 transition-opacity rounded-[2.5rem] flex items-center justify-center backdrop-blur-sm">
                            <span className="text-white font-black bg-[#3DFF6F] text-black px-6 py-3 rounded-2xl shadow-xl">Đổi hình ảnh</span>
                          </div>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center p-8 text-center group">
                          <div className="w-16 h-16 bg-[#162C21] rounded-2xl shadow-xl flex items-center justify-center mb-4 text-[#3DFF6F] group-hover:scale-110 transition-transform border border-white/5">
                            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                            </svg>
                          </div>
                          <p className="text-white font-black text-lg mb-1">Tải ảnh khu đất</p>
                          <p className="text-slate-500 text-xs max-w-xs leading-relaxed font-medium">Chọn ảnh chụp mảnh đất trống để AI bắt đầu thi công bản vẽ.</p>
                        </div>
                      )}
                    </label>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <label className="text-[10px] font-black text-[#3DFF6F] uppercase tracking-[0.2em] ml-2">Loại hình</label>
                    <select
                      className="w-full px-6 py-4 bg-[#0E1F16] border border-white/10 rounded-2xl focus:ring-2 focus:ring-[#3DFF6F] focus:border-[#3DFF6F] appearance-none font-bold text-white transition-all shadow-inner"
                      value={formData.houseType}
                      onChange={(e) => setFormData(p => ({ ...p, houseType: e.target.value as HouseType }))}
                    >
                      {Object.values(HouseType).map(t => <option key={t} value={t} className="bg-[#162C21]">{t}</option>)}
                    </select>
                  </div>
                  <div className="space-y-3">
                    <label className="text-[10px] font-black text-[#3DFF6F] uppercase tracking-[0.2em] ml-2">Phong cách</label>
                    <select
                      className="w-full px-6 py-4 bg-[#0E1F16] border border-white/10 rounded-2xl focus:ring-2 focus:ring-[#3DFF6F] focus:border-[#3DFF6F] appearance-none font-bold text-white transition-all shadow-inner"
                      value={formData.style}
                      onChange={(e) => setFormData(p => ({ ...p, style: e.target.value as DesignStyle }))}
                    >
                      {Object.values(DesignStyle).map(s => <option key={s} value={s} className="bg-[#162C21]">{s}</option>)}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <label className="text-[10px] font-black text-[#3DFF6F] uppercase tracking-[0.2em] ml-2">Chiều ngang (m)</label>
                    <input
                      type="number"
                      step="0.1"
                      className="w-full px-6 py-4 bg-[#0E1F16] border border-white/10 rounded-2xl focus:ring-2 focus:ring-[#3DFF6F] focus:border-[#3DFF6F] font-bold text-white transition-all shadow-inner"
                      value={formData.landWidth}
                      onChange={(e) => setFormData(p => ({ ...p, landWidth: e.target.value }))}
                      placeholder="VD: 5"
                    />
                  </div>
                  <div className="space-y-3">
                    <label className="text-[10px] font-black text-[#3DFF6F] uppercase tracking-[0.2em] ml-2">Chiều dài (m)</label>
                    <input
                      type="number"
                      step="0.1"
                      className="w-full px-6 py-4 bg-[#0E1F16] border border-white/10 rounded-2xl focus:ring-2 focus:ring-[#3DFF6F] focus:border-[#3DFF6F] font-bold text-white transition-all shadow-inner"
                      value={formData.landLength}
                      onChange={(e) => setFormData(p => ({ ...p, landLength: e.target.value }))}
                      placeholder="VD: 20"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <label className="text-[10px] font-black text-[#3DFF6F] uppercase tracking-[0.2em] ml-2">Số tầng</label>
                    <input
                      type="number"
                      min="1"
                      className="w-full px-6 py-4 bg-[#0E1F16] border border-white/10 rounded-2xl focus:ring-2 focus:ring-[#3DFF6F] focus:border-[#3DFF6F] font-bold text-white transition-all shadow-inner"
                      value={formData.floors}
                      onChange={(e) => setFormData(p => ({ ...p, floors: e.target.value }))}
                      placeholder="VD: 2"
                    />
                  </div>
                  <div className="space-y-3">
                    <label className="text-[10px] font-black text-[#3DFF6F] uppercase tracking-[0.2em] ml-2">Chừa sân trước (m)</label>
                    <input
                      type="number"
                      min="0"
                      step="0.5"
                      className="w-full px-6 py-4 bg-[#0E1F16] border border-white/10 rounded-2xl focus:ring-2 focus:ring-[#3DFF6F] focus:border-[#3DFF6F] font-bold text-white transition-all shadow-inner"
                      value={formData.frontYardLength}
                      onChange={(e) => setFormData(p => ({ ...p, frontYardLength: e.target.value }))}
                      placeholder="VD: 3"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1">
                  <div className="space-y-3">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] ml-2">Tổng diện tích dự kiến</label>
                    <div className="w-full px-6 py-4 bg-[#0E1F16]/50 border border-white/5 rounded-2xl font-black text-[#3DFF6F] flex items-center justify-between shadow-inner">
                      <span>{!isNaN(calculatedArea) ? calculatedArea : 0}</span>
                      <span className="text-[10px] opacity-50 uppercase tracking-widest">m2 đất trống</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-6 bg-[#0E1F16] p-8 rounded-[2rem] border border-white/5 shadow-inner">
                  <div className="flex justify-between items-end">
                    <label className="text-[10px] font-black text-[#3DFF6F] uppercase tracking-[0.2em]">Ngân sách</label>
                    <div className="text-right">
                      <span className="text-4xl font-black text-white leading-none">{formData.budget}</span>
                      <span className="text-xl font-black text-[#3DFF6F] ml-2">Tỷ VNĐ</span>
                    </div>
                  </div>
                  <div className="relative pt-2">
                    <input
                      type="range"
                      min="0.5"
                      max="10.0"
                      step="0.1"
                      value={formData.budget}
                      onChange={(e) => setFormData(p => ({ ...p, budget: e.target.value }))}
                      className="w-full h-2 bg-white/10 rounded-lg appearance-none cursor-pointer accent-[#3DFF6F] hover:accent-[#6BFF9C] transition-all"
                    />
                  </div>
                  <div className="flex justify-between text-[10px] font-black text-slate-600 uppercase tracking-widest px-1">
                    <span>500 Tr</span>
                    <span>5 Tỷ</span>
                    <span>10 Tỷ+</span>
                  </div>
                </div>
              </div>
            </div>

            <button
              onClick={handleGenerate}
              disabled={isLoading}
              className="mt-12 w-full bg-[#3DFF6F] hover:bg-[#6BFF9C] text-black font-black py-6 px-10 rounded-[2rem] transition-all shadow-[0_0_30px_rgba(61,255,111,0.3)] flex items-center justify-center gap-4 text-xl group active:scale-[0.98]"
            >
              {isLoading ? 'Đang thực hiện quy trình...' : (
                <>
                  {suggestions.length > 0 ? 'THIẾT KẾ LẠI PHƯƠNG ÁN MỚI' : 'KHỞI TẠO KIẾN TRÚC'}
                  <svg className="w-6 h-6 group-hover:translate-x-2 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </>
              )}
            </button>
          </div>

          <div className="flex flex-col gap-8">
            <div className="bg-[#162C21] rounded-[3rem] p-12 text-white shadow-2xl relative overflow-hidden flex-grow flex flex-col justify-center border border-white/5">
              <div className="relative z-10">
                <h3 className="text-4xl font-black mb-8 leading-tight tracking-tight">AI Phân Tích <br/><span className="text-[#3DFF6F] neon-text-glow">Khoảng Lùi Sân.</span></h3>
                <p className="text-slate-400 mb-12 text-lg leading-relaxed font-medium">
                  {`Với khoảng lùi sân trước ${formData.frontYardLength}m trên mảnh đất ${formData.landWidth}x${formData.landLength}m, AI sẽ đề xuất giải pháp bố trí nhà ${formData.floors} tầng với khoảng sân vườn trước nhà rộng thoáng, tối ưu công năng.`}
                </p>
                <div className="grid grid-cols-1 gap-8">
                  {[
                    { t: 'Đúng khoảng lùi sân', d: 'Xác định vị trí móng nhà chính xác sau khoảng sân bạn yêu cầu.' },
                    { t: 'Tỷ lệ vàng kiến trúc', d: 'Cân đối chiều cao tầng và khối nhà dựa trên diện tích đất còn lại.' },
                    { t: 'Phối cảnh 3D thật', d: 'Dựng phối cảnh từ chính góc chụp ảnh hiện trạng của bạn.' }
                  ].map((item, i) => (
                    <div key={i} className="flex gap-6 items-start">
                      <div className="bg-[#3DFF6F]/10 p-3 rounded-2xl h-fit border border-[#3DFF6F]/20">
                        <svg className="w-6 h-6 text-[#3DFF6F]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                      <div>
                        <h4 className="font-black text-white text-xl mb-1">{item.t}</h4>
                        <p className="text-sm text-slate-500 font-medium leading-relaxed">{item.d}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-[#3DFF6F]/5 blur-[120px] -mr-64 -mt-64 rounded-full"></div>
            </div>
          </div>
        </section>

        {/* Phần Kết quả */}
        {suggestions.length > 0 && (
          <section id="results-section" className="scroll-mt-24 mb-32 animate-in fade-in slide-in-from-bottom-20 duration-1000">
            <div className="flex flex-col md:flex-row md:items-end justify-between mb-16 gap-8">
              <div>
                <h2 className="text-5xl font-black text-white mb-6 tracking-tight neon-text-glow">Bản vẽ thiết kế</h2>
                <p className="text-slate-400 text-xl font-medium">
                  {`Hoàn tất 3 phương án cho nhà ${formData.floors} tầng, sân trước ${formData.frontYardLength}m trên đất ${formData.landWidth}x${formData.landLength}m.`}
                </p>
              </div>
              <div className="flex gap-4">
                 <button 
                   onClick={handleReset}
                   className="bg-white/5 text-white border border-white/10 px-8 py-4 rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-[#3DFF6F] hover:text-black hover:border-[#3DFF6F] transition-all shadow-lg flex items-center gap-3"
                 >
                   <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 15l-3-3m0 0l3-3m-3 3h8M3 12a9 9 0 1118 0 9 9 0 01-18 0z" /></svg>
                   Quay về trang chủ
                 </button>
              </div>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-10">
              {suggestions.map((s, idx) => (
                <div 
                  key={s.id} 
                  className={`group bg-[#162C21] rounded-[3rem] overflow-hidden shadow-2xl border-4 transition-all duration-700 hover:-translate-y-4 ${selectedDesign?.id === s.id ? 'border-[#3DFF6F] scale-[1.05]' : 'border-white/5 hover:border-[#3DFF6F]/30'}`}
                  onClick={() => setSelectedDesign(s)}
                >
                  <div className="aspect-[4/3] relative overflow-hidden">
                    <img src={s.imageUrl} alt={s.title} className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110" />
                    <div className="absolute top-6 left-6 flex flex-col gap-2">
                       <div className="bg-[#3DFF6F] text-black px-4 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-xl">Phương án {idx + 1}</div>
                       <div className="bg-black/80 backdrop-blur px-4 py-1.5 rounded-xl text-[10px] font-black text-white uppercase tracking-widest shadow-md border border-white/10">{s.estimatedCost}</div>
                    </div>
                  </div>
                  <div className="p-10 text-center">
                    <h3 className="text-2xl font-black text-white mb-4 tracking-tight">{s.title}</h3>
                    <p className="text-slate-500 text-lg mb-8 leading-relaxed line-clamp-2 italic font-medium">
                      {`"${s.description.split('.')[0]}."`}
                    </p>
                    <div className="flex flex-col gap-3 mt-6">
                      <button 
                        className={`w-full font-black py-4 rounded-[1.25rem] transition-all border ${selectedDesign?.id === s.id ? 'bg-[#3DFF6F] text-black border-[#3DFF6F]' : 'bg-[#3DFF6F]/10 text-[#3DFF6F] border-[#3DFF6F]/20 hover:bg-[#3DFF6F] hover:text-black'}`}
                      >
                        {selectedDesign?.id === s.id ? 'ĐANG CHỌN' : 'CHỌN THIẾT KẾ'}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Phần Biên tập */}
        {selectedDesign && (
          <section className="max-w-7xl mx-auto mb-32 animate-in slide-in-from-bottom-12 duration-1000">
            <div className="bg-[#162C21] rounded-[4rem] p-4 shadow-[0_0_100px_rgba(0,0,0,0.4)] border border-white/5 overflow-hidden">
               <div className="grid lg:grid-cols-5 items-stretch">
                  <div className="lg:col-span-3 p-10">
                    <div className="flex items-center justify-between mb-10">
                       <h2 className="text-4xl font-black text-white tracking-tight neon-text-glow">Tùy biến bản vẽ</h2>
                    </div>
                    <div className="relative rounded-[3rem] overflow-hidden aspect-video shadow-2xl bg-black border border-white/10 group">
                       <img src={selectedDesign.imageUrl} alt="Chi tiết" className="w-full h-full object-cover" />
                       {isEditing && (
                        <div className="absolute inset-0 bg-[#0E1F16]/80 backdrop-blur-2xl flex items-center justify-center">
                          <div className="bg-[#162C21] p-10 rounded-[2.5rem] shadow-[0_0_50px_rgba(61,255,111,0.2)] flex items-center gap-6 border border-[#3DFF6F]/30">
                            <div className="w-12 h-12 border-4 border-[#3DFF6F]/10 border-t-[#3DFF6F] rounded-full animate-spin"></div>
                            <span className="font-black text-2xl text-white neon-text-glow">Đang xử lý yêu cầu...</span>
                          </div>
                        </div>
                       )}
                    </div>
                  </div>
                  
                  <div className="lg:col-span-2 bg-[#0E1F16]/30 p-12 flex flex-col justify-center border-l border-white/5">
                    <h3 className="text-3xl font-black text-white mb-4 tracking-tight">Lệnh thiết kế</h3>
                    <p className="text-slate-500 mb-8 text-lg font-medium leading-relaxed">Nhập mô tả chi tiết để AI tinh chỉnh kiến trúc ngôi nhà theo ý bạn.</p>
                    
                    <div className="space-y-6">
                       <div className="space-y-4">
                          <label className="text-[10px] font-black text-[#3DFF6F] uppercase tracking-[0.3em] ml-2">Yêu cầu thay đổi</label>
                          <textarea
                            className="w-full px-8 py-6 bg-black/40 border-2 border-white/5 rounded-[2.5rem] focus:ring-4 focus:ring-[#3DFF6F]/20 focus:border-[#3DFF6F] h-40 resize-none text-white font-bold text-lg placeholder:text-slate-700 shadow-inner transition-all outline-none"
                            placeholder="Ví dụ: Đổi màu sơn tầng 2 sang màu xám đậm, thêm hệ thống đèn led dọc ban công..."
                            value={editPrompt}
                            onChange={(e) => setEditPrompt(e.target.value)}
                          ></textarea>
                       </div>

                       <div className="flex flex-col gap-4">
                         <button
                           onClick={handleEditDesign}
                           disabled={isEditing || !editPrompt.trim()}
                           className="w-full bg-[#3DFF6F] text-black font-black py-6 rounded-[2rem] hover:bg-[#6BFF9C] transition-all shadow-[0_0_40px_rgba(61,255,111,0.3)] disabled:opacity-10 disabled:cursor-not-allowed text-xl uppercase tracking-widest active:scale-95"
                         >
                           CẬP NHẬT KIẾN TRÚC
                         </button>
                         <button
                           onClick={handleJoinZalo}
                           className="w-full bg-[#3DFF6F]/20 text-[#3DFF6F] font-black py-5 rounded-[2rem] hover:bg-[#3DFF6F] hover:text-black transition-all border border-[#3DFF6F]/30 flex items-center justify-center gap-3 tracking-widest uppercase text-sm shadow-[0_10px_30px_rgba(61,255,111,0.1)]"
                         >
                           <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                           NHẬN BẢN VẼ CHI TIẾT
                         </button>
                         <button
                           onClick={handleContactArchitect}
                           className="w-full bg-white/5 text-white font-black py-4 rounded-[2rem] hover:bg-white/10 transition-all border border-white/10 flex items-center justify-center gap-3 tracking-widest uppercase text-[10px] opacity-60"
                         >
                           GỌI KTS TƯ VẤN TRỰC TIẾP
                         </button>
                       </div>
                    </div>
                  </div>
               </div>
            </div>
          </section>
        )}

        {/* Phần CTA Zalo Mới */}
        <section className="mb-32">
          <div className="bg-gradient-to-br from-[#162C21] to-[#0E1F16] rounded-[4rem] p-16 border border-white/5 shadow-2xl relative overflow-hidden text-center">
            <div className="relative z-10 max-w-3xl mx-auto">
              <div className="w-24 h-24 bg-[#0068FF] rounded-3xl mx-auto mb-10 flex items-center justify-center shadow-[0_20px_40px_rgba(0,104,255,0.3)] rotate-12 hover:rotate-0 transition-transform duration-500">
                <svg className="w-12 h-12 text-white" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2C6.477 2 2 5.918 2 10.75c0 2.82 1.554 5.318 3.96 6.944l-.367 1.833a.75.75 0 001.06.848l2.257-1.128c.983.315 2.03.486 3.09.486 5.523 0 10-3.918 10-8.75S17.523 2 12 2z"/>
                </svg>
              </div>
              <h2 className="text-5xl font-black text-white mb-6 tracking-tight">Tham Gia Cộng Đồng <br/><span className="text-[#3DFF6F] neon-text-glow">Sdarchi Zalo.</span></h2>
              <p className="text-slate-400 text-xl mb-12 font-medium leading-relaxed">
                Đừng bỏ lỡ các ưu đãi xây dựng, bản vẽ kỹ thuật chi tiết và tư vấn 1-1 miễn phí từ đội ngũ kiến trúc sư chuyên nghiệp của chúng tôi.
              </p>
              <button 
                onClick={handleJoinZalo}
                className="bg-[#0068FF] hover:bg-[#0052cc] text-white font-black py-6 px-16 rounded-[2.5rem] text-xl transition-all shadow-[0_20px_50px_rgba(0,104,255,0.4)] flex items-center gap-4 mx-auto group"
              >
                VÀO NHÓM ZALO TƯ VẤN
                <svg className="w-6 h-6 group-hover:translate-x-2 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
              </button>
            </div>
            {/* Trang trí nền */}
            <div className="absolute -top-20 -left-20 w-80 h-80 bg-[#3DFF6F]/5 blur-[100px] rounded-full"></div>
            <div className="absolute -bottom-20 -right-20 w-80 h-80 bg-[#0068FF]/10 blur-[100px] rounded-full"></div>
          </div>
        </section>
      </main>

      <footer className="bg-[#0E1F16] border-t border-white/5 pt-24 pb-16 text-center">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center justify-center gap-4 mb-10">
            <span className="text-3xl font-black text-white tracking-tight">Sdarchi <span className="text-[#3DFF6F]">AI</span></span>
          </div>
          <p className="text-slate-600 text-base font-bold uppercase tracking-[0.4em] mb-12">
            Nền tảng kiến trúc số tương lai
          </p>
          <div className="flex justify-center gap-12 text-[10px] font-black text-slate-700 uppercase tracking-widest border-t border-white/5 pt-12">
            <span className="hover:text-[#3DFF6F] cursor-pointer transition-colors" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>Thiết kế AI</span>
            <span className="hover:text-[#3DFF6F] cursor-pointer transition-colors" onClick={handleJoinZalo}>Nhóm Zalo</span>
            <span className="hover:text-[#3DFF6F] cursor-pointer transition-colors" onClick={handleReset}>Bắt đầu lại</span>
          </div>
          <p className="text-slate-800 text-[10px] font-bold mt-16 opacity-50">
            &copy; {new Date().getFullYear()} Sdarchi AI. Crafted with Artificial Intelligence.
          </p>
        </div>
      </footer>

      {isLoading && <LoadingOverlay message={loadingMessage} />}
    </div>
  );
};

export default App;
