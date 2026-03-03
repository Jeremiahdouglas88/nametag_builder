import React, { useState, useRef, useEffect } from 'react';
import { toPng } from 'html-to-image';
import { Download, Tag, Move, Type, Building2, ListOrdered } from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';

interface TextLine {
  text: string;
  style: {
    weight: number;
  };
}

interface Dealership {
  name: string;
  template: string;
}

const dealerships: Dealership[] = [
  { name: 'Sport Mazda North', template: '/mazda_template.png' },
  { name: 'Sport Mazda South', template: '/mazda_template.png' },
  { name: 'Sport Subaru South', template: '/template.png' },
  { name: 'Sport Mitsubishi', template: '/mitsubishi_template.png' }
];

// Default values for font size and position
const DEFAULT_FONT_SIZE = 24;
const DEFAULT_POSITION = { x: 50, y: 50 };

function App() {
  const [textLines, setTextLines] = useState<TextLine[]>([
    { text: '', style: { weight: 700 } },
    { text: '', style: { weight: 300 } }
  ]);
  const [selectedDealership, setSelectedDealership] = useState<string>('');
  const [template, setTemplate] = useState('');
  const [uploadError, setUploadError] = useState('');
  const [textPosition, setTextPosition] = useState(DEFAULT_POSITION);
  const [fontSize, setFontSize] = useState(DEFAULT_FONT_SIZE);
  const [lineSpacing, setLineSpacing] = useState(0.9);
  const [isDragging, setIsDragging] = useState(false);
  const [startPosition, setStartPosition] = useState({ x: 0, y: 0 });
  const [isDownloading, setIsDownloading] = useState(false);
  const [hasAdjustedText, setHasAdjustedText] = useState(false);
  const nameTagRef = useRef<HTMLDivElement>(null);
  const textRef = useRef<HTMLDivElement>(null);

  const handleDealershipChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const dealership = dealerships.find(d => d.name === e.target.value);
    if (dealership) {
      setSelectedDealership(dealership.name);
      setTemplate(dealership.template);
    }
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (nameTagRef.current) {
      e.preventDefault();
      setIsDragging(true);
      
      const rect = nameTagRef.current.getBoundingClientRect();
      setStartPosition({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top
      });
    }
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isDragging && nameTagRef.current) {
        const rect = nameTagRef.current.getBoundingClientRect();
        const x = ((e.clientX - rect.left) / rect.width) * 100;
        const y = ((e.clientY - rect.top) / rect.height) * 100;
        
        setTextPosition({
          x: Math.max(0, Math.min(100, x)),
          y: Math.max(0, Math.min(100, y))
        });
        setHasAdjustedText(true);
      }
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging]);

  const handleTextChange = (index: number, value: string) => {
    setTextLines(prev => prev.map((line, i) => 
      i === index ? { ...line, text: value } : line
    ));
  };

  const handleFontSizeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newSize = Number(e.target.value);
    setFontSize(newSize);
    if (newSize !== DEFAULT_FONT_SIZE) {
      setHasAdjustedText(true);
    }
  };

  const handleDownload = async () => {
    if (!selectedDealership || !textLines[0].text || !textLines[1].text) {
      toast.error('Please fill in all required fields');
      return;
    }

    if (!hasAdjustedText || fontSize === DEFAULT_FONT_SIZE) {
      toast.error("You didn't resize the text! Please use the font size slider to resize the text and drag it to fit inside the red box.");
      return;
    }

    setIsDownloading(true);
    
    try {
      if (!nameTagRef.current) {
        throw new Error('Name tag reference not found');
      }

      // Generate the image
      const dataUrl = await toPng(nameTagRef.current, {
        backgroundColor: null,
        quality: 1.0,
        style: {
          transform: 'scale(1)',
          transformOrigin: 'top left'
        },
        skipAutoScale: true,
        pixelRatio: 2,
        filter: (node) => {
          // Filter out the guidelines and preview elements
          const classAttr = node.getAttribute?.('class');
          return !classAttr?.includes('preview-guidelines') && !classAttr?.includes('guide-box');
        }
      });

      // Create download link
      const fileName = `nametag-${textLines[0].text}-${textLines[1].text}-${Date.now()}.png`;
      const link = document.createElement('a');
      link.download = fileName;
      link.href = dataUrl;
      
      // Trigger download
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast.success('Name tag downloaded successfully!');

      // Reset form
      setTextLines([
        { text: '', style: { weight: 700 } },
        { text: '', style: { weight: 300 } }
      ]);
      setSelectedDealership('');
      setTemplate('');
      setFontSize(DEFAULT_FONT_SIZE);
      setLineSpacing(0.9);
      setTextPosition(DEFAULT_POSITION);
      setHasAdjustedText(false);
    } catch (error) {
      console.error('Download error:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to download name tag. Please try again.');
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <Toaster position="top-right" />
      <div className="max-w-6xl mx-auto space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Instructions Panel */}
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <ListOrdered className="w-5 h-5" />
              How It Works
            </h2>
            <ol className="space-y-4 mb-4">
              <li className="flex gap-2">
                <span className="flex-shrink-0 w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center font-semibold">1</span>
                <span>Select your dealership from the dropdown menu</span>
              </li>
              <li className="flex gap-2">
                <span className="flex-shrink-0 w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center font-semibold">2</span>
                <span>Input your first and last name in the provided fields</span>
              </li>
              <li className="flex gap-2">
                <span className="flex-shrink-0 w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center font-semibold">3</span>
                <span>Resize and drag the text to fit within the dotted red lines</span>
              </li>
              <li className="flex gap-2">
                <span className="flex-shrink-0 w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center font-semibold">4</span>
                <span>Click the blue "Download" button to save your name tag</span>
              </li>
            </ol>
            <div className="mt-6 pt-4 border-t border-gray-200">
              <p className="text-sm text-gray-600">
                Need Help? Text or call <a href="tel:4234249301" className="text-blue-600 hover:text-blue-800 font-medium">(423) 424-9301</a>
              </p>
            </div>
          </div>

          {/* Main Form Panel */}
          <div className="md:col-span-2 bg-white p-6 rounded-lg shadow-md">
            <h1 className="text-2xl font-bold mb-6 flex items-center gap-2">
              <Tag className="w-6 h-6" />
              Name Tag Generator
            </h1>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <h2 className="text-lg font-semibold flex items-center gap-2">
                  <Type className="w-5 h-5" />
                  Name Information
                </h2>
                <div className="space-y-4">
                  {textLines.map((line, index) => (
                    <div key={index} className="space-y-2">
                      <label htmlFor={`line${index}`} className="block text-sm font-medium text-gray-700">
                        {index === 0 ? 'First Name' : 'Last Name'}
                      </label>
                      <input
                        type="text"
                        id={`line${index}`}
                        value={line.text}
                        onChange={(e) => handleTextChange(index, e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder={index === 0 ? 'John' : 'Doe'}
                      />
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-4">
                <h2 className="text-lg font-semibold flex items-center gap-2">
                  <Move className="w-5 h-5" />
                  Text Settings
                </h2>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-2">
                      <Building2 className="w-4 h-4" />
                      Select Your Dealership
                    </label>
                    <select
                      value={selectedDealership}
                      onChange={handleDealershipChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Select a dealership...</option>
                      {dealerships.map(dealership => (
                        <option key={dealership.name} value={dealership.name}>
                          {dealership.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="grid grid-cols-1 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Font Size (px)
                      </label>
                      <input
                        type="range"
                        min="12"
                        max="200"
                        value={fontSize}
                        onChange={handleFontSizeChange}
                        className="w-full"
                      />
                      <div className="flex justify-between text-xs text-gray-500">
                        <span>12px</span>
                        <span>{fontSize}px</span>
                        <span>200px</span>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Line Spacing <span className="text-sm text-gray-500">(Adjust only if letters overlap)</span>
                      </label>
                      <input
                        type="range"
                        min="0.8"
                        max="2"
                        step="0.1"
                        value={lineSpacing}
                        onChange={(e) => setLineSpacing(Number(e.target.value))}
                        className="w-full"
                      />
                      <div className="flex justify-between text-xs text-gray-500">
                        <span>Tight</span>
                        <span>{lineSpacing.toFixed(1)}</span>
                        <span>Loose</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <button
              onClick={handleDownload}
              className="w-full mt-6 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={!template || !textLines[0].text || !textLines[1].text || isDownloading}
            >
              <Download className="w-4 h-4" />
              {isDownloading ? 'Downloading...' : 'Download Name Tag'}
            </button>
          </div>
        </div>

        <div className="flex justify-center">
          <div
            ref={nameTagRef}
            className="relative"
            style={{
              width: '877px',
              height: '268px',
              touchAction: 'none'
            }}
          >
            {/* Outer Guidelines */}
            <div 
              className="preview-guidelines absolute inset-0 pointer-events-none"
              style={{
                border: '2px dashed rgba(156, 163, 175, 0.5)',
                zIndex: 10
              }}
            />

            {/* Fixed Position Guide Box */}
            <div 
              className="guide-box absolute pointer-events-none"
              style={{
                left: '67%',
                top: '50%',
                transform: 'translate(-50%, -50%)',
                border: '2px dotted #ff0000',
                width: '480px',
                height: '190px',
                zIndex: 10
              }}
            />
            
            {template ? (
              <>
                <img
                  src={template}
                  alt="Name tag template"
                  className="absolute inset-0 w-full h-full object-contain"
                  onError={() => {
                    console.error('Image load error');
                    setUploadError('Error loading image');
                    setTemplate('');
                  }}
                />
                <div
                  ref={textRef}
                  className={`absolute proxima-nova flex flex-col ${isDragging ? 'select-none' : ''}`}
                  style={{
                    left: `${textPosition.x}%`,
                    top: `${textPosition.y}%`,
                    transform: 'translate(0, -50%)',
                    color: '#000000',
                    fontSize: `${fontSize}px`,
                    textShadow: '1px 1px 2px rgba(0,0,0,0.1)',
                    lineHeight: String(lineSpacing),
                    textAlign: 'left',
                    userSelect: 'none',
                    width: 'auto',
                    minWidth: '200px',
                    cursor: isDragging ? 'grabbing' : 'grab'
                  }}
                  onMouseDown={handleMouseDown}
                >
                  {textLines.map((line, index) => (
                    <div
                      key={index}
                      style={{
                        fontWeight: line.style.weight
                      }}
                    >
                      {line.text || (index === 0 ? 'First' : 'Last')}
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="flex items-center justify-center h-full text-gray-500">
                Please select a dealership to begin
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;