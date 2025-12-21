import { GAME_RULES } from '../constants';

export default function RulesCard() {
  return (
    <div className="bg-santa-taupe/70 border-l-4 border-santa-green p-6 mb-8 rounded-r-lg shadow-sm">
      <h3 className="font-serif text-xl font-bold text-santa-green mb-4 tracking-wide uppercase">
        Official Guidelines
      </h3>
      {/* This splits the rules by newline so they display as separate paragraphs */}
      <div className="font-sans text-santa-cream space-y-3 leading-relaxed">
        {GAME_RULES.split('\n').filter(rule => rule.trim() !== '').map((rule, index) => (
          <p key={index}>{rule}</p>
        ))}
      </div>
    </div>
  );
}