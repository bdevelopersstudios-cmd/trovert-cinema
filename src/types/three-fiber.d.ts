import type { ThreeElements } from "@react-three/fiber";

// React 19 moved JSX into the React namespace; this re-exposes the three.js
// intrinsic elements (<mesh>, <boxGeometry>, ...) to TypeScript.
declare global {
  namespace React {
    namespace JSX {
      // Declaration merging needs an interface here — a type alias cannot
      // extend the JSX namespace, so the "empty interface" rule is moot.
      // eslint-disable-next-line @typescript-eslint/no-empty-object-type
      interface IntrinsicElements extends ThreeElements {}
    }
  }
}

export {};
