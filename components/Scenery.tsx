
import React, { useMemo, useRef, useLayoutEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import { BackSide, Object3D, InstancedMesh, Color } from 'three';
import { Stars, Sparkles, Cloud, Environment } from '@react-three/drei';
import { DevicePerformanceProfile, SceneryTheme } from '../types';

interface SceneryProps {
    theme: SceneryTheme;
    performanceProfile: DevicePerformanceProfile;
}

interface TempleTowerProps {
    position: [number, number, number];
    scale: number;
    materialProps: any;
}

const TempleTower: React.FC<TempleTowerProps> = ({ position, scale, materialProps }) => {
    return (
        <group position={position} scale={[scale, scale, scale]}>
            {/* Base Tiers */}
            <mesh position={[0, 0.5, 0]}>
                <boxGeometry args={[4, 1, 4]} />
                <meshStandardMaterial {...materialProps} />
            </mesh>
            <mesh position={[0, 1.5, 0]}>
                <boxGeometry args={[3, 1, 3]} />
                <meshStandardMaterial {...materialProps} />
            </mesh>
            <mesh position={[0, 2.25, 0]}>
                <boxGeometry args={[2.2, 0.5, 2.2]} />
                <meshStandardMaterial {...materialProps} />
            </mesh>

            {/* Main Prang (Lotus Bud Shape) - Constructed from stacked cylinders */}
            <mesh position={[0, 3.5, 0]}>
                <cylinderGeometry args={[0.9, 1.4, 2, 8]} />
                <meshStandardMaterial {...materialProps} />
            </mesh>
            <mesh position={[0, 5.0, 0]}>
                <cylinderGeometry args={[0.6, 0.9, 2, 8]} />
                <meshStandardMaterial {...materialProps} />
            </mesh>
            <mesh position={[0, 6.5, 0]}>
                <cylinderGeometry args={[0.2, 0.6, 2.5, 8]} />
                <meshStandardMaterial {...materialProps} />
            </mesh>
            <mesh position={[0, 8, 0]}>
                <coneGeometry args={[0.2, 1.5, 8]} />
                <meshStandardMaterial {...materialProps} />
            </mesh>

            {/* Detail Ridges */}
            <mesh position={[0, 4.5, 0]} rotation={[Math.PI / 2, 0, 0]}>
                <torusGeometry args={[0.95, 0.05, 6, 8]} />
                <meshStandardMaterial {...materialProps} />
            </mesh>
        </group>
    )
}

// --- NEW: Lotus Flower for Rice Paddies ---
const LotusFlower: React.FC<{ position: [number, number, number] }> = ({ position }) => {
    return (
        <group position={position}>
            <mesh position={[0, 0.02, 0]}>
                <cylinderGeometry args={[0.2, 0, 0.15, 6]} />
                <meshStandardMaterial color="#ec4899" emissive="#be185d" emissiveIntensity={0.2} />
            </mesh>
            <mesh position={[0, 0, 0]} rotation={[-Math.PI / 2, 0, 0]}>
                <circleGeometry args={[0.3, 8]} />
                <meshStandardMaterial color="#15803d" />
            </mesh>
        </group>
    )
}

interface RicePaddyProps {
    position: [number, number, number];
    width: number;
    length: number;
    theme: SceneryTheme;
}

const RicePaddy: React.FC<RicePaddyProps> = ({ position, width, length, theme }) => {
    const lotuses = useMemo(() => {
        return [...Array(Math.floor(width / 4))].map(() => ({
            x: (Math.random() - 0.5) * (width * 0.8),
            z: (Math.random() - 0.5) * (length * 0.8)
        }));
    }, [width, length]);

    return (
        <group position={position}>
            {/* Water Surface */}
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.05, 0]}>
                <planeGeometry args={[width - 0.5, length - 0.5]} />
                <meshStandardMaterial
                    color={theme.skyBottom}
                    roughness={0.05}
                    metalness={0.8}
                    transparent
                    opacity={0.8}
                />
            </mesh>
            {/* Ridge/Bund */}
            <mesh rotation={[-Math.PI / 2, 0, 0]}>
                <planeGeometry args={[width, length]} />
                <meshStandardMaterial color="#3f2e20" roughness={1} />
            </mesh>
            {/* Rice Plants */}
            {[...Array(15)].map((_, i) => (
                <mesh key={i} position={[(Math.random() - 0.5) * width * 0.8, 0.2, (Math.random() - 0.5) * length * 0.8]} rotation={[0, Math.random() * Math.PI, 0]}>
                    <planeGeometry args={[0.5, 0.4]} />
                    <meshStandardMaterial color="#65a30d" side={2} transparent opacity={0.6} />
                </mesh>
            ))}
            {/* Lotus Flowers */}
            {lotuses.map((l, i) => (
                <LotusFlower key={`lotus-${i}`} position={[l.x, 0.06, l.z]} />
            ))}
        </group>
    )
}

