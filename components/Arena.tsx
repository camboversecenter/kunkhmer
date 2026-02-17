import React from 'react';
import { FIGHTER_CONFIG } from '../constants';
import '../types'; // Import types to ensure global JSX IntrinsicElements augmentation

const Arena: React.FC = () => {
  return (
    <group>
      {/* Floor */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
        <planeGeometry args={[12, 12]} />
        <meshStandardMaterial color={FIGHTER_CONFIG.FLOOR_COLOR} roughness={0.8} />
      </mesh>

      {/* Ring Canvas Border */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, 0]} receiveShadow>
        <planeGeometry args={[14, 14]} />
        <meshStandardMaterial color="#111" />
      </mesh>

      {/* Posts */}
      {[[-6, -6], [6, -6], [6, 6], [-6, 6]].map((pos, idx) => (
        <mesh key={idx} position={[pos[0], 1.5, pos[1]]} castShadow>
          <cylinderGeometry args={[0.2, 0.2, 3]} />
          <meshStandardMaterial color={idx % 2 === 0 ? '#ef4444' : '#3b82f6'} metalness={0.5} />
        </mesh>
      ))}

      {/* Ropes */}
      {[1, 2, 3].map((height) => (
        <group key={height} position={[0, height * 0.8, 0]}>
          {/* North */}
          <mesh position={[0, 0, -6]}>
             <boxGeometry args={[12, 0.05, 0.05]} />
             <meshStandardMaterial color={FIGHTER_CONFIG.ROPE_COLOR} />
          </mesh>
          {/* South */}
          <mesh position={[0, 0, 6]}>
             <boxGeometry args={[12, 0.05, 0.05]} />
             <meshStandardMaterial color={FIGHTER_CONFIG.ROPE_COLOR} />
          </mesh>
          {/* East */}
          <mesh position={[6, 0, 0]} rotation={[0, Math.PI/2, 0]}>
             <boxGeometry args={[12, 0.05, 0.05]} />
             <meshStandardMaterial color={FIGHTER_CONFIG.ROPE_COLOR} />
          </mesh>
          {/* West */}
          <mesh position={[-6, 0, 0]} rotation={[0, Math.PI/2, 0]}>
             <boxGeometry args={[12, 0.05, 0.05]} />
             <meshStandardMaterial color={FIGHTER_CONFIG.ROPE_COLOR} />
          </mesh>
        </group>
      ))}

      {/* Lighting Setup - Specific Environment lighting is handled in Scenery.tsx */}
      {/* Only keeping the Ring Spotlight here */}
      <spotLight 
        position={[0, 10, 0]} 
        angle={0.6} 
        penumbra={0.5} 
        intensity={1.5} 
        castShadow 
        shadow-bias={-0.0001}
      />
    </group>
  );
};

export default Arena;