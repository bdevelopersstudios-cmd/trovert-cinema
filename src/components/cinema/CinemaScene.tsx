"use client";

import { Suspense, useEffect, useRef } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { ContactShadows, OrbitControls } from "@react-three/drei";
import * as THREE from "three";
import type { OrbitControls as OrbitControlsImpl } from "three-stdlib";
import { SEATS } from "@/lib/seats";
import { Seat3D } from "./Seat3D";
import { Hall } from "./Hall";
import type { SeatState } from "./seat-state";
import { useIsCompact, usePrefersReducedMotion } from "@/lib/use-media";

export type CameraView = "hall" | "screen" | "top";

type Framing = { position: [number, number, number]; target: [number, number, number] };

/**
 * Phones get pulled-back framing: a narrow viewport crops horizontally, so the
 * same distance would cut the outer seats out of shot.
 */
const VIEWS: Record<CameraView, Framing> = {
  hall: { position: [0, 3.9, 11.4], target: [0, 1.5, 0.2] },
  screen: { position: [0, 2.2, 6.2], target: [0, 2.3, -4.2] },
  top: { position: [0, 10.5, 6.2], target: [0, 0.4, 1.8] },
};

const COMPACT_VIEWS: Record<CameraView, Framing> = {
  hall: { position: [0, 4.4, 14.6], target: [0, 1.6, 0.4] },
  screen: { position: [0, 2.2, 7.6], target: [0, 2.3, -4.2] },
  top: { position: [0, 13.5, 7.2], target: [0, 0.4, 1.8] },
};

/** Eases the camera between the three preset viewpoints. */
function CameraRig({
  view,
  views,
  controls,
}: {
  view: CameraView;
  views: Record<CameraView, Framing>;
  controls: React.RefObject<OrbitControlsImpl | null>;
}) {
  const { camera } = useThree();
  const desired = useRef(new THREE.Vector3(...views.hall.position));
  const desiredTarget = useRef(new THREE.Vector3(...views.hall.target));
  const animating = useRef(false);

  useEffect(() => {
    desired.current.set(...views[view].position);
    desiredTarget.current.set(...views[view].target);
    animating.current = true;
  }, [view, views]);

  useFrame((_, delta) => {
    if (!animating.current) return;
    const k = 1 - Math.pow(0.0015, delta);
    camera.position.lerp(desired.current, k);
    const ctrl = controls.current;
    if (ctrl) {
      ctrl.target.lerp(desiredTarget.current, k);
      ctrl.update();
    }
    if (camera.position.distanceTo(desired.current) < 0.02) animating.current = false;
  });

  return null;
}

interface CinemaSceneProps {
  seatStates: Record<string, SeatState>;
  onSelect: (id: string) => void;
  accent: string;
  view: CameraView;
  /** Slow idle orbit, used by the marketing hero. */
  autoRotate?: boolean;
  interactive?: boolean;
}

export default function CinemaScene({
  seatStates,
  onSelect,
  accent,
  view,
  autoRotate = false,
  interactive = true,
}: CinemaSceneProps) {
  const controls = useRef<OrbitControlsImpl>(null);
  const compact = useIsCompact();
  const reducedMotion = usePrefersReducedMotion();
  const views = compact ? COMPACT_VIEWS : VIEWS;

  useEffect(() => () => void (document.body.style.cursor = "auto"), []);

  return (
    <Canvas
      // Phones cap out at 1.5x and drop MSAA — the hall still reads, and a
      // mid-range Android keeps a steady frame rate instead of cooking.
      dpr={compact ? [1, 1.5] : [1, 1.75]}
      camera={{ position: views.hall.position, fov: compact ? 48 : 42, near: 0.1, far: 100 }}
      gl={{
        antialias: !compact,
        powerPreference: "high-performance",
        failIfMajorPerformanceCaveat: false,
      }}
      onCreated={({ gl }) => {
        gl.toneMapping = THREE.ACESFilmicToneMapping;
        gl.toneMappingExposure = 1.15;
      }}
    >
      <color attach="background" args={["#0b0708"]} />
      <fog attach="fog" args={["#0b0708", 16, 34]} />

      <ambientLight intensity={0.5} color="#9fa8b4" />
      <hemisphereLight args={["#7a3a3a", "#120c0d", 0.45]} />
      {/* soft key from the projection booth so the leather reads as grey */}
      <spotLight
        position={[0, 5.6, 8.5]}
        angle={0.9}
        penumbra={1}
        intensity={55}
        distance={26}
        decay={2}
        color="#cfd6e0"
      />

      <Suspense fallback={null}>
        <Hall accent={accent} compact={compact} />

        {SEATS.map((seat) => (
          <Seat3D
            key={seat.id}
            seat={seat}
            state={seatStates[seat.id] ?? "available"}
            onSelect={onSelect}
            compact={compact}
          />
        ))}

        <ContactShadows
          position={[0, 0.01, 1.8]}
          opacity={0.55}
          scale={16}
          blur={compact ? 1.6 : 2.4}
          resolution={compact ? 256 : 512}
          far={4}
          color="#000000"
        />
      </Suspense>

      <OrbitControls
        ref={controls}
        target={views.hall.target}
        autoRotate={autoRotate && !reducedMotion}
        autoRotateSpeed={0.35}
        enableZoom={interactive}
        enableRotate={interactive}
        enablePan={false}
        enableDamping
        dampingFactor={0.08}
        minDistance={compact ? 7 : 5}
        maxDistance={compact ? 20 : 17}
        minPolarAngle={0.25}
        maxPolarAngle={1.46}
        minAzimuthAngle={-Math.PI / 2.4}
        maxAzimuthAngle={Math.PI / 2.4}
        // One finger orbits, two fingers pinch-zoom. Vertical page scrolling
        // stays available because the canvas never fills the viewport.
        touches={{ ONE: THREE.TOUCH.ROTATE, TWO: THREE.TOUCH.DOLLY_ROTATE }}
      />
      <CameraRig view={view} views={views} controls={controls} />
    </Canvas>
  );
}
