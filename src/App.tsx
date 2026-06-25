import React, { useState, useMemo, useRef, useEffect } from "react";
import { 
  Play, 
  RotateCcw, 
  Trash2, 
  Plus, 
  Info, 
  Sliders, 
  Code, 
  BookOpen, 
  Calculator, 
  Database, 
  Sparkles, 
  Check, 
  HelpCircle,
  Eye,
  TrendingUp,
  AlertCircle,
  Maximize2,
  RefreshCw,
  Move
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { originalDataset, colabSteps, CodeStep, DataPoint } from "./data";
import { calculateRegression, RegressionResult } from "./regression";

export default function App() {
  // Application states
  const [points, setPoints] = useState<DataPoint[]>(() => [...originalDataset]);
  const [activeStepIndex, setActiveStepIndex] = useState<number>(5); // Default to final step (Complete View)
  const [activeTab, setActiveTab] = useState<"walkthrough" | "predictor" | "math" | "table">("walkthrough");
  
  // Visualizer configurations
  const [theme, setTheme] = useState<"modern" | "matplotlib">("modern");
  const [showResiduals, setShowResiduals] = useState<boolean>(true);
  const [dragModeEnabled, setDragModeEnabled] = useState<boolean>(true);
  const [clickToAddEnabled, setClickToAddEnabled] = useState<boolean>(false);
  const [showMeansPoint, setShowMeansPoint] = useState<boolean>(true);

  // Predictor state
  const [predictionExperience, setPredictionExperience] = useState<number>(10); // Default to 10 as in Colab predict([[10]])
  const [showVisualPrediction, setShowVisualPrediction] = useState<boolean>(true);
  
  // Quick presets for educational analysis
  const [activePreset, setActivePreset] = useState<string>("original");

  // Interaction tracking state
  const [hoveredPointId, setHoveredPointId] = useState<string | null>(null);
  const [draggedPointId, setDraggedPointId] = useState<string | null>(null);
  
  // Custom manual point inputs
  const [manualExperience, setManualExperience] = useState<string>("5.0");
  const [manualSalary, setManualSalary] = useState<string>("75000");
  const [inputError, setInputError] = useState<string | null>(null);

  // SVG dimensions
  const svgRef = useRef<SVGSVGElement | null>(null);
  const chartWidth = 640;
  const chartHeight = 440;
  const padding = { top: 50, right: 40, bottom: 60, left: 80 };

  // Calculate regression results dynamically
  const regression: RegressionResult = useMemo(() => {
    return calculateRegression(points);
  }, [points]);

  // Coordinate limits for plotting (Experience: 0 to 15, Salary: 0 to 150k)
  const xMin = 0;
  const xMax = useMemo(() => {
    const maxVal = Math.max(12, ...points.map(p => p.experience), predictionExperience);
    return Math.ceil(maxVal + 1);
  }, [points, predictionExperience]);

  const yMin = 0;
  const yMax = useMemo(() => {
    const activePred = regression.isUndefined ? 0 : regression.slope * predictionExperience + regression.intercept;
    const maxVal = Math.max(140000, ...points.map(p => p.salary), activePred);
    return Math.ceil((maxVal + 10000) / 10000) * 10000;
  }, [points, regression, predictionExperience]);

  // Coordinate projection mapping
  const toSvgX = (x: number) => {
    return padding.left + ((x - xMin) / (xMax - xMin)) * (chartWidth - padding.left - padding.right);
  };

  const toSvgY = (y: number) => {
    return chartHeight - padding.bottom - ((y - yMin) / (yMax - yMin)) * (chartHeight - padding.top - padding.bottom);
  };

  const fromSvgX = (svgX: number) => {
    const innerWidth = chartWidth - padding.left - padding.right;
    const pct = (svgX - padding.left) / innerWidth;
    const val = xMin + pct * (xMax - xMin);
    return Math.max(0, parseFloat(val.toFixed(1)));
  };

  const fromSvgY = (svgY: number) => {
    const innerHeight = chartHeight - padding.top - padding.bottom;
    const pct = (chartHeight - padding.bottom - svgY) / innerHeight;
    const val = yMin + pct * (yMax - yMin);
    return Math.max(0, Math.round(val / 1000) * 1000);
  };

  // Preset scenarios handler
  const handleApplyPreset = (type: string) => {
    setActivePreset(type);
    if (type === "original") {
      setPoints([...originalDataset]);
    } else if (type === "noisy") {
      // Add random spread
      const noisy = originalDataset.map((p, idx) => ({
        ...p,
        salary: Math.max(20000, p.salary + (Math.sin(idx) * 28000)),
      }));
      setPoints(noisy);
    } else if (type === "perfect") {
      // Perfect correlation: Salary = 20000 + 10000 * Experience
      const perfect = originalDataset.map((p) => ({
        ...p,
        salary: 25000 + 9500 * p.experience,
      }));
      setPoints(perfect);
    } else if (type === "outlier") {
      // Original dataset + one massive outlier (e.g. 1.5 yrs experience making 150k, or 12 yrs making 20k)
      setPoints([
        ...originalDataset,
        { id: "outlier-1", experience: 2.0, salary: 145000, isCustom: true },
        { id: "outlier-2", experience: 11.5, salary: 30000, isCustom: true }
      ]);
    }
  };

  // Add custom manual point
  const handleAddManualPoint = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const expNum = parseFloat(manualExperience);
    const salNum = parseFloat(manualSalary);

    if (isNaN(expNum) || expNum < 0 || expNum > 20) {
      setInputError("Experience must be a valid number between 0 and 20 years.");
      return;
    }
    if (isNaN(salNum) || salNum < 0 || salNum > 300000) {
      setInputError("Salary must be a valid number between $0 and $300,000.");
      return;
    }

    const newPoint: DataPoint = {
      id: "custom-" + Date.now(),
      experience: expNum,
      salary: salNum,
      isCustom: true,
    };

    setPoints(prev => [...prev, newPoint]);
    setInputError(null);
  };

  // Delete an individual point
  const handleDeletePoint = (id: string) => {
    setPoints(prev => prev.filter(p => p.id !== id));
    if (hoveredPointId === id) setHoveredPointId(null);
  };

  // Clear all custom data points
  const handleClearCustomPoints = () => {
    setPoints(prev => prev.filter(p => !p.isCustom));
  };

  // Reset to raw data entirely
  const handleResetAll = () => {
    setPoints([...originalDataset]);
    setPredictionExperience(10);
    setActiveStepIndex(5);
    setActivePreset("original");
  };

  // Mouse drag handler in SVG
  const handleSvgPointerDown = (e: React.PointerEvent<SVGSVGElement>, pointId: string) => {
    if (!dragModeEnabled) return;
    e.stopPropagation();
    setDraggedPointId(pointId);
    if (svgRef.current) {
      svgRef.current.setPointerCapture(e.pointerId);
    }
  };

  const handleSvgPointerMove = (e: React.PointerEvent<SVGSVGElement>) => {
    if (draggedPointId === null || !svgRef.current) return;
    
    const rect = svgRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const dataX = fromSvgX(x);
    const dataY = fromSvgY(y);

    setPoints(prev => 
      prev.map(p => 
        p.id === draggedPointId 
          ? { ...p, experience: Math.min(15, Math.max(0, dataX)), salary: Math.min(200000, Math.max(0, dataY)) } 
          : p
      )
    );
  };

  const handleSvgPointerUp = (e: React.PointerEvent<SVGSVGElement>) => {
    if (draggedPointId !== null && svgRef.current) {
      svgRef.current.releasePointerCapture(e.pointerId);
      setDraggedPointId(null);
    }
  };

  // Click on SVG blank canvas to add a point
  const handleSvgCanvasClick = (e: React.MouseEvent<SVGSVGElement>) => {
    if (!clickToAddEnabled || draggedPointId !== null || !svgRef.current) return;
    
    const rect = svgRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // Only add if inside grid boundaries
    if (x >= padding.left && x <= chartWidth - padding.right && y >= padding.top && y <= chartHeight - padding.bottom) {
      const dataX = fromSvgX(x);
      const dataY = fromSvgY(y);

      const newPoint: DataPoint = {
        id: "click-custom-" + Date.now(),
        experience: dataX,
        salary: dataY,
        isCustom: true
      };

      setPoints(prev => [...prev, newPoint]);
    }
  };

  // Generate grid lines
  const gridLinesX = useMemo(() => {
    const lines = [];
    const step = xMax > 15 ? 2 : 1;
    for (let x = 0; x <= xMax; x += step) {
      lines.push(x);
    }
    return lines;
  }, [xMax]);

  const gridLinesY = useMemo(() => {
    const lines = [];
    const step = 20000;
    for (let y = 0; y <= yMax; y += step) {
      lines.push(y);
    }
    return lines;
  }, [yMax]);

  // Calculate predicted salary for experience = 10
  const predictedValueForTen = useMemo(() => {
    if (regression.isUndefined) return 0;
    return regression.slope * 10 + regression.intercept;
  }, [regression]);

  // Calculate selected predictor output
  const activePrediction = useMemo(() => {
    if (regression.isUndefined) return 0;
    return regression.slope * predictionExperience + regression.intercept;
  }, [regression, predictionExperience]);

  // Which graph elements should be visible based on active Colab Step
  // Step 0: raw data loading -> only show data list (no points on plot or simple title)
  // Step 1: exploratory plot -> draw scatter points only, no line, no residuals
  // Step 2: model fit -> draw scatter + regression line
  // Step 3: predict [[10]] -> draw scatter, regression line, and highlight X=10 predict point
  // Step 4: model score -> draw residuals to show how we evaluate accuracy (R2)
  // Step 5: final matplotlib plot -> fully polished model view
  const showScatterPoints = activeStepIndex >= 1;
  const showRegressionLine = activeStepIndex >= 2 && !regression.isUndefined;
  const showPredictionHighlight = (activeStepIndex === 3 || activeStepIndex === 5 || showVisualPrediction) && showScatterPoints && !regression.isUndefined;
  const forceResidualsVisible = activeStepIndex === 4;

  const currentHoveredPoint = useMemo(() => {
    if (hoveredPointId === null) return null;
    return regression.pointsWithPredictions.find(p => p.id === hoveredPointId) || null;
  }, [hoveredPointId, regression]);

  return (
    <div className="min-h-screen bg-[#0A0A0B] text-white flex flex-col font-sans antialiased p-6 md:p-10">
      {/* Top Header Navigation Bar */}
      <header className="flex flex-col lg:flex-row justify-between items-start lg:items-end border-b border-white/10 pb-6 mb-8 gap-6 max-w-7xl w-full mx-auto">
        <div>
          <h1 className="text-5xl md:text-7xl font-black tracking-tighter leading-none uppercase font-display">
            Salaray<br/><span className="text-[#FF3E3E]">Predictor</span>
          </h1>
          <p className="mt-4 text-gray-400 font-mono tracking-widest uppercase text-xs">
            Dataset: Salary_Data.csv • Model: LinearRegression() • Colab Port
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-4 md:gap-6 text-left lg:text-right">
          <div className="bg-white/[0.02] border border-white/10 px-4 py-2 rounded-sm font-mono">
            <div className="text-[10px] text-gray-500 uppercase tracking-widest font-bold">Equation</div>
            <div className="text-sm font-black text-[#FF3E3E] mt-0.5">
              {regression.isUndefined ? "x = constant" : `y = ${regression.slope.toFixed(1)}x + ${regression.intercept.toFixed(0)}`}
            </div>
          </div>
          <div className="bg-white/[0.02] border border-white/10 px-4 py-2 rounded-sm font-mono">
            <div className="text-[10px] text-gray-500 uppercase tracking-widest font-bold">R² Accuracy</div>
            <div className="text-lg md:text-xl font-black text-white mt-0.5">
              {regression.r2.toFixed(4)}
            </div>
          </div>
          <div className="bg-white/[0.02] border border-white/10 px-4 py-2 rounded-sm font-mono">
            <div className="text-[10px] text-gray-500 uppercase tracking-widest font-bold">Data Points</div>
            <div className="text-lg md:text-xl font-black text-white mt-0.5">
              {points.length}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content Dashboard */}
      <main className="flex-1 max-w-7xl w-full mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* LEFT WORKSPACE - Interactive Plot and Chart Customizers (7 Cols) */}
        <section id="visualizer-section" className="lg:col-span-7 flex flex-col gap-6">
          
          {/* Main Visualizer Card */}
          <div className="bg-white/[0.02] border border-white/10 rounded-sm overflow-hidden flex flex-col h-full">
            
            {/* Visualizer Header */}
            <div className="bg-white/5 border-b border-white/10 px-5 py-4 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <Eye className="h-4 w-4 text-[#FF3E3E]" />
                <h2 className="font-black text-sm tracking-widest uppercase font-display text-white">
                  Interactive Chart View
                </h2>
              </div>

              {/* Theme Selector (Modern vs Matplotlib) */}
              <div className="flex items-center bg-black/60 border border-white/10 p-0.5 rounded-sm">
                <button
                  id="theme-modern-btn"
                  onClick={() => setTheme("modern")}
                  className={`px-3 py-1 text-[10px] uppercase font-mono rounded-sm transition-all ${
                    theme === "modern" 
                      ? "bg-white text-black font-black" 
                      : "text-gray-400 hover:text-white"
                  }`}
                >
                  Modern Lab
                </button>
                <button
                  id="theme-matplotlib-btn"
                  onClick={() => setTheme("matplotlib")}
                  className={`px-3 py-1 text-[10px] uppercase font-mono rounded-sm transition-all ${
                    theme === "matplotlib" 
                      ? "bg-white text-black font-black" 
                      : "text-gray-400 hover:text-white"
                  }`}
                >
                  Matplotlib Style
                </button>
              </div>
            </div>

            {/* Quick Chart Interaction Settings Panel */}
            <div className="bg-[#161618]/30 border-b border-white/10 px-5 py-3 flex flex-wrap items-center justify-between gap-4 text-xs text-gray-400">
              <div className="flex flex-wrap items-center gap-4">
                <label className="flex items-center gap-1.5 cursor-pointer select-none">
                  <input
                    id="residuals-toggle"
                    type="checkbox"
                    checked={showResiduals}
                    onChange={(e) => setShowResiduals(e.target.checked)}
                    className="rounded-sm border-white/20 bg-[#0A0A0B] text-[#FF3E3E] focus:ring-0 focus:ring-offset-0"
                  />
                  <span className="font-mono text-[11px] uppercase tracking-wider text-gray-300">Show Residual Lines</span>
                </label>
                
                <label className="flex items-center gap-1.5 cursor-pointer select-none">
                  <input
                    id="means-toggle"
                    type="checkbox"
                    checked={showMeansPoint}
                    onChange={(e) => setShowMeansPoint(e.target.checked)}
                    className="rounded-sm border-white/20 bg-[#0A0A0B] text-[#FF3E3E] focus:ring-0 focus:ring-offset-0"
                  />
                  <span className="font-mono text-[11px] uppercase tracking-wider text-gray-300">Centroid Center <span className="text-[#FF3E3E] font-bold">(X̄, Ȳ)</span></span>
                </label>
              </div>

              <div className="flex items-center gap-3">
                <span className="text-gray-500 font-mono text-[10px] uppercase tracking-wider">Interactions:</span>
                <button
                  id="interaction-drag-btn"
                  onClick={() => {
                    setDragModeEnabled(true);
                    setClickToAddEnabled(false);
                  }}
                  className={`flex items-center gap-1 px-2.5 py-1 text-[10px] uppercase font-mono rounded-sm transition-all ${
                    dragModeEnabled 
                      ? "bg-[#FF3E3E] text-black font-black border border-transparent" 
                      : "border border-white/10 hover:border-white/20 text-gray-400 hover:text-white"
                  }`}
                  title="Drag point dots directly on the graph to fit the line in real-time!"
                >
                  <Move className="h-3 w-3" />
                  Drag Dots
                </button>
                <button
                  id="interaction-click-btn"
                  onClick={() => {
                    setClickToAddEnabled(true);
                    setDragModeEnabled(false);
                  }}
                  className={`flex items-center gap-1 px-2.5 py-1 text-[10px] uppercase font-mono rounded-sm transition-all ${
                    clickToAddEnabled 
                      ? "bg-[#FF3E3E] text-black font-black border border-transparent" 
                      : "border border-white/10 hover:border-white/20 text-gray-400 hover:text-white"
                  }`}
                  title="Click anywhere on the graph area to add a brand new custom coordinate!"
                >
                  <Plus className="h-3 w-3" />
                  Click to Add
                </button>
              </div>
            </div>

            {/* SVG Visualizer Canvas Container */}
            <div 
              className={`flex-1 flex flex-col items-center justify-center p-4 min-h-[400px] transition-colors duration-500 ${
                theme === "matplotlib" ? "bg-white text-slate-950" : "bg-black text-slate-100"
              }`}
            >
              <div className="relative w-full max-w-[640px] aspect-[64/44]">
                <svg
                  id="linear-regression-svg"
                  ref={svgRef}
                  width="100%"
                  height="100%"
                  viewBox={`0 0 ${chartWidth} ${chartHeight}`}
                  onPointerMove={handleSvgPointerMove}
                  onPointerUp={handleSvgPointerUp}
                  onClick={handleSvgCanvasClick}
                  className={`block rounded-sm select-none outline-none ${
                    clickToAddEnabled ? "cursor-crosshair" : "cursor-default"
                  }`}
                >
                  {/* --- MATPLOTLIB VS MODERN GRAPHS CONFIGURATION --- */}
                  {theme === "matplotlib" ? (
                    /* Matplotlib Chart Styling */
                    <>
                      {/* Background clean white */}
                      <rect width={chartWidth} height={chartHeight} fill="#ffffff" />
                      
                      {/* Matplotlib red title */}
                      <text
                        x={chartWidth / 2}
                        y={30}
                        textAnchor="middle"
                        fill="red"
                        fontSize="16"
                        fontWeight="bold"
                        fontFamily="DejaVu Sans, sans-serif"
                      >
                        Salary vs Experience
                      </text>

                      {/* Axes Labels in Matplotlib blue */}
                      <text
                        x={chartWidth / 2}
                        y={chartHeight - 15}
                        textAnchor="middle"
                        fill="blue"
                        fontSize="12"
                        fontFamily="DejaVu Sans, sans-serif"
                      >
                        Years of Experience
                      </text>

                      <text
                        x={20}
                        y={chartHeight / 2}
                        textAnchor="middle"
                        fill="blue"
                        fontSize="12"
                        fontFamily="DejaVu Sans, sans-serif"
                        transform={`rotate(-90, 20, ${chartHeight / 2})`}
                      >
                        Salary
                      </text>

                      {/* Simple Matplotlib outer frame */}
                      <rect
                        x={padding.left}
                        y={padding.top}
                        width={chartWidth - padding.left - padding.right}
                        height={chartHeight - padding.top - padding.bottom}
                        fill="none"
                        stroke="#000000"
                        strokeWidth="1"
                      />

                      {/* X and Y Ticks */}
                      {gridLinesX.map((val) => (
                        <g key={`x-tick-${val}`}>
                          <line
                            x1={toSvgX(val)}
                            y1={chartHeight - padding.bottom}
                            x2={toSvgX(val)}
                            y2={chartHeight - padding.bottom + 5}
                            stroke="#000000"
                            strokeWidth="1"
                          />
                          <text
                            x={toSvgX(val)}
                            y={chartHeight - padding.bottom + 18}
                            textAnchor="middle"
                            fill="#000000"
                            fontSize="10"
                            fontFamily="DejaVu Sans, sans-serif"
                          >
                            {val}
                          </text>
                        </g>
                      ))}

                      {gridLinesY.map((val) => (
                        <g key={`y-tick-${val}`}>
                          <line
                            x1={padding.left - 5}
                            y1={toSvgY(val)}
                            x2={padding.left}
                            y2={toSvgY(val)}
                            stroke="#000000"
                            strokeWidth="1"
                          />
                          <text
                            x={padding.left - 10}
                            y={toSvgY(val) + 4}
                            textAnchor="end"
                            fill="#000000"
                            fontSize="9"
                            fontFamily="DejaVu Sans, sans-serif"
                          >
                            ${(val / 1000).toFixed(0)}k
                          </text>
                        </g>
                      ))}
                    </>
                  ) : (
                    /* Sleek Modern UI Dashboard Theme */
                    <>
                      {/* Grid background */}
                      <defs>
                        <radialGradient id="neonGlow" cx="50%" cy="50%" r="50%">
                          <stop offset="0%" stopColor="#FF3E3E" stopOpacity="0.1" />
                          <stop offset="100%" stopColor="#FF3E3E" stopOpacity="0" />
                        </radialGradient>
                      </defs>
                      <rect width={chartWidth} height={chartHeight} fill="none" />
                      <rect 
                        x={padding.left} 
                        y={padding.top} 
                        width={chartWidth - padding.left - padding.right} 
                        height={chartHeight - padding.top - padding.bottom} 
                        fill="url(#neonGlow)"
                      />

                      {/* Horizontal Grid lines */}
                      {gridLinesY.map((val) => (
                        <line
                          key={`grid-y-${val}`}
                          x1={padding.left}
                          y1={toSvgY(val)}
                          x2={chartWidth - padding.right}
                          y2={toSvgY(val)}
                          stroke="rgba(255, 255, 255, 0.1)"
                          strokeWidth="1"
                          strokeDasharray="2 4"
                        />
                      ))}

                      {/* Vertical Grid lines */}
                      {gridLinesX.map((val) => (
                        <line
                          key={`grid-x-${val}`}
                          x1={toSvgX(val)}
                          y1={padding.top}
                          x2={toSvgX(val)}
                          y2={chartHeight - padding.bottom}
                          stroke="rgba(255, 255, 255, 0.1)"
                          strokeWidth="1"
                          strokeDasharray="2 4"
                        />
                      ))}

                      {/* Clean Slate Glass Axes */}
                      <line
                        x1={padding.left}
                        y1={chartHeight - padding.bottom}
                        x2={chartWidth - padding.right}
                        y2={chartHeight - padding.bottom}
                        stroke="rgba(255, 255, 255, 0.2)"
                        strokeWidth="1.5"
                      />
                      <line
                        x1={padding.left}
                        y1={padding.top}
                        x2={padding.left}
                        y2={chartHeight - padding.bottom}
                        stroke="rgba(255, 255, 255, 0.2)"
                        strokeWidth="1.5"
                      />

                      {/* Modern Axes Labels */}
                      <text
                        x={chartWidth / 2}
                        y={chartHeight - 12}
                        textAnchor="middle"
                        fill="#94a3b8"
                        fontSize="12"
                        className="font-mono uppercase tracking-wider font-semibold"
                      >
                        Years of Experience
                      </text>

                      <text
                        x={24}
                        y={chartHeight / 2}
                        textAnchor="middle"
                        fill="#94a3b8"
                        fontSize="12"
                        className="font-mono uppercase tracking-wider font-semibold"
                        transform={`rotate(-90, 24, ${chartHeight / 2})`}
                      >
                        Salary (USD)
                      </text>

                      {/* Tick coordinates labels */}
                      {gridLinesX.map((val) => (
                        <text
                          key={`lbl-x-${val}`}
                          x={toSvgX(val)}
                          y={chartHeight - padding.bottom + 20}
                          textAnchor="middle"
                          fill="#64748b"
                          fontSize="10"
                          className="font-mono font-medium"
                        >
                          {val}
                        </text>
                      ))}

                      {gridLinesY.map((val) => (
                        <text
                          key={`lbl-y-${val}`}
                          x={padding.left - 12}
                          y={toSvgY(val) + 4}
                          textAnchor="end"
                          fill="#64748b"
                          fontSize="9"
                          className="font-mono font-medium"
                        >
                          ${val.toLocaleString()}
                        </text>
                      ))}
                    </>
                  )}

                  {/* 1. VISUAL ELEMENT: Residual Error Lines (OLS Cost Visualizer) */}
                  {(showResiduals || forceResidualsVisible) && showRegressionLine && (
                    <g id="residual-lines">
                      {regression.pointsWithPredictions.map((pt) => {
                        const sx = toSvgX(pt.experience);
                        const sy = toSvgY(pt.salary);
                        const spy = toSvgY(pt.predictedSalary);
                        
                        return (
                          <line
                            key={`res-line-${pt.id}`}
                            x1={sx}
                            y1={sy}
                            x2={sx}
                            y2={spy}
                            stroke={theme === "matplotlib" ? "rgba(100, 116, 139, 0.4)" : "#FF3E3E"}
                            strokeWidth={hoveredPointId === pt.id ? "2.5" : "1"}
                            strokeDasharray="3 3"
                            opacity={hoveredPointId === pt.id ? "1.0" : "0.5"}
                            className="transition-all"
                          />
                        );
                      })}
                    </g>
                  )}

                  {/* 2. VISUAL ELEMENT: Linear Regression Fitted Line */}
                  {showRegressionLine && (
                    <g id="regression-line">
                      {/* Calculate coordinates at x=0 and x=xMax */}
                      {(() => {
                        const startY = regression.slope * xMin + regression.intercept;
                        const endY = regression.slope * xMax + regression.intercept;
                        const x1 = toSvgX(xMin);
                        const y1 = toSvgY(startY);
                        const x2 = toSvgX(xMax);
                        const y2 = toSvgY(endY);

                        return (
                          <>
                            {/* Hover shadow / glow line in modern theme */}
                            {theme === "modern" && (
                              <line
                                x1={x1}
                                y1={y1}
                                x2={x2}
                                y2={y2}
                                stroke="#FF3E3E"
                                strokeWidth="8"
                                opacity="0.15"
                                strokeLinecap="round"
                              />
                            )}
                            {/* Exact model line in user's red color */}
                            <line
                              id="regression-fit-line"
                              x1={x1}
                              y1={y1}
                              x2={x2}
                              y2={y2}
                              stroke="#FF3E3E"
                              strokeWidth={theme === "matplotlib" ? "2" : "3"}
                              strokeLinecap="round"
                              className="transition-all"
                            />
                          </>
                        );
                      })()}
                    </g>
                  )}

                  {/* 3. VISUAL ELEMENT: Centroid Center of Gravity of regression (Mean X, Mean Y) */}
                  {showMeansPoint && showRegressionLine && theme === "modern" && (
                    <g id="means-centroid">
                      <line
                        x1={toSvgX(regression.meanX)}
                        y1={padding.top}
                        x2={toSvgX(regression.meanX)}
                        y2={chartHeight - padding.bottom}
                        stroke="#e2e8f0"
                        strokeWidth="1"
                        strokeDasharray="2 2"
                        opacity="0.2"
                      />
                      <line
                        x1={padding.left}
                        y1={toSvgY(regression.meanY)}
                        x2={chartWidth - padding.right}
                        y2={toSvgY(regression.meanY)}
                        stroke="#e2e8f0"
                        strokeWidth="1"
                        strokeDasharray="2 2"
                        opacity="0.2"
                      />
                      <polygon
                        points={`${toSvgX(regression.meanX)},${toSvgY(regression.meanY) - 7} ${toSvgX(regression.meanX) + 7},${toSvgY(regression.meanY)} ${toSvgX(regression.meanX)},${toSvgY(regression.meanY) + 7} ${toSvgX(regression.meanX) - 7},${toSvgY(regression.meanY)}`}
                        fill="#f59e0b"
                        stroke="#ffffff"
                        strokeWidth="1.5"
                        title="Centroid Center of Gravity of Points"
                        className="cursor-help"
                      />
                    </g>
                  )}

                  {/* 4. VISUAL ELEMENT: Actual Training Data Scatter Points */}
                  {showScatterPoints && (
                    <g id="data-scatter-points">
                      {points.map((pt) => {
                        const sx = toSvgX(pt.experience);
                        const sy = toSvgY(pt.salary);
                        const isHovered = hoveredPointId === pt.id;
                        const isBeingDragged = draggedPointId === pt.id;

                        // Styling configuration based on theme
                        const dotColor = theme === "matplotlib" 
                          ? "#1f77b4" // Matplotlib classic blue
                          : pt.isCustom 
                            ? "#10b981" // Custom points in emerald green
                            : "#38bdf8"; // Original in nice sky blue

                        const dotRadius = theme === "matplotlib"
                          ? 6
                          : isBeingDragged
                            ? 10
                            : isHovered 
                              ? 8 
                              : pt.isCustom 
                                ? 6.5 
                                : 5.5;

                        return (
                          <g 
                            key={`point-group-${pt.id}`}
                            className="cursor-pointer"
                            onPointerDown={(e) => handleSvgPointerDown(e, pt.id)}
                            onMouseEnter={() => setHoveredPointId(pt.id)}
                            onMouseLeave={() => setHoveredPointId(null)}
                          >
                            {/* Larger transparent pointer area */}
                            <circle
                              cx={sx}
                              cy={sy}
                              r={16}
                              fill="transparent"
                            />
                            
                            {/* Glowing ring under points in Modern Theme */}
                            {theme === "modern" && (isHovered || isBeingDragged) && (
                              <circle
                                cx={sx}
                                cy={sy}
                                r={dotRadius + 4}
                                fill="none"
                                stroke={pt.isCustom ? "#34d399" : "#0ea5e9"}
                                strokeWidth="2.5"
                                opacity="0.6"
                              />
                            )}

                            {/* Main core dot */}
                            <circle
                              id={`scatter-dot-${pt.id}`}
                              cx={sx}
                              cy={sy}
                              r={dotRadius}
                              fill={dotColor}
                              stroke={theme === "matplotlib" ? "none" : isHovered ? "#ffffff" : pt.isCustom ? "#047857" : "#0369a1"}
                              strokeWidth={theme === "matplotlib" ? "0" : "1.5"}
                              className="transition-all duration-150"
                            />
                          </g>
                        );
                      })}
                    </g>
                  )}

                  {/* 5. VISUAL ELEMENT: Sandbox Active Predictor Node Target */}
                  {showPredictionHighlight && !regression.isUndefined && (
                    <g id="active-predictor-target">
                      {/* Vertical lookup helper line */}
                      <line
                        x1={toSvgX(predictionExperience)}
                        y1={chartHeight - padding.bottom}
                        x2={toSvgX(predictionExperience)}
                        y2={toSvgY(activePrediction)}
                        stroke="#FF3E3E"
                        strokeWidth="1.5"
                        strokeDasharray="4 2"
                      />
                      {/* Horizontal projection helper line */}
                      <line
                        x1={padding.left}
                        y1={toSvgY(activePrediction)}
                        x2={toSvgX(predictionExperience)}
                        y2={toSvgY(activePrediction)}
                        stroke="#FF3E3E"
                        strokeWidth="1.5"
                        strokeDasharray="4 2"
                      />

                      {/* Pulse target rings */}
                      <circle
                        cx={toSvgX(predictionExperience)}
                        cy={toSvgY(activePrediction)}
                        r="14"
                        fill="none"
                        stroke="#FF3E3E"
                        strokeWidth="2"
                        className="animate-ping"
                        opacity="0.3"
                      />
                      
                      {/* prediction core node */}
                      <circle
                        cx={toSvgX(predictionExperience)}
                        cy={toSvgY(activePrediction)}
                        r="7.5"
                        fill="#FF3E3E"
                        stroke="#ffffff"
                        strokeWidth="2"
                        className="shadow-lg"
                      />
                    </g>
                  )}
                </svg>

                {/* Live Tooltip Over the Chart */}
                <AnimatePresence>
                  {currentHoveredPoint && (
                    <motion.div
                      id="chart-tooltip"
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      transition={{ duration: 0.15 }}
                      className="absolute bg-slate-900/95 border border-slate-700 text-slate-100 px-4 py-3 rounded-lg shadow-xl text-xs pointer-events-auto backdrop-blur-md"
                      style={{
                        left: Math.min(chartWidth - 190, Math.max(10, toSvgX(currentHoveredPoint.experience) - 90)),
                        top: Math.max(10, toSvgY(currentHoveredPoint.salary) - 130),
                        width: "180px",
                      }}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-semibold text-slate-400">
                          {currentHoveredPoint.isCustom ? "Custom Data Point" : `Data Point #${currentHoveredPoint.id}`}
                        </span>
                        {dragModeEnabled && (
                          <span className="text-[10px] px-1 bg-slate-800 text-slate-400 rounded flex items-center gap-0.5">
                            <Move className="h-2 w-2" /> Drag
                          </span>
                        )}
                      </div>
                      <div className="space-y-1 font-mono text-[11px]">
                        <div className="flex justify-between">
                          <span>Experience:</span>
                          <span className="text-sky-400 font-bold">{currentHoveredPoint.experience} yrs</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Actual Salary:</span>
                          <span className="text-white font-bold">${currentHoveredPoint.salary.toLocaleString()}</span>
                        </div>
                        {showRegressionLine && (
                          <>
                            <div className="flex justify-between border-t border-slate-800 pt-1 mt-1">
                              <span>Predicted:</span>
                              <span className="text-purple-400 font-medium">${Math.round(currentHoveredPoint.predictedSalary).toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between">
                              <span>Residual Error:</span>
                              <span className={`font-medium ${currentHoveredPoint.residual >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                                {currentHoveredPoint.residual >= 0 ? '+' : ''}
                                {Math.round(currentHoveredPoint.residual).toLocaleString()}
                              </span>
                            </div>
                          </>
                        )}
                      </div>
                      
                      {/* Delete node option directly in tool-tip */}
                      <button
                        onClick={() => handleDeletePoint(currentHoveredPoint.id)}
                        className="w-full mt-2.5 pt-1.5 border-t border-slate-800 flex items-center justify-center gap-1 text-[10px] text-rose-400 hover:text-rose-300 font-medium transition"
                      >
                        <Trash2 className="h-2.5 w-2.5" />
                        Delete Point
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>

            {/* Quick Sandbox Action Drawer footer */}
            <div className="bg-[#0A0A0B] border-t border-white/10 p-5 flex flex-wrap items-center justify-between gap-4 font-mono">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-[10px] text-gray-500 uppercase font-bold tracking-widest">Dataset Presets:</span>
                <button
                  id="preset-original-btn"
                  onClick={() => handleApplyPreset("original")}
                  className={`px-3 py-1.5 text-[10px] uppercase rounded-sm transition font-bold ${
                    activePreset === "original"
                      ? "bg-[#FF3E3E] text-black"
                      : "bg-white/5 border border-white/10 text-gray-300 hover:bg-white/10"
                  }`}
                >
                  Original (N=40)
                </button>
                <button
                  id="preset-noisy-btn"
                  onClick={() => handleApplyPreset("noisy")}
                  className={`px-3 py-1.5 text-[10px] uppercase rounded-sm transition font-bold ${
                    activePreset === "noisy"
                      ? "bg-[#FF3E3E] text-black"
                      : "bg-white/5 border border-white/10 text-gray-300 hover:bg-white/10"
                  }`}
                  title="Adds noise to salary values to decrease fit quality R²"
                >
                  Noisy / High Variance
                </button>
                <button
                  id="preset-perfect-btn"
                  onClick={() => handleApplyPreset("perfect")}
                  className={`px-3 py-1.5 text-[10px] uppercase rounded-sm transition font-bold ${
                    activePreset === "perfect"
                      ? "bg-[#FF3E3E] text-black"
                      : "bg-white/5 border border-white/10 text-gray-300 hover:bg-white/10"
                  }`}
                  title="Fits points perfectly on a line for R² = 1.0"
                >
                  Perfect Fit (R² = 1.0)
                </button>
                <button
                  id="preset-outliers-btn"
                  onClick={() => handleApplyPreset("outlier")}
                  className={`px-3 py-1.5 text-[10px] uppercase rounded-sm transition font-bold ${
                    activePreset === "outlier"
                      ? "bg-[#FF3E3E] text-black"
                      : "bg-white/5 border border-white/10 text-gray-300 hover:bg-white/10"
                  }`}
                  title="Adds two massive outliers to demonstrate OLS tilt sensitivity"
                >
                  With Outliers
                </button>
              </div>

              <div className="flex items-center gap-2">
                {points.some(p => p.isCustom) && (
                  <button
                    id="clear-custom-btn"
                    onClick={handleClearCustomPoints}
                    className="px-2.5 py-1.5 text-[10px] uppercase text-gray-400 hover:text-white border border-white/10 rounded-sm hover:border-white/20 transition font-bold"
                  >
                    Clear Custom
                  </button>
                )}
                <button
                  id="reset-all-btn"
                  onClick={handleResetAll}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-[10px] uppercase bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 rounded-sm transition text-white font-bold"
                  title="Restore default states"
                >
                  <RotateCcw className="h-3 w-3" />
                  Reset Simulator
                </button>
              </div>
            </div>
          </div>

          {/* Quick Manual Point Adder Form */}
          <div className="bg-white/[0.02] border border-white/10 rounded-sm p-6">
            <h3 className="font-black text-xs tracking-widest uppercase mb-4 flex items-center gap-2 text-white font-display">
              <Plus className="h-4 w-4 text-[#FF3E3E]" />
              Add Custom Coordinates
            </h3>
            
            <form onSubmit={handleAddManualPoint} className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
              <div>
                <label className="block text-[10px] font-mono text-gray-500 mb-1.5 uppercase tracking-wider">
                  Experience (Years):
                </label>
                <input
                  id="input-experience"
                  type="number"
                  step="0.1"
                  min="0"
                  max="20"
                  value={manualExperience}
                  onChange={(e) => setManualExperience(e.target.value)}
                  className="w-full bg-[#161618] border border-white/10 focus:border-[#FF3E3E] rounded-sm px-3 py-2 text-xs text-white font-mono focus:outline-none focus:ring-0"
                />
              </div>

              <div>
                <label className="block text-[10px] font-mono text-gray-500 mb-1.5 uppercase tracking-wider">
                  Salary (USD $):
                </label>
                <input
                  id="input-salary"
                  type="number"
                  step="1000"
                  min="0"
                  max="300000"
                  value={manualSalary}
                  onChange={(e) => setManualSalary(e.target.value)}
                  className="w-full bg-[#161618] border border-white/10 focus:border-[#FF3E3E] rounded-sm px-3 py-2 text-xs text-white font-mono focus:outline-none focus:ring-0"
                />
              </div>

              <div>
                <button
                  id="add-point-submit-btn"
                  type="submit"
                  className="w-full bg-white hover:bg-gray-200 text-black font-black uppercase rounded-sm py-2 text-xs flex items-center justify-center gap-1.5 transition font-mono tracking-widest"
                >
                  <Plus className="h-4 w-4" /> Add Coordinate
                </button>
              </div>
            </form>

            {inputError && (
              <div id="error-alert" className="mt-4 bg-red-950/20 border border-red-800/40 text-red-400 text-xs px-3 py-2.5 rounded-sm flex items-center gap-1.5 font-mono">
                <AlertCircle className="h-3.5 w-3.5 flex-shrink-0" />
                <span>{inputError}</span>
              </div>
            )}
          </div>
        </section>

        {/* RIGHT WORKSPACE - interactive notebook emulator, stats and predictor (5 Cols) */}
        <section id="control-panel-section" className="lg:col-span-5 flex flex-col gap-6">
          
          {/* Controls Tab Headers */}
          <div className="bg-white/[0.02] border border-white/10 rounded-sm overflow-hidden flex flex-col">
            <div className="border-b border-white/10 bg-black/40 p-1 flex">
              <button
                id="tab-walkthrough-btn"
                onClick={() => setActiveTab("walkthrough")}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 text-[10px] font-bold uppercase tracking-wider font-mono rounded-sm transition-all ${
                  activeTab === "walkthrough"
                    ? "bg-[#FF3E3E] text-black"
                    : "text-gray-400 hover:text-white hover:bg-white/5"
                }`}
              >
                <BookOpen className="h-3.5 w-3.5" />
                Colab Code
              </button>
              <button
                id="tab-predictor-btn"
                onClick={() => setActiveTab("predictor")}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 text-[10px] font-bold uppercase tracking-wider font-mono rounded-sm transition-all ${
                  activeTab === "predictor"
                    ? "bg-[#FF3E3E] text-black"
                    : "text-gray-400 hover:text-white hover:bg-white/5"
                }`}
              >
                <Sliders className="h-3.5 w-3.5" />
                Predictor Sandbox
              </button>
              <button
                id="tab-math-btn"
                onClick={() => setActiveTab("math")}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 text-[10px] font-bold uppercase tracking-wider font-mono rounded-sm transition-all ${
                  activeTab === "math"
                    ? "bg-[#FF3E3E] text-black"
                    : "text-gray-400 hover:text-white hover:bg-white/5"
                }`}
              >
                <Calculator className="h-3.5 w-3.5" />
                Math Proofs
              </button>
              <button
                id="tab-table-btn"
                onClick={() => setActiveTab("table")}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 text-[10px] font-bold uppercase tracking-wider font-mono rounded-sm transition-all ${
                  activeTab === "table"
                    ? "bg-[#FF3E3E] text-black"
                    : "text-gray-400 hover:text-white hover:bg-white/5"
                }`}
              >
                <Database className="h-3.5 w-3.5" />
                Dataset ({points.length})
              </button>
            </div>

            {/* TAB CONTENTS CONTAINER */}
            <div className="p-5 max-h-[550px] overflow-y-auto bg-[#0A0A0B]/20 min-h-[480px]">
              
              {/* TAB 1: COLAB WALKTHROUGH & INTERACTIVE NOTEBOOK */}
              {activeTab === "walkthrough" && (
                <div className="space-y-4">
                  <div className="bg-white/[0.02] p-4 rounded-sm border border-white/5 mb-4 text-xs text-gray-300 leading-relaxed font-mono">
                    <p className="flex items-center gap-2 font-black uppercase text-[10px] tracking-widest text-white mb-2">
                      <Sparkles className="h-3.5 w-3.5 text-[#FF3E3E]" />
                      Google Colab Notebook Emulator
                    </p>
                    Below is the sequential code you executed in Google Colab. 
                    Click **Run Step** on any cell to isolate that modeling phase on the interactive graph!
                  </div>

                  <div className="space-y-4">
                    {colabSteps.map((step, idx) => (
                      <div 
                        key={`step-card-${idx}`}
                        className={`border transition-all duration-300 overflow-hidden rounded-sm ${
                          activeStepIndex === idx 
                            ? "bg-white/[0.02] border-[#FF3E3E] shadow-lg shadow-[#FF3E3E]/5" 
                            : "bg-white/[0.01] border-white/5 opacity-60 hover:opacity-100"
                        }`}
                      >
                        {/* Cell Header */}
                        <div className="bg-white/5 px-4 py-2.5 flex items-center justify-between border-b border-white/10">
                          <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-gray-400">
                            Cell [{idx + 1}] • {step.title}
                          </span>
                          <button
                            id={`run-cell-btn-${idx}`}
                            onClick={() => setActiveStepIndex(idx)}
                            className={`flex items-center gap-1 px-2.5 py-1 rounded-sm text-[9px] uppercase tracking-wider font-mono transition ${
                              activeStepIndex === idx 
                                ? "bg-[#FF3E3E] text-black font-black" 
                                : "bg-white/5 text-gray-300 hover:bg-white/10 font-bold"
                            }`}
                          >
                            <Play className="h-3 w-3 fill-current" />
                            Run Step
                          </button>
                        </div>

                        {/* Cell Body Code */}
                        <div className="p-4 bg-black/80 font-mono text-[11px] overflow-x-auto text-gray-300 border-b border-white/5 leading-relaxed select-text">
                          <pre className="text-[#FF3E3E]/90 font-mono">
                            {step.code}
                          </pre>
                        </div>

                        {/* Cell Explanation & Output */}
                        <div className="p-4 space-y-2.5 text-xs font-mono">
                          <p className="text-gray-300 leading-relaxed">
                            {step.explanation}
                          </p>
                          <div className="bg-black/60 p-3 rounded-sm border border-white/5 font-mono text-[10px] text-gray-500">
                            <span className="block text-gray-400 font-bold uppercase tracking-wider text-[8px] mb-1">
                              Under the hood regression logic:
                            </span>
                            {step.roleInRegression}
                          </div>

                          {/* Simulated Cell Execution Output */}
                          <AnimatePresence>
                            {activeStepIndex === idx && (
                              <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: "auto" }}
                                exit={{ opacity: 0, height: 0 }}
                                className="mt-2 pt-2 border-t border-white/5"
                              >
                                <div className="bg-[#FF3E3E]/5 border-l-2 border-[#FF3E3E] p-3 rounded-sm font-mono text-[10px] text-[#FF3E3E]">
                                  <span className="text-gray-500 mr-2">Output:</span>
                                  {idx === 0 && `Loaded df: [40 rows x 2 columns]`}
                                  {idx === 1 && `matplotlib: plotted 40 coordinates as blue markers`}
                                  {idx === 2 && `sklearn.linear_model: Calculated slope m = ${regression.slope.toFixed(2)}, intercept c = ${regression.intercept.toFixed(0)}`}
                                  {idx === 3 && `lr.predict([[10]]) => Predicted Salary: $${Math.round(predictedValueForTen).toLocaleString()}`}
                                  {idx === 4 && `lr.score() => Training R² accuracy: ${regression.r2.toFixed(5)}`}
                                  {idx === 5 && `Plotting Regression line y = ${regression.slope.toFixed(1)}*X + ${regression.intercept.toFixed(0)} on canvas`}
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* TAB 2: INTERACTIVE PREDICTOR SANDBOX */}
              {activeTab === "predictor" && (
                <div className="space-y-5 font-mono">
                  <div className="bg-white/[0.02] border border-white/10 p-4 rounded-sm space-y-3">
                    <h3 className="font-black text-xs text-white uppercase tracking-widest flex items-center gap-1.5 font-display">
                      <Sliders className="h-4 w-4 text-[#FF3E3E]" />
                      Salaray Prediction Sandbox
                    </h3>
                    <p className="text-[11px] text-gray-300 leading-relaxed">
                      Enter a custom number or drag the slider for 'Years of Experience' to instantly predict 'Salary' using the trained scikit-learn linear regression model.
                    </p>
                  </div>

                  {/* Input & Range Slider for X */}
                  <div className="space-y-4 bg-black/60 p-4 rounded-sm border border-white/5">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <span className="text-[10px] uppercase tracking-wider text-gray-400 font-bold">
                        Years of Experience (X):
                      </span>
                      <div className="flex items-center gap-2">
                        <input
                          id="predictor-numeric-input"
                          type="number"
                          min="0"
                          max="50"
                          step="0.1"
                          value={predictionExperience}
                          onChange={(e) => {
                            const val = parseFloat(e.target.value);
                            setPredictionExperience(isNaN(val) ? 0 : Math.max(0, val));
                            setActiveStepIndex(5); // Show full regression view
                            setShowVisualPrediction(true);
                          }}
                          className="w-24 bg-black border border-white/15 focus:border-[#FF3E3E] rounded-sm px-2.5 py-1 text-center text-xs text-white font-mono focus:outline-none focus:ring-0"
                          placeholder="e.g. 10"
                        />
                        <span className="text-[10px] text-gray-500 uppercase font-bold">years</span>
                      </div>
                    </div>
                    
                    <input
                      id="predictor-range"
                      type="range"
                      min="0"
                      max="50"
                      step="0.1"
                      value={predictionExperience > 50 ? 50 : predictionExperience}
                      onChange={(e) => {
                        setPredictionExperience(parseFloat(e.target.value));
                        setActiveStepIndex(5); // Show full regression view
                        setShowVisualPrediction(true);
                      }}
                      className="w-full h-1 bg-white/10 rounded-sm appearance-none cursor-pointer accent-[#FF3E3E]"
                    />
                    
                    <div className="flex justify-between text-[9px] text-gray-500 uppercase font-bold tracking-wider">
                      <span>0 yrs (Entry Level)</span>
                      <span>50 yrs (Veteran)</span>
                    </div>

                    {/* Visualize on Scatter Plot Button */}
                    <button
                      id="btn-visualize-prediction"
                      type="button"
                      onClick={() => {
                        setActiveStepIndex(3); // Go to prediction highlight step
                        setShowVisualPrediction(true);
                        // Smoothly scroll to visualizer section to draw focus
                        const visualizerEl = document.getElementById("visualizer-section");
                        if (visualizerEl) {
                          visualizerEl.scrollIntoView({ behavior: "smooth" });
                        }
                      }}
                      className="w-full bg-white hover:bg-gray-200 text-black font-black uppercase tracking-widest py-2 px-4 rounded-sm text-[10px] flex items-center justify-center gap-2 transition duration-200 font-mono"
                    >
                      <Eye className="h-3.5 w-3.5" />
                      Visualize Prediction on Scatter Plot
                    </button>
                  </div>

                  {/* Mathematical computation breakdown */}
                  <div className="bg-black/60 border border-white/5 rounded-sm p-4 space-y-4">
                    <h4 className="text-[10px] uppercase tracking-widest text-gray-400 font-bold border-b border-white/5 pb-2">
                      Arithmetic Formula Breakdown
                    </h4>

                    {regression.isUndefined ? (
                      <div className="text-xs text-red-400 font-mono">
                        Slope is undefined. Provide at least two distinct points on the graph to draw a prediction.
                      </div>
                    ) : (
                      <div className="space-y-4 text-xs leading-relaxed">
                        <div>
                          <div className="text-gray-500 text-[10px] uppercase tracking-wider font-bold">1. General Model Equation:</div>
                          <div className="text-white text-sm mt-0.5 font-black">
                            ŷ = Intercept + Slope × Experience
                          </div>
                        </div>

                        <div>
                          <div className="text-gray-500 text-[10px] uppercase tracking-wider font-bold">2. Substituting Trained Parameters:</div>
                          <div className="text-gray-300 mt-0.5">
                            ŷ = ${Math.round(regression.intercept).toLocaleString()} + ${Math.round(regression.slope).toLocaleString()} × ({predictionExperience})
                          </div>
                        </div>

                        <div className="bg-[#FF3E3E]/5 p-4 rounded-sm border border-[#FF3E3E]/20">
                          <div className="text-[#FF3E3E] text-[10px] font-black uppercase tracking-wider">
                            3. Predicted Output (lr.predict):
                          </div>
                          <div className="text-2xl text-white font-black mt-1">
                            ${Math.round(activePrediction).toLocaleString()}
                          </div>
                          <div className="text-[10px] text-gray-400 mt-1">
                            An employee with {predictionExperience} years of experience is estimated to make a base salary of ${Math.round(activePrediction).toLocaleString()}.
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Matplotlib line comparison widget */}
                  <div className="bg-white/[0.02] border border-white/10 rounded-sm p-4 text-xs text-gray-400 flex items-start gap-2.5">
                    <Info className="h-4 w-4 text-[#FF3E3E] flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-black text-white font-display uppercase text-[10px] tracking-wider">Predicting Experience = 10</p>
                      <p className="mt-1 text-gray-400">
                        In your Colab, you ran <code className="text-[#FF3E3E] bg-black/40 px-1 rounded">lr.predict([[10]])</code>.
                        With the original dataset, this evaluates to exactly <strong className="text-white">${Math.round(regression.slope * 10 + regression.intercept).toLocaleString()}</strong>.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 3: MATHEMATICAL OLS PROOFS AND CALCULATIONS */}
              {activeTab === "math" && (
                <div className="space-y-5 font-mono">
                  <div className="bg-white/[0.02] border border-white/10 p-4 rounded-sm space-y-1.5">
                    <h3 className="font-black text-xs text-white uppercase tracking-widest flex items-center gap-1.5 font-display">
                      <Calculator className="h-4 w-4 text-[#FF3E3E]" />
                      OLS Proofs & Calculations
                    </h3>
                    <p className="text-[11px] text-gray-300 leading-relaxed">
                      Here is the live mathematical arithmetic performed in the background of scikit-learn's `.fit()` engine for the active coordinate list.
                    </p>
                  </div>

                  {/* Calculations breakdown list */}
                  <div className="space-y-3 text-xs">
                    
                    {/* Centroid / Means */}
                    <div className="bg-black/60 p-4 rounded-sm border border-white/5">
                      <div className="text-[10px] text-gray-500 uppercase font-bold tracking-widest mb-2">
                        1. Mean Centroid Values (x̄, ȳ)
                      </div>
                      <div className="space-y-1">
                        <div className="flex justify-between">
                          <span className="text-gray-400">Mean Experience (x̄):</span>
                          <span className="text-white font-bold">{regression.meanX.toFixed(4)} yrs</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400">Mean Salary (ȳ):</span>
                          <span className="text-white font-bold">${regression.meanY.toFixed(2)}</span>
                        </div>
                      </div>
                    </div>

                    {/* Slope & Intercept formulas */}
                    <div className="bg-black/60 p-4 rounded-sm border border-white/5 space-y-3">
                      <div>
                        <div className="text-[10px] text-gray-500 uppercase font-bold tracking-widest mb-1">
                          2. Slope (m) Calculation formula
                        </div>
                        <div className="text-[10px] text-[#FF3E3E] italic mb-2">
                          m = Σ((x - x̄)(y - ȳ)) / Σ(x - x̄)²
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400">Covariance Numerator:</span>
                          <span className="text-gray-300">
                            {regression.isUndefined ? "0" : (regression.slope * regression.totalSumSquares).toFixed(0)}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400">Variance Denominator:</span>
                          <span className="text-gray-300">
                            {regression.isUndefined ? "0" : (regression.totalSumSquares / regression.slope).toFixed(1)}
                          </span>
                        </div>
                        <div className="flex justify-between border-t border-white/10 pt-1.5 mt-1.5 font-bold">
                          <span className="text-white">Trained Slope (m):</span>
                          <span className="text-[#FF3E3E]">{regression.slope.toFixed(4)}</span>
                        </div>
                      </div>

                      <div className="border-t border-white/10 pt-2.5">
                        <div className="text-[10px] text-gray-500 uppercase font-bold tracking-widest mb-1">
                          3. Y-Intercept (c) Calculation formula
                        </div>
                        <div className="text-[10px] text-[#FF3E3E] italic mb-2">
                          c = ȳ - m * x̄
                        </div>
                        <div className="flex justify-between font-bold">
                          <span className="text-white">Intercept (c):</span>
                          <span className="text-[#FF3E3E]">${regression.intercept.toFixed(2)}</span>
                        </div>
                      </div>
                    </div>

                    {/* Coefficient of Determination R2 */}
                    <div className="bg-black/60 p-4 rounded-sm border border-white/5 space-y-1">
                      <div className="text-[10px] text-gray-500 uppercase font-bold tracking-widest mb-2">
                        4. Sum of Squares & R² Accuracy
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">SS Total (Total Variance):</span>
                        <span className="text-gray-300">{regression.totalSumSquares.toExponential(3)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">SS Residual (Sum of Errors):</span>
                        <span className="text-[#FF3E3E]">{regression.residualsSumSquares.toExponential(3)}</span>
                      </div>
                      <div className="flex justify-between border-t border-white/10 pt-1.5 mt-1.5 font-bold">
                        <span className="text-white">R² Coefficient:</span>
                        <span className="text-[#FF3E3E]">{regression.r2.toFixed(6)}</span>
                      </div>
                      <p className="text-[10px] text-gray-500 mt-2 leading-normal italic">
                        An R² of {regression.r2.toFixed(3)} means that approximately {(regression.r2 * 100).toFixed(1)}% of the variance in Employee Salaries is explained by their years of professional experience.
                      </p>
                    </div>

                  </div>
                </div>
              )}

              {/* TAB 4: RAW DATASET LIST TABLE */}
              {activeTab === "table" && (
                <div className="space-y-4 font-mono">
                  <div className="flex items-center justify-between bg-black/60 p-4 rounded-sm border border-white/5">
                    <div className="text-xs text-gray-300">
                      Active: <span className="text-[#FF3E3E] font-black">{points.length} coordinates</span>
                    </div>
                    {points.length > 2 && (
                      <button
                        id="clear-all-data-btn"
                        onClick={() => setPoints([])}
                        className="text-[10px] text-[#FF3E3E] hover:text-white uppercase font-bold tracking-wider flex items-center gap-1 hover:underline"
                        title="Delete every data point"
                      >
                        <Trash2 className="h-3 w-3" />
                        Delete All Data
                      </button>
                    )}
                  </div>

                  {/* Tabular scrolling block */}
                  <div className="border border-white/10 rounded-sm overflow-hidden bg-black/20">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="bg-white/5 border-b border-white/10 text-gray-400 font-mono text-[9px] uppercase tracking-wider">
                          <th className="px-3 py-2">ID</th>
                          <th className="px-3 py-2 text-right">Experience (X)</th>
                          <th className="px-3 py-2 text-right">Salary (Y)</th>
                          <th className="px-3 py-2 text-center">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/5 text-gray-300">
                        {points.length === 0 ? (
                          <tr>
                            <td colSpan={4} className="px-3 py-8 text-center text-gray-500 italic">
                              No data points available. Click on the chart or use the form above to add some!
                            </td>
                          </tr>
                        ) : (
                          points.slice().reverse().map((pt) => (
                            <tr 
                              key={`table-row-${pt.id}`} 
                              className={`hover:bg-white/[0.04] transition ${
                                pt.isCustom ? "bg-[#FF3E3E]/5" : ""
                              }`}
                              onMouseEnter={() => setHoveredPointId(pt.id)}
                              onMouseLeave={() => setHoveredPointId(null)}
                            >
                              <td className="px-3 py-1.5 text-gray-500">
                                {pt.isCustom ? (
                                  <span className="text-[8px] px-1 bg-[#FF3E3E]/10 text-[#FF3E3E] rounded-sm border border-[#FF3E3E]/20 font-bold uppercase font-mono">
                                    Custom
                                  </span>
                                ) : (
                                  `#${pt.id}`
                                )}
                              </td>
                              <td className="px-3 py-1.5 text-right font-bold text-white">
                                {pt.experience.toFixed(1)} yrs
                              </td>
                              <td className="px-3 py-1.5 text-right font-bold text-[#FF3E3E]">
                                ${pt.salary.toLocaleString()}
                              </td>
                              <td className="px-3 py-1.5 text-center">
                                <button
                                  id={`delete-pt-btn-${pt.id}`}
                                  onClick={() => handleDeletePoint(pt.id)}
                                  className="text-gray-500 hover:text-[#FF3E3E] p-1 rounded-sm hover:bg-white/5 transition"
                                  title="Delete coordinate point"
                                >
                                  <Trash2 className="h-3 w-3" />
                                </button>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

            </div>
          </div>

          {/* Quick Informational Guide Cards */}
          <div className="bg-white/[0.02] border border-white/10 rounded-sm p-6">
            <h4 className="font-black text-xs tracking-widest uppercase mb-3 text-white flex items-center gap-1.5 font-display">
              <Info className="h-4 w-4 text-[#FF3E3E]" />
              OLS Intuition
            </h4>
            <p className="text-xs text-gray-400 leading-relaxed font-mono">
              When scikit-learn calls <code className="text-[#FF3E3E] bg-black/40 px-1 rounded">lr.fit(X, y)</code>, it aims to find the slope and intercept parameters that minimize the 
              <strong> Residual Sum of Squares (RSS)</strong>. 
            </p>
            <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="bg-black/60 p-4 rounded-sm border border-white/5 text-[11px] font-mono leading-relaxed">
                <span className="block font-black text-white uppercase tracking-wider text-[9px] mb-1">Residual (Error):</span>
                The vertical distance between each data point (Actual Salary) and the regression line (Predicted Salary).
              </div>
              <div className="bg-black/60 p-4 rounded-sm border border-white/5 text-[11px] font-mono leading-relaxed">
                <span className="block font-black text-white uppercase tracking-wider text-[9px] mb-1">Least Squares:</span>
                Squaring errors prevents positive/negative cancelations and penalizes larger deviations more heavily.
              </div>
            </div>
          </div>
        </section>

      </main>

      {/* Footer credits and information */}
      <footer className="border-t border-white/10 bg-black py-8 px-6 mt-12 text-center text-[10px] text-gray-500 font-mono uppercase tracking-wider">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-3">
          <div>
            Built to recreate scikit-learn's <code className="text-[#FF3E3E]">LinearRegression</code> and matplotlib outputs.
          </div>
          <div className="text-gray-600">
            Dataset Source: YBIFoundation (Salary Data.csv) • Dynamic Fitting Engine v1.0
          </div>
        </div>
      </footer>
    </div>
  );
}