// --- NEW: Naga Balustrade Railing ---
const NagaRail = ({ position, length, rotation = 0, theme }: { position: [number, number, number], length: number, rotation?: number, theme: SceneryTheme }) => {
    const posts = Math.floor(length / 2);
    return (
        <group position={position} rotation={[0, rotation, 0]}>
            {/* Naga Body (Rail) */}
            <mesh position={[0, 1, 0]} rotation={[0, 0, Math.PI / 2]}>
                <cylinderGeometry args={[0.25, 0.25, length, 8]} />
                <meshStandardMaterial color={theme.templeColor} roughness={0.6} />
            </mesh>
            {/* Posts */}
            {[...Array(posts)].map((_, i) => (
                <mesh key={i} position={[-length / 2 + i * 2.1, 0.5, 0]}>
                    <boxGeometry args={[0.6, 1.2, 0.6]} />
                    <meshStandardMaterial color={theme.templeColor} roughness={0.8} />
                </mesh>
            ))}
            {/* Naga Head (Abstract) */}
            <group position={[length / 2 + 0.5, 1.5, 0]}>
                <mesh rotation={[0, 0, -0.5]}>
                    <cylinderGeometry args={[0.4, 0.3, 1.5, 8]} />
                    <meshStandardMaterial color={theme.templeColor} />
                </mesh>
                <mesh position={[0.5, 0.8, 0]}>
                    <sphereGeometry args={[0.5]} />
                    <meshStandardMaterial color={theme.templeColor} />
                </mesh>
            </group>
        </group>
    );
};

// Procedural Silhouette of Angkor Wat to replace external image
const AngkorSilhouette: React.FC<{ color: string }> = ({ color }) => {
    const mat = <meshBasicMaterial color={color} transparent opacity={0.9} fog={false} />;
    return (
        <group position={[0, 14, -90]} scale={[2.5, 2.5, 1]}>
            <group position={[0, 0, 0]}>
                <mesh position={[0, 5, 0]}>
                    <planeGeometry args={[5, 10]} />
                    {mat}
                </mesh>
                <mesh position={[0, 12, 0]} rotation={[0, Math.PI / 4, 0]}>
                    <cylinderGeometry args={[0, 2.5, 8, 4]} />
                    {mat}
                </mesh>
            </group>
            {[-8, 8].map((x, i) => (
                <group key={i} position={[x, -2, 0]}>
                    <mesh position={[0, 4, 0]}>
                        <planeGeometry args={[4, 8]} />
                        {mat}
                    </mesh>
                    <mesh position={[0, 9.5, 0]} rotation={[0, Math.PI / 4, 0]}>
                        <cylinderGeometry args={[0, 2, 6, 4]} />
                        {mat}
                    </mesh>
                </group>
            ))}
            {[-16, 16].map((x, i) => (
                <group key={i} position={[x, -4, 0]}>
                    <mesh position={[0, 3, 0]}>
                        <planeGeometry args={[3, 6]} />
                        {mat}
                    </mesh>
                    <mesh position={[0, 7, 0]} rotation={[0, Math.PI / 4, 0]}>
                        <cylinderGeometry args={[0, 1.5, 5, 4]} />
                        {mat}
                    </mesh>
                </group>
            ))}
            <mesh position={[0, -1, 0]}>
                <planeGeometry args={[40, 6]} />
                {mat}
            </mesh>
        </group>
    );
};

