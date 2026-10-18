// One place to import GSAP from, so plugins are registered exactly once.
// Usage: import { gsap, useGSAP } from "../lib/gsap";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";

gsap.registerPlugin(useGSAP);

export { gsap, useGSAP };
