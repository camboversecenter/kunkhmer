
import React, { useEffect, useState, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Text, Billboard } from '@react-three/drei';
import { Vector3, Group } from 'three';
import '../types'; // Import types to ensure global JSX IntrinsicElements augmentation

interface FloatingDamageProps {
  text: string;
  position: [number, number, number];
  color: string;
  onComplete: () => void;
}

const FloatingDamage: React.FC<FloatingDamageProps> = ({ text, position, color, onComplete }) => {
  const [visible, setVisible] = useState(true);
  const groupRef = useRef<Group>(null);
  const textRef = useRef<any>(null);
  const startTime = useRef(Date.now());
  
  // Refined durations: much quicker for combat text to reduce clutter
  const isItem = color.includes("gold") || text.includes("Book");
  const duration = isItem ? 2000 : 450; 

  useFrame(() => {
    if (!groupRef.current) return;
    const elapsed = Date.now() - startTime.current;
    const progress = Math.min(elapsed / duration, 1);

    // Float up relative to the Billboard's anchor - reduced vertical travel
    groupRef.current.position.y = progress * 0.6;

    // Animation Logic
    let scale = 1;
    let opacity = 1.0;

    if (progress < 0.15) {
         // Fast elastic pop in
         const p = progress / 0.15;
         scale = p * 1.1; 
    } else if (progress < 0.5) {
         // Settle
         const p = (progress - 0.15) / 0.35;
         scale = 1.1 - (p * 0.1); // 1.1 -> 1.0
    } else {
         // Quick fade out
         const p = (progress - 0.5) / 0.5;
         scale = 1.0 - (p * 0.2); // Shrink slightly
         opacity = 1.0 - p; // Fade out
    }
    
    groupRef.current.scale.setScalar(Math.max(0, scale));
    
    // Update text opacity if ref is available
    if (textRef.current) {
        textRef.current.fillOpacity = opacity;
        textRef.current.outlineOpacity = opacity;
    }

    if (elapsed >= duration) {
        if (visible) {
            setVisible(false);
            onComplete();
        }
    }
  });

  if (!visible) return null;

  return (
    <Billboard position={position} follow={true} lockX={false} lockY={false} lockZ={false}>
      <group ref={groupRef}>
        <Text
            ref={textRef}
            color={color}
            fontSize={isItem ? 0.4 : 0.6}
            fontWeight="bold"
            anchorX="center"
            anchorY="middle"
            outlineWidth={0.03}
            outlineColor="black"
            fillOpacity={1}
            outlineOpacity={1}
        >
            {text}
        </Text>
      </group>
    </Billboard>
  );
};

export default FloatingDamage;
