"use client";

import { useEffect } from "react";
import { Canvas, invalidate } from "@react-three/fiber";
import { ContactShadows, OrbitControls } from "@react-three/drei";
import RoomShell from "@/components/home/RoomShell";
import RoomFurniture from "@/components/home/rooms";
import Plant3D from "@/components/home/Plant3D";
import { SLOTS, SLOTS_PER_ROOM, type RoomKey } from "@/lib/home";
import type { Plant } from "@/lib/types";

/**
 * The WebGL scene: warm lighting, soft contact shadow, orbit + pinch camera,
 * and one or two rooms side by side with their plants placed on slots.
 */

function offsetsFor(count: number): number[] {
  if (count <= 1) return [0];
  return [-1.85, 1.85];
}

export default function HomeScene({
  rooms,
  plants,
  weatherFactor,
  hoveredId,
  selectedId,
  reduceMotion,
  onHover,
  onSelect,
}: {
  rooms: RoomKey[];
  plants: Plant[];
  weatherFactor: number;
  hoveredId: string | null;
  selectedId: string | null;
  reduceMotion: boolean;
  onHover: (id: string | null) => void;
  onSelect: (plant: Plant) => void;
}) {
  const offsets = offsetsFor(rooms.length);

  // Render on demand: kick a frame whenever interaction state or plant data
  // changes (hover, selection, watering, room placement). OrbitControls
  // invalidates on its own while dragging.
  useEffect(() => {
    invalidate();
  }, [hoveredId, selectedId, plants, rooms, weatherFactor]);

  return (
    <Canvas
      shadows
      frameloop="demand"
      dpr={[1, 1.75]}
      camera={{ position: [7, 5.5, 7], fov: 32 }}
      gl={{ antialias: true, powerPreference: "high-performance" }}
      onPointerMissed={() => onHover(null)}
    >
      <color attach="background" args={["#081c0e"]} />
      <fog attach="fog" args={["#081c0e", 14, 26]} />

      <ambientLight intensity={0.75} />
      <hemisphereLight args={["#fff4e0", "#20301f", 0.6]} />
      <directionalLight
        position={[6, 9, 5]}
        intensity={1.15}
        castShadow
        shadow-mapSize-width={1024}
        shadow-mapSize-height={1024}
        shadow-camera-far={30}
        shadow-camera-left={-8}
        shadow-camera-right={8}
        shadow-camera-top={8}
        shadow-camera-bottom={-8}
      />

      {rooms.map((room, i) => {
        const roomPlants = plants
          .filter((p) => p.room === room)
          .slice(0, SLOTS_PER_ROOM);
        return (
          <group key={room} position={[offsets[i], 0, 0]}>
            <RoomShell room={room} />
            <RoomFurniture room={room} />
            {roomPlants.map((plant, slot) => (
              <Plant3D
                key={plant.id}
                plant={plant}
                weatherFactor={weatherFactor}
                position={SLOTS[room][slot]}
                hovered={hoveredId === plant.id}
                selected={selectedId === plant.id}
                reduceMotion={reduceMotion}
                onHover={onHover}
                onSelect={onSelect}
              />
            ))}
          </group>
        );
      })}

      <ContactShadows
        position={[0, -0.02, 0]}
        opacity={0.35}
        scale={16}
        blur={2.6}
        far={4}
      />

      <OrbitControls
        makeDefault
        enablePan={false}
        enableDamping
        dampingFactor={0.08}
        minDistance={5}
        maxDistance={16}
        minPolarAngle={0.15}
        maxPolarAngle={1.35}
        target={[0, 0.5, 0]}
      />
    </Canvas>
  );
}