// --- MARKET COMPONENTS ---

const LanternString = ({ position, rotation = 0 }: { position: [number, number, number], rotation?: number }) => {
    return (
        <group position={position} rotation={[0, rotation, 0]}>
            <mesh position={[0, 4, 0]} rotation={[0, 0, Math.PI / 2]}>
                <cylinderGeometry args={[0.02, 0.02, 20]} />
                <meshBasicMaterial color="#333" />
            </mesh>
            {[...Array(6)].map((_, i) => {
                const x = (i - 2.5) * 3;
                const color = i % 2 === 0 ? '#ef4444' : '#eab308';
                return (
                    <group key={i} position={[x, 3.8, 0]}>
                        <mesh>
                            <sphereGeometry args={[0.3, 16, 16]} />
                            <meshStandardMaterial color={color} emissive={color} emissiveIntensity={2} />
                        </mesh>
                        <pointLight distance={6} intensity={2} color={color} />
                    </group>
                )
            })}
        </group>
    )
}

const MarketStall = ({ position, side, color }: { position: [number, number, number], side: 'left' | 'right', color: string }) => {
    const rotation = side === 'left' ? Math.PI / 2 : -Math.PI / 2;
    const awningColor = color === 'red' ? '#dc2626' : (color === 'blue' ? '#2563eb' : '#16a34a');

    return (
        <group position={position} rotation={[0, rotation, 0]}>
            {/* Frame */}
            <mesh position={[-1.2, 1.5, 1]} castShadow>
                <boxGeometry args={[0.1, 3, 0.1]} />
                <meshStandardMaterial color="#573a24" />
            </mesh>
            <mesh position={[1.2, 1.5, 1]} castShadow>
                <boxGeometry args={[0.1, 3, 0.1]} />
                <meshStandardMaterial color="#573a24" />
            </mesh>
            <mesh position={[-1.2, 1.5, -1]} castShadow>
                <boxGeometry args={[0.1, 3, 0.1]} />
                <meshStandardMaterial color="#573a24" />
            </mesh>
            <mesh position={[1.2, 1.5, -1]} castShadow>
                <boxGeometry args={[0.1, 3, 0.1]} />
                <meshStandardMaterial color="#573a24" />
            </mesh>

            {/* Counter */}
            <mesh position={[0, 0.6, 0]} castShadow receiveShadow>
                <boxGeometry args={[2.4, 1.2, 1.5]} />
                <meshStandardMaterial color="#e5e5e5" />
            </mesh>

            {/* Awning/Roof */}
            <group position={[0, 2.8, 0]} rotation={[0.1, 0, 0]}>
                <mesh castShadow>
                    <boxGeometry args={[2.8, 0.1, 2.4]} />
                    <meshStandardMaterial color={awningColor} />
                </mesh>
                {/* Neon Trim */}
                <mesh position={[0, -0.05, 1.2]}>
                    <boxGeometry args={[2.8, 0.05, 0.05]} />
                    <meshBasicMaterial color={awningColor} toneMapped={false} />
                </mesh>
            </group>

            {/* Hanging Light */}
            <group position={[0, 2.2, 0.5]}>
                <mesh>
                    <sphereGeometry args={[0.15]} />
                    <meshBasicMaterial color="#fef08a" toneMapped={false} />
                </mesh>
                <pointLight intensity={3} distance={5} color="#fef08a" />
            </group>

            {/* Simple Wares */}
            <mesh position={[-0.5, 1.25, 0]}>
                <cylinderGeometry args={[0.2, 0.3, 0.3]} />
                <meshStandardMaterial color="orange" />
            </mesh>
            <mesh position={[0.5, 1.25, 0]}>
                <boxGeometry args={[0.4, 0.2, 0.4]} />
                <meshStandardMaterial color="green" />
            </mesh>
        </group>
    )
}

