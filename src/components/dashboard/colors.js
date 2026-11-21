// The look of each dashboard card (the rules card and the wrapped wishlist have their own designs in their files).
//   bg     the solid card colour
//   wave   the wavy strip along the bottom edge, in a contrasting colour
//   text   text colour on the card (cream on dark cards, charcoal on the light ones)
//   field  base colour for inputs and chips drawn on the card (a dark or white tint over bg)
// The card is outlined in dark charcoal with a hard offset shadow, like a chat bubble (see Card.jsx).
// Change a value here to recolour a card.
export const CARDS = {
  registration: { bg: "#1f7a47", wave: "#f2fff6", text: "#fffaf0", field: "#0f1f16" }, // pine green, snow-white wave
  preferences: { bg: "#b8324b", wave: "#ffd3dc", text: "#fffaf0", field: "#2a0d14" }, // cranberry, pink wave
  reveal: { bg: "#f0b429", wave: "#b3261e", text: "#2a2430", field: "#ffffff" }, // gold, ribbon-red wave
  wishlist: { bg: "#8e44ad", wave: "#f1d4ff", text: "#fffaf0", field: "#1d0f26" }, // plum, lilac wave
  members: { bg: "#17878a", wave: "#c4f6ef", text: "#fffaf0", field: "#06292a" }, // teal, mint wave
  invite: { bg: "#e0701f", wave: "#fff0c2", text: "#2a2430", field: "#ffffff" }, // orange, butter wave
};

// Shared by every card: the chat-bubble outline colour
export const BUBBLE_INK = "#2a2430";
