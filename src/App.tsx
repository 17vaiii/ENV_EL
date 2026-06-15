import React, { useState, useEffect, useRef } from 'react';
import { APIProvider, Map, AdvancedMarker, Pin, InfoWindow, useMap } from '@vis.gl/react-google-maps';
import { 
  Bus, 
  MapPin, 
  Wind, 
  Globe, 
  Settings, 
  CloudRain, 
  Sun, 
  CloudSun, 
  Activity, 
  TrendingDown, 
  Leaf, 
  AlertTriangle, 
  TrendingUp, 
  Thermometer, 
  Users, 
  Navigation,
  Sparkles,
  Info
} from 'lucide-react';

const API_KEY =
  process.env.GOOGLE_MAPS_PLATFORM_KEY ||
  (import.meta as any).env?.VITE_GOOGLE_MAPS_PLATFORM_KEY ||
  (globalThis as any).GOOGLE_MAPS_PLATFORM_KEY ||
  '';
const hasValidKey = Boolean(API_KEY) && API_KEY !== 'YOUR_API_KEY' && API_KEY !== 'MY_GOOGLE_MAPS_PLATFORM_KEY' && API_KEY !== '';

// Custom Polyline Drawer using Google Maps direct API
interface PolylineProps {
  path: google.maps.LatLngLiteral[];
  strokeColor?: string;
  strokeOpacity?: number;
  strokeWeight?: number;
  dashed?: boolean;
}

function CustomPolyline({ path, strokeColor = '#10B981', strokeOpacity = 0.8, strokeWeight = 5, dashed = false }: PolylineProps) {
  const map = useMap();
  const polylineRef = useRef<google.maps.Polyline | null>(null);

  useEffect(() => {
    if (!map || path.length === 0) return;

    // Remove any stale polyline
    if (polylineRef.current) {
      polylineRef.current.setMap(null);
    }

    const options: google.maps.PolylineOptions = {
      path,
      strokeColor,
      strokeOpacity,
      strokeWeight,
    };

    if (dashed) {
      options.strokeOpacity = 0;
      options.icons = [{
        icon: {
          path: 'M 0,-1 0,1',
          strokeOpacity: strokeOpacity,
          scale: 3,
          strokeColor,
          strokeWeight
        },
        offset: '0',
        repeat: '20px'
      }];
    }

    polylineRef.current = new google.maps.Polyline(options);
    polylineRef.current.setMap(map);

    // Fit map bounds to encompass the optimized route comparison
    const bounds = new google.maps.LatLngBounds();
    path.forEach(coord => bounds.extend(coord));
    map.fitBounds(bounds, { top: 60, bottom: 60, left: 60, right: 60 });

    return () => {
      if (polylineRef.current) {
        polylineRef.current.setMap(null);
      }
    };
  }, [map, path, strokeColor, strokeOpacity, strokeWeight, dashed]);

  return null;
}

// Preset Route Configuration
const PRESETS = [
  {
    id: 'pt-1',
    label: 'Koramangala ⇌ Indiranagar Hub',
    origin: 'Koramangala 8th Block',
    destination: 'Indiranagar 100 Feet Road',
  },
  {
    id: 'pt-2',
    label: 'RV College of Engineering ⇌ Majestic',
    origin: 'RV College of Engineering Gate',
    destination: 'Kempegowda Bus Station (Majestic)',
  },
  {
    id: 'pt-3',
    label: 'Silk Board Grid ⇌ Hebbal Flyover',
    origin: 'Silk Board Cross Road',
    destination: 'Hebbal Central Hub',
  },
  {
    id: 'pt-4',
    label: 'Electronic City ⇌ Whitefield Corridor',
    origin: 'Electronic City Phase 1',
    destination: 'ITPL Campus Whitefield',
  }
];

