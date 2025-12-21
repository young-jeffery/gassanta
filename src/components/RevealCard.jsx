import { useState } from 'react';
// eslint-disable-next-line no-unused-vars
import { motion } from 'framer-motion';

export default function RevealCard({ matchName, nameList }) {
    const [isFlipped, setIsFlipped] = useState(false);
    const [tempName, setTempName] = useState("");
    const [isShuffling, setIsShuffling] = useState(false);

    // Use real names if available, otherwise fallbacks
    const shuffleNames = nameList || ["Calculating...", "Searching...", "Matching..."];

    const handleReveal = () => {
        setIsShuffling(true);
        let counter = 0;

        // 1. Quick shuffle effect on the front of the card
        const interval = setInterval(() => {
            setTempName(shuffleNames[Math.floor(Math.random() * shuffleNames.length)]);
            counter++;

            if (counter > 100) {
                clearInterval(interval);
                setIsShuffling(false);
                // 2. Trigger the 3D Flip
                setIsFlipped(true);
            }
        }, 40);
    };


    return (
        <div className="flex flex-col items-center justify-center perspective-1000">
            {/* The 3D Card Container */}
            <div className="w-full h-64 relative" style={{ perspective: "1000px" }}>
                <motion.div
                    className="w-full h-full absolute top-0 left-0 rounded-xl shadow-2xl"
                    style={{ transformStyle: "preserve-3d" }}
                    animate={{ rotateY: isFlipped ? 180 : 0 }}
                    transition={{ duration: 0.8, ease: "easeInOut" }}
                >
                    {/* ----- FRONT OF CARD (The Button/Shuffle) ----- */}
                    <div
                        className="absolute w-full h-full -z-10 bg-santa-burgundy rounded-xl flex flex-col items-center justify-center p-6 border-4 border-santa-red"
                        style={{ backfaceVisibility: "hidden" }}
                    >
                        {isShuffling ? (
                            <p className="text-2xl font-serif text-santa-cream animate-pulse text-center">{tempName}</p>
                        ) : (
                            <button
                                onClick={handleReveal}
                                className="bg-santa-cream text-santa-burgundy font-serif font-black py-4 px-8 rounded-full text-lg shadow-lg hover:scale-105 transition-transform uppercase tracking-widest"
                            >
                                Reveal Match
                            </button>
                        )}
                    </div>

                    {/* ----- BACK OF CARD (The Reveal) ----- */}
                    <div
                        className="absolute w-full h-full bg-santa-cream rounded-xl flex flex-col items-center justify-center p-6 border-4 border-santa-green shadow-inner"
                        style={{ backfaceVisibility: "hidden", transform: "rotateY(180deg)" }}
                    >
                        <p className="text-santa-taupe font-serif italic mb-2">You are gifting to:</p>
                        <h3 className="text-4xl md:text-5xl font-serif font-black text-santa-green text-center uppercase tracking-wide">
                            {matchName}
                        </h3>
                    </div>
                </motion.div>
            </div>

            {isFlipped && (
                <motion.p
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.8 }}
                    className="text-santa-taupe/70 text-sm mt-8 font-bold uppercase tracking-widest"
                >
                    Remember: Total Secrecy Required.
                </motion.p>
            )}
        </div>
    );
}