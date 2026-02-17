
import React, { useRef, useEffect, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { Group, Vector3, Mesh, MeshStandardMaterial, MeshBasicMaterial, MathUtils, AdditiveBlending, DoubleSide } from 'three';
import { Sparkles, Billboard, Torus, Icosahedron, Ring, Text } from '@react-three/drei';
import { useXR } from '@react-three/xr';
import { MoveType, SakYantType, RitualBuff, GameState } from '../types';
import { SAK_YANT_DB, skinBase, skinFlushed, shortsMaterial } from '../constants';

interface FighterProps {
    position: [number, number, number];
    color: string;
    action: MoveType;
    isFacingRight: boolean;
    comboCount?: number;
    sakYant?: { type: SakYantType, level: number, currentIntegrity: number } | null;
    isFirstPerson?: boolean;
    isPlayer?: boolean;
    inputState?: React.MutableRefObject<Set<string>>;
    positionRef?: React.MutableRefObject<Vector3>;
    opponentPositionRef?: React.MutableRefObject<Vector3>;
    ritualBuff?: RitualBuff; // New: Spirit Buff data
    gameState: GameState; // Added to control positioning logic
}

// Easing functions for snappier animations
const easeOutCubic = (x: number): number => 1 - Math.pow(1 - x, 3);
const easeOutElastic = (x: number): number => {
    const i4 = (2 * Math.PI) / 3;
    return x === 0 ? 0 : x === 1 ? 1 : Math.pow(2, -10 * x) * Math.sin((x * 10 - 0.75) * i4) + 1;
};

const getMoveColor = (move: MoveType) => {
    switch (move) {
        case MoveType.PUNCH: return '#3b82f6';
        case MoveType.UPPERCUT: return '#1d4ed8'; // Dark Blue
        case MoveType.KICK: return '#ca8a04';
        case MoveType.ELBOW: return '#dc2626';
        case MoveType.KNEE: return '#9333ea';
        case MoveType.TAUNT: return '#db2777'; // Pink
        case MoveType.ROLL: return '#9ca3af'; // Gray
        case MoveType.BLOCK:
        case MoveType.BLOCK_HIT: return '#16a34a'; // Green
        case MoveType.VICTORY_POSE: return '#facc15'; // Gold
        default: return 'white';
    }
};

// --- SUB-COMPONENTS ---

const FireVFX = ({ visible }: { visible: boolean }) => {
    if (!visible) return null;
    return (
        <group>
            <Sparkles count={15} scale={0.6} size={15} speed={2} opacity={0.8} color="#fbbf24" noise={0.2} />
            <Sparkles count={10} scale={0.4} size={10} speed={3} opacity={0.6} color="#ef4444" noise={0.5} />
            <pointLight color="#fbbf24" intensity={3} distance={1} decay={2} />
        </group>
    )
}

const UppercutVFX = ({ visible, color }: { visible: boolean, color: string }) => {
    if (!visible) return null;
    return (
        <group>
            {/* Intense rising particles to emphasize upward momentum */}
            <Sparkles count={25} scale={[0.5, 1.5, 0.5]} size={20} speed={5} opacity={1} color={color} noise={0.1} />
            {/* Inner white core for power */}
            <Sparkles count={10} scale={0.3} size={25} speed={2} opacity={0.8} color="white" />
            <pointLight color={color} intensity={5} distance={1.5} decay={2} />
        </group>
    )
}

const TauntVFX = () => {
    return (
        <group position={[0, 2.1, 0]}>
            <Billboard>
                <Text
                    color="#f472b6"
                    fontSize={0.5}
                    outlineWidth={0.03}
                    outlineColor="#831843"
                    anchorY="bottom"
                    characters="5+"
                >
                    555+
                </Text>
            </Billboard>
            <Sparkles count={20} scale={1.5} size={5} speed={3} color="#f472b6" opacity={0.8} noise={1} />
        </group>
    )
}

const VictoryVFX = () => {
    return (
        <group position={[0, 1.0, 0]}>
            <Sparkles count={50} scale={[2, 4, 2]} size={12} speed={1.5} color="#facc15" opacity={0.8} noise={0.2} />
            <pointLight color="#facc15" intensity={2} distance={4} decay={2} position={[0, 2, 0]} />
            <Billboard position={[0, 2.5, 0]}>
                <Text
                    color="#facc15"
                    fontSize={0.6}
                    outlineWidth={0.03}
                    outlineColor="#854d0e"
                    anchorY="bottom"
                    characters="WINNER"
                >
                    WINNER
                </Text>
            </Billboard>
        </group>
    )
}

const KickSlashVFX = ({ visible, color }: { visible: boolean, color: string }) => {
    if (!visible) return null;
    return (
        <group rotation={[0, 0, Math.PI / 4]} position={[0, 0.5, 0]}>
            {/* Curved Slash Trail */}
            <mesh scale={[1.5, 1.5, 1.5]}>
                <torusGeometry args={[0.8, 0.05, 16, 100, Math.PI]} />
                <meshBasicMaterial color={color} transparent opacity={0.6} blending={AdditiveBlending} />
            </mesh>
            <Sparkles count={15} scale={[2, 2, 2]} size={12} speed={3} color={color} noise={0.5} />
        </group>
    )
}

const KneeImpactVFX = ({ visible, color }: { visible: boolean, color: string }) => {
    if (!visible) return null;
    return (
        <group>
            {/* Shockwave Rings */}
            <mesh rotation={[Math.PI / 2, 0, 0]}>
                <ringGeometry args={[0.3, 0.6, 32]} />
                <meshBasicMaterial color={color} transparent opacity={0.5} blending={AdditiveBlending} side={DoubleSide} />
            </mesh>
            <mesh rotation={[Math.PI / 2, 0, 0]} scale={[0.5, 0.5, 0.5]}>
                <ringGeometry args={[0.3, 0.8, 32]} />
                <meshBasicMaterial color="white" transparent opacity={0.7} blending={AdditiveBlending} side={DoubleSide} />
            </mesh>
            <Sparkles count={20} scale={1.5} size={15} speed={4} color={color} noise={0.2} />
        </group>
    )
}

const BlockShieldVFX = () => {
    const ref = useRef<Group>(null);
    useFrame((state, delta) => {
        if (ref.current) {
            ref.current.scale.lerp(new Vector3(1.2, 1.2, 1.2), delta * 5);
            ref.current.children.forEach((child: any) => {
                if (child.material) {
                    child.material.opacity = MathUtils.lerp(child.material.opacity, 0, delta * 3);
                }
            });
        }
    });

    return (
        <group ref={ref} position={[0, 1.2, 0.4]}>
            {/* Main Shield Bubble */}
            <mesh>
                <sphereGeometry args={[0.6, 16, 16]} />
                <meshBasicMaterial color="#4ade80" transparent opacity={0.4} blending={AdditiveBlending} wireframe />
            </mesh>
            {/* Impact Core */}
            <mesh scale={[0.5, 0.5, 0.5]}>
                <sphereGeometry args={[0.5, 16, 16]} />
                <meshBasicMaterial color="white" transparent opacity={0.6} blending={AdditiveBlending} />
            </mesh>
            {/* Particles */}
            <Sparkles count={15} scale={1.2} size={8} speed={5} color="#86efac" />
        </group>
    );
};

const SakYantBreakVFX = () => {
    const ref = useRef<Group>(null);
    useFrame((state, delta) => {
        if (ref.current) {
            ref.current.scale.multiplyScalar(1.05); // Expand rapidly
            ref.current.children.forEach((child: any) => {
                if (child.material) child.material.opacity -= delta * 1.5;
            });
            if (ref.current.scale.x > 3) ref.current.visible = false;
        }
    });

    return (
        <group ref={ref} position={[0, 1, 0]}>
            {/* Shatter pieces */}
            {[...Array(6)].map((_, i) => (
                <mesh key={i} position={[(Math.random() - 0.5), (Math.random() - 0.5), (Math.random() - 0.5)]} rotation={[Math.random(), Math.random(), 0]}>
                    <planeGeometry args={[0.3, 0.3]} />
                    <meshBasicMaterial color="#fff" side={DoubleSide} transparent opacity={1} />
                </mesh>
            ))}
            <Sparkles count={20} scale={2} size={10} speed={5} color="white" />
            <pointLight color="white" intensity={5} distance={3} decay={5} />
        </group>
    )
}

// --- SPECIFIC SAK YANT VFX ---

const HanumanVFX = ({ color, level }: { color: string, level: number }) => {
    // Concept: Wind/Speed - Spinning rings
    const ref = useRef<Group>(null);
    useFrame((state) => {
        if (ref.current) {
            ref.current.rotation.y += 5 * state.clock.getDelta() * (0.5 + level * 0.1);
            ref.current.position.y = 1 + Math.sin(state.clock.elapsedTime * 4) * 0.1;
        }
    });

    return (
        <group ref={ref}>
            <Torus args={[0.5, 0.02, 16, 32]} rotation={[Math.PI / 2, 0, 0]}>
                <meshBasicMaterial color={color} transparent opacity={0.3 + level * 0.1} blending={AdditiveBlending} />
            </Torus>
            <Torus args={[0.4, 0.01, 16, 32]} rotation={[Math.PI / 2, 0.5, 0]}>
                <meshBasicMaterial color="white" transparent opacity={0.2} blending={AdditiveBlending} />
            </Torus>
            <Sparkles count={5 + level * 3} scale={1.2} size={6} speed={2} color={color} />
        </group>
    );
};

const GaoYordVFX = ({ color, level }: { color: string, level: number }) => {
    // Concept: Protection/Shield - Geometric Sphere
    const ref = useRef<Mesh>(null);
    useFrame((state) => {
        if (ref.current) {
            ref.current.rotation.x += 0.2 * state.clock.getDelta();
            ref.current.rotation.y += 0.1 * state.clock.getDelta();
            const pulse = 1 + Math.sin(state.clock.elapsedTime * 2) * 0.05;
            ref.current.scale.setScalar(pulse);
        }
    });

    return (
        <group position={[0, 1, 0]}>
            <Icosahedron ref={ref} args={[0.7 + level * 0.05, 0]}>
                <meshBasicMaterial color={color} wireframe transparent opacity={0.15 + level * 0.05} blending={AdditiveBlending} />
            </Icosahedron>
            {/* The 9 Spires (simplified as particles floating up) */}
            <Sparkles count={9} scale={1} size={10} speed={0.4} color={color} opacity={0.8} />
            <pointLight color={color} intensity={0.5} distance={2} />
        </group>
    );
};

const TwinTigerVFX = ({ color, level }: { color: string, level: number }) => {
    // Concept: Power/Aggression - Ground fire and aggressive particles
    const ringRef = useRef<Mesh>(null);
    useFrame((state) => {
        if (ringRef.current) {
            const t = state.clock.elapsedTime;
            ringRef.current.scale.setScalar(1 + Math.sin(t * 10) * 0.05);
            ringRef.current.material.opacity = 0.3 + Math.sin(t * 5) * 0.2;
        }
    });

    return (
        <group>
            <mesh ref={ringRef} rotation={[-Math.PI / 2, 0, 0]}>
                <ringGeometry args={[0.4, 0.5 + level * 0.05, 32]} />
                <meshBasicMaterial color={color} transparent opacity={0.4} blending={AdditiveBlending} side={DoubleSide} />
            </mesh>
            <Sparkles
                count={10 + level * 5}
                scale={[1, 2, 1]}
                size={8}
                speed={4} // Fast speed for aggression
                color={color}
                noise={0.5}
            />
        </group>
    );
};

const NagaVFX = ({ color, level }: { color: string, level: number }) => {
    // Concept: Water/Regen - Spiral flow
    // We create a spiral of particles using logic or just abstract it with rising bubbles
    const groupRef = useRef<Group>(null);

    useFrame((state) => {
        if (groupRef.current) {
            groupRef.current.rotation.y = state.clock.elapsedTime * 0.5;
            groupRef.current.position.y = Math.sin(state.clock.elapsedTime) * 0.1;
        }
    });

    return (
        <group>
            <group ref={groupRef} position={[0, 0.8, 0]}>
                {/* Simulated spiral using two tilted rings */}
                <Ring args={[0.5, 0.55, 32]} rotation={[Math.PI / 4, 0, 0]}>
                    <meshBasicMaterial color={color} transparent opacity={0.1} blending={AdditiveBlending} side={DoubleSide} />
                </Ring>
                <Ring args={[0.4, 0.45, 32]} rotation={[-Math.PI / 4, Math.PI / 2, 0]}>
                    <meshBasicMaterial color="white" transparent opacity={0.1} blending={AdditiveBlending} side={DoubleSide} />
                </Ring>
            </group>
            <Sparkles
                count={15 + level * 5}
                scale={[0.8, 2, 0.8]}
                size={6}
                speed={0.5} // Slow, calming speed
                color={color}
                opacity={0.6}
            />
        </group>
    );
};

const SakYantAura = ({ type, level }: { type: SakYantType, level: number }) => {
    const data = SAK_YANT_DB[type];
    const color = data.color;
    const groupRef = useRef<Group>(null);
    const burstRef = useRef<Group>(null);
    const timeRef = useRef(0);

    useFrame((state, delta) => {
        if (!groupRef.current) return;
        timeRef.current += delta;

        // Aura Scale Up (Elastic Entry)
        if (timeRef.current < 1.0) {
            const t = timeRef.current;
            const scale = Math.sin(t * Math.PI * 0.5) * 1.1;
            groupRef.current.scale.setScalar(Math.max(0.01, scale));

            // Settle scale
            if (t > 0.8) {
                const settleT = (t - 0.8) * 5;
                groupRef.current.scale.setScalar(1.1 - (settleT * 0.1));
            }
        } else {
            groupRef.current.scale.setScalar(1);
        }

        // Burst Effect Animation
        if (burstRef.current) {
            if (timeRef.current < 0.6) {
                const t = timeRef.current / 0.6;
                burstRef.current.scale.setScalar(1 + t * 3);
                burstRef.current.position.y = t * 1.5;

                burstRef.current.children.forEach((child: any) => {
                    if (child.material) {
                        child.material.opacity = (1 - t) * 0.8;
                    }
                });
            } else {
                burstRef.current.visible = false;
            }
        }
    });

    const commonLight = (
        <pointLight position={[0, 1.0, 0]} color={color} intensity={0.5 + (level * 0.2)} distance={2.5} decay={2} />
    );

    let vfx = null;

    switch (type) {
        case SakYantType.HANUMAN:
            vfx = <HanumanVFX color={color} level={level} />;
            break;
        case SakYantType.GAO_YORD:
            vfx = <GaoYordVFX color={color} level={level} />;
            break;
        case SakYantType.TWIN_TIGER:
            vfx = <TwinTigerVFX color={color} level={level} />;
            break;
        case SakYantType.NAGA:
            vfx = <NagaVFX color={color} level={level} />;
            break;
        default:
            vfx = <Sparkles color={color} count={10} scale={1} />;
    }

    return (
        <group ref={groupRef}>
            {/* Activation Burst Effects */}
            <group ref={burstRef}>
                <mesh rotation={[-Math.PI / 2, 0, 0]}>
                    <ringGeometry args={[0.2, 0.5, 32]} />
                    <meshBasicMaterial color={color} transparent opacity={0.8} blending={AdditiveBlending} side={DoubleSide} />
                </mesh>
                <mesh position={[0, 0.5, 0]}>
                    <cylinderGeometry args={[0.4, 0.1, 1.5, 16, 1, true]} />
                    <meshBasicMaterial color={color} transparent opacity={0.6} blending={AdditiveBlending} side={DoubleSide} depthWrite={false} />
                </mesh>
            </group>

            {commonLight}
            {vfx}
        </group>
    );
};

const KramaHeadband = () => {
    return (
        <group position={[0, 0.09, 0]} rotation={[0.1, 0, 0]}>
            <mesh castShadow>
                <torusGeometry args={[0.135, 0.028, 8, 32]} rotation={[Math.PI / 2, 0, 0]} />
                <meshStandardMaterial color="#b91c1c" roughness={0.9} />
            </mesh>
            {Array.from({ length: 12 }).map((_, i) => (
                <mesh key={i} rotation={[0, i * (Math.PI / 6), 0]} position={[0, 0, 0]}>
                    <mesh position={[0, 0, 0.136]} rotation={[0, 0, 0]}>
                        <boxGeometry args={[0.02, 0.03, 0.005]} />
                        <meshStandardMaterial color="#f3f4f6" />
                    </mesh>
                </mesh>
            ))}
            <group position={[0, -0.04, -0.135]} rotation={[-0.3, 0, 0]}>
                <mesh>
                    <sphereGeometry args={[0.035, 32, 32]} />
                    <meshStandardMaterial color="#b91c1c" />
                </mesh>
                <group position={[-0.025, -0.1, 0]} rotation={[0, 0, 0.2]}>
                    <mesh>
                        <boxGeometry args={[0.04, 0.2, 0.01]} />
                        <meshStandardMaterial color="#b91c1c" />
                    </mesh>
                </group>
                <group position={[0.025, -0.09, -0.01]} rotation={[0.1, 0, -0.2]}>
                    <mesh>
                        <boxGeometry args={[0.04, 0.18, 0.01]} />
                        <meshStandardMaterial color="#b91c1c" />
                    </mesh>
                </group>
            </group>
        </group>
    );
};

interface RealisticLegProps {
    isAttacking: boolean;
    activeMoveColor: string;
    lowerLegRef?: React.RefObject<Group | null>;
}

const RealisticLeg = React.memo(({ isAttacking, activeMoveColor, lowerLegRef }: RealisticLegProps) => {
    // Straight leg idle pose
    const baseLowerLegRot = -0.05;
    return (
        <group>
            {/* Hip Joint */}
            <mesh position={[0, 0, 0]}>
                <sphereGeometry args={[0.105, 24, 24]} />
                <meshPhysicalMaterial {...skinBase} />
            </mesh>

            {/* Thigh */}
            <mesh position={[0, -0.22, 0]} castShadow receiveShadow>
                <capsuleGeometry args={[0.1, 0.4, 8, 32]} />
                <meshPhysicalMaterial {...skinBase} />
            </mesh>

            {/* Knee Joint */}
            <mesh position={[0, -0.44, 0.01]} castShadow receiveShadow>
                <sphereGeometry args={[0.095, 32, 32]} />
                <meshPhysicalMaterial {...skinFlushed} />
            </mesh>

            {/* Lower Leg Group */}
            <group ref={lowerLegRef} position={[0, -0.44, 0]} rotation={[baseLowerLegRot, 0, 0]}>
                {/* Shin */}
                <mesh position={[0, -0.22, 0]} rotation={[0.02, 0, 0]} castShadow receiveShadow>
                    <capsuleGeometry args={[0.085, 0.4, 8, 32]} />
                    <meshPhysicalMaterial {...skinBase} />
                </mesh>
                {/* Calf Muscle Bump */}
                <mesh position={[0, -0.15, -0.04]} rotation={[-0.05, 0, 0]} castShadow receiveShadow>
                    <capsuleGeometry args={[0.08, 0.2, 8, 32]} />
                    <meshPhysicalMaterial {...skinBase} />
                </mesh>

                {/* Ankle */}
                <mesh position={[0, -0.42, 0]}>
                    <sphereGeometry args={[0.07, 16, 16]} />
                    <meshPhysicalMaterial {...skinBase} />
                </mesh>

                {/* Foot */}
                <group position={[0, -0.48, 0.03]}>
                    <mesh position={[0, 0, 0.04]} rotation={[0.1, 0, 0]} castShadow receiveShadow>
                        <boxGeometry args={[0.11, 0.07, 0.24]} />
                        <meshPhysicalMaterial {...skinBase} />
                    </mesh>
                    {/* Toes */}
                    <mesh position={[0, -0.01, 0.16]}>
                        <capsuleGeometry args={[0.055, 0.1, 4, 16]} rotation={[0, 0, Math.PI / 2]} />
                        <meshPhysicalMaterial {...skinFlushed} />
                    </mesh>
                </group>

                {isAttacking && (
                    <group position={[0, -0.35, 0.08]}>
                        <FireVFX visible={true} />
                    </group>
                )}
            </group>
        </group>
    );
});

const SakYantTattoo = ({ type, level }: { type: SakYantType, level: number }) => {
    const data = SAK_YANT_DB[type];
    const linesColor = data.color;

    return (
        <group position={[0, 0.1, -0.12]} rotation={[0, Math.PI, 0]} scale={[0.8, 0.8, 0.8]}>
            <mesh position={[0, 0, -0.02]}>
                <planeGeometry args={[0.3, 0.4]} />
                <meshBasicMaterial color={linesColor} transparent opacity={0.15 * level} />
            </mesh>
            <mesh position={[0, 0.1, 0]}>
                <capsuleGeometry args={[0.005, 0.25, 4, 8]} />
                <meshBasicMaterial color={linesColor} toneMapped={false} />
            </mesh>
            {[0.1, 0.05, 0, -0.05, -0.1].map((y, i) => (
                <mesh key={i} position={[0, y, 0]}>
                    <boxGeometry args={[0.15 - (Math.abs(y) * 0.5), 0.005, 0.005]} />
                    <meshBasicMaterial color={linesColor} toneMapped={false} />
                </mesh>
            ))}
            {Array.from({ length: level }).map((_, i) => (
                <mesh key={i} position={[(i - (level - 1) / 2) * 0.03, -0.22, 0]}>
                    <sphereGeometry args={[0.008, 16, 16]} />
                    <meshBasicMaterial color="white" toneMapped={false} />
                </mesh>
            ))}
        </group>
    )
}

const Fighter: React.FC<FighterProps> = ({
    position,
    color,
    action,
    isFacingRight,
    comboCount = 0,
    sakYant,
    isFirstPerson = false,
    isPlayer = false,
    inputState,
    positionRef,
    opponentPositionRef,
    ritualBuff,
    gameState
}) => {
    const { isPresenting } = useXR();
    const groupRef = useRef<Group>(null);
    const bodyRef = useRef<Group>(null); // For rotating body independently during rolls

    const armLRef = useRef<Group>(null);
    const armRRef = useRef<Group>(null);
    const forearmLRef = useRef<Group>(null);
    const forearmRRef = useRef<Group>(null);

    const legLRef = useRef<Group>(null);
    const legRRef = useRef<Group>(null);
    const lowerLegRRef = useRef<Group>(null);

    const torsoRef = useRef<Group>(null);
    const headRef = useRef<Group>(null);

    const hitFlashRef = useRef<Group>(null);
    const punchEffectRef = useRef<Group>(null);
    const sweatParticlesRef = useRef<Group>(null);
    const kneeImpactRef = useRef<Group>(null); // New Ref for imperatively toggling Knee VFX

    const basePosition = useRef(new Vector3(...position));

    const timeRef = useRef(0);

    // Integrity Tracking for VFX
    const prevIntegrity = useRef(sakYant?.currentIntegrity || 0);
    const [showBreakVFX, setShowBreakVFX] = React.useState(false);

    useEffect(() => {
        // Logic: If we had integrity before, and now it's 0 (or we lost it), trigger break
        const current = sakYant?.currentIntegrity || 0;
        if (prevIntegrity.current > 0 && current <= 0) {
            setShowBreakVFX(true);
            setTimeout(() => setShowBreakVFX(false), 1000);
        }
        prevIntegrity.current = current;
    }, [sakYant?.currentIntegrity]);

    // Idle Micro-Movements State
    const nextIdleVarTime = useRef(0);
    const targetIdleMod = useRef({
        headY: 0,
        headZ: 0,
        guardHeight: 0,
        torsoLean: 0
    });
    const currentIdleMod = useRef({
        headY: 0,
        headZ: 0,
        guardHeight: 0,
        torsoLean: 0
    });

    const currentKneeFlexR = useRef(0);
    const activeMoveColor = getMoveColor(action);
    const comboIntensity = Math.min(comboCount, 5) * 0.5;

    // Helper to lerp position/rotation
    const lerpVec3 = (ref: React.RefObject<Group | null>, x: number, y: number, z: number, speed: number = 0.2) => {
        if (ref.current) ref.current.position.lerp(new Vector3(x, y, z), speed);
    };

    // Helper that lerps to a target rotation
    const lerpRot = (ref: React.RefObject<Group | null>, x: number, y: number, z: number, speed: number = 0.2) => {
        if (ref.current) {
            ref.current.rotation.x += (x - ref.current.rotation.x) * speed;
            ref.current.rotation.y += (y - ref.current.rotation.y) * speed;
            ref.current.rotation.z += (z - ref.current.rotation.z) * speed;
        }
    };

    useEffect(() => {
        timeRef.current = 0;
    }, [action]);

    useEffect(() => {
        basePosition.current.set(...position);
    }, [position]);

    useFrame((state, delta) => {
        if (!groupRef.current) return;
        timeRef.current += delta * 1.2; // Speed scale
        const t = timeRef.current;
        const totalTime = state.clock.elapsedTime;
        const breath = Math.sin(totalTime * 3);
        const stanceSway = Math.cos(totalTime * 4);
        const dir = isFacingRight ? 1 : -1;

        // --- PLAYER MOVEMENT PHYSICS (WASD) ---
        let isWalking = false;

        if (isPlayer && inputState && positionRef) {
            // Boost speed during roll
            const baseSpeed = 3.5;
            const speedMultiplier = action === MoveType.ROLL ? 2.5 : 1.0;
            const speed = baseSpeed * speedMultiplier * delta;

            const currentPos = groupRef.current.position;
            const moveVec = new Vector3(0, 0, 0);

            if (inputState.current.has('KeyA')) moveVec.x -= 1;
            if (inputState.current.has('KeyD')) moveVec.x += 1;
            // W/S typically moves in Z (Depth) in this 2.5D view
            if (inputState.current.has('KeyW')) moveVec.z -= 1;
            if (inputState.current.has('KeyS')) moveVec.z += 1;

            if (moveVec.lengthSq() > 0) {
                isWalking = true;
                moveVec.normalize().multiplyScalar(speed);

                // Calculate potential new position
                const newPos = currentPos.clone().add(moveVec);

                // 1. Boundary Checks (Arena Ropes)
                // Arena is roughly -5 to 5
                newPos.x = MathUtils.clamp(newPos.x, -5, 5);
                newPos.z = MathUtils.clamp(newPos.z, -5, 5);

                // 2. Collision Check (Opponent)
                if (opponentPositionRef) {
                    const dist = newPos.distanceTo(opponentPositionRef.current);
                    const minDistance = 0.5; // Collision radius sum

                    // FIX: Ensure we don't divide by zero if positions are identical
                    if (dist < minDistance && dist > 0.001) {
                        const dirToOpp = new Vector3().subVectors(opponentPositionRef.current, newPos).normalize();
                        const dot = moveVec.clone().normalize().dot(dirToOpp);
                        if (dot > 0) {
                            // Moving towards opponent, block that component
                            // Use length of moveVec (speed magnitude for this frame) instead of just 'speed' variable which might be outdated scale
                            const currentSpeed = moveVec.length();
                            const projection = dirToOpp.multiplyScalar(dot * currentSpeed);
                            moveVec.sub(projection);

                            // Re-apply modified moveVec from original position
                            newPos.copy(currentPos).add(moveVec);
                        }
                    } else if (dist <= 0.001) {
                        // Too close/overlapping, just push back slightly
                        const pushBack = new Vector3(moveVec.x > 0 ? -1 : 1, 0, moveVec.z > 0 ? -1 : 1).normalize().multiplyScalar(0.1);
                        moveVec.add(pushBack);
                        newPos.copy(currentPos).add(moveVec);
                    }
                }

                groupRef.current.position.copy(newPos);
                // Sync back to Ref for Game Logic
                positionRef.current.copy(newPos);
            }
        } else {
            // CPU or standard interpolation fallback if no input control
            // Determine movement state based on position change (naive)
            if (groupRef.current) {
                // If actual position is significantly changing, treat as walking
                // Note: This relies on targetPos updating below
            }
        }

        // --- IDLE VARIATIONS LOGIC ---
        if (action === MoveType.IDLE) {
            if (totalTime > nextIdleVarTime.current) {
                targetIdleMod.current = {
                    headY: (Math.random() - 0.5) * 0.4,
                    headZ: (Math.random() - 0.5) * 0.1,
                    guardHeight: (Math.random() - 0.5) * 0.15,
                    torsoLean: (Math.random() - 0.5) * 0.1
                };
                nextIdleVarTime.current = totalTime + 2 + Math.random() * 3;
            }
        } else {
            targetIdleMod.current = { headY: 0, headZ: 0, guardHeight: 0, torsoLean: 0 };
        }

        currentIdleMod.current.headY = MathUtils.lerp(currentIdleMod.current.headY, targetIdleMod.current.headY, delta * 2);
        currentIdleMod.current.headZ = MathUtils.lerp(currentIdleMod.current.headZ, targetIdleMod.current.headZ, delta * 2);
        currentIdleMod.current.guardHeight = MathUtils.lerp(currentIdleMod.current.guardHeight, targetIdleMod.current.guardHeight, delta * 2);
        currentIdleMod.current.torsoLean = MathUtils.lerp(currentIdleMod.current.torsoLean, targetIdleMod.current.torsoLean, delta * 2);

        if (action !== MoveType.PUNCH && action !== MoveType.UPPERCUT && punchEffectRef.current) {
            punchEffectRef.current.visible = false;
        }

        // --- ROTATION / FACING LOGIC ---
        // If not doing a special move that controls rotation (like rolling or KO or RITUAL)
        if (action !== MoveType.KNOCKOUT && action !== MoveType.ROLL && action !== MoveType.VICTORY_POSE && action !== MoveType.RITUAL_DANCE && action !== MoveType.RITUAL_KNEEL) {
            if (opponentPositionRef && groupRef.current) {
                const myPos = groupRef.current.position;
                const oppPos = opponentPositionRef.current;
                const dx = oppPos.x - myPos.x;

                // Strict Left/Right facing
                const targetYRot = dx > 0 ? Math.PI / 2 : -Math.PI / 2;
                groupRef.current.rotation.y = MathUtils.lerp(groupRef.current.rotation.y, targetYRot, 0.1);

            } else {
                // Fallback to static prop
                groupRef.current.rotation.y = MathUtils.lerp(groupRef.current.rotation.y, isFacingRight ? Math.PI / 2 : -Math.PI / 2, 0.1);
            }
        } else if (action === MoveType.VICTORY_POSE && groupRef.current) {
            // Face camera during victory
            groupRef.current.rotation.y = MathUtils.lerp(groupRef.current.rotation.y, 0, 0.1);
        }

        let targetPos = basePosition.current.clone();

        // OVERRIDE: If external controller (AI/Net) is driving via positionRef, use that as target
        if (!isPlayer && positionRef) {
            targetPos.copy(positionRef.current);

            // Infer walking state from target movement
            const dist = groupRef.current.position.distanceTo(targetPos);
            if (dist > 0.05) isWalking = true;
        }

        // Animation Logic
        if (action !== MoveType.KNOCKOUT && action !== MoveType.VICTORY_POSE && action !== MoveType.RITUAL_DANCE && action !== MoveType.RITUAL_KNEEL) {
            let bounceFreq = 6;
            let bounceAmp = 0.02;

            if (isWalking) {
                bounceFreq = 12;
                bounceAmp = 0.05;
            }

            const bounce = Math.abs(Math.sin(totalTime * bounceFreq));

            // If manually controlling position, apply bounce to current position
            if (isPlayer) {
                groupRef.current.position.y = bounce * bounceAmp;
            } else {
                targetPos.y += bounce * bounceAmp;
            }
        }

        let targetTorsoRot = {
            x: -0.05 + currentIdleMod.current.torsoLean,
            y: -0.2 * dir + stanceSway * 0.05,
            z: 0
        };

        // Walking Animation Modifications
        if (isWalking) {
            const walkCycle = Math.sin(totalTime * 12);
            targetTorsoRot.z += walkCycle * 0.05;
            targetTorsoRot.y += Math.cos(totalTime * 12) * 0.05;
        }

        let targetArmLPos = { x: 0.24, y: 0.32 + currentIdleMod.current.guardHeight, z: 0 };
        let targetArmLRot = { x: -0.8 + breath * 0.05 - (currentIdleMod.current.guardHeight), y: 0.3, z: 0.2 };
        let targetForearmLRot = { x: -2.1, y: 0, z: 0 };

        let targetArmRPos = { x: -0.24, y: 0.32 + currentIdleMod.current.guardHeight, z: 0 };
        let targetArmRRot = { x: -0.9 + breath * 0.05 - (currentIdleMod.current.guardHeight), y: -0.3, z: -0.2 };
        let targetForearmRRot = { x: -2.3, y: 0, z: 0 };

        let targetHeadRot = { x: 0.1, y: currentIdleMod.current.headY * dir, z: currentIdleMod.current.headZ };

        let targetLegLPos = { x: 0.18, y: 0.8, z: 0.1 };
        let targetLegLRot = { x: 0, y: 0, z: 0 };

        let targetLegRPos = { x: -0.18, y: 0.8, z: -0.1 };
        let targetLegRRot = { x: 0, y: 0, z: 0 };

        // Walking Legs Override
        if (isWalking) {
            const walkCycle = totalTime * 12;
            targetLegLRot.x = Math.sin(walkCycle) * 0.3;
            targetLegRRot.x = Math.sin(walkCycle + Math.PI) * 0.3;
            targetLegLPos.z += Math.sin(walkCycle) * 0.1;
            targetLegRPos.z += Math.sin(walkCycle + Math.PI) * 0.1;
        }

        let targetKneeFlexR = 0;
        let showFire = false;
        let speed = 0.2;

        // --- RITUAL ANIMATION LOGIC ---
        if (action === MoveType.RITUAL_DANCE) {
            const rhythm = Math.sin(totalTime * 4); // BPM match roughly

            // Swaying dance - Enhanced Sarama fluidity
            const swayX = Math.sin(totalTime * 2) * 0.2;
            const swayZ = Math.cos(totalTime * 2) * 0.1;

            targetTorsoRot.y = rhythm * 0.5 * dir;
            targetTorsoRot.z = swayZ + (Math.sin(totalTime * 4) * 0.05); // Add micro movement
            targetTorsoRot.x = Math.sin(totalTime * 1.5) * 0.1; // Gentle bowing

            // Arms waving slowly with more complexity (Spirit Calling)
            targetArmLRot.x = -1.8 + rhythm * 0.3;
            targetArmLRot.z = 0.5 + Math.cos(totalTime * 3) * 0.2;
            targetForearmLRot.z = Math.sin(totalTime * 3) * 0.5; // Hand flourish

            targetArmRRot.x = -1.8 - rhythm * 0.3;
            targetArmRRot.z = -0.5 - Math.cos(totalTime * 3) * 0.2;
            targetForearmRRot.z = -Math.sin(totalTime * 3) * 0.5; // Hand flourish

            // Head Bob
            targetHeadRot.x = Math.sin(totalTime * 4) * 0.1;
            targetHeadRot.y = -targetTorsoRot.y * 0.5; // Counter-look

            // Bounce / Knee bend
            groupRef.current.position.y = Math.abs(rhythm) * 0.08;
            targetLegLRot.x = Math.abs(rhythm) * 0.2;
            targetLegRRot.x = Math.abs(rhythm) * 0.2;

        } else if (action === MoveType.RITUAL_KNEEL) {
            // Kneeling / Bowing
            targetTorsoRot.x = 0.5; // Bow forward
            groupRef.current.position.y = -0.5; // Lower body (fake kneel)
            targetLegLRot.x = -1.0;
            targetLegRRot.x = -1.0;

            targetArmLRot.x = -0.5;
            targetArmLRot.z = 0.8; // Praying hands ish
            targetArmRRot.x = -0.5;
            targetArmRRot.z = -0.8;
        }
        // --- COMBAT ANIMATION LOGIC ---
        else if (action === MoveType.PUNCH) {
            speed = 0.5;
            // Phase 1: Heavy Wind-up (Loading) - Stores kinetic energy
            if (t < 0.2) {
                // Load hips and shoulders dramatically away from target
                targetTorsoRot = { x: 0.1, y: 0.6 * dir, z: -0.1 * dir };

                // Pull arm back deep
                targetArmRPos = { x: -0.4, y: 0.35, z: -0.3 };
                targetArmRRot = { x: -1.0, y: 1.0 * dir, z: 0.8 * dir };

                // Crouch
                if (!isPlayer) targetPos.y -= 0.1;

                // Step Back slightly to launch
                if (!isPlayer) targetPos.x -= 0.1 * dir;

                // Guard up high with other hand
                targetArmLRot = { x: -2.5, y: 0.5 * dir, z: 0.5 * dir };

                // Load back leg
                targetLegRRot = { x: 0.4, y: 0, z: 0 };
            }
            // Phase 2: Execution (Strike) with Snap - FASTER & HARDER
            else if (t < 0.35) {
                showFire = true;
                speed = 1.2; // FASTER Snap!
                if (!isPlayer) targetPos.x += 1.4 * dir;

                // Kinetic Chain: Hips -> Shoulders -> Fist
                targetTorsoRot = { x: 0.2, y: -1.4 * dir, z: 0.2 * dir };

                // Leg Drive - Deep Lunge
                targetLegRRot = { x: -0.4, y: -0.8 * dir, z: 0 };
                targetLegRPos = { x: -0.18, y: 1.0, z: 0.25 };

                // Arm Extension with Overshoot
                targetArmRPos = { x: -0.12, y: 0.45, z: 0.9 }; // Reach further
                targetArmRRot = { x: -1.5, y: -0.5 * dir, z: -1.3 * dir };
                targetForearmRRot = { x: 0, y: 0, z: -1.8 * dir }; // Violent twist
            }
            // Phase 3: Recovery
            else {
                targetForearmRRot = { x: -2.2, y: 0, z: 0 };
                speed = 0.35; // Controlled return
                // Settle back to guard
                targetArmRRot = { x: -1.0, y: -0.2 * dir, z: -0.2 * dir };
            }

            if (punchEffectRef.current) {
                // Visual Pop timing adjusted to match the snap
                if (t > 0.2 && t < 0.4) {
                    punchEffectRef.current.visible = true;
                    const p = (t - 0.2) / 0.2;
                    const scale = 1 + easeOutElastic(p) * 3;
                    punchEffectRef.current.scale.setScalar(scale);
                } else {
                    punchEffectRef.current.visible = false;
                }
            }
        }
        else if (action === MoveType.UPPERCUT) {
            // UPPERCUT ANIMATION (Mok Keng)
            speed = 0.6;
            if (t < 0.2) {
                // Phase 1: Dip / Wind Up
                // Lower torso
                if (!isPlayer) targetPos.y -= 0.15;
                targetTorsoRot = { x: 0.3, y: 0.5 * dir, z: 0.1 * dir };

                // Drop arm low
                targetArmRPos = { x: -0.2, y: 0.1, z: 0.1 };
                targetArmRRot = { x: -1.5, y: 0.5 * dir, z: 0 };
                targetForearmRRot = { x: -2.0, y: 0, z: 0 };
            } else if (t < 0.4) {
                // Phase 2: Rising Strike - EXPLOSIVE
                showFire = true;
                speed = 1.1;
                if (!isPlayer) {
                    targetPos.x += 0.8 * dir;
                    targetPos.y += 0.45; // Higher Jump/Rise
                }

                targetTorsoRot = { x: -0.6, y: -1.0 * dir, z: 0 }; // Lean back more
                // Shoot arm up
                targetArmRPos = { x: -0.15, y: 0.95, z: 0.6 };
                targetArmRRot = { x: -2.8, y: 0, z: 0 }; // Vertical
                targetForearmRRot = { x: -0.2, y: 0, z: 0 }; // Almost straight
            } else {
                // Phase 3: Recovery
                targetArmRRot = { x: -1.5, y: 0, z: 0 };
            }

            if (punchEffectRef.current) {
                if (t > 0.2 && t < 0.4) {
                    punchEffectRef.current.visible = true;
                    const p = (t - 0.2) / 0.2;
                    const scale = 1 + easeOutElastic(p) * 4;
                    punchEffectRef.current.scale.setScalar(scale);
                    // Move effect higher for uppercut
                    punchEffectRef.current.position.y = 1.6;
                } else {
                    punchEffectRef.current.visible = false;
                    // Reset pos
                    punchEffectRef.current.position.y = 1.45;
                }
            }
        }
        else if (action === MoveType.KICK) {
            // IMPROVED KICK ANIMATION: Wind-up, Hip Rotation, Pivot, Arm Counter-swing
            if (t < 0.15) {
                // PHASE 1: WIND-UP / CHAMBER
                // Slight lean back
                targetTorsoRot = { x: 0.1, y: 0.2 * dir, z: 0.1 * dir };

                // Chamber Right Leg High
                targetLegRPos = { x: -0.2, y: 1.0, z: 0.2 };
                targetLegRRot = { x: 0, y: 0, z: -0.5 * dir };
                targetKneeFlexR = 2.0; // Tight chamber

                // Slight dip on left leg to power up
                targetLegLPos = { x: 0.18, y: 0.75, z: 0.1 };

                // Arms guard high
                targetArmLRot = { x: -2.0, y: 0, z: 0 };
                targetArmRRot = { x: -2.0, y: 0, z: 0 };

                speed = 0.4;
            }
            else if (t < 0.5) {
                // PHASE 2: EXECUTION / SNAP
                speed = 0.8;
                if (!isPlayer) targetPos.x += 0.5 * dir;

                // Full Hip Rotation (Torso turns perpendicular)
                targetTorsoRot = { x: 0.1, y: -1.8 * dir, z: -0.4 * dir };

                // PIVOT LEG (Left): Rotate heel in, rise on toes
                targetLegLRot = { x: 0, y: -0.6 * dir, z: 0 };
                targetLegLPos = { x: 0.18, y: 0.9, z: 0.1 }; // Rise higher

                // EXTEND KICKING LEG (Right)
                targetLegRPos = { x: 0.7 * dir, y: 1.45, z: 0.4 }; // Reach further
                // Z rotation lifts leg high
                targetLegRRot = { x: 0, y: 0, z: -2.6 * dir }; // Higher angle
                // Knee extends almost fully
                targetKneeFlexR = 0.1;

                // ARM COUNTER-SWING - More aggressive
                // Right arm swings down/back to counterbalance leg
                targetArmRRot = { x: -0.3, y: -0.8 * dir, z: -1.8 * dir };
                targetArmRPos = { x: -0.3, y: 0.2, z: -0.3 };
                // Left arm guards face tightly
                targetArmLRot = { x: -2.2, y: 0.5 * dir, z: 0.5 * dir };
            }
            else {
                // PHASE 3: RECOVERY / RETRACT
                // Bring leg back down, controlled
                targetLegRPos = { x: -0.2, y: 0.85, z: -0.2 };
                targetKneeFlexR = 0.5;

                // Reset torso/pivot
                targetTorsoRot = { x: -0.05, y: -0.2 * dir, z: 0 };
                targetLegLRot = { x: 0, y: 0, z: 0 };
                speed = 0.4;
            }
        }
        else if (action === MoveType.KNEE) {
            if (t < 0.15) {
                if (!isPlayer) targetPos.y -= 0.3;
                targetTorsoRot = { x: 0.5, y: 0, z: 0 };
            }
            else if (t < 0.35) {
                showFire = true;
                const airTime = (t - 0.15) / 0.2; // Faster flight
                if (!isPlayer) {
                    targetPos.y += Math.sin(airTime * Math.PI) * 2.2; // Higher jump
                    targetPos.x += 2.0 * dir * Math.sin(airTime * Math.PI / 2); // Further lunge
                }

                // Flying Knee Pose
                targetTorsoRot = { x: -0.4, y: -0.8 * dir, z: 0 }; // Lean back into it
                targetLegRPos = { x: 0.6 * dir, y: 1.6, z: 0.5 }; // Knee HIGH
                targetLegRRot = { x: -0.8, y: 0, z: -3.0 * dir }; // Pointed knee
                targetKneeFlexR = 2.8;

                // Superman arms (or guard)
                targetArmLRot = { x: 0.5, y: 0, z: 0.5 };
                targetArmRRot = { x: -2.0, y: 0, z: 0 }; // Right arm down for power
            }
            else {
                if (!isPlayer) targetPos.y = basePosition.current.y;
                targetTorsoRot = { x: 0.2, y: 0, z: 0 };
                targetKneeFlexR = 0.0;
                speed = 0.4;
            }
        }
        else if (action === MoveType.ELBOW) {
            // Refined Elbow Animation (Sok)
            // 1. Wind-up (Coil)
            if (t < 0.12) {
                speed = 0.5;
                // Twist torso back
                targetTorsoRot = { x: 0.1, y: 0.9 * dir, z: 0 };
                // Raise elbow high and back
                targetArmRPos = { x: -0.3, y: 0.45, z: -0.1 };
                targetArmRRot = { x: -1.9, y: 0.8 * dir, z: 1.0 * dir };
                // Flex forearm tight
                targetForearmRRot = { x: -2.6, y: 0, z: 0 };

                // Guard face with left
                targetArmLRot = { x: -2.2, y: 0.3 * dir, z: 0.2 * dir };
            }
            // 2. Strike (Snap)
            else if (t < 0.3) {
                showFire = true;
                speed = 0.9; // Fast snap

                if (!isPlayer) targetPos.x += 1.1 * dir; // Aggressive step

                // Massive torque release
                targetTorsoRot = { x: 0.2, y: -1.6 * dir, z: -0.2 * dir };

                // Drive elbow through target
                targetArmRPos = { x: -0.15, y: 0.38, z: 0.5 };
                // Horizontal cutting angle
                targetArmRRot = { x: -1.5, y: -0.8 * dir, z: -1.2 * dir };
                targetForearmRRot = { x: -2.5, y: 0, z: 0 }; // Keep sharp
            }
            // 3. Retract
            else {
                speed = 0.4;
                targetArmRRot = { x: -1.2, y: -0.3 * dir, z: -0.5 * dir };
                targetForearmRRot = { x: -2.2, y: 0, z: 0 };
            }
        }
        else if (action === MoveType.HIT) {
            if (t < 0.4) {
                const progress = easeOutCubic(t / 0.4);
                targetHeadRot = { x: -0.5, y: (Math.random() - 0.5), z: 0.5 * dir };
                lerpRot(headRef, -0.5, (Math.random() - 0.5), 0.5 * dir, 0.9);

                // Knockback
                if (!isPlayer) targetPos.x -= 1.2 * dir * progress;
                else groupRef.current.position.x -= 0.02 * dir; // Small nudge for player to not disorient too much

                targetTorsoRot = { x: 0.4, y: 0, z: -0.2 * dir };

                if (sweatParticlesRef.current) sweatParticlesRef.current.visible = true;
                if (hitFlashRef.current) {
                    hitFlashRef.current.visible = true;
                    const scale = 1.5 + (1 - progress) * 8.0;
                    hitFlashRef.current.scale.set(scale, scale, scale);
                    hitFlashRef.current.rotation.z += delta * 10;
                }
            } else {
                if (hitFlashRef.current) hitFlashRef.current.visible = false;
                if (sweatParticlesRef.current) sweatParticlesRef.current.visible = false;
            }
        }
        else if (action === MoveType.BLOCK || action === MoveType.BLOCK_HIT) {
            if (t < 0.15) {
                targetTorsoRot = { x: 0.3, y: 0, z: 0 };
                targetHeadRot = { x: 0.6, y: 0, z: 0 };

                targetArmLPos = { x: 0.15, y: 0.45, z: 0.3 };
                targetArmLRot = { x: -2.0, y: 0, z: 0.2 };

                targetArmRPos = { x: -0.15, y: 0.45, z: 0.3 };
                targetArmRRot = { x: -2.0, y: 0, z: -0.2 };
            }
            if (hitFlashRef.current && t < 0.1 && action !== MoveType.BLOCK_HIT) {
                // Only use basic flash for standard block holding
                hitFlashRef.current.visible = true;
                hitFlashRef.current.scale.set(1.5, 1.5, 1.5);
                (hitFlashRef.current.children[1] as Mesh).material = new MeshBasicMaterial({ color: "#60a5fa", transparent: true, opacity: 0.5 });
            } else if (hitFlashRef.current) {
                hitFlashRef.current.visible = false;
            }
        }
        else if (action === MoveType.ROLL) {
            // Rolling Animation
            speed = 0.5;

            if (bodyRef.current) {
                // Spin whole body around X axis
                bodyRef.current.rotation.x = -t * 15.0; // Fast spin
                bodyRef.current.position.y = 0.5; // Lower center of mass
            }

            // Curl up
            targetTorsoRot = { x: 0.5, y: 0, z: 0 };
            targetHeadRot = { x: 0.5, y: 0, z: 0 };
            targetLegLRot = { x: -1.5, y: 0, z: 0 };
            targetLegRRot = { x: -1.5, y: 0, z: 0 };
            targetArmLRot = { x: 0, y: 0, z: 0 };
            targetArmRRot = { x: 0, y: 0, z: 0 };

            if (sweatParticlesRef.current) sweatParticlesRef.current.visible = true;
        }
        else if (action === MoveType.TAUNT) {
            // Glove Tap / Chest Pound Animation
            if (t < 0.2) {
                // Bring arms to center
                targetArmLPos = { x: 0.1, y: 0.4, z: 0.2 };
                targetArmLRot = { x: -1.5, y: -0.5, z: 0.5 };

                targetArmRPos = { x: -0.1, y: 0.4, z: 0.2 };
                targetArmRRot = { x: -1.5, y: 0.5, z: -0.5 };

                targetHeadRot = { x: 0.2, y: 0, z: 0 };
            } else if (t < 0.4) {
                // Gloves touch (bang)
                targetArmLPos = { x: 0.05, y: 0.4, z: 0.3 };
                targetArmRPos = { x: -0.05, y: 0.4, z: 0.3 };

                // Head Nod
                targetHeadRot = { x: 0.4, y: 0, z: 0 };
            } else if (t < 0.6) {
                // Arms out slightly
                targetArmLPos = { x: 0.2, y: 0.35, z: 0.2 };
                targetArmRPos = { x: -0.2, y: 0.35, z: 0.2 };
                targetHeadRot = { x: 0, y: 0, z: 0 };
            } else if (t < 0.8) {
                // Gloves touch again (bang)
                targetArmLPos = { x: 0.05, y: 0.4, z: 0.3 };
                targetArmRPos = { x: -0.05, y: 0.4, z: 0.3 };

                // Head Nod
                targetHeadRot = { x: 0.4, y: 0, z: 0 };
            }
        }
        else if (action === MoveType.VICTORY_POSE) {
            // Champion Victory Pose - Arms Raised High + Chest Puff
            speed = 0.3;
            const celebrateCycle = Math.sin(totalTime * 8); // Fast celebration breath

            // Puff chest
            targetTorsoRot = { x: -0.3 + (celebrateCycle * 0.05), y: 0, z: 0 };
            // Look slightly up
            targetHeadRot = { x: -0.4, y: 0, z: 0 };

            // Raise Arms in V Shape
            targetArmLPos = { x: 0.25, y: 0.5, z: 0 };
            targetArmLRot = { x: -2.8, y: 0, z: 0.5 }; // Arms up and out
            targetForearmLRot = { x: -0.2, y: 0, z: 0 }; // Straighten arm

            targetArmRPos = { x: -0.25, y: 0.5, z: 0 };
            targetArmRRot = { x: -2.8, y: 0, z: -0.5 };
            targetForearmRRot = { x: -0.2, y: 0, z: 0 };

            // Slight pumping motion
            const pump = Math.abs(Math.sin(totalTime * 4)) * 0.1;
            targetArmLPos.y += pump;
            targetArmRPos.y += pump;
        }
        else if (action === MoveType.KNOCKOUT) {
            if (groupRef.current) {
                const fallSpeed = 0.08;
                groupRef.current.rotation.x = MathUtils.lerp(groupRef.current.rotation.x, -Math.PI / 2, fallSpeed);
                const targetYRot = isFacingRight ? Math.PI / 2 : -Math.PI / 2;
                groupRef.current.rotation.y = MathUtils.lerp(groupRef.current.rotation.y, targetYRot, fallSpeed);
                groupRef.current.rotation.z = MathUtils.lerp(groupRef.current.rotation.z, 0, fallSpeed);
                groupRef.current.position.y = MathUtils.lerp(groupRef.current.position.y, -0.05, fallSpeed);
            }
            targetArmLRot = { x: -2.5, y: 0, z: 0.8 };
            targetArmRRot = { x: -2.5, y: 0, z: -0.8 };
        }
        else {
            // IDLE Recovery
            targetKneeFlexR = 0;

            // Reset body rotation from Roll
            if (bodyRef.current) {
                bodyRef.current.rotation.x = 0;
                bodyRef.current.position.y = 0;
            }

            if (groupRef.current && Math.abs(groupRef.current.rotation.x) > 0.01) {
                const rotSpeed = 0.1;
                groupRef.current.rotation.x = MathUtils.lerp(groupRef.current.rotation.x, 0, rotSpeed);
                groupRef.current.rotation.z = MathUtils.lerp(groupRef.current.rotation.z, 0, rotSpeed);
            } else if (groupRef.current) {
                groupRef.current.rotation.x = 0;
                groupRef.current.rotation.z = 0;
            }

            if (hitFlashRef.current) hitFlashRef.current.visible = false;
            if (sweatParticlesRef.current) sweatParticlesRef.current.visible = false;
        }

        // Apply Position Lerp (Only if NOT player controlled - Player uses physics above)
        // AND Only if not in Ritual mode (Ritual mode sets position via camera or static)
        if (action !== MoveType.KNOCKOUT && !isPlayer && gameState !== GameState.RITUAL) {
            let posSpeed = 0.25;
            if (action === MoveType.IDLE && groupRef.current && Math.abs(groupRef.current.rotation.x) > 0.2) {
                posSpeed = 0.05;
            }
            // CPU Fighters or Opponents lerp to targetPos
            groupRef.current?.position.lerp(targetPos, posSpeed);
        }

        // Force sync Y for Player if they are jumping/bobbing during attack to override physics mesh
        if (isPlayer && action !== MoveType.IDLE && action !== MoveType.BLOCK && action !== MoveType.BLOCK_HIT && action !== MoveType.HIT && action !== MoveType.TAUNT && action !== MoveType.ROLL) {
            // Simply don't apply Y overrides from attack animations to physics mesh for now to keep it stable
            // or add them as offsets
        }

        lerpRot(torsoRef, targetTorsoRot.x, targetTorsoRot.y, targetTorsoRot.z, speed);

        if (action !== MoveType.HIT && action !== MoveType.BLOCK && action !== MoveType.BLOCK_HIT && action !== MoveType.TAUNT && action !== MoveType.ROLL) {
            lerpRot(headRef, targetHeadRot.x, targetHeadRot.y, targetHeadRot.z, speed);
        } else if (action === MoveType.BLOCK || action === MoveType.BLOCK_HIT || action === MoveType.TAUNT || action === MoveType.ROLL) {
            lerpRot(headRef, targetHeadRot.x, targetHeadRot.y, targetHeadRot.z, 0.8);
        }

        lerpVec3(armLRef, targetArmLPos.x, targetArmLPos.y, targetArmLPos.z, speed);
        lerpRot(armLRef, targetArmLRot.x, targetArmLRot.y, targetArmLRot.z, speed);
        lerpRot(forearmLRef, targetForearmLRot.x, targetForearmLRot.y, targetForearmLRot.z, speed);

        lerpVec3(armRRef, targetArmRPos.x, targetArmRPos.y, targetArmRPos.z, speed);
        lerpRot(armRRef, targetArmRRot.x, targetArmRRot.y, targetArmRRot.z, speed);
        lerpRot(forearmRRef, targetForearmRRot.x, targetForearmRRot.y, targetForearmRRot.z, speed);

        lerpVec3(legLRef, targetLegLPos.x, targetLegLPos.y, targetLegLPos.z, speed);
        lerpRot(legLRef, targetLegLRot.x, targetLegLRot.y, targetLegLRot.z, speed);

        lerpVec3(legRRef, targetLegRPos.x, targetLegRPos.y, targetLegRPos.z, speed);
        lerpRot(legRRef, targetLegRRot.x, targetLegRRot.y, targetLegRRot.z, speed);

        currentKneeFlexR.current += (targetKneeFlexR - currentKneeFlexR.current) * 0.3;
        if (lowerLegRRef.current) {
            lowerLegRRef.current.rotation.x = -0.05 + currentKneeFlexR.current;
        }

        if (forearmRRef.current && forearmRRef.current.children) {
            const fire = forearmRRef.current.children.find(c => c.userData.isFire);
            if (fire) fire.visible = showFire && (action === MoveType.PUNCH || action === MoveType.ELBOW);

            const uppercut = forearmRRef.current.children.find(c => c.userData.isUppercut);
            if (uppercut) uppercut.visible = showFire && (action === MoveType.UPPERCUT);
        }

        // Sync Knee Impact VFX Visibility
        if (kneeImpactRef.current) {
            kneeImpactRef.current.visible = showFire && (action === MoveType.KNEE);
        }
    });

    // VR Visibility logic: Hide torso and head if local player in VR
    const isBodyVisible = !(isPlayer && isPresenting);

    return (
        <group ref={groupRef} position={position} castShadow>

            {/* SPIRIT BUFF GLOW */}
            {ritualBuff?.isActive && (
                <group position={[0, 1, 0]}>
                    <Sparkles count={40} scale={2.5} size={6} speed={2} color="#facc15" opacity={0.8} />
                    <pointLight color="#facc15" intensity={2} distance={3} />
                </group>
            )}

            {/* --- VFX GROUP --- */}
            {sakYant && sakYant.currentIntegrity > 0 && <SakYantAura type={sakYant.type} level={sakYant.level} />}
            {showBreakVFX && <SakYantBreakVFX />}
            {action === MoveType.TAUNT && <TauntVFX />}
            {action === MoveType.BLOCK_HIT && <BlockShieldVFX />}
            {action === MoveType.VICTORY_POSE && <VictoryVFX />}

            <group ref={hitFlashRef} visible={false} position={[0, 1.3, 0.5]}>
                <mesh>
                    <dodecahedronGeometry args={[0.2, 0]} />
                    <meshBasicMaterial color="#ffddaa" transparent opacity={0.8} />
                </mesh>
                <mesh rotation={[Math.PI / 4, Math.PI / 4, 0]}>
                    <dodecahedronGeometry args={[0.4, 0]} />
                    <meshStandardMaterial
                        color={action === MoveType.BLOCK ? "#60a5fa" : "#f97316"}
                        emissive={action === MoveType.BLOCK ? "#60a5fa" : "#ea580c"}
                        emissiveIntensity={4}
                        transparent
                        opacity={0.9}
                    />
                </mesh>
            </group>

            <group ref={sweatParticlesRef} position={[0, 1.5, 0]} visible={false}>
                <Sparkles count={40} scale={3} size={4} speed={5} opacity={0.6} color="#bae6fd" noise={10} />
            </group>

            <group ref={punchEffectRef} position={[-0.25, 1.45, 0.6]} visible={false}>
                <mesh rotation={[Math.PI / 2, 0, 0]}>
                    <ringGeometry args={[0.1, 0.25, 32]} />
                    <meshBasicMaterial color="#60a5fa" transparent opacity={0.5} side={2} />
                </mesh>
                <Sparkles count={20} scale={0.8} size={6} speed={4} color="#bfdbfe" noise={0.5} />
            </group>

            {comboCount > 0 && (
                <group position={[0, 1, 0]}>
                    <Sparkles count={comboCount * 10} scale={1.5 + comboIntensity} color={comboCount > 3 ? "orange" : "white"} speed={1 + comboIntensity} />
                </group>
            )}

            {/* --- BODY CONTAINER FOR INDEPENDENT ROTATION --- */}
            <group ref={bodyRef}>
                <group ref={headRef} position={[0, 1.65, 0.05]} rotation={[0.1, 0, 0]}>
                    {/* Hide head in First Person View only for Player or in VR */}
                    {!(isPlayer && (isFirstPerson || isPresenting)) && (
                        <group>
                            <mesh castShadow receiveShadow>
                                <sphereGeometry args={[0.125, 32, 32]} />
                                <meshPhysicalMaterial {...skinBase} emissive={ritualBuff?.isActive ? "#facc15" : "#000"} emissiveIntensity={ritualBuff?.isActive ? 0.2 : 0} />
                            </mesh>
                            <mesh position={[0, -0.06, 0.03]}>
                                <boxGeometry args={[0.14, 0.14, 0.15]} />
                                <meshPhysicalMaterial {...skinBase} emissive={ritualBuff?.isActive ? "#facc15" : "#000"} emissiveIntensity={ritualBuff?.isActive ? 0.2 : 0} />
                            </mesh>
                            <mesh position={[0, 0, 0.11]} rotation={[-0.2, 0, 0]}>
                                <coneGeometry args={[0.015, 0.05, 4, 16]} />
                                <meshPhysicalMaterial {...skinFlushed} />
                            </mesh>
                            <KramaHeadband />
                        </group>
                    )}
                </group>

                <group ref={torsoRef} position={[0, 1.05, 0]}>
                    {/* Hide torso in First Person View or VR, but keep arms visible */}
                    {isBodyVisible && !isFirstPerson && (
                        <group>
                            <mesh position={[0, 0.32, 0]} castShadow receiveShadow>
                                <cylinderGeometry args={[0.24, 0.18, 0.35, 32]} />
                                <meshPhysicalMaterial {...skinBase} emissive={ritualBuff?.isActive ? "#facc15" : "#000"} emissiveIntensity={ritualBuff?.isActive ? 0.2 : 0} />
                            </mesh>
                            <mesh position={[0.24, 0.42, 0]} castShadow receiveShadow>
                                <sphereGeometry args={[0.11, 32, 32]} />
                                <meshPhysicalMaterial {...skinBase} emissive={ritualBuff?.isActive ? "#facc15" : "#000"} emissiveIntensity={ritualBuff?.isActive ? 0.2 : 0} />
                            </mesh>
                            <mesh position={[-0.24, 0.42, 0]} castShadow receiveShadow>
                                <sphereGeometry args={[0.11, 32, 32]} />
                                <meshPhysicalMaterial {...skinBase} emissive={ritualBuff?.isActive ? "#facc15" : "#000"} emissiveIntensity={ritualBuff?.isActive ? 0.2 : 0} />
                            </mesh>
                            <mesh position={[0, 0.05, 0]} castShadow receiveShadow>
                                <cylinderGeometry args={[0.17, 0.16, 0.35, 32]} />
                                <meshPhysicalMaterial {...skinBase} emissive={ritualBuff?.isActive ? "#facc15" : "#000"} emissiveIntensity={ritualBuff?.isActive ? 0.2 : 0} />
                            </mesh>
                            {sakYant && sakYant.currentIntegrity > 0 && <SakYantTattoo type={sakYant.type} level={sakYant.level} />}
                        </group>
                    )}

                    {/* Arms - Always Visible */}
                    <group ref={armLRef} position={[0.24, 0.35, 0]}>
                        <mesh position={[0, -0.2, 0]} rotation={[0, 0, -0.1]} castShadow receiveShadow>
                            <capsuleGeometry args={[0.08, 0.35, 8, 32]} />
                            <meshPhysicalMaterial {...skinBase} emissive={ritualBuff?.isActive ? "#facc15" : "#000"} emissiveIntensity={ritualBuff?.isActive ? 0.5 : 0} />
                        </mesh>
                        <mesh position={[0, -0.42, 0]} castShadow>
                            <sphereGeometry args={[0.075, 24, 24]} />
                            <meshPhysicalMaterial {...skinFlushed} />
                        </mesh>
                        <group ref={forearmLRef} position={[0, -0.42, 0]}>
                            <mesh position={[0, -0.22, 0]} castShadow>
                                <capsuleGeometry args={[0.07, 0.35, 8, 32]} />
                                <meshPhysicalMaterial {...skinBase} emissive={ritualBuff?.isActive ? "#facc15" : "#000"} emissiveIntensity={ritualBuff?.isActive ? 0.5 : 0} />
                            </mesh>
                            <mesh position={[0, -0.44, 0]} rotation={[0.2, 0, 0]}>
                                <boxGeometry args={[0.15, 0.18, 0.18]} />
                                <meshStandardMaterial color={color} roughness={0.4} />
                            </mesh>
                        </group>
                    </group>

                    <group ref={armRRef} position={[-0.24, 0.35, 0]}>
                        <mesh position={[0, -0.2, 0]} rotation={[0, 0, 0.1]} castShadow receiveShadow>
                            <capsuleGeometry args={[0.08, 0.35, 8, 32]} />
                            <meshPhysicalMaterial {...skinBase} emissive={ritualBuff?.isActive ? "#facc15" : "#000"} emissiveIntensity={ritualBuff?.isActive ? 0.5 : 0} />
                        </mesh>
                        <mesh position={[0, -0.42, 0]} castShadow>
                            <sphereGeometry args={[0.075, 24, 24]} />
                            <meshPhysicalMaterial {...skinFlushed} />
                        </mesh>
                        <group ref={forearmRRef} position={[0, -0.42, 0]}>
                            <mesh position={[0, -0.22, 0]} castShadow>
                                <capsuleGeometry args={[0.07, 0.35, 8, 32]} />
                                <meshPhysicalMaterial {...skinBase} emissive={ritualBuff?.isActive ? "#facc15" : "#000"} emissiveIntensity={ritualBuff?.isActive ? 0.5 : 0} />
                            </mesh>
                            <mesh position={[0, -0.44, 0]} rotation={[0.2, 0, 0]}>
                                <boxGeometry args={[0.15, 0.18, 0.18]} />
                                <meshStandardMaterial color={color} roughness={0.4} />
                            </mesh>

                            {/* VFX Attachment Point on Hand */}
                            {(action === MoveType.PUNCH || action === MoveType.ELBOW) && (
                                <group position={[0, -0.4, 0]} userData={{ isFire: true }} visible={false}>
                                    <FireVFX visible={true} />
                                </group>
                            )}
                            {(action === MoveType.UPPERCUT) && (
                                <group position={[0, -0.4, 0]} userData={{ isUppercut: true }} visible={false}>
                                    <UppercutVFX visible={true} color={color} />
                                </group>
                            )}
                        </group>
                    </group>
                </group>

                {/* Shorts */}
                {isBodyVisible && (
                    <group position={[0, 0.85, 0]}>
                        <mesh castShadow receiveShadow>
                            <cylinderGeometry args={[0.23, 0.27, 0.32, 32]} />
                            <meshStandardMaterial color="#111" {...shortsMaterial} />
                        </mesh>
                        <mesh position={[0, 0, 0.12]}>
                            <boxGeometry args={[0.28, 0.1, 0.05]} />
                            <meshStandardMaterial color={color} />
                        </mesh>
                        <mesh position={[0.23, 0, 0]} rotation={[0, 0, 0.1]}>
                            <boxGeometry args={[0.02, 0.32, 0.15]} />
                            <meshStandardMaterial color={color} />
                        </mesh>
                        <mesh position={[-0.23, 0, 0]} rotation={[0, 0, -0.1]}>
                            <boxGeometry args={[0.02, 0.32, 0.15]} />
                            <meshStandardMaterial color={color} />
                        </mesh>
                    </group>
                )}

                {isBodyVisible && (
                    <>
                        <group ref={legLRef} position={[0.15, 0.8, 0]}>
                            <RealisticLeg isAttacking={false} activeMoveColor={activeMoveColor} />
                        </group>

                        <group ref={legRRef} position={[-0.15, 0.8, 0]}>
                            <RealisticLeg
                                isAttacking={action === MoveType.KICK || action === MoveType.KNEE}
                                activeMoveColor={activeMoveColor}
                                lowerLegRef={lowerLegRRef}
                            />
                            {/* Leg VFX Attachments */}
                            {action === MoveType.KICK && (
                                <group position={[0, -0.6, 0]}>
                                    <KickSlashVFX visible={true} color={activeMoveColor} />
                                </group>
                            )}
                            {action === MoveType.KNEE && (
                                <group ref={kneeImpactRef} position={[0, -0.4, 0.2]} visible={false}>
                                    <KneeImpactVFX visible={true} color={activeMoveColor} />
                                </group>
                            )}
                        </group>
                    </>
                )}
            </group>

        </group>
    );
};

export default Fighter;
