"use client";

import { useRef, useState } from "react";
import { useFrame } from "@react-three/fiber";
import { RoundedBox, Html } from "@react-three/drei";
import type { Group } from "three";
import type { SeatDef } from "@/lib/seats";
import { SEAT_COLORS, type SeatState } from "./seat-state";

interface Seat3DProps {
  seat: SeatDef;
  state: SeatState;
  onSelect: (id: string) => void;
  /** Fewer rounded-box segments and no stitching on phones. */
  compact?: boolean;
}

/** Backrest tilt, in radians: upright when idle, laid back when selected. */
const RECLINE_IDLE = 0.15;
const RECLINE_OPEN = 0.38;

/** Footrest hinge angle: folded down under the seat, or out in front. */
const FOOTREST_FOLDED = -1.15;
const FOOTREST_OPEN = 0.04;

/**
 * One powered recliner, built from primitives so the hall ships with no
 * external model to download.
 *
 * The model faces -z, which is where the screen is. Selecting a seat actually
 * reclines it — the back lays down and the footrest swings out — so the thing
 * on screen behaves like the chair it represents.
 */
export function Seat3D({ seat, state, onSelect, compact = false }: Seat3DProps) {
  const group = useRef<Group>(null);
  const backrest = useRef<Group>(null);
  const footrest = useRef<Group>(null);
  const [hovered, setHovered] = useState(false);
  /** Where the press started, so orbiting the hall does not select a seat. */
  const pressedAt = useRef<{ x: number; y: number } | null>(null);

  const interactive = state === "available" || state === "selected";
  const colors = SEAT_COLORS[state];
  const reclined = state === "selected";
  const body = hovered && interactive && !reclined ? "#6b5f5c" : colors.body;
  const seam = reclined ? "#7d1714" : "#2a2426";

  useFrame((_, delta) => {
    const node = group.current;
    if (!node) return;
    const k = Math.min(1, delta * 9);

    const targetY = seat.y + (reclined ? 0.06 : hovered && interactive ? 0.03 : 0);
    node.position.y += (targetY - node.position.y) * k;

    const targetScale = hovered && interactive && !reclined ? 1.02 : 1;
    node.scale.setScalar(node.scale.x + (targetScale - node.scale.x) * k);

    // The recline itself — slower than the hover, so it reads as a mechanism.
    const ease = Math.min(1, delta * 5);
    if (backrest.current) {
      const target = reclined ? RECLINE_OPEN : RECLINE_IDLE;
      backrest.current.rotation.x += (target - backrest.current.rotation.x) * ease;
    }
    if (footrest.current) {
      const target = reclined ? FOOTREST_OPEN : FOOTREST_FOLDED;
      footrest.current.rotation.x += (target - footrest.current.rotation.x) * ease;
    }
  });

  const leather = {
    color: body,
    roughness: 0.58,
    metalness: 0.08,
    emissive: colors.emissive,
    emissiveIntensity: colors.emissiveIntensity,
  };

  return (
    <group
      ref={group}
      position={[seat.x, seat.y, seat.z]}
      rotation={[0, seat.rotation, 0]}
      onPointerOver={(e) => {
        e.stopPropagation();
        setHovered(true);
        if (interactive) document.body.style.cursor = "pointer";
      }}
      onPointerOut={(e) => {
        e.stopPropagation();
        setHovered(false);
        document.body.style.cursor = "auto";
      }}
      onPointerDown={(e) => {
        pressedAt.current = { x: e.clientX, y: e.clientY };
      }}
      onClick={(e) => {
        e.stopPropagation();
        if (!interactive) return;
        // A drag past this threshold was an orbit gesture, not a tap.
        const start = pressedAt.current;
        pressedAt.current = null;
        if (start && Math.hypot(e.clientX - start.x, e.clientY - start.y) > 8) return;
        onSelect(seat.id);
      }}
    >
      {/* pedestal base, inset so the chair reads as floating on it */}
      <RoundedBox args={[0.82, 0.13, 0.74]} radius={0.04} smoothness={2} position={[0, 0.065, 0.04]}>
        <meshStandardMaterial color="#100c0d" roughness={0.7} metalness={0.35} />
      </RoundedBox>

      {/* skirt under the cushion */}
      <RoundedBox args={[1.0, 0.16, 0.9]} radius={0.06} smoothness={2} position={[0, 0.2, 0]}>
        <meshStandardMaterial color="#191415" roughness={0.85} metalness={0.12} />
      </RoundedBox>

      {/* seat cushion, overstuffed */}
      <RoundedBox args={[0.96, 0.28, 0.88]} radius={0.13} smoothness={compact ? 2 : 5} position={[0, 0.4, -0.02]}>
        <meshStandardMaterial {...leather} />
      </RoundedBox>

      {/* channel stitching across the cushion */}
      {!compact &&
        [-0.2, 0.12].map((z) => (
          <mesh key={z} position={[0, 0.535, z]}>
            <boxGeometry args={[0.86, 0.012, 0.022]} />
            <meshStandardMaterial color={seam} roughness={0.9} />
          </mesh>
        ))}

      {/* ------------------------------------------------ reclining backrest */}
      <group ref={backrest} position={[0, 0.44, 0.4]} rotation={[RECLINE_IDLE, 0, 0]}>
        {/* lumbar cushion */}
        <RoundedBox args={[0.96, 0.5, 0.28]} radius={0.13} smoothness={compact ? 2 : 5} position={[0, 0.27, 0]}>
          <meshStandardMaterial {...leather} />
        </RoundedBox>

        {/* upper back cushion, slightly narrower — the stacked, padded look */}
        <RoundedBox args={[0.92, 0.44, 0.26]} radius={0.13} smoothness={compact ? 2 : 5} position={[0, 0.72, -0.01]}>
          <meshStandardMaterial {...leather} />
        </RoundedBox>

        {/* vertical channel seams */}
        {!compact &&
          [-0.28, 0.28].map((x) => (
            <mesh key={x} position={[x, 0.5, -0.135]}>
              <boxGeometry args={[0.022, 0.86, 0.02]} />
              <meshStandardMaterial color={seam} roughness={0.9} />
            </mesh>
          ))}

        {/* headrest pillow */}
        <RoundedBox args={[0.62, 0.3, 0.24]} radius={0.11} smoothness={compact ? 2 : 5} position={[0, 1.06, -0.04]}>
          <meshStandardMaterial
            {...leather}
            color={colors.trim}
            emissiveIntensity={colors.emissiveIntensity * 0.8}
          />
        </RoundedBox>
      </group>

      {/* -------------------------------------------------- powered footrest */}
      <group ref={footrest} position={[0, 0.34, -0.46]} rotation={[FOOTREST_FOLDED, 0, 0]}>
        <RoundedBox args={[0.86, 0.15, 0.62]} radius={0.07} smoothness={compact ? 2 : 4} position={[0, 0, -0.3]}>
          <meshStandardMaterial {...leather} />
        </RoundedBox>
        {!compact && (
          <mesh position={[0, 0.08, -0.3]}>
            <boxGeometry args={[0.76, 0.012, 0.022]} />
            <meshStandardMaterial color={seam} roughness={0.9} />
          </mesh>
        )}
      </group>

      {/* ------------------------------------------- rolled armrests + panel */}
      {[-0.58, 0.58].map((x) => (
        <group key={x} position={[x, 0.46, -0.02]}>
          {/* thick rolled arm */}
          <RoundedBox args={[0.26, 0.34, 1.0]} radius={0.12} smoothness={compact ? 2 : 5}>
            <meshStandardMaterial {...leather} color={colors.trim} />
          </RoundedBox>

          {/* cup holder sunk into the front half */}
          <mesh position={[0, 0.16, -0.22]} rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.07, 0.07, 0.06, compact ? 10 : 22]} />
            <meshStandardMaterial color="#0b0809" roughness={0.35} metalness={0.55} />
          </mesh>
          <mesh position={[0, 0.174, -0.22]} rotation={[Math.PI / 2, 0, 0]}>
            <torusGeometry args={[0.072, 0.008, 6, compact ? 12 : 22]} />
            <meshStandardMaterial color="#6e6360" roughness={0.3} metalness={0.8} />
          </mesh>

          {/* recline control panel */}
          <mesh position={[0, 0.172, 0.22]}>
            <boxGeometry args={[0.13, 0.014, 0.2]} />
            <meshStandardMaterial color="#141011" roughness={0.4} metalness={0.5} />
          </mesh>
          {[0.16, 0.26].map((z) => (
            <mesh key={z} position={[0, 0.182, z]}>
              <boxGeometry args={[0.07, 0.012, 0.05]} />
              <meshStandardMaterial
                color="#8a7a6a"
                emissive={reclined ? "#d4342c" : "#d9a87c"}
                emissiveIntensity={reclined ? 0.9 : 0.4}
                roughness={0.3}
                metalness={0.6}
              />
            </mesh>
          ))}
        </group>
      ))}

      {/* floating label on hover only — selection already reads as red */}
      {hovered && (
        <Html center distanceFactor={5} position={[0, 1.95, 0.3]} zIndexRange={[20, 0]}>
          <span className="pointer-events-none rounded-full border border-tan/40 bg-ink/90 px-2.5 py-1 text-[11px] font-medium tracking-wide text-cream whitespace-nowrap">
            {seat.label}
          </span>
        </Html>
      )}
    </group>
  );
}