// --- ANIMATED CROWD COMPONENT ---
const Crowd: React.FC<{ density: number; castShadowEnabled: boolean }> = ({ density, castShadowEnabled }) => {
    const meshRef = useRef<InstancedMesh>(null);
    const count = Math.max(60, Math.round(350 * density));
    const dummy = useMemo(() => new Object3D(), []);

    // Generate random positions for audience
    const crowdData = useMemo(() => {
        return [...Array(count)].map(() => ({
            // Position on left or right bleachers
            side: Math.random() > 0.5 ? 1 : -1,
            row: Math.floor(Math.random() * 5),
            offset: Math.random() * 20 - 10,
            color: new Color().setHSL(Math.random(), 0.8, 0.5),
            speed: 0.5 + Math.random() * 2,
            phase: Math.random() * Math.PI * 2
        }));
    }, [count]);

    useLayoutEffect(() => {
        if (meshRef.current) {
            crowdData.forEach((data, i) => {
                meshRef.current!.setColorAt(i, data.color);
            });
            meshRef.current.instanceColor!.needsUpdate = true;
        }
    }, [crowdData]);

    useFrame((state) => {
        if (!meshRef.current) return;
        const t = state.clock.elapsedTime;

        crowdData.forEach((data, i) => {
            const x = data.side * (10 + data.row * 1.5);
            const y = 0.5 + data.row * 1;
            const z = data.offset;

            // Jumping Animation
            const jump = Math.sin(t * data.speed + data.phase) > 0.5 ? 0.3 : 0;
            const sway = Math.cos(t * data.speed * 0.5) * 0.2;

            dummy.position.set(x, y + jump, z + sway);

            // Face center
            dummy.lookAt(0, 0, 0);

            // Scale pop
            const s = 1 + Math.sin(t * data.speed * 2) * 0.1;
            dummy.scale.set(s, s, s);

            dummy.updateMatrix();
            meshRef.current!.setMatrixAt(i, dummy.matrix);
        });
        meshRef.current.instanceMatrix.needsUpdate = true;
    });

    return (
        <group>
            {/* Bleachers Geometry */}
            <group position={[14, 0, 0]}>
                {[0, 1, 2, 3, 4].map(i => (
                    <mesh key={i} position={[i * 1.5, i * 1, 0]}>
                        <boxGeometry args={[1.5, 1, 24]} />
                        <meshStandardMaterial color="#57534e" />
                    </mesh>
                ))}
            </group>
            <group position={[-14, 0, 0]}>
                {[0, 1, 2, 3, 4].map(i => (
                    <mesh key={i} position={[-i * 1.5, i * 1, 0]}>
                        <boxGeometry args={[1.5, 1, 24]} />
                        <meshStandardMaterial color="#57534e" />
                    </mesh>
                ))}
            </group>

            {/* Audience Instanced Mesh */}
            <instancedMesh ref={meshRef} args={[undefined, undefined, count]} castShadow={castShadowEnabled}>
                <capsuleGeometry args={[0.25, 0.6, 4, 8]} />
                <meshStandardMaterial />
            </instancedMesh>
        </group>
    );
};

