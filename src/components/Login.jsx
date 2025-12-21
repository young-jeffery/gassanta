import { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';
import RevealCard from './RevealCard';
import RulesCard from './RulesCard';

export default function Login() {
  const [name, setName] = useState('');
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [user, setUser] = useState(null);
  const [allParticipantsNames, setAllParticipantsNames] = useState([]);

  useEffect(() => {
    const fetchAllNames = async () => {
      const querySnapshot = await getDocs(collection(db, "participants"));
      const names = querySnapshot.docs.map(doc => doc.data().name);
      setAllParticipantsNames(names);
    };
    fetchAllNames();

    // NEW: Check for saved user on load
    const storedUser = localStorage.getItem('secretSantaUser');
    if (storedUser) {
        try {
            const { name: savedName, pin: savedPin } = JSON.parse(storedUser);
            if(savedName && savedPin) {
                setName(savedName);
                setPin(savedPin);
                // eslint-disable-next-line react-hooks/immutability
                performLogin(savedName, savedPin);
            }
        } catch (e) {
            console.error("Error parsing saved user", e);
        }
    }
  }, []);

  const performLogin = async (loginName, loginPin) => {
    try {
        const q = query(
          collection(db, "participants"),
          where("name", "==", loginName.trim()),
          where("pin", "==", loginPin)
        );
  
        const snapshot = await getDocs(q);
  
        if (snapshot.empty) {
          setError("Invalid name or PIN.");
        } else {
          const userData = snapshot.docs[0].data();
          setUser(userData);
          // Update storage (refreshes the session)
          localStorage.setItem('secretSantaUser', JSON.stringify({ name: loginName, pin: loginPin }));
        }
      } catch (err) {
        console.error(err);
        setError("System error. Please try again later.");
      }
  }

  const handleLogin = (e) => {
    e.preventDefault();
    setError('');
    performLogin(name, pin);
  };

  const handleLogout = () => {
      setUser(null);
      localStorage.removeItem('secretSantaUser');
      setName('');
      setPin('');
      window.location.reload(); 
  }

  // LOGGED IN VIEW
  if (user) {
    return (
      <div>
        <RulesCard />
        <div className="bg-white p-8 rounded-xl shadow-xl border-t-4 border-santa-green text-center">
          <h2 className="text-3xl font-serif font-bold text-santa-green mb-2">
            Welcome, {user.name}.
          </h2>

          <div className="mt-10">
            {user.assignedTo ? (
              <div>
                <p className="text-santa-taupe mb-6 text-lg">Your assigned recipient is ready.</p>
                <RevealCard
                  matchName={user.assignedTo}
                  nameList={allParticipantsNames.length > 5 ? allParticipantsNames : null}
                />
              </div>
            ) : (
              <div className="py-10 bg-santa-cream/30 rounded-lg border border-santa-cream">
                <p className="text-santa-taupe text-xl font-serif">
                  Status: <span className="font-bold text-santa-green">Waiting for Shuffle</span>
                </p>
                <p className="mt-4 text-santa-taupe/60 text-sm">
                   The Admin hasn't shuffled the names yet.<br/> Check back soon!
                </p>
              </div>
            )}
          </div>

          <button
            onClick={handleLogout}
            className="mt-12 text-sm text-santa-taupe/50 hover:text-santa-red underline transition-colors uppercase tracking-wider cursor-pointer"
          >
            Log Out
          </button>
        </div>
      </div>
    );
  }

  // LOGIN FORM VIEW
  return (
    <div className="bg-white p-8 rounded-xl shadow-lg border-t-4 border-santa-green">
      <p className="text-center text-santa-taupe mb-8 leading-relaxed">
        Enter your credentials to view your status or reveal your match.
      </p>

      <form onSubmit={handleLogin} className="flex flex-col gap-6">
        <div>
          <label className="block text-sm font-bold text-santa-green uppercase tracking-wider mb-2">Full Name</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full p-4 bg-santa-cream/30 border-2 border-santa-cream rounded-lg focus:outline-none focus:border-santa-green transition-colors text-santa-green font-medium"
          />
        </div>

        <div>
          <label className="block text-sm font-bold text-santa-green uppercase tracking-wider mb-2">Secret PIN</label>
          <input
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            maxLength={4}
            value={pin}
            onChange={(e) => {
                const val = e.target.value.replace(/\D/g, '').slice(0, 4);
                setPin(val);
            }}
            className="w-full p-4 bg-santa-cream/30 border-2 border-santa-cream rounded-lg focus:outline-none focus:border-santa-green transition-colors font-mono tracking-[1em] text-center font-bold text-xl text-santa-green"
            placeholder="0000"
          />
        </div>

        <button
          type="submit"
          className="bg-santa-green text-santa-cream font-serif font-bold py-4 px-6 rounded-lg hover:bg-santa-green/90 hover:scale-[1.02] transition-all shadow-md uppercase tracking-widest cursor-pointer"
        >
          Access Portal
        </button>

        {error && <p className="text-santa-red text-center font-medium bg-santa-red/10 p-3 rounded-lg">{error}</p>}
      </form>
    </div>
  );
}