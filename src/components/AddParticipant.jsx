import { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, addDoc, query, where, getDocs } from 'firebase/firestore';
import RulesCard from './RulesCard';

export default function AddParticipant() {
    const [name, setName] = useState('');
    const [pin, setPin] = useState('');
    const [message, setMessage] = useState('');
    const [loading, setLoading] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);
    const [gameLocked, setGameLocked] = useState(false);

    // NEW: Check if matches exist when page loads
    useEffect(() => {
        const checkGameStatus = async () => {
            try {
                const querySnapshot = await getDocs(collection(db, "participants"));
                // If anyone has an assignment, the game has started
                const matchesExist = querySnapshot.docs.some(doc => doc.data().assignedTo);
                if (matchesExist) {
                    setGameLocked(true);
                }
            } catch (error) {
                console.error("Error checking game status:", error);
            }
        };
        checkGameStatus();
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();

        // NEW: Enforce 4 digit pin length
        if (name.trim() === '' || pin.length !== 4) {
            setMessage("Please enter your name and a 4-digit PIN.");
            setIsSuccess(false);
            return;
        }

        setLoading(true);

        try {
            // Check for duplicate names
            const q = query(collection(db, "participants"), where("name", "==", name.trim()));
            const querySnapshot = await getDocs(q);

            if (!querySnapshot.empty) {
                setMessage("That name is taken. Please use your full name.");
                setIsSuccess(false);
                setLoading(false);
                return;
            }

            // Add user
            await addDoc(collection(db, "participants"), {
                name: name.trim(),
                pin: pin,
                assignedTo: null,
                isAdmin: false
            });

            // NEW: Auto-save to localStorage so they are "Remembered"
            localStorage.setItem('secretSantaUser', JSON.stringify({ name: name.trim(), pin }));

            setMessage(`Welcome, ${name}. You are registered.`);
            setIsSuccess(true);
            setName('');
            setPin('');
            
            // Reload page to trigger the auto-login in App.jsx
            setTimeout(() => window.location.reload(), 1500);

        } catch (error) {
            console.error("Error:", error);
            setMessage("Connection error. Please try again.");
            setIsSuccess(false);
        }

        setLoading(false);
    };

    return (
        <div>
            <RulesCard />

            <div className="bg-white p-8 rounded-xl shadow-lg border-t-4 border-santa-red">
                {gameLocked ? (
                    <div className="text-center py-10">
                        <h3 className="text-3xl font-bold text-santa-red mb-4">🚫 Registration Closed</h3>
                        <p className="text-santa-taupe text-lg">
                            The Secret Santa names have already been shuffled! <br/>
                            No new members can join this round.
                        </p>
                    </div>
                ) : (
                    <>
                        <p className="text-center text-santa-taupe mb-8 leading-relaxed">
                            To enter the pool, provide your name and create a secret 4-digit PIN.
                        </p>

                        <form onSubmit={handleSubmit} className="flex flex-col gap-6">
                            <div>
                                <label className="block text-sm font-bold text-santa-green uppercase tracking-wider mb-2">Full Name</label>
                                <input
                                    type="text"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    className="w-full p-4 bg-santa-cream/30 border-2 border-santa-cream rounded-lg focus:outline-none focus:border-santa-red transition-colors text-santa-green font-medium"
                                    placeholder="Enter your name"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-santa-green uppercase tracking-wider mb-2">Secret PIN (4 Digits)</label>
                                <input
                                    type="text"
                                    inputMode="numeric"
                                    pattern="[0-9]*"
                                    maxLength={4}
                                    value={pin}
                                    onChange={(e) => {
                                        // NEW: Only allow numbers, max 4 chars
                                        const val = e.target.value.replace(/\D/g, '').slice(0, 4);
                                        setPin(val);
                                    }}
                                    className="w-full p-4 bg-santa-cream/30 border-2 border-santa-cream rounded-lg focus:outline-none focus:border-santa-red transition-colors font-mono tracking-[1em] text-center font-bold text-xl text-santa-red"
                                    placeholder="0000"
                                />
                            </div>

                            <button
                                type="submit"
                                disabled={loading}
                                className="mt-4 bg-santa-red text-santa-cream font-serif font-bold py-4 px-6 rounded-lg hover:bg-santa-burgundy hover:scale-[1.02] transition-all duration-300 shadow-md disabled:opacity-50 uppercase tracking-widest cursor-pointer"
                            >
                                {loading ? "Processing..." : "Confirm Registration"}
                            </button>
                        </form>
                    </>
                )}

                {message && !gameLocked && (
                    <div className={`mt-6 p-4 rounded-lg text-center font-medium ${isSuccess ? "bg-santa-green/10 text-santa-green" : "bg-santa-red/10 text-santa-red"}`}>
                        {message}
                    </div>
                )}
            </div>
        </div>
    );
}