const Scenery: React.FC<SceneryProps> = ({ theme, performanceProfile }) => {
    const palmTrees = useMemo(() => {
        const treeCount = Math.max(16, Math.round(60 * performanceProfile.sceneryDensity));
        return [...Array(treeCount)].map(() => ({
            x: Math.cos(Math.random() * Math.PI) * (25 + Math.random() * 50) * (Math.random() > 0.5 ? 1 : -1),
            z: -15 - Math.random() * 60,
            scale: 0.9 + Math.random() * 1.5,
            rotation: Math.random() * Math.PI
        }));
    }, [performanceProfile.sceneryDensity]);

    const ricePaddies = useMemo(() => {
        const fields: { x: number, z: number, width: number, length: number }[] = [];
        const step = performanceProfile.sceneryDensity < 0.6 ? 2 : 1;
        for (let x = -75; x <= 75; x += 25) {
            for (let z = -100; z <= -20; z += 20) {
                if (Math.abs(x) > 10 || z < -40) {
                    fields.push({ x, z, width: 24, length: 19 });
                }
            }
        }
        return fields.filter((_, index) => index % step === 0);
    }, [performanceProfile.sceneryDensity]);

    const birds = useMemo(() => {
        if (theme.id === 'NIGHT' || theme.id === 'MARKET') return [];
        const birdCount = Math.max(4, Math.round(15 * performanceProfile.sceneryDensity));
        return [...Array(birdCount)].map(() => ({
            x: (Math.random() - 0.5) * 100,
            y: 20 + Math.random() * 15,
            z: -50 - Math.random() * 40,
            speed: 0.5 + Math.random() * 0.5
        }));
    }, [performanceProfile.sceneryDensity, theme.id]);

    const templeMaterialProps = {
        color: theme.templeColor,
        roughness: 0.9,
        emissive: theme.templeEmissive,
        emissiveIntensity: 0.25
    };

    const isMarket = theme.id === 'MARKET';

    return (
        <group>
            <ambientLight intensity={theme.ambientIntensity} color={theme.sunColor} />
            <directionalLight
                position={[-30, 40, 20]}
                intensity={isMarket || theme.id === 'NIGHT' ? 0.3 : 1.5}
                color={theme.sunColor}
                castShadow={performanceProfile.enableShadows}
                shadow-mapSize={[performanceProfile.shadowMapSize, performanceProfile.shadowMapSize]}
                shadow-bias={-0.0005}
            />

            {performanceProfile.enableEnvironment && (
                <Environment preset={theme.environmentPreset as any} />
            )}

            <mesh position={[0, 0, 0]} scale={[200, 200, 200]}>
                <sphereGeometry args={[1, 32, 32, 0, Math.PI * 2, 0, Math.PI * 0.5]} />
                <meshBasicMaterial side={BackSide} color={theme.skyTop} fog={false} />
            </mesh>

            <AngkorSilhouette color={theme.id === 'SUNSET' ? '#572810' : theme.templeColor} />

            {theme.id !== 'NIGHT' && !isMarket && performanceProfile.cloudSegments > 0 && (
                <group position={[0, 35, -60]}>
                    <Cloud
                        opacity={0.5}
                        speed={0.1}
                        bounds={[50, 10, 10]}
                        segments={performanceProfile.cloudSegments}
                        color={theme.fogColor}
                    />
                </group>
            )}

            {(theme.id === 'NIGHT' || isMarket) && (
                <>
                    <Stars
                        radius={95}
                        depth={50}
                        count={performanceProfile.starCount}
                        factor={4}
                        saturation={0}
                        fade
                        speed={0.5}
                    />
                    <Sparkles
                        count={Math.max(24, Math.round(150 * performanceProfile.particleMultiplier))}
                        scale={40}
                        size={5}
                        speed={0.3}
                        opacity={0.8}
                        color="#fef3c7"
                        position={[0, 2, -20]}
                    />
                </>
            )}

            <mesh position={[0, -5, -90]}>
                <planeGeometry args={[300, 60]} />
                <meshStandardMaterial color={theme.id === 'NIGHT' || isMarket ? '#020617' : '#292524'} />
            </mesh>

            {/* Market Logic */}
            {isMarket ? (
                <group>
                    {/* Rows of Stalls */}
                    {[-1, 0, 1].map(z => (
                        <group key={z} position={[0, 0, z * 8]}>
                            <MarketStall position={[-8, 0, 0]} side="left" color={z === 0 ? 'red' : 'blue'} />
                            <MarketStall position={[8, 0, 0]} side="right" color={z === 0 ? 'green' : 'red'} />
                        </group>
                    ))}

                    {/* Hanging Lanterns */}
                    <LanternString position={[0, 0, -5]} />
                    <LanternString position={[0, 0, 0]} />
                    <LanternString position={[0, 0, 5]} />
                </group>
            ) : (
                <group position={[0, -1.02, 0]}>
                    {ricePaddies.map((paddy, i) => (
                        <RicePaddy key={i} position={[paddy.x, 0, paddy.z]} width={paddy.width} length={paddy.length} theme={theme} />
                    ))}
                </group>
            )}

            <Crowd density={performanceProfile.crowdDensity} castShadowEnabled={performanceProfile.enableShadows} />

            {/* === PROCEDURAL TEMPLE COMPLEX === */}
            {!isMarket && (
                <group position={[0, -1, -55]}>
                    <mesh position={[0, 0.1, 18]}>
                        <boxGeometry args={[8, 0.2, 40]} />
                        <meshStandardMaterial color={theme.ground} />
                    </mesh>
                    <NagaRail position={[-4.5, 0, 18]} length={40} theme={theme} />
                    <NagaRail position={[4.5, 0, 18]} length={40} theme={theme} />

                    <TempleTower position={[0, 0, 0]} scale={2.5} materialProps={templeMaterialProps} />
                    <TempleTower position={[-12, 0, 12]} scale={1.6} materialProps={templeMaterialProps} />
                    <TempleTower position={[12, 0, 12]} scale={1.6} materialProps={templeMaterialProps} />
                </group>
            )}

            {palmTrees.map((tree, idx) => (
                <group key={idx} position={[tree.x, -1, tree.z]} scale={[tree.scale, tree.scale, tree.scale]} rotation={[0, tree.rotation, 0]}>
                    <mesh position={[0, 2, 0]} rotation={[0.1, 0, 0]} castShadow={performanceProfile.enableShadows}>
                        <cylinderGeometry args={[0.15, 0.28, 4, 7]} />
                        <meshStandardMaterial color="#3f2e20" roughness={1} />
                    </mesh>
                    <mesh position={[0, 4.5, 0.4]} rotation={[0.2, 0, 0]} castShadow={performanceProfile.enableShadows}>
                        <cylinderGeometry args={[0.1, 0.15, 2, 6]} />
                        <meshStandardMaterial color="#3f2e20" roughness={1} />
                    </mesh>
                    <group position={[0, 5.5, 0.6]}>
                        {[0, 1, 2, 3, 4, 5, 6, 7].map((r) => (
                            <group key={r} rotation={[0.25, r * (Math.PI * 2 / 8), 0]}>
                                <mesh position={[0, 0.2, 1.4]} rotation={[0.5, 0, 0]} castShadow={performanceProfile.enableShadows}>
                                    <cylinderGeometry args={[0.01, 0.1, 4]} />
                                    <meshStandardMaterial color={theme.id === 'NIGHT' || isMarket ? '#0f172a' : '#15803d'} roughness={0.8} side={2} />
                                </mesh>
                            </group>
                        ))}
                    </group>
                </group>
            ))}

            {birds.map((bird, i) => (
                <mesh key={i} position={[bird.x, bird.y, bird.z]} rotation={[0.2, Math.PI / 4, 0]}>
                    <coneGeometry args={[0.15, 0.5, 4]} />
                    <meshBasicMaterial color="#000" />
                </mesh>
            ))}

            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -1.05, 0]} receiveShadow>
                <planeGeometry args={[400, 400]} />
                <meshStandardMaterial color={theme.ground} roughness={1} />
            </mesh>

        </group>
    );
};

export default Scenery;
