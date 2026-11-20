import { useCallback, useEffect, useState } from "react";
import { isNicknameFree } from "../../lib/registration";
import { cleanNickname, nicknameKey, nicknameProblem } from "../../lib/nickname";
import { useStage } from "./useStage";

// Live "is this nickname free in this group?" check, 450ms after the person stops typing.
//   state: "invalid" (fails the basic rules) | "checking" | "free" | "taken" | "error"
// markTaken() is for the submit step finding out the hard way (someone grabbed it a second ago).
const SPECIAL = { santa: "santa", santaclaus: "santa", santaclause: "santa", saintnick: "santa", grinch: "grinch", admin: "admin", administrator: "admin", god: "god" };

export function useNicknameCheck(gid, nickname) {
  const stage = useStage();
  const [result, setResult] = useState(null); // { gid, key, state }
  const key = nicknameKey(nickname);
  const problem = nicknameProblem(nickname);

  useEffect(() => {
    if (!gid || problem) return undefined;
    let cancelled = false;
    const timer = setTimeout(async () => {
      try {
        const free = await isNicknameFree(gid, nickname);
        if (cancelled) return;
        if (SPECIAL[key]) stage.say(`nickname:${SPECIAL[key]}`, { name: cleanNickname(nickname) });
        setResult({ gid, key, state: free ? "free" : "taken" });
        stage.say(free ? "nickname:free" : "nickname:taken", { name: cleanNickname(nickname) });
      } catch {
        if (!cancelled) setResult({ gid, key, state: "error" });
      }
    }, 450);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [gid, key, problem, nickname, stage]);

  const markTaken = useCallback(() => setResult({ gid, key, state: "taken" }), [gid, key]);
  const state = problem ? "invalid" : result && result.gid === gid && result.key === key ? result.state : "checking";
  return { state, markTaken, problem };
}