export default function App() {
  // Configured inputs
  const [selectedPreset, setSelectedPreset] = useState(PRESETS[0]);
  const [originText, setOriginText] = useState(PRESETS[0].origin);
  const [destText, setDestText] = useState(PRESETS[0].destination);
  const [vehicleType, setVehicleType] = useState('Heavy Diesel Bus');
  const [weather, setWeather] = useState('Sunny');
  const [tempCelsius, setTempCelsius] = useState(30);
  const [congestionLevel, setCongestionLevel] = useState('Heavy');

  // Interactive UI triggers
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [optimizationData, setOptimizationData] = useState<any>(null);
  const [fleetBuses, setFleetBuses] = useState<any[]>([]);
  const [selectedBus, setSelectedBus] = useState<any | null>(null);
  const [activeTab, setActiveTab] = useState<'routing' | 'fleet'>('routing');
  const [activeRouteView, setActiveRouteView] = useState<'both' | 'eco' | 'standard'>('both');

  // Trigger preset changes
  const applyPreset = (preset: typeof PRESETS[0]) => {
    setSelectedPreset(preset);
    setOriginText(preset.origin);
    setDestText(preset.destination);
  };

  // Fetch active fleet list
  const fetchFleet = async () => {
    try {
      const res = await fetch('/api/buses');
      const data = await res.json();
      setFleetBuses(data);
    } catch (e) {
      console.error('Failed to load fleet data:', e);
    }
  };

  // Run Optimization Algorithm
  const runOptimization = async () => {
    setIsOptimizing(true);
    try {
      const res = await fetch('/api/optimize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          origin: originText,
          destination: destText,
          vehicleType,
          weather,
          tempCelsius,
          congestionLevel
        })
      });
      const data = await res.json();
      setOptimizationData(data);
    } catch (e) {
      console.error('EcoRoute optimization failure:', e);
    } finally {
      setIsOptimizing(false);
    }
  };

  // Run simulation / fetch data on starting mounting
  useEffect(() => {
    fetchFleet();
    runOptimization();

    // Set interactive poll interval for coordinates / progress update
    const timer = setInterval(() => {
      setFleetBuses(prev => prev.map(bus => {
        // Mock slight telemetry jitter
        const deltaSpeed = Math.floor(Math.random() * 5) - 2;
        const baseSpeed = parseInt(bus.speed);
        const newSpeed = Math.max(0, baseSpeed + deltaSpeed);
        return {
          ...bus,
          speed: `${newSpeed} km/h`
        };
      }));
    }, 60000);

    return () => clearInterval(timer);
  }, []);

  // Require Google Maps API Key Splash Screen rendering
  if (!hasValidKey) {
    return (
      <div id="api-key-splash" className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-6 antialiased font-sans">
        <div className="max-w-xl w-full bg-slate-900 border border-slate-800 rounded-2xl p-8 shadow-2xl transition-all">
          <div className="flex items-center space-x-3 mb-6">
            <div className="bg-emerald-500/10 p-3 rounded-xl">
              <Leaf className="w-8 h-8 text-emerald-400" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-white">EcoRoute AI</h1>
              <p className="text-slate-400 text-xs tracking-wider uppercase font-medium mt-0.5">Green Transit Operations</p>
            </div>
          </div>

          <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-4 mb-6">
            <div className="flex space-x-3">
              <AlertTriangle className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="font-semibold text-amber-200 text-sm">Google Maps API Key Required</h3>
                <p className="text-slate-300 text-xs mt-1 leading-relaxed">
                  This framework relies on active components from the Google Maps Javascript API. Expose the environment key using the instructions below.
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <h2 className="text-sm font-semibold text-slate-200">How to register your Platform API Key:</h2>
            
            <div className="space-y-3 text-sm text-slate-300">
              <div className="flex items-start space-x-2.5">
                <span className="flex-shrink-0 w-6 h-6 bg-slate-800 text-emerald-400 text-xs font-semibold rounded-full flex items-center justify-center">1</span>
                <p>
                  Claim an API key from the{' '}
                  <a 
                    href="https://console.cloud.google.com/google/maps-apis/start?utm_campaign=gmp-code-assist-ais" 
                    target="_blank" 
                    rel="noreferrer"
                    className="text-emerald-400 hover:underline inline-flex items-center font-medium"
                  >
                    Google Cloud Console
                  </a>
                </p>
              </div>

              <div className="flex items-start space-x-2.5">
                <span className="flex-shrink-0 w-6 h-6 bg-slate-800 text-emerald-400 text-xs font-semibold rounded-full flex items-center justify-center">2</span>
                <p>
                  Add your credentials securely inside <strong>AI Studio Secrets</strong>:
                </p>
              </div>

              <div className="bg-slate-950 rounded-xl p-4 text-xs font-mono border border-slate-800 mt-2 space-y-2">
                <p className="text-emerald-400">// Config steps to activate map:</p>
                <p className="text-slate-300">1. Click the <strong className="text-slate-200 font-bold">⚙️ Settings (Gear Icon)</strong> in top-right screen corner</p>
                <p className="text-slate-300">2. Select the <strong className="text-slate-200 font-bold">Secrets</strong> panel</p>
                <p className="text-slate-300">3. Create a unique secret named: <span className="text-emerald-400">GOOGLE_MAPS_PLATFORM_KEY</span></p>
                <p className="text-slate-300">4. Paste your GCP Maps Key into the value block & submit</p>
              </div>

              <div className="flex items-start space-x-2.5 pt-1">
                <span className="flex-shrink-0 w-6 h-6 bg-slate-800 text-emerald-400 text-xs font-semibold rounded-full flex items-center justify-center">3</span>
                <p className="text-xs text-slate-400">
                  The application compiles and hot-reloads instantly once key definition matches. You do not need to reboot the browser workspace.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Draw routes coordinate vectors
  const standardPath = optimizationData?.coordinates?.standard || [];
  const ecoPath = optimizationData?.coordinates?.eco || [];

  return (
    <div id="main-dashboard" className="min-h-screen bg-[#0B0F19] text-indigo-50 font-sans flex flex-col antialiased selection:bg-indigo-500/30">
      {/* Header Panel */}
      <header id="dashboard-header" className="flex-shrink-0 bg-[#0B0F19]/70 backdrop-blur-xl border-b border-indigo-500/20 px-8 py-5 flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-20 shadow-[0_4px_30px_rgba(0,0,0,0.3)]">
        <div className="flex items-center space-x-3">
          <div className="bg-emerald-500/10 p-2.5 rounded-xl border border-emerald-500/20">
            <Leaf className="w-6 h-6 text-emerald-400 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-xl font-bold tracking-tight text-white">EcoRoute AI</h1>
              <span className="text-[10px] bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded-full border border-emerald-400/20 font-medium">
                V2.5 OPTIMIZER
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">Multi-Objective Optimization Framework for Green Public Transport</p>
          </div>
        </div>

        {/* SDG Target Badges (Direct alignment to presentation) */}
        <div id="sdg-alignment" className="flex items-center space-x-4 text-xs">
          <div className="flex items-center bg-violet-950/30 backdrop-blur border border-violet-500/20 rounded-xl p-2.5 space-x-3 shadow-[0_0_10px_rgba(139,92,246,0.1)] group hover:border-violet-400/50 transition-all">
            <div className="w-6 h-6 rounded-md bg-gradient-to-br from-violet-500 to-indigo-600 text-white flex items-center justify-center font-bold text-[10px] shadow-inner group-hover:scale-110 transition-transform">11</div>
            <div>
              <p className="text-[10px] text-violet-300 uppercase font-bold leading-none tracking-wider">SDG 11 Target</p>
              <p className="text-[11px] text-indigo-100/70 font-medium leading-normal mt-1">Sustainable Cities</p>
            </div>
          </div>
          <div className="flex items-center bg-indigo-950/30 backdrop-blur border border-indigo-500/20 rounded-xl p-2.5 space-x-3 shadow-[0_0_10px_rgba(79,70,229,0.1)] group hover:border-indigo-400/50 transition-all">
            <div className="w-6 h-6 rounded-md bg-gradient-to-br from-indigo-500 to-blue-600 text-white flex items-center justify-center font-bold text-[10px] shadow-inner group-hover:scale-110 transition-transform">13</div>
            <div>
              <p className="text-[10px] text-indigo-300 uppercase font-bold leading-none tracking-wider">SDG 13 Target</p>
              <p className="text-[11px] text-indigo-100/70 font-medium leading-normal mt-1">Climate Action</p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Container Layout */}
      <main id="app-workspace" className="flex-grow flex flex-col lg:flex-row min-h-0 bg-[#0B0F19]">
        
        {/* Sidebar Controls (Left) */}
        <section id="sidebar-controls" className="w-full lg:w-[400px] bg-[#0B0F19]/60 backdrop-blur-2xl border-r border-indigo-500/10 p-6 overflow-y-auto flex-shrink-0 flex flex-col gap-6 relative z-10 shadow-[4px_0_24px_rgba(0,0,0,0.2)]">
          
          {/* Main Navigation Tabs */}
          <div id="dashboard-modes" className="grid grid-cols-2 gap-1.5 bg-[#05070A]/50 p-1.5 rounded-2xl border border-white/5 backdrop-blur-sm">
            <button
              onClick={() => setActiveTab('routing')}
              className={`flex items-center justify-center space-x-2 py-3 rounded-xl text-xs font-semibold tracking-wide transition-all duration-300 ${
                activeTab === 'routing'
                  ? 'bg-gradient-to-r from-violet-600/20 to-indigo-600/20 text-indigo-300 border border-indigo-500/30 shadow-[0_0_15px_rgba(79,70,229,0.15)]'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-white/5 border border-transparent'
              }`}
            >
              <Navigation className="w-4 h-4" />
              <span>Route Optimizer</span>
            </button>
            <button
              onClick={() => setActiveTab('fleet')}
              className={`flex items-center justify-center space-x-2 py-3 rounded-xl text-xs font-semibold tracking-wide transition-all duration-300 ${
                activeTab === 'fleet'
                  ? 'bg-gradient-to-r from-violet-600/20 to-indigo-600/20 text-indigo-300 border border-indigo-500/30 shadow-[0_0_15px_rgba(79,70,229,0.15)]'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-white/5 border border-transparent'
              }`}
            >
              <Bus className="w-4 h-4" />
              <span>Operator Fleet ({fleetBuses.length})</span>
            </button>
          </div>

          {activeTab === 'routing' ? (
            /* Tab Content: Routing & Optimization Config */
            <div id="optimizer-config" className="space-y-4">
              
              {/* Presets List */}
              <div className="space-y-2">
                <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Route Corridor Presets</label>
                <div className="grid grid-cols-1 gap-1.5">
                  {PRESETS.map(preset => (
                    <button
                      key={preset.id}
                      onClick={() => applyPreset(preset)}
                      className={`text-left p-2.5 rounded-xl text-xs transition-all border ${
                        selectedPreset.id === preset.id
                          ? 'bg-emerald-950/20 border-emerald-500/40 text-emerald-200 font-medium'
                          : 'bg-slate-950/40 border-slate-800/80 hover:bg-slate-800 text-slate-300'
                      }`}
                    >
                      <div className="font-semibold">{preset.label}</div>
                      <div className="text-[10px] text-slate-400 mt-1 flex items-center truncate">
                        <MapPin className="w-3 h-3 text-emerald-400 mr-1 flex-shrink-0" />
                        <span>{preset.origin} → {preset.destination}</span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Dynamic Coordinate Text-Inputs */}
              <div className="bg-slate-950/50 rounded-xl p-3 border border-slate-800 space-y-3">
                <div className="space-y-1">
                  <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider flex items-center">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 mr-1.5"></span>
                    Origin Point
                  </label>
                  <input
                    type="text"
                    value={originText}
                    onChange={(e) => setOriginText(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-xs focus:outline-none focus:border-emerald-500 text-slate-200"
                    placeholder="Enter dispatch origin"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider flex items-center">
                    <span className="w-1.5 h-1.5 rounded-full bg-teal-400 mr-1.5"></span>
                    Destination Target
                  </label>
                  <input
                    type="text"
                    value={destText}
                    onChange={(e) => setDestText(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-xs focus:outline-none focus:border-emerald-500 text-slate-200"
                    placeholder="Enter final station location"
                  />
                </div>
              </div>

              {/* Vehicle Factors */}
              <div className="space-y-2">
                <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Vehicle Payload Profile</label>
                <div className="grid grid-cols-2 gap-1.5">
                  {[
                    { id: 'Heavy Diesel Bus', label: 'Diesel Bus', icon: '⛽' },
                    { id: 'Standard CNG Bus', label: 'CNG Carrier', icon: '💨' },
                    { id: 'Eco-Hybrid Bus', label: 'Eco Hybrid', icon: '🔋' },
                    { id: 'Electric Bus', label: 'E-Transit', icon: '⚡' }
                  ].map(v => (
                    <button
                      key={v.id}
                      onClick={() => setVehicleType(v.id)}
                      className={`p-2 rounded-xl text-xs flex items-center space-x-2 border transition-all ${
                        vehicleType === v.id
                          ? 'bg-emerald-950/30 border-emerald-500/50 text-white font-medium'
                          : 'bg-slate-950/30 border-slate-800/80 hover:bg-slate-800 text-slate-300'
                      }`}
                    >
                      <span className="text-sm">{v.icon}</span>
                      <span className="text-[11px]">{v.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Meteorological Factors */}
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Climate Adjustments</label>
                  <span className="text-[10px] text-teal-400 font-mono font-medium">{tempCelsius}°C</span>
                </div>
                
                <div className="bg-slate-950/50 border border-slate-800/80 rounded-xl p-3 space-y-3">
                  <div className="grid grid-cols-3 gap-1">
                    {[
                      { id: 'Sunny', label: 'Sunny', icon: Sun },
                      { id: 'Overcast', label: 'Cloudy', icon: CloudSun },
                      { id: 'Monsoon Rain', label: 'Monsoon', icon: CloudRain }
                    ].map(w => {
                      const IconComponent = w.icon;
                      return (
                        <button
                          key={w.id}
                          onClick={() => {
                            setWeather(w.id);
                            // Adjust temp dynamically on click for convenience
                            if (w.id === 'Sunny') setTempCelsius(32);
                            if (w.id === 'Overcast') setTempCelsius(22);
                            if (w.id === 'Monsoon Rain') setTempCelsius(18);
                          }}
                          className={`py-1.5 px-2 rounded-lg text-[10px] flex flex-col items-center gap-1 border transition-all ${
                            weather === w.id
                              ? 'bg-teal-950/30 border-teal-500/40 text-teal-300 font-bold'
                              : 'bg-slate-900 border-transparent text-slate-400 hover:text-slate-200'
                          }`}
                        >
                          <IconComponent className="w-3.5 h-3.5" />
                          <span>{w.label}</span>
                        </button>
                      )
                    })}
                  </div>

                  <div className="space-y-1 pt-1">
                    <div className="flex justify-between text-[10px] text-slate-400">
                      <span>Ambient Temperature</span>
                      <span>Aux AC Cargo Threshold</span>
                    </div>
                    <input
                      type="range"
                      min="10"
                      max="45"
                      value={tempCelsius}
                      onChange={(e) => setTempCelsius(Number(e.target.value))}
                      className="w-full accent-emerald-500 cursor-pointer h-1 bg-slate-800 rounded-lg"
                    />
                  </div>
                </div>
              </div>

              {/* Congestion Constants */}
              <div className="space-y-2">
                <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Base Congestion Intensity</label>
                <div className="grid grid-cols-3 gap-1">
                  {['Low', 'Moderate', 'Heavy'].map(level => {
                    return (
                      <button
                        key={level}
                        onClick={() => setCongestionLevel(level)}
                        className={`py-2 px-1.5 rounded-lg text-xs font-semibold transition-all border ${
                          congestionLevel === level
                            ? level === 'Heavy' 
                              ? 'bg-rose-950/30 border-rose-500/50 text-rose-300'
                              : level === 'Moderate'
                                ? 'bg-amber-950/30 border-amber-500/50 text-amber-300'
                                : 'bg-emerald-950/30 border-emerald-500/50 text-emerald-300'
                            : 'bg-slate-950/30 border-slate-800/80 hover:bg-slate-800 text-slate-400'
                        }`}
                      >
                        {level}
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Trigger button */}
              <button
                onClick={runOptimization}
                disabled={isOptimizing}
                className="w-full bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white py-3.5 rounded-xl font-bold text-xs tracking-widest uppercase transition-all duration-300 shadow-[0_0_20px_rgba(79,70,229,0.3)] hover:shadow-[0_0_30px_rgba(139,92,246,0.5)] disabled:opacity-50 flex items-center justify-center space-x-2 mt-6 cursor-pointer border border-white/10"
              >
                {isOptimizing ? (
                  <>
                    <Activity className="w-4 h-4 animate-spin text-slate-950" />
                    <span>Analyzing Route Vectors...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 text-slate-950" />
                    <span>Run Multi-Objective Optimization</span>
                  </>
                )}
              </button>

            </div>
          ) : (
            /* Tab Content: Fleet & live telematics trackers */
            <div id="fleet-live-panel" className="space-y-4 flex-grow flex flex-col min-h-0">
              <div className="text-slate-400 text-[10px] uppercase font-bold tracking-wider">Active System Dispatches</div>
              
              <div className="space-y-2 overflow-y-auto flex-grow max-h-[480px] pr-1">
                {fleetBuses.map(bus => (
                  <button
                    key={bus.id}
                    onClick={() => {
                      setSelectedBus(bus);
                      setActiveTab('fleet');
                    }}
                    className={`w-full text-left p-3.5 rounded-2xl border transition-all duration-300 flex flex-col justify-between space-y-3 group ${
                      selectedBus?.id === bus.id
                        ? 'bg-indigo-950/40 border-indigo-400 text-white shadow-[0_0_15px_rgba(79,70,229,0.2)]'
                        : 'bg-slate-900/30 border-white/5 hover:border-indigo-500/30 hover:bg-indigo-950/20 text-slate-300'
                    }`}
                  >
                    <div className="flex justify-between items-center w-full">
                      <div className="flex items-center space-x-2">
                        <div className={`p-1.5 rounded-lg ${
                          bus.ecoMode ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'
                        }`}>
                          <Bus className="w-4 h-4" />
                        </div>
                        <div>
                          <span className="font-bold text-xs text-white">{bus.id}</span>
                          <span className="text-[10px] text-slate-400 ml-2 font-mono">{bus.line}</span>
                        </div>
                      </div>
                      <span className={`text-[9px] px-2 py-0.5 rounded-full font-semibold border ${
                        bus.status === 'OPTIMAL_WAVE' || bus.status === 'GREEN_PATH'
                          ? 'bg-emerald-950/50 text-emerald-400 border-emerald-500/20'
                          : bus.status === 'IDLE_TRAP'
                            ? 'bg-rose-950/50 text-rose-400 border-rose-500/20'
                            : 'bg-amber-950/50 text-amber-400 border-amber-500/20'
                      }`}>
                        {bus.status.replace('_', ' ')}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-[11px] bg-slate-950/40 p-2 rounded-lg">
                      <div className="flex items-center text-slate-400">
                        <Users className="w-3 h-3 text-teal-400 mr-1" />
                        <span>Pax: <strong className="text-slate-200">{bus.passengers}</strong></span>
                      </div>
                      <div className="flex items-center text-slate-400 font-mono">
                        <Activity className="w-3 h-3 text-amber-400 mr-1" />
                        <span>Vel: <strong className="text-slate-200">{bus.speed}</strong></span>
                      </div>
                      <div className="col-span-2 flex justify-between text-[10px] text-slate-400 border-t border-slate-800/80 pt-1.5 mt-0.5">
                        <span>Rate: <strong className="text-emerald-400 font-bold">{bus.fuelRate}</strong></span>
                        <span className={bus.delay.includes('+') ? 'text-amber-400' : 'text-emerald-400'}>{bus.delay}</span>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Environmental Attribution info */}
          <footer className="mt-auto border-t border-slate-800/80 pt-4 text-[10px] text-slate-500 space-y-1">
            <p>Developed with Google Maps Platform and Gemini model intelligence.</p>
            <p className="font-mono text-[9px] text-slate-600">Attribution ID: gmp_mcp_codeassist_v1_aistudio</p>
          </footer>
        </section>

        {/* Center Dashboard View (Map & Statistics cards) */}
        <section id="analytics-console" className="flex-grow flex flex-col min-h-0 bg-[#05070A] relative">
          
          {/* Statistics summary overlays (Direct Alignment with Presentation expected impacts) */}
          {optimizationData && activeTab === 'routing' && (
            <div id="impact-cards-deck" className="bg-[#0B0F19]/80 backdrop-blur-xl p-5 border-b border-indigo-500/10 grid grid-cols-2 md:grid-cols-4 gap-4 relative z-20 shadow-[0_8px_30px_rgba(0,0,0,0.3)]">
              
              {/* SDG Fuel Savings card */}
              <div className="bg-slate-900/40 backdrop-blur-md border border-indigo-500/20 rounded-2xl p-4 flex flex-col justify-between shadow-[0_4px_20px_rgba(0,0,0,0.2)] hover:border-indigo-400/50 hover:shadow-[0_0_15px_rgba(79,70,229,0.3)] transition-all duration-300">
                <div className="flex justify-between items-start">
                  <div className="p-1.5 bg-emerald-500/10 rounded-lg text-emerald-400">
                    <TrendingDown className="w-4 h-4" />
                  </div>
                  <span className="text-[10px] text-emerald-400 font-bold bg-emerald-950/50 px-1.5 py-0.5 rounded border border-emerald-500/10">
                    -{optimizationData.metrics?.fuelSavingsPercent}% Fuel
                  </span>
                </div>
                <div className="mt-2.5">
                  <p className="text-[10px] text-slate-400 uppercase font-medium">Net Fuel Savings</p>
                  <p className="text-lg font-bold text-white mt-0.5">
                    {optimizationData.metrics?.fuelSavedLiters} <span className="text-xs font-normal text-slate-400">Liters</span>
                  </p>
                </div>
              </div>

              {/* CO2 reduction card */}
              <div className="bg-slate-900/40 backdrop-blur-md border border-indigo-500/20 rounded-2xl p-4 flex flex-col justify-between shadow-[0_4px_20px_rgba(0,0,0,0.2)] hover:border-indigo-400/50 hover:shadow-[0_0_15px_rgba(79,70,229,0.3)] transition-all duration-300">
                <div className="flex justify-between items-start">
                  <div className="p-1.5 bg-teal-500/10 rounded-lg text-teal-400">
                    <Wind className="w-4 h-4" />
                  </div>
                  <span className="text-[10px] text-teal-400 font-bold bg-teal-950/50 px-1.5 py-0.5 rounded border border-teal-500/10">
                    -{optimizationData.metrics?.co2SavingsPercent}% Emis
                  </span>
                </div>
                <div className="mt-2.5">
                  <p className="text-[10px] text-slate-400 uppercase font-medium">Carbon Avoided</p>
                  <p className="text-lg font-bold text-white mt-0.5">
                    {optimizationData.metrics?.co2ReducedKg} <span className="text-xs font-normal text-slate-400">kg CO₂</span>
                  </p>
                </div>
              </div>

              {/* Trees planted card */}
              <div className="bg-slate-900/40 backdrop-blur-md border border-indigo-500/20 rounded-2xl p-4 flex flex-col justify-between shadow-[0_4px_20px_rgba(0,0,0,0.2)] hover:border-indigo-400/50 hover:shadow-[0_0_15px_rgba(79,70,229,0.3)] transition-all duration-300">
                <div className="flex justify-between items-start">
                  <div className="p-1.5 bg-green-500/10 rounded-lg text-green-400">
                    <Leaf className="w-4 h-4" />
                  </div>
                  <span className="text-[10px] text-green-400 font-bold bg-green-950/50 px-1.5 py-0.5 rounded border border-green-500/10">
                    Equivalent
                  </span>
                </div>
                <div className="mt-2.5">
                  <p className="text-[10px] text-slate-400 uppercase font-medium">Absorb-Rate Equity</p>
                  <p className="text-lg font-bold text-white mt-0.5">
                    {optimizationData.metrics?.equivalentTreesPlanted} <span className="text-xs font-normal text-slate-400">Tree-Days</span>
                  </p>
                </div>
              </div>

              {/* Signal prioritized rating */}
              <div className="bg-slate-900/40 backdrop-blur-md border border-indigo-500/20 rounded-2xl p-4 flex flex-col justify-between shadow-[0_4px_20px_rgba(0,0,0,0.2)] hover:border-indigo-400/50 hover:shadow-[0_0_15px_rgba(79,70,229,0.3)] transition-all duration-300">
                <div className="flex justify-between items-start">
                  <div className="p-1.5 bg-indigo-500/10 rounded-lg text-indigo-400">
                    <Activity className="w-4 h-4" />
                  </div>
                  <span className="text-[10px] text-slate-300 font-semibold bg-indigo-950/20 px-2 py-0.5 rounded-full border border-indigo-500/15">
                    Traffic
                  </span>
                </div>
                <div className="mt-2.5">
                  <p className="text-[10px] text-slate-400 uppercase font-medium">Eco Priority Level</p>
                  <p className="text-sm font-bold text-indigo-300 mt-1 flex items-center">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 mr-1.5 inline-block"></span>
                    92% Optimal
                  </p>
                </div>
              </div>

            </div>
          )}

          {/* Map Viewer Area (Main workspace bottom) */}
          <div id="operator-map-container" className="flex-grow relative h-96 lg:h-auto min-h-[350px]">
            <APIProvider apiKey={API_KEY} version="weekly">
              <Map
                defaultCenter={{ lat: 12.9716, lng: 77.5946 }}
                defaultZoom={12}
                mapId="e8c56e3009ec38da" // Standard DEMO_MAP_ID/Custom customized styled map ID
                internalUsageAttributionIds={['gmp_mcp_codeassist_v1_aistudio']}
                style={{ width: '100%', height: '100%' }}
                gestureHandling="cooperative"
                disableDefaultUI={false}
              >
                
                {/* Fallback route indicators drawn if optimization records are loaded */}
                {activeTab === 'routing' && (activeRouteView === 'both' || activeRouteView === 'standard') && standardPath.length > 0 && (
                  <CustomPolyline 
                    path={standardPath} 
                    strokeColor="#F43F5E" // Slate Red for congestion segment
                    strokeWeight={4}
                    dashed={true}
                    strokeOpacity={0.65}
                  />
                )}

                {activeTab === 'routing' && (activeRouteView === 'both' || activeRouteView === 'eco') && ecoPath.length > 0 && (
                  <CustomPolyline 
                    path={ecoPath} 
                    strokeColor="#059669" // Emerald Green for eco wavelength Segment
                    strokeWeight={6}
                    dashed={false}
                    strokeOpacity={0.9}
                  />
                )}

                {/* Draw Markers for starting and ending targets */}
                {activeTab === 'routing' && standardPath.length > 0 && (
                  <>
                    <AdvancedMarker position={standardPath[0]} title="Origin Dispatch Gate">
                      <Pin background="#E11D48" glyphColor="#fff" borderColor="#9F1239">
                        <div className="p-1 font-bold text-[9px]">A</div>
                      </Pin>
                    </AdvancedMarker>
                    <AdvancedMarker position={standardPath[standardPath.length - 1]} title="Destination Station Hub">
                      <Pin background="#059669" glyphColor="#fff" borderColor="#065F46">
                        <div className="p-1 font-bold text-[9px]">B</div>
                      </Pin>
                    </AdvancedMarker>
                  </>
                )}

                {/* Active Fleet Dispatched pin arrays */}
                {fleetBuses.map((bus) => (
                  <AdvancedMarker
                    key={bus.id}
                    position={{ lat: bus.lat, lng: bus.lng }}
                    onClick={() => {
                      setSelectedBus(bus);
                      setActiveTab('fleet');
                    }}
                  >
                    <div className="relative group cursor-pointer transition-all hover:scale-110">
                      {/* Outer pulse indicator */}
                      <span className={`absolute -top-1 -right-1 flex h-3 w-3`}>
                        <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                          bus.ecoMode ? 'bg-emerald-400' : 'bg-rose-400'
                        }`}></span>
                        <span className={`relative inline-flex rounded-full h-3 w-3 ${
                          bus.ecoMode ? 'bg-emerald-500' : 'bg-rose-500'
                        }`}></span>
                      </span>

                      {/* Main Pin shape */}
                      <div className={`p-2 rounded-xl border flex items-center justify-center shadow-xl ${
                        bus.ecoMode 
                          ? 'bg-emerald-950 border-emerald-500 text-emerald-400' 
                          : 'bg-rose-950 border-rose-500 text-rose-400'
                      }`}>
                        <Bus className="w-4 h-4" />
                      </div>

                      {/* Hover vehicle ID tooltip */}
                      <div className="absolute top-10 left-1/2 -translate-x-1/2 bg-slate-900 border border-slate-700 text-[10px] text-white px-2 py-0.5 rounded whitespace-nowrap shadow-lg pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity">
                        {bus.id} ({bus.speed})
                      </div>
                    </div>
                  </AdvancedMarker>
                ))}

                {/* Show detailed inspect parameters inside Google InfoWindow if clicked */}
                {selectedBus && (
                  <InfoWindow
                    position={{ lat: selectedBus.lat, lng: selectedBus.lng }}
                    onCloseClick={() => setSelectedBus(null)}
                  >
                    <div className="p-2 text-slate-800 min-w-[200px] text-xs">
                      <div className="flex justify-between items-center border-b border-slate-200 pb-1.5 mb-2">
                        <h4 className="font-bold text-slate-900 text-sm flex items-center">
                          <Bus className="w-3.5 h-3.5 text-emerald-600 mr-1" />
                          {selectedBus.id}
                        </h4>
                        <span className={`text-[9px] px-1.5 rounded font-mono ${
                          selectedBus.ecoMode ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                        }`}>
                          {selectedBus.ecoMode ? 'Eco-Active' : 'Unoptimized'}
                        </span>
                      </div>

                      <div className="space-y-1 text-slate-600">
                        <p><strong>Route line:</strong> {selectedBus.line}</p>
                        <p><strong>Speed:</strong> {selectedBus.speed}</p>
                        <p><strong>Schedule Delay:</strong> {selectedBus.delay}</p>
                        <p><strong>Passengers on-board:</strong> {selectedBus.passengers} / 70</p>
                        <p><strong>Local Fuel Rate:</strong> {selectedBus.fuelRate}</p>
                        <p className="border-t border-slate-100 pt-1.5 mt-1 text-[10px]">
                          <strong>Estimated saved so far:</strong>{' '}
                          <span className="text-green-600 font-bold">
                            {selectedBus.metrics.litersSaved} Liters
                          </span>
                        </p>
                      </div>
                    </div>
                  </InfoWindow>
                )}

              </Map>
            </APIProvider>

            {/* Map Overlay legend & view controls */}
            <div id="map-control-overlay" className="absolute bottom-6 left-6 bg-[#0B0F19]/85 backdrop-blur-xl border border-indigo-500/30 rounded-2xl p-4 shadow-[0_8px_32px_rgba(79,70,229,0.2)] z-10 text-xs space-y-3 max-w-[260px]">
              <div className="font-semibold text-white">Operator Legend</div>
              <div className="space-y-1.5">
                <div className="flex items-center space-x-2">
                  <div className="w-3.5 h-1.5 rounded-full bg-emerald-600"></div>
                  <span className="text-[11px] text-slate-300">Eco-Priority Route (Signal Prioritized)</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-3.5 h-1.5 rounded-full bg-rose-500 bg-dashed border-b border-dashed"></div>
                  <span className="text-[11px] text-slate-300">Standard Grid Corridor (High Idle Hotspot)</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
                  <span className="text-[11px] text-slate-300">Active E-Bus Telemetry</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-rose-500"></span>
                  <span className="text-[11px] text-slate-300">Standard Diesel Fleet</span>
                </div>
              </div>

              {activeTab === 'routing' && standardPath.length > 0 && (
                <div className="border-t border-slate-800 pt-2.5 mt-2 space-y-1.5">
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Visual Filters</span>
                  <div className="flex gap-1">
                    <button
                      onClick={() => setActiveRouteView('both')}
                      className={`px-2 py-1 rounded text-[10px] font-semibold ${activeRouteView === 'both' ? 'bg-emerald-500 text-slate-950' : 'bg-slate-800 text-slate-300'}`}
                    >
                      Compare
                    </button>
                    <button
                      onClick={() => setActiveRouteView('eco')}
                      className={`px-2 py-1 rounded text-[10px] font-semibold ${activeRouteView === 'eco' ? 'bg-emerald-500 text-slate-950' : 'bg-slate-800 text-slate-300'}`}
                    >
                      Eco
                    </button>
                    <button
                      onClick={() => setActiveRouteView('standard')}
                      className={`px-2 py-1 rounded text-[10px] font-semibold ${activeRouteView === 'standard' ? 'bg-emerald-500 text-slate-950' : 'bg-slate-800 text-slate-300'}`}
                    >
                      Standard
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* AI Optimizer recommendation popover */}
            {optimizationData && activeTab === 'routing' && (
              <div id="recommendation-popover" className="absolute top-6 right-6 max-w-sm bg-[#0B0F19]/85 backdrop-blur-xl border border-indigo-500/30 rounded-2xl p-5 shadow-[0_8px_32px_rgba(79,70,229,0.2)] z-10 text-xs space-y-4 max-h-[400px] overflow-y-auto">
                <div className="flex items-center space-x-2 border-b border-slate-800 pb-2">
                  <Sparkles className="w-4 h-4 text-emerald-400" />
                  <span className="font-bold text-white text-xs tracking-wide">Multi-Objective Insights</span>
                </div>

                <div className="space-y-1 font-sans">
                  <p className="text-slate-300 leading-relaxed font-semibold text-[11px]">
                    {optimizationData.summary}
                  </p>
                  <p className="text-slate-400 italic text-[10px] mt-1.5 leading-normal">
                    {optimizationData.weatherImpact}
                  </p>
                </div>

                <div className="space-y-2 pt-2 border-t border-slate-800">
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">EcoRoute Recommendations</span>
                  <ul className="space-y-1.5 text-slate-300 text-[11px]">
                    {optimizationData.insights?.map((ins: string, idx: number) => (
                      <li key={idx} className="flex items-start">
                        <span className="text-emerald-400 mr-1.5 inline-block select-none">•</span>
                        <span>{ins}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {optimizationData.ecoRoute?.bypassDetails && (
                  <div className="bg-emerald-950/20 border border-emerald-500/10 rounded-lg p-2 text-[10px] text-emerald-300 font-sans mt-2">
                    <strong className="block text-[9px] uppercase tracking-wider text-emerald-400 mb-0.5">Bypass Directives:</strong>
                    {optimizationData.ecoRoute.bypassDetails}
                  </div>
                )}

                {optimizationData.fallbackWarning && (
                  <div className="bg-amber-950/30 border border-amber-500/15 rounded-lg p-2 text-[10px] text-amber-300 flex items-center space-x-1.5 leading-normal">
                    <Info className="w-3.5 h-3.5 flex-shrink-0" />
                    <span>{optimizationData.fallbackWarning}</span>
                  </div>
                )}
              </div>
            )}

          </div>

          {/* Quick Route comparison stat table at the bottom */}
          {optimizationData && activeTab === 'routing' && (
            <div id="metrics-tabulator" className="bg-[#0B0F19]/90 backdrop-blur-md border-t border-indigo-500/20 p-5 overflow-x-auto relative z-20 shadow-[0_-8px_30px_rgba(0,0,0,0.2)]">
              <table className="w-full text-left text-xs min-w-[600px]">
                <thead>
                  <tr className="text-slate-400 border-b border-slate-800/80 pb-2">
                    <th className="pb-2 font-bold uppercase text-[10px]">Route Segment Profile</th>
                    <th className="pb-2 font-bold uppercase text-[10px]">Distance</th>
                    <th className="pb-2 font-bold uppercase text-[10px]">Est. Duration</th>
                    <th className="pb-2 font-bold uppercase text-[10px]">Fuel Consumed</th>
                    <th className="pb-2 font-bold uppercase text-[10px]">CO₂ Emissions</th>
                    <th className="pb-2 font-bold uppercase text-[10px]">Congestion Score</th>
                    <th className="pb-2 font-bold uppercase text-[10px]">Hotspots / Staging Bays</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/80">
                  <tr className="hover:bg-slate-800/20">
                    <td className="py-2.5 font-bold text-rose-400 flex items-center">
                      <span className="w-1.5 h-1.5 rounded-full bg-rose-500 mr-2"></span>
                      {optimizationData.standardRoute?.name}
                    </td>
                    <td className="py-2.5 font-mono">{optimizationData.standardRoute?.distanceKm} km</td>
                    <td className="py-2.5 font-mono">{optimizationData.standardRoute?.durationMinutes} mins</td>
                    <td className="py-2.5 font-mono text-slate-300">{optimizationData.standardRoute?.estFuelLiters} L</td>
                    <td className="py-2.5 font-mono text-rose-300 font-semibold">{optimizationData.standardRoute?.estCO2Kg} kg</td>
                    <td className="py-2.5">
                      <span className="px-2 py-0.5 rounded bg-rose-950/40 text-rose-300 border border-rose-500/10 font-bold text-[10px]">
                        {optimizationData.standardRoute?.congestionScore}/10 Peak
                      </span>
                    </td>
                    <td className="py-2.5 text-xs text-slate-400 truncate max-w-[200px]" title={optimizationData.standardRoute?.hotspots?.join(', ')}>
                      {optimizationData.standardRoute?.hotspots?.join(', ')}
                    </td>
                  </tr>
                  <tr className="hover:bg-slate-800/20">
                    <td className="py-2.5 font-bold text-emerald-400 flex items-center">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-2"></span>
                      {optimizationData.ecoRoute?.name}
                    </td>
                    <td className="py-2.5 font-mono">{optimizationData.ecoRoute?.distanceKm} km</td>
                    <td className="py-2.5 font-mono text-emerald-200">{optimizationData.ecoRoute?.durationMinutes} mins</td>
                    <td className="py-2.5 font-mono text-emerald-400 font-bold">{optimizationData.ecoRoute?.estFuelLiters} L</td>
                    <td className="py-2.5 font-mono text-emerald-400 font-bold">{optimizationData.ecoRoute?.estCO2Kg} kg</td>
                    <td className="py-2.5">
                      <span className="px-2 py-0.5 rounded bg-emerald-950/40 text-emerald-400 border border-emerald-500/10 font-bold text-[10px]">
                        {optimizationData.ecoRoute?.congestionScore}/10 Fluid
                      </span>
                    </td>
                    <td className="py-2.5 text-xs text-slate-400 truncate max-w-[200px]" title={optimizationData.ecoRoute?.alternativeStops?.join(', ')}>
                      {optimizationData.ecoRoute?.alternativeStops?.join(', ')}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          )}

        </section>

      </main>
    </div>
  );
}
