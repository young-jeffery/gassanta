import { GAME_RULES } from '../constants';

export default function RulesCard() {
  // Helper function to turn "**text**" into <strong>text</strong>
  const formatText = (text) => {
    // 1. Split the text whenever we see "**"
    const parts = text.split('**');
    
    return parts.map((part, index) => {
      // 2. Every ODD item in the list was inside stars, so make it bold
      if (index % 2 === 1) {
        return <strong key={index} className="text-santa-green font-bold">{part}</strong>;
      }
      // 3. Every EVEN item is normal text
      return <span key={index}>{part}</span>;
    });
  };

  return (
    <div className="bg-santa-taupe/70 border-l-4 border-santa-green p-6 mb-8 rounded-r-lg shadow-sm">
      <h3 className="font-serif text-xl font-bold text-santa-green mb-4 tracking-wide uppercase">
        Rules to Follow.
      </h3>
      <div className="font-sans text-santa-cream space-y-3 leading-relaxed">
        {GAME_RULES.split('\n').filter(rule => rule.trim() !== '').map((rule, index) => (
          <p key={index}>
            {/* Call the helper function here */}
            {formatText(rule)}
          </p>
        ))}
      </div>
    </div>
  );
}