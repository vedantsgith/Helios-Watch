import React from 'react';
import { Radio, History, BookOpen } from 'lucide-react';

interface ViewSelectorProps {
    currentView: 'live' | 'history' | 'physics';
    onViewChange: (view: 'live' | 'history' | 'physics') => void;
}

export const ViewSelector: React.FC<ViewSelectorProps> = ({ currentView, onViewChange }) => {
    return (
        <div className="glass-card !rounded-full p-1 flex items-center gap-1 bg-black/40 backdrop-blur-xl border-white/10">
            {/* LIVE BUTTON */}
            <button
                onClick={() => onViewChange('live')}
                className={`flex items-center gap-2 px-6 py-2 rounded-full text-sm font-bold tracking-wider transition-all duration-300 ${currentView === 'live'
                        ? 'bg-white text-black shadow-[0_0_20px_rgba(255,255,255,0.3)]'
                        : 'text-gray-400 hover:text-white hover:bg-white/5'
                    }`}
            >
                <Radio size={14} className={currentView === 'live' ? 'animate-pulse' : ''} />
                LIVE
            </button>

            {/* HISTORY BUTTON */}
            <button
                onClick={() => onViewChange('history')}
                className={`flex items-center gap-2 px-6 py-2 rounded-full text-sm font-bold tracking-wider transition-all duration-300 ${currentView === 'history'
                        ? 'bg-white text-black shadow-[0_0_20px_rgba(255,255,255,0.3)]'
                        : 'text-gray-400 hover:text-white hover:bg-white/5'
                    }`}
            >
                <History size={14} />
                HISTORY
            </button>

            {/* PHYSICS BUTTON */}
            <button
                onClick={() => onViewChange('physics')}
                className={`flex items-center gap-2 px-6 py-2 rounded-full text-sm font-bold tracking-wider transition-all duration-300 ${currentView === 'physics'
                        ? 'bg-white text-black shadow-[0_0_20px_rgba(255,255,255,0.3)]'
                        : 'text-gray-400 hover:text-white hover:bg-white/5'
                    }`}
            >
                <BookOpen size={14} />
                PHYSICS
            </button>
        </div>
    );
};
