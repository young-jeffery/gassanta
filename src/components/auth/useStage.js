import { useContext } from "react";
import { StageContext } from "./stageContext";

// What form fields use to talk to the snowmen (see AuthShell.jsx):
//   const stage = useStage();
//   stage.focusField("email", inputEl)   the snowmen look at the field and give a tip
//   stage.typeField("email", inputEl)    their eyes follow the caret as you type
//   stage.blurField()                    back to following the mouse
//   stage.setRevealed(true)              a password is visible: they look away (the peeking one hides)
//   stage.say("email:typo", { suggestion })   make one of them say a line (see snowmen/lines.js)
//   stage.cheer()                        everyone jumps for joy
export function useStage() {
  const ctx = useContext(StageContext);
  if (!ctx) throw new Error("useStage must be used inside <AuthShell>");
  return ctx;
}
