"use client";

import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { RoundedBox } from "@react-three/drei";
import * as THREE from "three";

/** Warm wall sconce, the pair of glowing bars either side of the screen. */
function Sconce({ x }: { x: number }) {
  return (
    <group position={[x, 2.5, -4.55]}>
      <mesh>
        <boxGeometry args={[0.16, 0.5, 0.1]} />
        <meshStandardMaterial color="#f0c68a" emissive="#f0a94e" emissiveIntensity={2.2} />
      </mesh>
      <pointLight color="#ffb15e" intensity={7} distance={7} decay={2} />
    </group>
  );
}

/** Vertical slat panelling like the real room, cheap on draw calls. */
function SlatWall({ z, width, count }: { z: number; width: number; count: number }) {
  const slats = useMemo(
    () => Array.from({ length: count }, (_, i) => (i / (count - 1) - 0.5) * width),
    [count, width],
  );
  return (
    <group position={[0, 1.9, z]}>
      {slats.map((x) => (
        <mesh key={x} position={[x, 0, 0.04]}>
          <boxGeometry args={[0.09, 3.6, 0.08]} />
          <meshStandardMaterial color="#241a17" roughness={0.9} />
        </mesh>
      ))}
      <mesh>
        <planeGeometry args={[width + 0.6, 3.8]} />
        <meshStandardMaterial color="#150f10" roughness={1} />
      </mesh>
    </group>
  );
}

/**
 * The projection screen. The image is a canvas gradient tinted with the
 * selected movie accent, so the hall reacts to what you are about to watch
 * without loading a single texture file.
 */
function Screen({ accent }: { accent: string }) {
  const material = useRef<THREE.MeshBasicMaterial>(null);

  const texture = useMemo(() => {
    const canvas = document.createElement("canvas");
    canvas.width = 512;
    canvas.height = 288;
    const ctx = canvas.getContext("2d");
    if (ctx) {
      const grad = ctx.createRadialGradient(256, 120, 20, 256, 144, 340);
      grad.addColorStop(0, "#ffffff");
      grad.addColorStop(0.45, accent);
      grad.addColorStop(1, "#0a0708");
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, 512, 288);
      // faint scan bands, like a projector warming up
      ctx.fillStyle = "rgba(0,0,0,0.06)";
      for (let y = 0; y < 288; y += 4) ctx.fillRect(0, y, 512, 2);
    }
    const tex = new THREE.CanvasTexture(canvas);
    tex.colorSpace = THREE.SRGBColorSpace;
    return tex;
  }, [accent]);

  // Gentle flicker so the room feels alive.
  useFrame(({ clock }) => {
    if (!material.current) return;
    const t = clock.elapsedTime;
    material.current.opacity = 0.88 + Math.sin(t * 2.1) * 0.03 + Math.sin(t * 7.7) * 0.015;
  });

  return (
    <group position={[0, 2.35, -4.4]}>
      {/* bezel — pushed back so it frames the picture instead of covering it */}
      <RoundedBox args={[7.4, 3.5, 0.12]} radius={0.05} smoothness={3} position={[0, 0, -0.14]}>
        <meshStandardMaterial color="#0b0708" roughness={0.9} />
      </RoundedBox>
      <mesh>
        <planeGeometry args={[7.1, 3.25]} />
        <meshBasicMaterial ref={material} map={texture} transparent toneMapped={false} />
      </mesh>
      {/* the screen is the main light source in the hall */}
      <pointLight position={[0, 0, 2.4]} color={accent} intensity={22} distance={16} decay={2} />
      <pointLight position={[0, -0.6, 4.5]} color="#ffffff" intensity={6} distance={14} decay={2} />
    </group>
  );
}

/** Floor, ceiling, walls, tiered platforms and the step lighting. */
export function Hall({ accent, compact = false }: { accent: string; compact?: boolean }) {
  return (
    <group>
      {/* floor — deep enough that the camera never sails off the edge */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.02, 2]} receiveShadow>
        <planeGeometry args={[18, 28]} />
        <meshStandardMaterial color="#120c0d" roughness={0.95} />
      </mesh>

      {/* tiered platforms under rows B and C */}
      {[
        { z: 2.45, h: 0.34 },
        { z: 4.3, h: 0.68 },
      ].map(({ z, h }) => (
        <group key={z}>
          <mesh position={[0, h / 2, z + 0.6]}>
            <boxGeometry args={[9, h, 2.6]} />
            <meshStandardMaterial color="#180f11" roughness={0.95} />
          </mesh>
          {/* step strip light */}
          <mesh position={[0, h - 0.02, z - 0.71]}>
            <boxGeometry args={[8.4, 0.03, 0.06]} />
            <meshStandardMaterial color="#b3221f" emissive="#d4342c" emissiveIntensity={1.6} />
          </mesh>
        </group>
      ))}

      {/* ceiling with recessed downlights */}
      <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, 4.2, 2]}>
        <planeGeometry args={[18, 28]} />
        <meshStandardMaterial color="#0d0809" roughness={1} />
      </mesh>
      {[-2.4, 0, 2.4].map((x) =>
        [-2.6, 0.8, 4].map((z) => (
          <mesh key={`${x}:${z}`} position={[x, 4.16, z]} rotation={[Math.PI / 2, 0, 0]}>
            <circleGeometry args={[0.12, 16]} />
            <meshStandardMaterial color="#3a2a20" emissive="#c8853c" emissiveIntensity={0.9} />
          </mesh>
        )),
      )}

      {/* side walls */}
      {[-5.6, 5.6].map((x) => (
        <mesh key={x} rotation={[0, x < 0 ? Math.PI / 2 : -Math.PI / 2, 0]} position={[x, 1.9, 2]}>
          <planeGeometry args={[26, 4.4]} />
          <meshStandardMaterial color="#140e0f" roughness={1} />
        </mesh>
      ))}

      <SlatWall z={-4.75} width={11} count={compact ? 13 : 26} />
      <Sconce x={-4.6} />
      <Sconce x={4.6} />

      {/* back wall drape — sits behind the furthest camera position */}
      <mesh position={[0, 1.9, 15]} rotation={[0, Math.PI, 0]}>
        <planeGeometry args={[13, 4.4]} />
        <meshStandardMaterial color="#1a1013" roughness={1} side={THREE.DoubleSide} />
      </mesh>

      <Screen accent={accent} />
    </group>
  );
}
