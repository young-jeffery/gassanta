import { useState, useEffect } from 'react';
import AddParticipant from './components/AddParticipant';
import Login from './components/Login';
import AdminPanel from './components/AdminPanel';

function App() {
  const [currentView, setCurrentView] = useState('register');

  const VIEW_TITLES = {
    register: "Join the Exchange",
    login: "Participant Portal",
    admin: "Admin Access"
  };

  // NEW: Check if user is already remembered on load
  useEffect(() => {
    const savedUser = localStorage.getItem('secretSantaUser');
    if (savedUser) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setCurrentView('login');
    }
  }, []);

  return (
    <div className="min-h-screen bg-santa-cream font-sans flex flex-col items-center py-12 px-4">

      <header className="text-center mb-10">
        <h1 className="text-4xl md:text-5xl font-serif font-black text-santa-burgundy tracking-wider uppercase">
          Secret Santa
        </h1>
        <p className="text-santa-taupe mt-2 font-serif italic">2025 Edition</p>
      </header>

      <div className="bg-white/50 p-1 rounded-full shadow-sm mb-10 flex items-center backdrop-blur-sm border border-santa-cream/20">
        <button
          onClick={() => setCurrentView('register')}
          className={`px-8 py-3 rounded-full text-sm font-semibold transition-all duration-500 tracking-widest uppercase cursor-pointer ${currentView === 'register'
              ? 'bg-santa-red text-santa-cream shadow-md'
              : 'text-santa-taupe hover:bg-santa-red/10'
            }`}
        >
          Join
        </button>
        <button
          onClick={() => setCurrentView('login')}
          className={`px-8 py-3 rounded-full text-sm font-semibold transition-all duration-500 tracking-widest uppercase cursor-pointer ${currentView === 'login'
              ? 'bg-santa-green text-santa-cream shadow-md'
              : 'text-santa-taupe hover:bg-santa-green/10'
            }`}
        >
          Status
        </button>
      </div>

      <h2 className="text-2xl font-serif font-bold text-santa-green mb-6">
        {VIEW_TITLES[currentView]}
      </h2>

      <div className="w-full max-w-2xl">
        {currentView === 'register' && <AddParticipant />}
        {currentView === 'login' && <Login />}
        {currentView === 'admin' && <AdminPanel />}
      </div>

      <button
        onClick={() => setCurrentView('admin')}
        className="mt-16 text-santa-taupe/30 hover:text-santa-taupe text-xs uppercase tracking-widest transition-colors cursor-pointer"
      >
        Admin Access
      </button>

    </div>
  );
}

export default App;