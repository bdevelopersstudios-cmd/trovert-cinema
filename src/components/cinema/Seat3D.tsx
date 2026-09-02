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
  /** Fewer rounded-box segments on phones. */
  compact?: boolean;
}

/**
 * One powered recliner, built from primitives so the hall ships with no
 * external model to download: plinth, cushion, reclined back, headrest
 * pillow and two armrests with cup holders.
 */
export function Seat3D({ seat, state, onSelect, compact = false }: Seat3DProps) {
  const group = useRef<Group>(null);
  const [hovered, setHovered] = useState(false);
  /** Where the press started, so orbiting the hall does not select a seat. */
  const pressedAt = useRef<{ x: number; y: number } | null>(null);

  const interactive = state === "available" || state === "selected";
  const colors = SEAT_COLORS[state];
  const body = hovered && interactive && state !== "selected" ? "#6b5f5c" : colors.body;

  // Selected seats lift and turn a touch toward the aisle; hover nudges them.
  useFrame((_, delta) => {
    const node = group.current;
    if (!node) return;
    const targetY = seat.y + (state === "selected" ? 0.1 : hovered && interactive ? 0.04 : 0);
    const targetScale = state === "selected" ? 1.045 : hovered && interactive ? 1.02 : 1;
    const k = Math.min(1, delta * 9);
    node.position.y += (targetY - node.position.y) * k;
    const s = node.scale.x + (targetScale - node.scale.x) * k;
    node.scale.setScalar(s);
  });

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
      {/* plinth */}
      <RoundedBox args={[1.06, 0.16, 0.98]} radius={0.05} smoothness={compact ? 2 : 3} position={[0, 0.08, 0]}>
        <meshStandardMaterial color="#171213" roughness={0.85} metalness={0.15} />
      </RoundedBox>

      {/* seat cushion */}
      <RoundedBox args={[0.98, 0.26, 0.86]} radius={0.1} smoothness={compact ? 2 : 4} position={[0, 0.29, 0.02]}>
        <meshStandardMaterial
          color={body}
          roughness={0.62}
          metalness={0.08}
          emissive={colors.emissive}
          emissiveIntensity={colors.emissiveIntensity}
        />
      </RoundedBox>

      {/* reclined backrest */}
      <group position={[0, 0.42, -0.38]} rotation={[-0.16, 0, 0]}>
        <RoundedBox args={[0.98, 0.86, 0.24]} radius={0.11} smoothness={compact ? 2 : 4} position={[0, 0.4, 0]}>
          <meshStandardMaterial
            color={body}
            roughness={0.6}
            metalness={0.08}
            emissive={colors.emissive}
            emissiveIntensity={colors.emissiveIntensity}
          />
        </RoundedBox>

        {/* headrest pillow */}
        <RoundedBox args={[0.66, 0.34, 0.26]} radius={0.12} smoothness={compact ? 2 : 4} position={[0, 0.96, 0.03]}>
          <meshStandardMaterial
            color={colors.trim}
            roughness={0.55}
            metalness={0.06}
            emissive={colors.emissive}
            emissiveIntensity={colors.emissiveIntensity * 0.8}
          />
        </RoundedBox>
      </group>

      {/* armrests with cup holders */}
      {[-0.55, 0.55].map((x) => (
        <group key={x} position={[x, 0.4, 0.02]}>
          <RoundedBox args={[0.2, 0.24, 0.92]} radius={0.07} smoothness={compact ? 2 : 4}>
            <meshStandardMaterial color={colors.trim} roughness={0.58} metalness={0.1} />
          </RoundedBox>
          <mesh position={[0, 0.115, 0.16]} rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.062, 0.062, 0.03, compact ? 10 : 20]} />
            <meshStandardMaterial color="#0d0a0a" roughness={0.4} metalness={0.5} />
          </mesh>
          {/* recline control */}
          <mesh position={[0, 0.125, -0.2]}>
            <boxGeometry args={[0.07, 0.012, 0.13]} />
            <meshStandardMaterial
              color="#8a7a6a"
              emissive="#d9a87c"
              emissiveIntensity={0.35}
              roughness={0.3}
              metalness={0.6}
            />
          </mesh>
        </group>
      ))}

      {/* floating label on hover only — selection already reads as red */}
      {hovered && (
        <Html center distanceFactor={5} position={[0, 1.72, -0.2]} zIndexRange={[20, 0]}>
          <span className="pointer-events-none rounded-full border border-tan/40 bg-ink/90 px-2.5 py-1 text-[11px] font-medium tracking-wide text-cream whitespace-nowrap">
            {seat.label}
          </span>
        </Html>
      )}
    </group>
  );
}
