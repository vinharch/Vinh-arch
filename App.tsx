
import React, { useState, useCallback, useRef, useEffect } from 'react';
import type { SourceImage, HistoryItem } from './types';
import { generateImages, editImage } from './services/geminiService';
import { Icon } from './components/icons';
import { ImageEditor } from './components/ImageEditor';

type AspectRatio = '1:1' | '4:3' | '3:4' | '16:9' | '9:16';

const WelcomeScreen: React.FC<{ onStart: () => void }> = ({ onStart }) => (
  <div 
    className="min-h-screen w-full flex items-center justify-center bg-cover bg-center" 
    style={{ backgroundImage: "url('https://images.unsplash.com/photo-1534447677768-be436a0979f9?q=80&w=2070&auto=format&fit=crop')" }}
  >
    <div className="absolute inset-0 bg-black/60 backdrop-blur-sm"></div>
    <div className="relative z-10 text-center p-8 flex flex-col items-center">
      <img
        src="https://raw.githubusercontent.com/Khanhltvpp1a/Media/refs/heads/main/pictureaiapp/AIAI%20Logo-02.jpg"
        alt="AIcomplex Logo"
        className="w-32 h-auto rounded-xl shadow-lg mb-6"
      />
      <h1 className="text-5xl sm:text-7xl font-bold tracking-wide text-slate-100 mb-4" style={{ textShadow: '0 0 25px rgba(255, 255, 255, 0.4)' }}>
        AIcomplex
      </h1>
      <p className="text-slate-300 text-lg mb-10 max-w-2xl">
        Ứng dụng AI trong thiết kế kiến trúc và nội thất. Biến ý tưởng của bạn thành hiện thực với sức mạnh của trí tuệ nhân tạo.
      </p>
      <button
        onClick={onStart}
        className="bg-orange-600 hover:bg-orange-700 text-white font-bold py-4 px-10 rounded-lg text-xl transition-all duration-300 transform hover:scale-105 shadow-lg shadow-orange-500/30"
      >
        Bắt đầu
      </button>
    </div>
  </div>
);


const Header: React.FC = () => (
  <header className="flex flex-col items-center mb-8 text-center">
    <h1 className="text-4xl sm:text-5xl font-bold tracking-wide text-slate-100" style={{ textShadow: '0 0 20px rgba(99, 102, 241, 0.5), 0 0 5px rgba(255, 255, 255, 0.5)' }}>
      AIcomplex
    </h1>
    <p className="text-slate-400 mt-2 text-sm">Phát triển bởi AIAI Studio</p>
    <p className="text-slate-400 text-sm">Đồng hành bảo trợ phát triển VietCG - MComplex - Nhà To</p>
    <p className="text-slate-400 text-sm">
      Nhóm Zalo hỗ trợ: <a href="https://zalo.me/g/ffqfuu544" target="_blank" rel="noopener noreferrer" className="text-orange-400 hover:underline">https://zalo.me/g/ffqfuu544</a>
    </p>
  </header>
);

