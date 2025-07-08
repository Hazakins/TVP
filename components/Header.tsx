
import React from 'react';
import { Player, View } from '../types.ts';
import { BookOpenIcon } from './icons/BookOpenIcon.tsx';
import { ArrowPathIcon } from './icons/ArrowPathIcon.tsx';

interface HeaderProps {
  selectedPlayer: Player | null;
  onPlayerLogout: () => void;
  currentView: View;
  onViewChange: (view: View) => void;
  currentRound: number;
  totalRounds: number;
  definedTotalRounds: number | null;
  onRoundChange: (round: number) => void;
  isDirectorMode: boolean;
  onDirectorLoginClick: () => void;
  onDirectorExit: () => void;
  onNewEventClick: () => void;
  checkedInCount: number;
  playerCount: number;
  eventFinished: boolean;
  onViewRulesClick: () => void;
  isEventActive: boolean;
  onRefresh: () => void;
}

const Header: React.FC<HeaderProps> = ({ 
  selectedPlayer, 
  onPlayerLogout, 
  currentView, 
  onViewChange, 
  currentRound, 
  totalRounds, 
  definedTotalRounds,
  onRoundChange,
  isDirectorMode,
  onDirectorLoginClick,
  onDirectorExit,
  onNewEventClick,
  checkedInCount,
  playerCount,
  eventFinished,
  onViewRulesClick,
  isEventActive,
  onRefresh
}) => {
  const NavButton: React.FC<{ view: View, label: string }> = ({ view, label }) => (
    <button
      onClick={() => onViewChange(view)}
      className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
        currentView === view
          ? 'bg-lime-400 text-slate-900'
          : 'text-slate-300 hover:bg-slate-700 hover:text-white'
      }`}
    >
      {label}
    </button>
  );
  
  const isLatestRound = currentRound >= totalRounds;
  
  if (currentView === View.DataImport && isDirectorMode) {
    return (
        <header className="bg-slate-800 shadow-lg">
             <div className="container mx-auto px-4 md:px-6 flex items-center justify-between h-16">
                 <div className="flex items-center">
                    <div className="ml-4">
                        <h1 className="font-teko text-3xl tracking-wider text-white uppercase">
                            Treasure Valley Pickleball
                        </h1>
                         <p className="text-slate-400 -mt-2">Event Setup</p>
                    </div>
                 </div>
                 <button
                    onClick={onDirectorExit}
                    className="bg-red-600 hover:bg-red-700 text-white px-3 py-2 rounded-md text-sm font-medium transition-colors"
                >
                    Exit Director Mode
                </button>
             </div>
        </header>
    );
  }

  const renderMobileNav = () => {
    if (!selectedPlayer) return null;

    return (
       <div className="md:hidden flex justify-center items-center space-x-4 pb-3">
          {eventFinished ? (
              <NavButton view={View.Results} label="Final Results" />
          ) : (
            <>
              <NavButton view={View.PlayerDashboard} label="My Dashboard" />
              <NavButton view={View.AllCourts} label="All Courts" />
            </>
          )}
          {isDirectorMode && !eventFinished && (
              <NavButton view={View.DirectorDashboard} label="Director" />
          )}
        </div>
    );
  };

  return (
    <header className="bg-slate-800/50 backdrop-blur-sm sticky top-0 z-10 shadow-lg shadow-black/20">
      <nav className="container mx-auto px-4 md:px-6">
        <div className="flex items-center justify-between h-16">
          <a href="#" onClick={(e) => { e.preventDefault(); if (selectedPlayer) {onViewChange(View.PlayerDashboard)} else {onViewChange(View.PlayerSelection)} }} className="flex items-center cursor-pointer group">
              <span className="font-teko text-3xl tracking-wider text-white uppercase">Treasure Valley Pickleball</span>
          </a>
          
          <div className="flex items-center space-x-4">
            {/* Player Navigation */}
            {selectedPlayer && (
              <div className="hidden md:flex items-center space-x-2">
                {eventFinished ? <NavButton view={View.Results} label="Final Results" /> : (
                  <>
                    <NavButton view={View.PlayerDashboard} label="My Dashboard" />
                    <NavButton view={View.AllCourts} label="All Courts" />
                  </>
                )}
              </div>
            )}

            {/* Director Navigation */}
            {isDirectorMode && (
              <div className="hidden md:flex items-center space-x-2 border-l border-slate-700 ml-2 pl-2">
                {!eventFinished && <NavButton view={View.DirectorDashboard} label="Director Dashboard" />}
                {!selectedPlayer && !eventFinished && <NavButton view={View.AllCourts} label="All Courts" />}
                {eventFinished && !selectedPlayer && <NavButton view={View.Results} label="Final Results" />}
              </div>
            )}
            
            {/* Round Selector (Player View) */}
            {selectedPlayer && !eventFinished && totalRounds > 0 && (
              <div className="flex items-center space-x-2 bg-slate-700/50 rounded-lg p-1">
                  <button onClick={() => onRoundChange(currentRound - 1)} disabled={currentRound <= 1} className="px-2 py-1 rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-600 transition-colors" title="Go to previous round">&lt;</button>
                  <span className="text-sm font-medium w-28 text-center">Round {currentRound} {definedTotalRounds ? `of ${definedTotalRounds}`: ''}</span>
                  <button onClick={() => onRoundChange(currentRound + 1)} disabled={isLatestRound} className="px-2 py-1 rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-600 transition-colors" title="Go to next round">&gt;</button>
              </div>
            )}

            <div className="flex items-center space-x-3 border-l border-slate-700 ml-2 pl-3">
               {/* Refresh Button */}
              <button 
                onClick={onRefresh} 
                className="p-2 text-slate-300 hover:text-white hover:bg-slate-700 rounded-full transition-colors" 
                title="Refresh Data"
              >
                <ArrowPathIcon className="h-6 w-6" />
              </button>

              {/* Rules Button */}
              {isEventActive && (
                 <button onClick={onViewRulesClick} className="p-2 text-slate-300 hover:text-white hover:bg-slate-700 rounded-full transition-colors" title="View Event Rules">
                   <BookOpenIcon className="h-6 w-6" />
                 </button>
              )}

              {/* Status Indicators */}
              {isDirectorMode && !selectedPlayer && playerCount > 0 && (
                 <span className="text-sm text-slate-300">Checked-in: {checkedInCount}/{playerCount}</span>
              )}

              {selectedPlayer && (
                  <span className="text-sm text-white">Welcome, <span className="font-bold">{selectedPlayer.name.split(' ')[0]}</span></span>
              )}

              {/* Action Buttons */}
              {isDirectorMode ? (
                <button onClick={onDirectorExit} className="bg-red-600 hover:bg-red-700 text-white px-3 py-2 rounded-md text-sm font-medium transition-colors">
                  {selectedPlayer ? 'Exit Director' : 'Exit'}
                </button>
              ) : selectedPlayer ? (
                 <button onClick={onDirectorLoginClick} className="bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-2 rounded-md text-sm font-medium transition-colors">
                    Director Mode
                </button>
              ) : (
                 eventFinished ? (
                    isEventActive ? <NavButton view={View.Results} label="View Final Results" /> : <div/>
                 ) : (
                    <button onClick={onDirectorLoginClick} className="bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-2 rounded-md text-sm font-medium transition-colors">
                        Event Director
                    </button>
                 )
              )}

              {selectedPlayer && (
                 <button onClick={onPlayerLogout} className="bg-red-600 hover:bg-red-700 text-white px-3 py-2 rounded-md text-sm font-medium transition-colors">
                    Logout
                </button>
              )}

              {isDirectorMode && (
                <button onClick={onNewEventClick} className="text-sm font-medium text-slate-300 hover:text-white px-3 py-2 rounded-md hover:bg-slate-700 transition-colors">New Event</button>
              )}
            </div>
          </div>
        </div>
        {renderMobileNav()}
      </nav>
    </header>
  );
};

export default Header;
