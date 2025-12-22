import { useState } from 'react';
import { db } from '../firebase';
import { collection, getDocs, writeBatch, doc } from 'firebase/firestore';

export default function AdminPanel() {
  const [status, setStatus] = useState("Ready to Shuffle");
  const [loading, setLoading] = useState(false);

  // NEW: Function to clear all matches
  const resetMatches = async () => {
    const secretPassword = prompt("Enter Admin Password to RESET all matches:");
    if (secretPassword !== "5986") return alert("Wrong password!");

    if (!confirm("⚠️ ARE YOU SURE? \nThis will delete everyone's match assignment. The game will be reset to 'Waiting' mode.")) return;

    setLoading(true);
    setStatus("Reseting matches...");

    try {
        const querySnapshot = await getDocs(collection(db, "participants"));
        const batch = writeBatch(db);

        querySnapshot.forEach((docSnap) => {
            const ref = doc(db, "participants", docSnap.id);
            // Set assignedTo back to null
            batch.update(ref, { assignedTo: null });
        });

        await batch.commit();
        setStatus("✅ Game Reset! All matches cleared.");
    } catch (error) {
        console.error(error);
        setStatus("❌ Error: " + error.message);
    }
    setLoading(false);
  };

  const shuffleParticipants = async () => {
    const secretPassword = prompt("Enter Admin Password to SHUFFLE:");
    if (secretPassword !== "5986") return alert("Wrong password!"); 

    setLoading(true);
    setStatus("Fetching names...");

    try {
      const querySnapshot = await getDocs(collection(db, "participants"));
      const participants = [];
      querySnapshot.forEach((doc) => {
        participants.push({ id: doc.id, ...doc.data() });
      });

      if (participants.length < 2) {
        setStatus("Error: Need at least 2 people to play!");
        setLoading(false);
        return;
      }

      // Check if already matched
      const matchesExist = participants.some(p => p.assignedTo);
      if (matchesExist) {
        const confirmReset = prompt(
          "⚠️ Matches already exist! \nType 'RESET' to overwrite them and shuffle again:"
        );
        if (confirmReset !== "RESET") {
          setStatus("⛔ Shuffle Cancelled.");
          setLoading(false);
          return;
        }
      }

      // Valid Shuffle Logic (Self-match prevention)
      let shuffled = [];
      let isValid = false;
      let attempts = 0;

      while (!isValid && attempts < 100) {
        attempts++;
        shuffled = [...participants];
        // Fisher-Yates shuffle
        for (let i = shuffled.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }

        isValid = true;
        for (let i = 0; i < participants.length; i++) {
          if (participants[i].name === shuffled[i].name) {
            isValid = false;
            break;
          }
        }
      }

      if (!isValid) {
          setStatus("Error: Could not find valid shuffle after 100 attempts.");
          setLoading(false);
          return;
      }

      // Write matches to Firebase
      const batch = writeBatch(db);
      participants.forEach((giver, index) => {
        const receiver = shuffled[index];
        const giverRef = doc(db, "participants", giver.id);
        batch.update(giverRef, { assignedTo: receiver.name });
      });

      setStatus("Uploading matches...");
      await batch.commit();

      setStatus("✅ SUCCESS! Matches generated and locked.");

    } catch (error) {
      console.error(error);
      setStatus("❌ Error: " + error.message);
    }
    
    setLoading(false);
  };

  return (
    <div className="max-w-md mx-auto mt-10 p-6 bg-gray-900 text-white rounded-xl shadow-2xl border-2 border-red-500 text-center">
      <h2 className="text-2xl font-bold text-red-500 mb-6">⚠️ ADMIN ZONE ⚠️</h2>
      
      <div className="flex flex-col gap-6">
        <button 
            onClick={shuffleParticipants}
            disabled={loading}
            className="bg-red-600 hover:bg-red-700 text-white font-bold py-4 px-8 rounded-full shadow-lg transform transition hover:scale-105 active:scale-95 disabled:opacity-50 cursor-pointer uppercase tracking-widest"
        >
            {loading ? "Processing..." : "🔀 Shuffle & Lock"}
        </button>

        <div className="h-px bg-gray-700 w-full"></div>

        <button 
            onClick={resetMatches}
            disabled={loading}
            className="bg-transparent hover:bg-gray-800 text-gray-400 font-bold py-2 px-6 rounded-lg border border-gray-600 cursor-pointer text-sm"
        >
            Reset Game (Clear Matches)
        </button>
      </div>

      <p className="mt-6 font-mono text-sm text-green-400 min-h-5">{status}</p>
    </div>
  );
}