const Tab: React.FC<{ label: string; active: boolean; onClick: () => void; disabled?: boolean }> = ({ label, active, onClick, disabled }) => (
  <button
    onClick={onClick}
    disabled={disabled}
    className={`px-4 py-3 text-sm font-medium transition-colors relative ${
      active ? 'text-orange-400' : 'text-slate-400 hover:text-slate-200'
    } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
  >
    {label}
    {active && <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-orange-500 rounded-full"></span>}
  </button>
);

const ImageDropzone: React.FC<{ onImageUpload: (image: SourceImage) => void, children: React.ReactNode, className?: string }> = ({ onImageUpload, children, className }) => {
    const [isDraggingOver, setIsDraggingOver] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const processFile = (file: File) => {
      if (file && file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = (e) => {
          const base64 = (e.target?.result as string).split(',')[1];
          if (base64) {
            onImageUpload({ base64, mimeType: file.type });
          }
        };
        reader.readAsDataURL(file);
      } else {
        alert("Please upload a valid image file (PNG, JPG, WEBP).");
      }
    };

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) processFile(file);
    };
    
    const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
        event.preventDefault();
        setIsDraggingOver(true);
    };

    const handleDragLeave = (event: React.DragEvent<HTMLDivElement>) => {
        event.preventDefault();
        setIsDraggingOver(false);
    };

    const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
        event.preventDefault();
        setIsDraggingOver(false);
        const file = event.dataTransfer.files?.[0];
        if (file) processFile(file);
    };
    
    return (
        <>
            <div
                onClick={() => fileInputRef.current?.click()}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                className={`${className} ${isDraggingOver ? 'border-orange-500 bg-slate-700/50' : ''}`}
            >
                {children}
            </div>
            <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept="image/png, image/jpeg, image/webp" />
        </>
    );
};

const sourceImageToDataUrl = (image: SourceImage): string => {
    return `data:${image.mimeType};base64,${image.base64}`;
}

const AspectRatioSelector: React.FC<{
  value: AspectRatio;
  onChange: (value: AspectRatio) => void;
  disabled: boolean;
}> = ({ value, onChange, disabled }) => {
  const ratios: { value: AspectRatio; label: string; icon: React.ReactElement }[] = [
    { value: '4:3', label: '4:3', icon: <div className="w-8 h-6 border-2 rounded-sm border-current"></div> },
    { value: '3:4', label: '3:4', icon: <div className="w-6 h-8 border-2 rounded-sm border-current"></div> },
    { value: '16:9', label: '16:9', icon: <div className="w-10 h-[22.5px] border-2 rounded-sm border-current"></div> },
    { value: '9:16', label: '9:16', icon: <div className="w-[22.5px] h-10 border-2 rounded-sm border-current"></div> },
    { value: '1:1', label: '1:1', icon: <div className="w-7 h-7 border-2 rounded-sm border-current"></div> },
  ];

  return (
    <div className={`${disabled ? 'opacity-60' : ''}`}>
      <div className="flex items-center justify-around gap-2" role="group" aria-label="Aspect Ratio">
        {ratios.map(ratio => (
          <button
            key={ratio.value}
            type="button"
            onClick={() => onChange(ratio.value)}
            disabled={disabled}
            title={ratio.label}
            aria-pressed={value === ratio.value}
            className={`flex flex-col items-center justify-center gap-1.5 p-2 rounded-md transition-colors w-full h-16 ${
              value === ratio.value ? 'bg-orange-600/30 text-orange-400' : 'bg-slate-900/70 hover:bg-slate-700 text-slate-400'
            } ${disabled ? 'cursor-not-allowed' : ''}`}
          >
            {ratio.icon}
            <span className="text-xs font-medium">{ratio.label}</span>
          </button>
        ))}
      </div>
      {disabled && <p className="text-xs text-slate-500 mt-2 text-center">Tỷ lệ chỉ áp dụng khi tạo ảnh từ văn bản (không có ảnh nguồn).</p>}
    </div>
  );
};

export default function App() {
  const [isAppStarted, setIsAppStarted] = useState(false);
  const [activeTab, setActiveTab] = useState<'create' | 'cameraAngle' | 'edit' | 'planTo3d'>('create');
  const [sourceImage, setSourceImage] = useState<SourceImage | null>(null);
  const [referenceImage, setReferenceImage] = useState<SourceImage | null>(null);
  const [maskImage, setMaskImage] = useState<SourceImage | null>(null);
  const [prompt, setPrompt] = useState('Ảnh chụp thực tế ngôi nhà');
  const [imageCount, setImageCount] = useState(4);
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>('4:3');
  const [generatedImages, setGeneratedImages] = useState<string[]>([]);
  const [lastUsedPrompt, setLastUsedPrompt] = useState('');
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [isEditingMask, setIsEditingMask] = useState(false);
  const [brushSize, setBrushSize] = useState(3);
  const editorRef = useRef<{ clear: () => void }>(null);


  // Load history from localStorage on initial render
  useEffect(() => {
    try {
      const savedHistory = localStorage.getItem('aiai-studio-history');
      if (savedHistory) {
        setHistory(JSON.parse(savedHistory));
      }
    } catch (error) {
      console.error("Failed to load history from localStorage:", error);
      // If parsing fails, clear the corrupted data
      localStorage.removeItem('aiai-studio-history');
    }
  }, []);

  // Save history to localStorage whenever it changes, with quota handling
  useEffect(() => {
    if (history.length === 0) {
        // Ensure storage is cleared if history is empty
        try {
            localStorage.removeItem('aiai-studio-history');
        } catch (error) {
            console.error("Failed to clear history from localStorage:", error);
        }
        return;
    }

    let historyToSave = [...history]; // Make a mutable copy

    const save = () => {
        try {
            localStorage.setItem('aiai-studio-history', JSON.stringify(historyToSave));
            // Successfully saved
        } catch (error) {
            if (error instanceof DOMException && (error.name === 'QuotaExceededError' || error.code === 22)) {
                if (historyToSave.length > 1) {
                    console.warn("LocalStorage quota exceeded. Pruning oldest history item and retrying.");
                    // Remove the oldest item (which is at the end of the array due to how items are added)
                    historyToSave.pop(); 
                    save(); // Retry saving with the smaller array
                } else {
                    console.error("Could not save history. The single remaining item is too large for localStorage.", historyToSave[0]);
                    // Clear storage to prevent a locked state with old, large data
                    localStorage.removeItem('aiai-studio-history');
                }
            } else {
                console.error("Failed to save history to localStorage:", error);
            }
        }
    };

    save();
  }, [history]);
  
  useEffect(() => {
    if (generatedImages.length > 0 && !selectedImage) {
      setSelectedImage(generatedImages[0]);
    }
  }, [generatedImages, selectedImage]);
  
  useEffect(() => {
      // Exit mask editing mode if user switches tab or removes source image
      if (activeTab !== 'edit' || !sourceImage) {
          setIsEditingMask(false);
      }
  }, [activeTab, sourceImage]);

  // Default to mask editing mode when possible
  useEffect(() => {
    if (activeTab === 'edit' && sourceImage) {
      setIsEditingMask(true);
    }
  }, [activeTab, sourceImage]);

  const stylePrompts = [
    "phong cách hiện đại",
    "phong cách tối giản",
    "phong cách neoclassic",
    "phong cách Indochine",
    "phong cách công nghiệp",
    "phong cách Scandinavian",
  ];

  const contextPrompts = [
    "ở đường phố việt nam",
    "ở vùng làng quê việt nam",
    "ở khu đô thị sang trọng, hiện đại vinhomes hà nội",
    "ở ngã ba đường phố việt nam",
    "ở sân vườn nhiệt đới tại miền quê việt nam",
    "nằm bên đường nhựa với 2 bên cạnh nhà là cây xanh",
  ];

  const lightingPrompts = [
      "Ánh sáng ban ngày tự nhiên, trời trong xanh",
      "Ánh sáng hoàng hôn ấm áp, đổ bóng dài",
      "Ánh sáng ban đêm, ánh trăng chiếu sáng toàn cảnh, nhấn mạnh đèn nội thất và ngoại thất",
      "Trời u ám, ánh sáng dịu, không có bóng gắt",
      "bình minh với ánh sáng trong trẻo và không khí yên bình.",
      "buổi hoàng hôn tím với ánh sáng đèn nội thất hắt ra lung linh",
      "sương mù dày đặc vào sáng sớm tạo cảm giác huyền ảo.",
      "trời vừa mưa xong đường hơi ướt, bầu trời mây nhẹ",
  ];

  const cameraAnglePrompts = [
    { display: "Chụp từ trên cao xuống", value: "Chụp từ trên cao xuống (high-angle shot)"},
    { display: "Góc thấp (cảm giác hùng vĩ)", value: "Góc thấp từ dưới nhìn lên, tạo cảm giác công trình cao lớn, hùng vĩ (low-angle shot)"},
    { display: "Góc nhìn 3/4 từ bên trái", value: "Góc nhìn 3/4 từ bên trái, thể hiện chiều sâu , giữ nguyên bối cảnh đường phố Việt Nam, nhà hàng xóm và bầu trời xanh."},
    { display: "Chụp toàn cảnh từ xa", value: "Chụp toàn cảnh từ xa (wide long shot), thấy toàn cảnh xung quanh"},
    { display: "Chụp cận cảnh chi tiết", value: "Chụp cận cảnh chi tiết (detailed close-up shot)"},
    { display: "Góc nhìn 3/4 từ bên phải", value: "Góc nhìn 3/4 từ bên phải, thể hiện chiều sâu , giữ nguyên bối cảnh đường phố Việt Nam, nhà hàng xóm và bầu trời xanh."},
    { display: "Góc chụp chính diện, đối xứng", value: "góc chụp chính diện mặt tiền công trình, góc nhìn thẳng, đối xứng"},
  ];

  const interiorCameraAnglePrompts = [
    { display: "Góc 3/4 bên phải", value: "Góc chụp 3/4 bên phải, nhấn mạnh chiều sâu và trật tự không gian" },
    { display: "Góc 3/4 bên trái", value: "Góc chụp 3/4 bên trái, nhấn mạnh chiều sâu và trật tự không gian" },
    { display: "Chính diện đầu giường", value: "Góc nhìn thẳng chính diện đầu giường, bố cục đối xứng" },
    { display: "Từ giường nhìn ra TV", value: "Góc chụp từ trên giường nhìn về phía kệ tivi" },
    { display: "Từ trên cao (toàn cảnh)", value: "góc chụp từ trên cao thấy toàn bộ phòng" },
    { display: "Cận cảnh decor", value: "góc chụp cận cảnh chi tiết đồ decor" },
    { display: "Chính diện kệ TV", value: "góc chụp chính diện mặt đứng kệ tv" },
    { display: "Chính diện sofa", value: "góc chụp chính diện mặt đứng sofa" },
    { display: "xoay góc 45 độ", value: "Interior view at a 45-degree oblique angle" },
  ];

  const planStylePrompts = [
    "phong cách hiện đại, tông màu trắng và gỗ",
    "phong cách tối giản (minimalist), nội thất thông minh",
    "phong cách scandinavian, ánh sáng tự nhiên",
    "phong cách sang trọng (luxury), vật liệu cao cấp như đá marble, kim loại mạ vàng",
    "phong cách Indochine, kết hợp truyền thống và hiện đại",
  ];

  const planRoomTypePrompts = [
    "phòng ngủ",
    "phòng khách",
    "phòng bếp",
    "phòng ăn",
    "phòng tắm",
  ];

  const handleSourceImageUpload = (image: SourceImage) => {
    setSourceImage(image);
    setMaskImage(null);
    if(editorRef.current) {
        editorRef.current.clear();
    }

    if (activeTab === 'create') {
        setPrompt('Ảnh chụp thực tế ngôi nhà');
    } else if (activeTab === 'cameraAngle') {
        setPrompt('');
    } else if (activeTab === 'edit') {
        setPrompt('');
        const dataUrl = sourceImageToDataUrl(image);
        // Display the uploaded image in the main viewer on the right
        setGeneratedImages([dataUrl]);
        setSelectedImage(dataUrl);
    } else if (activeTab === 'planTo3d') {
        setPrompt('Tạo ảnh render 3D nội thất từ bản vẽ 2D này, góc nhìn eye-level, chân thực');
        const dataUrl = sourceImageToDataUrl(image);
        // Display the uploaded image in the main viewer on the right
        setGeneratedImages([dataUrl]);
        setSelectedImage(dataUrl);
    }
  };
  
  const handleTabChange = (tab: 'create' | 'cameraAngle' | 'edit' | 'planTo3d') => {
      setActiveTab(tab);
      // Reset prompt based on new tab
      if (tab === 'create') {
          setPrompt('Ảnh chụp thực tế ngôi nhà');
      } else if (tab === 'cameraAngle') {
          setPrompt('');
      } else if (tab === 'edit') {
          setPrompt('');
      } else if (tab === 'planTo3d') {
        setPrompt('Tạo ảnh render 3D nội thất từ bản vẽ 2D này, góc nhìn eye-level, chân thực');
      }
      setReferenceImage(null);
      setMaskImage(null);
  };

  const handleGeneration = useCallback(async () => {
    if (!sourceImage && (activeTab === 'cameraAngle' || activeTab === 'edit' || activeTab === 'planTo3d')) {
      alert("Vui lòng tải lên ảnh nguồn.");
      return;
    }
    if (!prompt) {
      alert("Vui lòng nhập mô tả (prompt).");
      return;
    }
    if (activeTab === 'edit' && !maskImage) {
        alert("Vui lòng vẽ một vùng chọn trên ảnh để chỉnh sửa.");
        return;
    }

    setIsLoading(true);
    setIsEditingMask(false); // Exit editing mode on generation start
    setGeneratedImages([]);
    setSelectedImage(null);
    
    setLastUsedPrompt(prompt); // Store the user-facing prompt

    try {
      let images: string[] = [];
      let finalReferenceImage = (activeTab === 'create' || activeTab === 'planTo3d') ? referenceImage : null;
      let finalPrompt = prompt;

      if (activeTab === 'create') {
        images = await generateImages(sourceImage, finalPrompt, imageCount, finalReferenceImage, aspectRatio);
      } else if (activeTab === 'cameraAngle' && sourceImage) {
        finalPrompt = `Render the building from the provided image with a new camera angle. The desired angle is: "${prompt}". The final image should be a realistic architectural photo.`;
        images = await generateImages(sourceImage, finalPrompt, imageCount, null, aspectRatio);
      } else if (activeTab === 'planTo3d' && sourceImage) {
        const engineeredPrompt = `Bạn là một kiến trúc sư AI chuyên nghiệp, chuyên chuyển đổi các bản vẽ mặt bằng 2D thành các ảnh render nội thất 3D siêu thực.
        Người dùng đã cung cấp một hình ảnh mặt bằng 2D.

        **Nhiệm vụ của bạn**:
        1.  **Phân tích Bản vẽ**: Dựa vào hình ảnh mặt bằng, phân tích bố cục, kích thước phòng, vị trí đồ nội thất, cửa sổ và cửa ra vào.
        2.  **Áp dụng Phong cách**: Yêu cầu của người dùng là: "${prompt}". Mô tả này quyết định phong cách, không khí, vật liệu và thẩm mỹ tổng thể.
        3.  **Sử dụng Ảnh tham chiếu (nếu có)**: Nếu có ảnh thứ hai, đó là ảnh tham chiếu phong cách. Bạn PHẢI lấy cảm hứng từ ảnh này cho bảng màu, kết cấu vật liệu, và kiểu chiếu sáng. KHÔNG sao chép bố cục từ ảnh tham chiếu, chỉ sử dụng cho thẩm mỹ.

        Hãy chọn một góc nhìn ngang tầm mắt (eye-level) thú vị và hấp dẫn để thể hiện không gian một cách tốt nhất.
        Đầu ra cuối cùng phải là một ảnh render nội thất 3D chất lượng cao, tuân thủ chính xác các yêu cầu.`;
        images = await generateImages(sourceImage, engineeredPrompt, imageCount, finalReferenceImage);
      } else if (activeTab === 'edit' && sourceImage && maskImage) {
        images = await editImage(sourceImage, maskImage, finalPrompt, imageCount);
      }

      setGeneratedImages(images);
      if (images.length > 0) {
        setSelectedImage(images[0]);
        // Add to history
        const newHistoryItem: HistoryItem = {
            id: Date.now().toString(),
            sourceImage,
            referenceImage: finalReferenceImage,
            prompt: prompt, // Save the original prompt for clarity
            imageCount,
            generatedImages: images,
            aspectRatio,
        };
        setHistory(prev => [newHistoryItem, ...prev].slice(0, 10));
      }
    } catch (error) {
      console.error("Image generation failed:", error);
      alert("Đã xảy ra lỗi khi tạo ảnh. Vui lòng kiểm tra API key và thử lại.");
    } finally {
      setIsLoading(false);
    }
  }, [sourceImage, referenceImage, maskImage, prompt, imageCount, activeTab, aspectRatio]);

  const handlePastePrompt = async () => {
      try {
          const text = await navigator.clipboard.readText();
          setPrompt(p => p ? `${p} ${text}` : text);
      } catch (err) {
          console.error('Failed to read clipboard contents: ', err);
      }
  };

    const handleCopyPrompt = (text: string) => {
        navigator.clipboard.writeText(text).then(() => {
            // Optional: Show a success message
        }).catch(err => {
            console.error('Failed to copy text: ', err);
        });
    };
  
  const handleRandomPrompt = () => {
      const allPrompts = [...stylePrompts, ...contextPrompts, ...lightingPrompts];
      const randomPrompt = allPrompts[Math.floor(Math.random() * allPrompts.length)];
      setPrompt(randomPrompt);
  };

  const handlePromptSelect = (selectedPrompt: string, categoryPrompts: string[]) => {
    if (!selectedPrompt) {
        return;
    }
    setPrompt(currentPrompt => {
        let existingPrompt: string | null = null;
        for (const p of categoryPrompts) {
            if (currentPrompt.includes(p)) {
                existingPrompt = p;
                break;
            }
        }
        
        let newPrompt = currentPrompt;

        if (existingPrompt) {
            newPrompt = newPrompt.replace(existingPrompt, selectedPrompt);
        } else {
            if (newPrompt.trim() === '') {
                newPrompt = selectedPrompt;
            } else {
                newPrompt += `, ${selectedPrompt}`;
            }
        }
        
        return newPrompt;
    });
  };

  const handleRestoreHistory = (item: HistoryItem) => {
    setSourceImage(item.sourceImage);
    setReferenceImage(item.referenceImage);
    setPrompt(item.prompt);
    setLastUsedPrompt(item.prompt);
    setImageCount(item.imageCount);
    setGeneratedImages(item.generatedImages);
    setSelectedImage(item.generatedImages[0] || null);
    setAspectRatio(item.aspectRatio || '4:3');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleClearHistory = () => {
    if (window.confirm("Bạn có chắc muốn xóa toàn bộ lịch sử không?")) {
        setHistory([]);
    }
  };

  const handleSetAsSourceImage = () => {
    if (!selectedImage) return;

    const [header, base64Data] = selectedImage.split(',');
    if (!header || !base64Data) {
        console.error("Invalid data URL format for selected image.");
        return;
    }

    const mimeTypeMatch = header.match(/:(.*?);/);
    if (!mimeTypeMatch || !mimeTypeMatch[1]) {
        console.error("Could not extract mimeType from data URL.");
        return;
    }
    
    const mimeType = mimeTypeMatch[1];
    
    const newSourceImage: SourceImage = {
        base64: base64Data,
        mimeType: mimeType
    };

    setSourceImage(newSourceImage);
    setGeneratedImages([]);
    setSelectedImage(null);
    setReferenceImage(null);
    setPrompt('Ảnh chụp thực tế ngôi nhà');
    
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleStartEditing = () => {
    if (!selectedImage) return;

    // 1. Convert data URL to SourceImage
    const [header, base64Data] = selectedImage.split(',');
    if (!header || !base64Data) {
      console.error("Invalid data URL format for selected image.");
      return;
    }
    const mimeTypeMatch = header.match(/:(.*?);/);
    if (!mimeTypeMatch?.[1]) {
      console.error("Could not extract mimeType from data URL.");
      return;
    }
    const mimeType = mimeTypeMatch[1];
    const newSourceForEditing: SourceImage = {
      base64: base64Data,
      mimeType: mimeType
    };

    // 2. Change tab and set the new source image
    setActiveTab('edit');
    setSourceImage(newSourceForEditing);
    
    // 3. Make the image appear in the editor view on the right
    setGeneratedImages([selectedImage]);
    setSelectedImage(selectedImage);

    // 4. Reset other state
    setReferenceImage(null);
    setMaskImage(null);
    setPrompt('');
    if (editorRef.current) {
        editorRef.current.clear();
    }
    
    // 5. Scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (!isAppStarted) {
    return <WelcomeScreen onStart={() => setIsAppStarted(true)} />;
  }
  
  return (
    <div className="min-h-screen p-4 md:p-6 lg:p-8">
      <Header />
      <main className="grid grid-cols-1 lg:grid-cols-12 gap-6 max-w-[1800px] mx-auto">
        {/* Left Control Panel */}
        <div className="lg:col-span-4 xl:col-span-3 bg-[#1e293b] p-5 rounded-xl flex flex-col gap-5 h-max shadow-2xl shadow-black/30 border border-slate-700/50">
          <div className="flex border-b border-slate-700">
            <Tab label="Tạo Ảnh" active={activeTab === 'create'} onClick={() => handleTabChange('create')} />
            <Tab label="Góc camera" active={activeTab === 'cameraAngle'} onClick={() => handleTabChange('cameraAngle')} />
            <Tab label="Edit Ảnh" active={activeTab === 'edit'} onClick={() => handleTabChange('edit')} />
            <Tab label="Plan to 3D" active={activeTab === 'planTo3d'} onClick={() => handleTabChange('planTo3d')} />
          </div>

          {activeTab === 'create' && (
            <div className="space-y-6">
              {/* 1. Tải ảnh lên */}
              <section>
                <h3 className="font-semibold text-slate-300 mb-3">1. Tải ảnh lên (Tùy chọn)</h3>
                {sourceImage ? (
                  <div className='space-y-3'>
                      <ImageDropzone onImageUpload={handleSourceImageUpload} className="cursor-pointer rounded-lg transition-colors">
                        <div className='bg-black/30 rounded-lg p-2'>
                            <img src={`data:${sourceImage.mimeType};base64,${sourceImage.base64}`} alt="Source preview" className="w-full h-auto object-contain rounded" />
                        </div>
                      </ImageDropzone>
                      <div className='flex items-center justify-between gap-2 text-sm'>
                          <button onClick={() => setSourceImage(null)} className='text-red-400 hover:text-red-500 transition-colors px-3 py-1.5 rounded-md hover:bg-red-500/10'>Xóa</button>
                      </div>
                  </div>
                ) : (
                  <ImageDropzone onImageUpload={handleSourceImageUpload} className='w-full h-40 border-2 border-dashed border-slate-600 rounded-lg flex items-center justify-center text-center text-slate-400 text-sm cursor-pointer transition-colors'>
                      <div>
                          <p>Kéo thả, dán, hoặc click</p>
                          <p className="text-xs mt-1 text-slate-500">PNG, JPG, WEBP</p>
                      </div>
                  </ImageDropzone>
                )}
              </section>
              
              {/* 2. Ảnh tham chiếu (Style) */}
              <section>
                <h3 className="font-semibold text-slate-300 mb-2">2. Ảnh tham chiếu (Style)</h3>
                <p className="text-xs text-slate-400 mb-3">AI sẽ sử dụng ảnh tham chiếu để lấy cảm hứng về phong cách, ánh sáng, bối cảnh và vật liệu cho ảnh kết quả.</p>
                {referenceImage ? (
                  <div className="relative group">
                      <ImageDropzone onImageUpload={setReferenceImage} className="cursor-pointer rounded-md transition-colors">
                        <img src={`data:${referenceImage.mimeType};base64,${referenceImage.base64}`} alt="Reference" className="w-full h-32 object-cover rounded-md" />
                      </ImageDropzone>
                      <button onClick={() => setReferenceImage(null)} className="absolute top-1 right-1 bg-black/60 rounded-full text-white hover:bg-black/80 p-1 transition-opacity opacity-0 group-hover:opacity-100 z-10" aria-label="Remove reference image">
                          <Icon name="x-circle" className="w-5 h-5" />
                      </button>
                  </div>
                ) : (
                  <ImageDropzone onImageUpload={setReferenceImage} className='w-full h-32 border-2 border-dashed border-slate-600 rounded-lg flex items-center justify-center text-center text-slate-400 text-sm cursor-pointer transition-colors'>
                      <p>Kéo thả, dán, hoặc click</p>
                  </ImageDropzone>
                )}
              </section>
              
              {/* 3. Ghi chú (Prompt) */}
              <section>
                <div className="flex justify-between items-center mb-2">
                  <h3 className="font-semibold text-slate-300">3. Ghi chú (Prompt)</h3>
                  <div className="flex items-center gap-2">
                      <button onClick={handleRandomPrompt} title="Prompt ngẫu nhiên" className="text-slate-400 hover:text-orange-400"><Icon name="sparkles" className="w-5 h-5"/></button>
                      <button onClick={handlePastePrompt} title="Dán" className="text-slate-400 hover:text-orange-400"><Icon name="clipboard" className="w-5 h-5"/></button>
                  </div>
                </div>
                <textarea
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder="Ví dụ: một ngôi nhà hiện đại, ánh sáng ban ngày, ảnh thực tế..."
                  className="w-full bg-slate-900/70 p-3 rounded-md h-28 resize-none text-sm focus:ring-2 focus:ring-orange-500 focus:outline-none border border-slate-700"
                />
                <div className="mt-3 space-y-2">
                  <p className="text-xs text-slate-400 mb-1">Hoặc chọn prompt có sẵn để thêm vào:</p>
                  <select onChange={(e) => handlePromptSelect(e.target.value, stylePrompts)} value="" className="w-full bg-slate-900/70 p-3 rounded-md text-sm focus:ring-2 focus:ring-orange-500 focus:outline-none appearance-none border border-slate-700" style={{ background: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%2364748b' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e") right 0.5rem center/1.5em 1.5em no-repeat`}}>
                    <option value="" disabled>Phong cách</option>
                    {stylePrompts.map(p => <option key={p} value={p} className="bg-[#1e293b] text-slate-200">{p}</option>)}
                  </select>
                  <select onChange={(e) => handlePromptSelect(e.target.value, contextPrompts)} value="" className="w-full bg-slate-900/70 p-3 rounded-md text-sm focus:ring-2 focus:ring-orange-500 focus:outline-none appearance-none border border-slate-700" style={{ background: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%2364748b' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e") right 0.5rem center/1.5em 1.5em no-repeat`}}>
                    <option value="" disabled>Bối cảnh</option>
                    {contextPrompts.map(p => <option key={p} value={p} className="bg-[#1e293b] text-slate-200">{p}</option>)}
                  </select>
                  <select onChange={(e) => handlePromptSelect(e.target.value, lightingPrompts)} value="" className="w-full bg-slate-900/70 p-3 rounded-md text-sm focus:ring-2 focus:ring-orange-500 focus:outline-none appearance-none border border-slate-700" style={{ background: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%2364748b' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e") right 0.5rem center/1.5em 1.5em no-repeat`}}>
                    <option value="" disabled>Ánh sáng</option>
                    {lightingPrompts.map(p => <option key={p} value={p} className="bg-[#1e293b] text-slate-200">{p}</option>)}
                  </select>
                </div>
              </section>

              {/* 4. Số lượng ảnh */}
              <section>
                  <h3 className="font-semibold text-slate-300 mb-2">4. Số lượng ảnh</h3>
                  <div className="flex items-center justify-between bg-slate-900/70 rounded-md p-2">
                      <button onClick={() => setImageCount(c => Math.max(1, c - 1))} className="px-4 py-2 rounded text-xl font-bold hover:bg-slate-700">-</button>
                      <span className="text-lg font-semibold">{imageCount}</span>
                      <button onClick={() => setImageCount(c => Math.min(10, c + 1))} className="px-4 py-2 rounded text-xl font-bold hover:bg-slate-700">+</button>
                  </div>
              </section>

              {/* 5. Tỷ lệ khung hình */}
              <section>
                  <h3 className="font-semibold text-slate-300 mb-2">5. Tỷ lệ khung hình</h3>
                  <AspectRatioSelector
                      value={aspectRatio}
                      onChange={setAspectRatio}
                      disabled={!!sourceImage}
                  />
              </section>
            </div>
          )}

          {activeTab === 'cameraAngle' && (
            <div className="space-y-6">
                {/* 1. Tải ảnh lên */}
                <section>
                  <h3 className="font-semibold text-slate-300 mb-3">1. Tải ảnh lên</h3>
                  {sourceImage ? (
                    <div className='space-y-3'>
                        <ImageDropzone onImageUpload={handleSourceImageUpload} className="cursor-pointer rounded-lg transition-colors">
                          <div className='bg-black/30 rounded-lg p-2'>
                              <img src={`data:${sourceImage.mimeType};base64,${sourceImage.base64}`} alt="Source preview" className="w-full h-auto object-contain rounded" />
                          </div>
                        </ImageDropzone>
                        <div className='flex items-center justify-start gap-2 text-sm'>
                            <button onClick={() => setSourceImage(null)} className='text-red-400 hover:text-red-500 transition-colors px-3 py-1.5 rounded-md hover:bg-red-500/10'>Xóa</button>
                        </div>
                    </div>
                  ) : (
                    <ImageDropzone onImageUpload={handleSourceImageUpload} className='w-full h-40 border-2 border-dashed border-slate-600 rounded-lg flex items-center justify-center text-center text-slate-400 text-sm cursor-pointer transition-colors'>
                        <div>
                            <p>Kéo thả, dán, hoặc click</p>
                            <p className="text-xs mt-1 text-slate-500">PNG, JPG, WEBP</p>
                        </div>
                    </ImageDropzone>
                  )}
                </section>

                {/* 2. Chọn góc camera ngoại thất */}
                <section>
                  <h3 className="font-semibold text-slate-300 mb-3">2. Chọn góc camera ngoại thất</h3>
                  <select
                    value={cameraAnglePrompts.some(p => p.value === prompt) ? prompt : ""}
                    onChange={(e) => setPrompt(e.target.value)}
                    className="w-full bg-slate-900/70 p-3 rounded-md text-sm focus:ring-2 focus:ring-orange-500 focus:outline-none appearance-none border border-slate-700"
                    style={{ background: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%2364748b' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e") right 0.5rem center/1.5em 1.5em no-repeat`}}
                  >
                    <option value="" disabled>-- Chọn góc ngoại thất --</option>
                    {cameraAnglePrompts.map(p => (
                      <option key={p.display} value={p.value} className="bg-[#1e293b] text-slate-200">
                        {p.display}
                      </option>
                    ))}
                  </select>
                </section>

                {/* 3. Chọn góc camera nội thất */}
                <section>
                  <h3 className="font-semibold text-slate-300 mb-3">3. Chọn góc camera nội thất</h3>
                  <select
                    value={interiorCameraAnglePrompts.some(p => p.value === prompt) ? prompt : ""}
                    onChange={(e) => setPrompt(e.target.value)}
                    className="w-full bg-slate-900/70 p-3 rounded-md text-sm focus:ring-2 focus:ring-orange-500 focus:outline-none appearance-none border border-slate-700"
                    style={{ background: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%2364748b' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e") right 0.5rem center/1.5em 1.5em no-repeat`}}
                  >
                     <option value="" disabled>-- Chọn góc nội thất --</option>
                    {interiorCameraAnglePrompts.map(p => (
                      <option key={p.display} value={p.value} className="bg-[#1e293b] text-slate-200">
                        {p.display}
                      </option>
                    ))}
                  </select>
                </section>
                
                {/* 4. Mô tả tùy chỉnh */}
                <section>
                    <h3 className="font-semibold text-slate-300 mb-2">4. Mô tả tùy chỉnh</h3>
                    <p className="text-xs text-slate-400 mb-2">Hoặc mô tả góc camera của riêng bạn tại đây. Chọn một tùy chọn ở trên sẽ tự động điền vào đây.</p>
                    <textarea
                        value={prompt}
                        onChange={(e) => setPrompt(e.target.value)}
                        placeholder="Ví dụ: chụp từ góc 3/4 từ dưới lên..."
                        className="w-full bg-slate-900/70 p-3 rounded-md h-24 resize-none text-sm focus:ring-2 focus:ring-orange-500 focus:outline-none border border-slate-700"
                    />
                </section>

                {/* 5. Số lượng ảnh */}
                <section>
                    <h3 className="font-semibold text-slate-300 mb-2">5. Số lượng ảnh</h3>
                    <div className="flex items-center justify-between bg-slate-900/70 rounded-md p-2">
                        <button onClick={() => setImageCount(c => Math.max(1, c - 1))} className="px-4 py-2 rounded text-xl font-bold hover:bg-slate-700">-</button>
                        <span className="text-lg font-semibold">{imageCount}</span>
                        <button onClick={() => setImageCount(c => Math.min(10, c + 1))} className="px-4 py-2 rounded text-xl font-bold hover:bg-slate-700">+</button>
                    </div>
                </section>
                
                {/* 6. Tỷ lệ khung hình */}
                <section>
                    <h3 className="font-semibold text-slate-300 mb-2">6. Tỷ lệ khung hình</h3>
                    <AspectRatioSelector
                        value={aspectRatio}
                        onChange={setAspectRatio}
                        disabled={!!sourceImage}
                    />
                </section>
            </div>
          )}
          
          {activeTab === 'edit' && (
            <div className="space-y-6">
                <section>
                  <h3 className="font-semibold text-slate-300 mb-3">1. Tải ảnh lên</h3>
                  {sourceImage ? (
                     <div className='space-y-2'>
                        <img src={sourceImageToDataUrl(sourceImage)} alt="Source preview" className="w-full h-auto object-contain rounded-lg bg-black/30 p-2" />
                        <button onClick={() => { setSourceImage(null); setMaskImage(null); setGeneratedImages([]); setSelectedImage(null); }} className='text-sm text-red-400 hover:text-red-500 transition-colors px-3 py-1.5 rounded-md hover:bg-red-500/10 w-full text-left'>Xóa Ảnh & Bắt đầu lại</button>
                    </div>
                  ) : (
                    <ImageDropzone onImageUpload={handleSourceImageUpload} className='w-full h-40 border-2 border-dashed border-slate-600 rounded-lg flex items-center justify-center text-center text-slate-400 text-sm cursor-pointer transition-colors'>
                        <div>
                            <p>Kéo thả, dán, hoặc click</p>
                            <p className="text-xs mt-1 text-slate-500">PNG, JPG, WEBP</p>
                        </div>
                    </ImageDropzone>
                  )}
                </section>
                
                {sourceImage && (
                    <>
                        <section>
                            <h3 className="font-semibold text-slate-300 mb-3">2. Vẽ vùng chọn (Lasso tool)</h3>
                            <div className='space-y-4'>
                                <button
                                    onClick={() => setIsEditingMask(!isEditingMask)}
                                    className={`w-full flex items-center justify-center gap-2 font-semibold py-3 px-4 rounded-lg transition-colors ${isEditingMask ? 'bg-red-600 hover:bg-red-700 text-white' : 'bg-slate-700 hover:bg-slate-600 text-slate-200'}`}
                                >
                                    <Icon name="pencil-swoosh" className="w-5 h-5" />
                                    {isEditingMask ? 'Hoàn thành' : 'Vẽ vùng chọn'}
                                </button>

                                {isEditingMask && (
                                     <button onClick={() => editorRef.current?.clear()} className='w-full flex items-center justify-center gap-2 text-sm text-slate-300 hover:text-slate-100 transition-colors px-3 py-2 rounded-md bg-slate-900/70 hover:bg-slate-700'>
                                        <Icon name="arrow-uturn-left" className="w-4 h-4" />
                                        Xóa vùng chọn
                                     </button>
                                )}
                                
                                <div className='space-y-2'>
                                    <label htmlFor="brushSize" className="text-sm font-medium text-slate-400">Độ dày đường viền: {brushSize}px</label>
                                    <input
                                        id="brushSize"
                                        type="range"
                                        min="1"
                                        max="10"
                                        value={brushSize}
                                        onChange={(e) => setBrushSize(Number(e.target.value))}
                                        className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-orange-500"
                                    />
                                </div>
                            </div>
                        </section>

                        <section>
                           <div className="flex justify-between items-center mb-2">
                             <h3 className="font-semibold text-slate-300">3. Mô tả thay đổi (Prompt)</h3>
                             <button onClick={handlePastePrompt} title="Dán" className="text-slate-400 hover:text-orange-400"><Icon name="clipboard" className="w-5 h-5"/></button>
                           </div>
                           <textarea
                             value={prompt}
                             onChange={(e) => setPrompt(e.target.value)}
                             placeholder="Ví dụ: thêm một cửa sổ kiểu vòm..."
                             className="w-full bg-slate-900/70 p-3 rounded-md h-28 resize-none text-sm focus:ring-2 focus:ring-orange-500 focus:outline-none border border-slate-700"
                           />
                        </section>

                        <section>
                            <h3 className="font-semibold text-slate-300 mb-2">4. Số lượng ảnh</h3>
                            <div className="flex items-center justify-between bg-slate-900/70 rounded-md p-2">
                                <button onClick={() => setImageCount(c => Math.max(1, c - 1))} className="px-4 py-2 rounded text-xl font-bold hover:bg-slate-700">-</button>
                                <span className="text-lg font-semibold">{imageCount}</span>
                                <button onClick={() => setImageCount(c => Math.min(10, c + 1))} className="px-4 py-2 rounded text-xl font-bold hover:bg-slate-700">+</button>
                            </div>
                        </section>
                    </>
                )}
            </div>
          )}

          {activeTab === 'planTo3d' && (
            <div className="space-y-6">
              {/* 1. Tải bản vẽ 2D (Floor Plan) */}
              <section>
                <h3 className="font-semibold text-slate-300 mb-3">1. Tải bản vẽ 2D (Floor Plan)</h3>
                {sourceImage ? (
                  <div className='space-y-3'>
                    <ImageDropzone onImageUpload={handleSourceImageUpload} className="cursor-pointer rounded-lg transition-colors">
                      <div className='bg-black/30 rounded-lg p-2'>
                        <img src={`data:${sourceImage.mimeType};base64,${sourceImage.base64}`} alt="Floor plan preview" className="w-full h-auto object-contain rounded" />
                      </div>
                    </ImageDropzone>
                    <div className='flex items-center justify-start gap-2 text-sm'>
                      <button onClick={() => { setSourceImage(null); setGeneratedImages([]); setSelectedImage(null); }} className='text-red-400 hover:text-red-500 transition-colors px-3 py-1.5 rounded-md hover:bg-red-500/10'>Xóa</button>
                    </div>
                  </div>
                ) : (
                  <ImageDropzone onImageUpload={handleSourceImageUpload} className='w-full h-40 border-2 border-dashed border-slate-600 rounded-lg flex items-center justify-center text-center text-slate-400 text-sm cursor-pointer transition-colors'>
                    <div>
                      <p>Kéo thả, dán, hoặc click</p>
                      <p className="text-xs mt-1 text-slate-500">PNG, JPG, WEBP</p>
                    </div>
                  </ImageDropzone>
                )}
              </section>

              {/* 2. Ảnh tham chiếu (Style) */}
              <section>
                <h3 className="font-semibold text-slate-300 mb-2">2. Ảnh tham chiếu (Style)</h3>
                <p className="text-xs text-slate-400 mb-3">AI sẽ sử dụng ảnh này để lấy cảm hứng về phong cách, màu sắc, vật liệu.</p>
                {referenceImage ? (
                  <div className="relative group">
                    <ImageDropzone onImageUpload={setReferenceImage} className="cursor-pointer rounded-md transition-colors">
                      <img src={`data:${referenceImage.mimeType};base64,${referenceImage.base64}`} alt="Reference" className="w-full h-32 object-cover rounded-md" />
                    </ImageDropzone>
                    <button onClick={() => setReferenceImage(null)} className="absolute top-1 right-1 bg-black/60 rounded-full text-white hover:bg-black/80 p-1 transition-opacity opacity-0 group-hover:opacity-100 z-10" aria-label="Remove reference image">
                      <Icon name="x-circle" className="w-5 h-5" />
                    </button>
                  </div>
                ) : (
                  <ImageDropzone onImageUpload={setReferenceImage} className='w-full h-32 border-2 border-dashed border-slate-600 rounded-lg flex items-center justify-center text-center text-slate-400 text-sm cursor-pointer transition-colors'>
                    <p>Kéo thả, dán, hoặc click</p>
                  </ImageDropzone>
                )}
              </section>

              {/* 3. Ghi chú (Prompt) */}
              <section>
                <div className="flex justify-between items-center mb-2">
                  <h3 className="font-semibold text-slate-300">3. Ghi chú (Prompt)</h3>
                   <button onClick={handlePastePrompt} title="Dán" className="text-slate-400 hover:text-orange-400"><Icon name="clipboard" className="w-5 h-5"/></button>
                </div>
                <textarea
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder="Ví dụ: phòng khách hiện đại, tông màu ấm, ánh sáng ban ngày..."
                  className="w-full bg-slate-900/70 p-3 rounded-md h-28 resize-none text-sm focus:ring-2 focus:ring-orange-500 focus:outline-none border border-slate-700"
                />
                <div className="mt-3 space-y-2">
                  <p className="text-xs text-slate-400 mb-1">Hoặc chọn prompt có sẵn để thêm vào:</p>
                  <select onChange={(e) => handlePromptSelect(e.target.value, planStylePrompts)} value="" className="w-full bg-slate-900/70 p-3 rounded-md text-sm focus:ring-2 focus:ring-orange-500 focus:outline-none appearance-none border border-slate-700" style={{ background: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%2364748b' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e") right 0.5rem center/1.5em 1.5em no-repeat`}}>
                    <option value="" disabled>Phong cách nội thất</option>
                    {planStylePrompts.map(p => <option key={p} value={p} className="bg-[#1e293b] text-slate-200">{p}</option>)}
                  </select>
                  <select onChange={(e) => handlePromptSelect(e.target.value, planRoomTypePrompts)} value="" className="w-full bg-slate-900/70 p-3 rounded-md text-sm focus:ring-2 focus:ring-orange-500 focus:outline-none appearance-none border border-slate-700" style={{ background: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%2364748b' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e") right 0.5rem center/1.5em 1.5em no-repeat`}}>
                    <option value="" disabled>Loại phòng</option>
                    {planRoomTypePrompts.map(p => <option key={p} value={p} className="bg-[#1e293b] text-slate-200">{p}</option>)}
                  </select>
                </div>
              </section>
              
              {/* 4. Số lượng ảnh */}
              <section>
                  <h3 className="font-semibold text-slate-300 mb-2">4. Số lượng ảnh</h3>
                  <div className="flex items-center justify-between bg-slate-900/70 rounded-md p-2">
                      <button onClick={() => setImageCount(c => Math.max(1, c - 1))} className="px-4 py-2 rounded text-xl font-bold hover:bg-slate-700">-</button>
                      <span className="text-lg font-semibold">{imageCount}</span>
                      <button onClick={() => setImageCount(c => Math.min(10, c + 1))} className="px-4 py-2 rounded text-xl font-bold hover:bg-slate-700">+</button>
                  </div>
              </section>
            </div>
          )}

          <button onClick={handleGeneration} disabled={isLoading || (activeTab === 'create' ? !prompt : !sourceImage || !prompt)} className="w-full bg-orange-600 hover:bg-orange-700 text-white font-bold py-3 px-4 rounded-lg transition-colors flex items-center justify-center gap-2 disabled:bg-slate-600 disabled:cursor-not-allowed mt-4 text-base">
            <Icon name="camera" className="w-5 h-5" />
            Tạo Ảnh
          </button>
        </div>

        {/* Right Gallery Panel */}
        <div className="lg:col-span-8 xl:col-span-9 bg-[#1e293b] p-4 rounded-xl shadow-2xl shadow-black/30 border border-slate-700/50 min-h-[60vh] lg:min-h-0">
            <div className='h-full max-h-[85vh] overflow-y-auto pr-2'>
            {isLoading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {Array.from({ length: imageCount }).map((_, index) => (
                        <div key={index} className="aspect-[4/3] bg-slate-700/50 rounded-lg animate-pulse"></div>
                    ))}
                </div>
             ) : generatedImages.length > 0 && selectedImage ? (
                <div className="flex flex-col h-full">
                    {/* Main Image Viewer */}
                    <div className="flex-grow flex items-center justify-center relative group bg-black/30 rounded-lg overflow-hidden">
                        <img src={selectedImage} alt="Selected Render" className="max-w-full max-h-[65vh] object-contain" />

                        {activeTab === 'edit' && isEditingMask && sourceImage && (
                            <ImageEditor
                                ref={editorRef}
                                sourceImage={sourceImage}
                                onMaskReady={setMaskImage}
                                strokeWidth={brushSize}
                            />
                        )}

                        <div className="absolute bottom-2 right-2 flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                             <button
                                onClick={handleStartEditing}
                                className="bg-slate-800/80 backdrop-blur-sm border border-slate-600 hover:bg-slate-700 text-white p-2 rounded-md"
                                aria-label="Chỉnh sửa ảnh này"
                                title="Chỉnh sửa ảnh này"
                            >
                                <Icon name="pencil-swoosh" className="w-5 h-5" />
                            </button>
                            <button
                                onClick={handleSetAsSourceImage}
                                className="bg-slate-800/80 backdrop-blur-sm border border-slate-600 hover:bg-slate-700 text-white p-2 rounded-md"
                                aria-label="Sử dụng làm ảnh nguồn"
                                title="Sử dụng làm ảnh nguồn"
                            >
                                <Icon name="arrow-up-tray" className="w-5 h-5" />
                            </button>
                            <a
                                href={selectedImage}
                                download={`aiai-studio-${Date.now()}.png`}
                                className="bg-slate-800/80 backdrop-blur-sm border border-slate-600 hover:bg-slate-700 text-white p-2 rounded-md"
                                aria-label="Tải ảnh"
                                title="Tải ảnh"
                            >
                                <Icon name="download" className="w-5 h-5" />
                            </a>
                        </div>
                    </div>
                    
                    {/* Prompt Display */}
                    <div className="my-4 p-3 bg-slate-900/50 rounded-md border border-slate-700/80">
                      <div className="flex justify-between items-start gap-3">
                        <p className="text-sm text-slate-300 flex-grow">{lastUsedPrompt || (activeTab === 'edit' && "Chưa có prompt")}</p>
                        {lastUsedPrompt &&
                            <button onClick={() => handleCopyPrompt(lastUsedPrompt)} title="Copy prompt" className="text-slate-400 hover:text-orange-400 flex-shrink-0">
                            <Icon name="clipboard" className="w-5 h-5"/>
                            </button>
                        }
                      </div>
                    </div>
        
                    {/* Thumbnail Strip */}
                    {generatedImages.length > 1 && (
                        <div className={`flex-shrink-0 grid grid-cols-${Math.min(generatedImages.length, 4)} gap-2`}>
                            {generatedImages.map((image, index) => (
                                <div
                                    key={index}
                                    className={`relative cursor-pointer rounded-md overflow-hidden transition-all duration-200 h-28 ${selectedImage === image ? 'ring-2 ring-orange-500' : 'opacity-60 hover:opacity-100'}`}
                                    onClick={() => setSelectedImage(image)}
                                >
                                    <img src={image} alt={`Thumbnail ${index + 1}`} className="w-full h-full object-cover" />
                                </div>
                            ))}
                        </div>
                    )}
                </div>
             ) : (
                <div className="h-full flex flex-col items-center justify-center text-center text-slate-500">
                    <Icon name="sparkles" className="w-16 h-16 mb-4 text-slate-600" />
                    <h3 className="text-xl font-semibold text-slate-400">Kết Quả Render</h3>
                    <p className="mt-2">Hình ảnh được tạo sẽ xuất hiện ở đây.</p>
                </div>
            )}
            </div>
        </div>
      </main>
      
      {/* History Section */}
      <section className="max-w-[1800px] mx-auto mt-8">
        <div className="flex justify-between items-center mb-4 px-1">
          <h2 className="text-xl font-semibold text-slate-300 flex items-center gap-2">
            <Icon name="clock" className="w-6 h-6" />
            Lịch sử
          </h2>
          {history.length > 0 && (
            <button
              onClick={handleClearHistory}
              className="flex items-center gap-1.5 text-sm text-slate-400 hover:text-red-400 transition-colors px-3 py-1.5 rounded-md hover:bg-red-500/10"
              title="Xóa toàn bộ lịch sử"
            >
              <Icon name="trash" className="w-4 h-4" />
              <span>Xóa tất cả</span>
            </button>
          )}
        </div>
        {history.length > 0 ? (
          <div className="flex overflow-x-auto space-x-4 pb-4 -mx-4 px-4">
            {history.map(item => (
              <div
                key={item.id}
                className="group flex-shrink-0 w-52 bg-slate-800 rounded-lg cursor-pointer transition-all duration-200 hover:ring-2 hover:ring-orange-500 shadow-lg overflow-hidden"
                onClick={() => handleRestoreHistory(item)}
              >
                <div className="relative">
                  <img
                    src={item.generatedImages[0]}
                    alt="History thumbnail"
                    className="w-full h-32 object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
                  <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <p className="text-white font-bold text-sm">Xem lại</p>
                  </div>
                  <span className="absolute bottom-1 right-2 text-white text-xs bg-black/50 px-1.5 py-0.5 rounded">
                    {item.imageCount} ảnh
                  </span>
                </div>
                <div className="p-2">
                    <p className="text-xs text-slate-300 line-clamp-2" title={item.prompt}>{item.prompt}</p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-[#1e293b] border border-slate-700/50 p-6 rounded-xl text-center text-slate-500">
            <p>Kết quả từ các lần tạo ảnh trước sẽ được lưu ở đây.</p>
          </div>
        )}
      </section>
    </div>
  );
}
