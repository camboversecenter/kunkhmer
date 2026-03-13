
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { CameraShake, OrbitControls, Text, Float } from '@react-three/drei';
import { EffectComposer, Bloom, Vignette } from '@react-three/postprocessing';
import { XR, VRButton, useXR, Controllers, useController, useXREvent } from '@react-three/xr';
import { Vector3, Group, MathUtils, PerspectiveCamera, MeshBasicMaterial } from 'three';
import {
    AssetDownloadStatus,
    DeviceCapabilities,
    DevicePerformanceProfile,
    Difficulty,
    FighterStats,
    GameMode,
    GameState,
    GraphicsMode,
    GraphicsPreset,
    HeroId,
    LeaderboardEntry,
    LeaderboardPeriod,
    LootReward,
    MoveType,
    OnlineState,
    PeerData,
    PlayerInventory,
    PlayerProfile,
    RendererTelemetry,
    RitualBuff,
    SakYantType,
    SceneryTheme,
    UserProfile
} from './types';
import { MOVES, SAK_YANT_DB, FIGHTER_CONFIG, ADVENTURE_OPPONENTS, GAME_ECONOMY, INITIAL_INVENTORY, HEROES_DB } from './constants';
import Fighter from './components/Fighter';
import Arena from './components/Arena';
import Scenery from './components/Scenery';
import FloatingDamage from './components/FloatingDamage';
import HowToPlay from './components/HowToPlay';
import SakYantMenu from './components/SakYantMenu';
import OnlineLobby from './components/OnlineLobby';
import Joystick from './components/Joystick';
import AdventureMap from './components/AdventureMap';
import TreasureBoxOverlay from './components/TreasureBoxOverlay';
import CharacterSelect from './components/CharacterSelect';
import RitualOverlay from './components/RitualOverlay';
import { playSound, startBackgroundMusic, stopBackgroundMusic, toggleMute } from './services/audioService';
import { initializeGoogleAuth, renderGoogleButton, getLeaderboard, submitScore, cancelAuth, saveUserData, loadUserData } from './services/authService';
import { initializePeer, connectToPeer, sendData, sendToPeer, destroyPeer } from './services/peerService';
import {
    buildPerformanceProfile,
    DEFAULT_ASSET_DOWNLOAD_STATUS,
    DEFAULT_DEVICE_CAPABILITIES,
    detectDeviceCapabilities,
    hydrateCapabilitiesWithRenderer,
    readRendererTelemetry,
    scheduleOptionalAssetDownloads,
    shiftGraphicsPreset
} from './services/performanceService';
import { Sword, Trophy, Book, ChevronLeft, Lock, Check, Globe, User, Copy, Wifi, WifiOff, Volume2, VolumeX, AlertCircle, Activity, Glasses, Home, Mic, Monitor, HelpCircle, Eye, EyeOff, Zap, MessageSquare, Map, Star, Settings, Shield, Move, Coins, Crown, ArrowUp, ChevronRight, Flame, Music } from 'lucide-react';

const SCENERY_THEMES: SceneryTheme[] = [
    {
        id: 'SUNSET',
        name: 'Angkor Sunset',
        skyTop: '#2e1065',
        skyBottom: '#ea580c',
        ground: '#7f5539',
        fogColor: '#451a03',
        sunColor: '#f59e0b',
        ambientIntensity: 0.5,
        templeColor: '#1c1917',
        templeEmissive: '#572810',
        environmentPreset: 'sunset'
    },
    {
        id: 'DAY',
        name: 'Midday Ruins',
        skyTop: '#0284c7',
        skyBottom: '#bae6fd',
        ground: '#a8a29e',
        fogColor: '#e0f2fe',
        sunColor: '#fffbeb',
        ambientIntensity: 0.9,
        templeColor: '#78716c',
        templeEmissive: '#292524',
        environmentPreset: 'park'
    },
    {
        id: 'NIGHT',
        name: 'Midnight Legend',
        skyTop: '#020617',
        skyBottom: '#1e1b4b',
        ground: '#0c0a09',
        fogColor: '#020617',
        sunColor: '#e2e8f0',
        ambientIntensity: 0.2,
        templeColor: '#1e293b',
        templeEmissive: '#0f172a',
        environmentPreset: 'night'
    },
    {
        id: 'MARKET',
        name: 'Night Market',
        skyTop: '#1e1b4b',
        skyBottom: '#4c1d95',
        ground: '#1f2937',
        fogColor: '#1e1b4b',
        sunColor: '#fbbf24',
        ambientIntensity: 0.6,
        templeColor: '#374151',
        templeEmissive: '#111827',
        environmentPreset: 'city'
    }
];

const INITIAL_STATS: FighterStats = {
    maxHealth: 500,
    currentHealth: 500,
    stamina: 120,
    maxStamina: 120,
    staminaRegenMultiplier: 1.0,
    activeSakYant: null
};

const INITIAL_PROFILE: PlayerProfile = {
    level: 0,
    currentExp: 0,
    maxExp: GAME_ECONOMY.LEVEL_BASE_XP,
    currency: 0,
    adventureStage: 0
};

// --- VR COMPONENTS ---

const VRControllerHandler = ({
    onAction,
    playerPositionRef
}: {
    onAction: (move: MoveType) => void,
    playerPositionRef: React.MutableRefObject<Vector3>
}) => {
    const { player, isPresenting } = useXR();
    const leftController = useController('left');
    const rightController = useController('right');

    // Trigger attacks
    useXREvent('selectstart', (e) => {
        if (!isPresenting) return;
        // Right hand usually handles primary attacks
        if (e.pointer_id === rightController?.id) {
            onAction(MoveType.PUNCH);
        } else {
            onAction(MoveType.KICK);
        }
    });

    // Grip for blocking
    useXREvent('squeezestart', (e) => {
        onAction(MoveType.BLOCK);
    });

    useXREvent('squeezeend', (e) => {
        onAction(MoveType.IDLE);
    });

    useFrame((state, delta) => {
        if (!isPresenting || !player) return;

        // --- LOCOMOTION (Left Thumbstick) ---
        if (leftController?.inputSource?.gamepad) {
            const axes = leftController.inputSource.gamepad.axes;
            // Standard mapping: 2 = Horizontal, 3 = Vertical
            const axisX = axes[2] || 0;
            const axisY = axes[3] || 0;

            if (Math.abs(axisX) > 0.1 || Math.abs(axisY) > 0.1) {
                const speed = 2.5 * delta;
                
                // Get camera direction for forward movement
                const direction = new Vector3();
                state.camera.getWorldDirection(direction);
                direction.y = 0;
                direction.normalize();

                const side = new Vector3().crossVectors(state.camera.up, direction).normalize();

                // Move the XR Rig
                player.position.add(direction.multiplyScalar(-axisY * speed));
                player.position.add(side.multiplyScalar(axisX * speed));

                // Boundary check
                player.position.x = MathUtils.clamp(player.position.x, -5, 5);
                player.position.z = MathUtils.clamp(player.position.z, -5, 5);
            }
        }

        // --- POSITION SYNC ---
        // Keep the game logic's player position in sync with XR rig
        playerPositionRef.current.copy(player.position);

        // --- ADDITIONAL BUTTON MAPPING ---
        if (rightController?.inputSource?.gamepad) {
            const gamepad = rightController.inputSource.gamepad;
            // Button 4 = A/X, Button 5 = B/Y
            if (gamepad.buttons[4]?.pressed) onAction(MoveType.UPPERCUT);
            if (gamepad.buttons[5]?.pressed) onAction(MoveType.KNEE);
        }
    });

    return null;
};

const VRFloatingHUD = ({ playerStats, opponentStats }: { playerStats: FighterStats, opponentStats: FighterStats }) => {
    const { isPresenting } = useXR();
    if (!isPresenting) return null;

    return (
        <group position={[0, 2.5, -2]}>
            <Float speed={2} rotationIntensity={0.2} floatIntensity={0.5}>
                <group scale={[0.8, 0.8, 0.8]}>
                    {/* Player Stats Panel */}
                    <group position={[-1.2, 0, 0]}>
                        <Text position={[0, 0.3, 0]} fontSize={0.1} color="white" font="https://fonts.gstatic.com/s/pressstart2p/v15/e3t4euO8T-267oIAQAu6jTrynsmwp6A.woff">
                            YOU
                        </Text>
                        <mesh position={[0, 0, 0]}>
                            <planeGeometry args={[1, 0.1]} />
                            <meshBasicMaterial color="#333" />
                        </mesh>
                        <mesh position={[-(1 - playerStats.currentHealth / playerStats.maxHealth) / 2, 0, 0.01]}>
                            <planeGeometry args={[playerStats.currentHealth / playerStats.maxHealth, 0.08]} />
                            <meshBasicMaterial color="#3b82f6" />
                        </mesh>
                    </group>

                    {/* VS Divider */}
                    <Text position={[0, 0, 0]} fontSize={0.2} color="#eab308">VS</Text>

                    {/* Opponent Stats Panel */}
                    <group position={[1.2, 0, 0]}>
                        <Text position={[0, 0.3, 0]} fontSize={0.1} color="white" font="https://fonts.gstatic.com/s/pressstart2p/v15/e3t4euO8T-267oIAQAu6jTrynsmwp6A.woff">
                            OPPONENT
                        </Text>
                        <mesh position={[0, 0, 0]}>
                            <planeGeometry args={[1, 0.1]} />
                            <meshBasicMaterial color="#333" />
                        </mesh>
                        <mesh position={[(1 - opponentStats.currentHealth / opponentStats.maxHealth) / 2, 0, 0.01]}>
                            <planeGeometry args={[opponentStats.currentHealth / opponentStats.maxHealth, 0.08]} />
                            <meshBasicMaterial color="#ef4444" />
                        </mesh>
                    </group>
                </group>
            </Float>
        </group>
    );
};

// --- CONTROLLERS ---

const AiController = ({
    playerPos,
    opponentPos,
    isActive,
    difficulty,
    action
}: {
    playerPos: React.MutableRefObject<Vector3>,
    opponentPos: React.MutableRefObject<Vector3>,
    isActive: boolean,
    difficulty: Difficulty,
    action: MoveType
}) => {
    useFrame((state, delta) => {
        if (!isActive) return;
        // Pause movement during active attack animations to prevent sliding
        if (action !== MoveType.IDLE && action !== MoveType.BLOCK && action !== MoveType.BLOCK_HIT && action !== MoveType.TAUNT && action !== MoveType.ROLL) return;

        const p = playerPos.current;
        const o = opponentPos.current;
        const dist = p.distanceTo(o);

        const speed = difficulty === Difficulty.HARD ? 2.5 : (difficulty === Difficulty.EASY ? 1.5 : 2.0);

        // Chase logic
        if (dist > 1.6) { // Attack range is approx 1.8 (hitRange) to 2.0 (cpu trigger)
            const dir = new Vector3().subVectors(p, o).normalize();
            // Remove Y component to stay on floor
            dir.y = 0;
            dir.normalize();

            o.add(dir.multiplyScalar(speed * delta));

            // Simple boundary check
            o.x = MathUtils.clamp(o.x, -5, 5);
            o.z = MathUtils.clamp(o.z, -5, 5);
        } else if (dist < 1.0) {
            // Back off slightly if too close
            const dir = new Vector3().subVectors(o, p).normalize();
            dir.y = 0;
            o.add(dir.multiplyScalar(1.0 * delta));
        }
    });
    return null;
}

const ViewController = ({
    isFirstPerson,
    playerPosition,
    opponentPosition,
    playerAction,
    isHit,
    inputState,
    cpuActionRef,
    gameState
}: {
    isFirstPerson: boolean,
    playerPosition: Vector3,
    opponentPosition: Vector3,
    playerAction: MoveType,
    isHit: boolean,
    inputState: React.MutableRefObject<Set<string>>,
    cpuActionRef?: React.MutableRefObject<MoveType>,
    gameState: GameState
}) => {
    const { camera } = useThree();
    const { isPresenting } = useXR();
    const timeRef = useRef(0);
    const shakeIntensity = useRef(0);

    // Orbit Camera State
    const camState = useRef({ azimuth: 0, zoom: 0 });
    const lookAtTarget = useRef(new Vector3(0, 1.2, 0));

    useFrame((state, delta) => {
        // If we are in VR, the headset controls the camera.
        // We only provide a base offset if necessary, but usually @react-three/xr handles the player group.
        if (isPresenting) return;

        timeRef.current += delta;

        // --- MENU CAMERA MODE ---
        if (gameState === GameState.MENU) {
            if ((camera as any).isPerspectiveCamera) {
                (camera as any).fov = MathUtils.lerp((camera as any).fov, 30, delta);
                camera.updateProjectionMatrix();
            }

            // Portrait style framing on the left
            const menuTargetPos = new Vector3(0.8, 0.9, 2.2);
            menuTargetPos.x += Math.sin(timeRef.current * 0.2) * 0.05;
            menuTargetPos.y += Math.cos(timeRef.current * 0.3) * 0.03;

            camera.position.lerp(menuTargetPos, delta * 2);

            const menuLookAt = new Vector3(-0.5, 1.3, 0);
            camera.lookAt(menuLookAt);
            return;
        }

        // --- CHARACTER SELECT OR SAK YANT MENU CAMERA MODE ---
        if (gameState === GameState.CHARACTER_SELECT || gameState === GameState.SAK_YANT_MENU) {
            if ((camera as any).isPerspectiveCamera) {
                (camera as any).fov = MathUtils.lerp((camera as any).fov, 30, delta);
                camera.updateProjectionMatrix();
            }

            // Position camera to view hero on the left, zoomed out slightly to see full body
            const charSelectPos = new Vector3(0, 1.0, 4.5);

            camera.position.lerp(charSelectPos, delta * 3);

            // Look at the left side of the screen where the hero stands
            const charLookAt = new Vector3(-1.0, 1.0, 0);
            camera.lookAt(charLookAt);
            return;
        }

        // --- RITUAL MODE CAMERA ---
        if (gameState === GameState.RITUAL) {
            // Slow circling camera for ritual
            const radius = 6;
            const x = Math.sin(timeRef.current * 0.2) * radius;
            const z = Math.cos(timeRef.current * 0.2) * radius;

            camera.position.lerp(new Vector3(x, 1.5, z), delta * 2);
            camera.lookAt(0, 1, 0);
            return;
        }

        // --- FIRST PERSON FIGHTING ---
        if (isFirstPerson) {
            let targetFOV = 70;

            if (playerAction === MoveType.ROLL) {
                targetFOV = 85;
            } else if (playerAction !== MoveType.IDLE && playerAction !== MoveType.BLOCK && playerAction !== MoveType.BLOCK_HIT && playerAction !== MoveType.VICTORY_POSE) {
                targetFOV = 75;
            }

            if (inputState.current.has('Space')) targetFOV = 65;

            if ((camera as any).isPerspectiveCamera) {
                (camera as any).fov = MathUtils.lerp((camera as any).fov, targetFOV, delta * 2);
                camera.updateProjectionMatrix();
            }

            const headPos = playerPosition.clone().add(new Vector3(0, 1.50, 0));

            if (playerAction === MoveType.ROLL) {
                headPos.y = 0.8;
            }

            const forwardDir = new Vector3().subVectors(opponentPosition, playerPosition).normalize();
            headPos.add(forwardDir.multiplyScalar(0.1));

            const isMoving = inputState.current.has('KeyW') || inputState.current.has('KeyA') || inputState.current.has('KeyS') || inputState.current.has('KeyD');
            if (isMoving && playerAction !== MoveType.ROLL) {
                headPos.y += Math.sin(timeRef.current * 12) * 0.05;
                const sway = Math.cos(timeRef.current * 6) * 0.02;
                headPos.add(camera.getWorldDirection(new Vector3()).cross(new Vector3(0, 1, 0)).multiplyScalar(sway));
            }

            if (isHit) {
                shakeIntensity.current = 1.0;
            }

            if (shakeIntensity.current > 0) {
                const shake = shakeIntensity.current * 0.1;
                headPos.add(new Vector3((Math.random() - 0.5) * shake, (Math.random() - 0.5) * shake, (Math.random() - 0.5) * shake));
                shakeIntensity.current = MathUtils.lerp(shakeIntensity.current, 0, delta * 5);
            }

            const lookTarget = opponentPosition.clone().add(new Vector3(0, 1.62, 0));

            camera.position.lerp(headPos, 0.5);
            camera.lookAt(lookTarget);
        }
        // --- THIRD PERSON (ORBIT) FIGHTING ---
        else {
            if ((camera as any).isPerspectiveCamera) {
                (camera as any).fov = MathUtils.lerp((camera as any).fov, 45, delta);
                camera.updateProjectionMatrix();
            }

            if (inputState.current.has('ArrowLeft')) camState.current.azimuth += delta;
            if (inputState.current.has('ArrowRight')) camState.current.azimuth -= delta;
            if (inputState.current.has('ArrowUp')) camState.current.zoom = Math.max(camState.current.zoom - delta * 5, -3);
            if (inputState.current.has('ArrowDown')) camState.current.zoom = Math.min(camState.current.zoom + delta * 5, 5);

            const center = new Vector3().addVectors(playerPosition, opponentPosition).multiplyScalar(0.5);

            let targetZoom = 8 + camState.current.zoom;
            let targetY = 3;
            let targetLookY = 1.2;

            const cpuMove = cpuActionRef?.current || MoveType.IDLE;
            const isPowerfulCpuMove = [MoveType.KICK, MoveType.KNEE, MoveType.ELBOW, MoveType.UPPERCUT].includes(cpuMove);
            const isPowerfulPlayerMove = [MoveType.KICK, MoveType.KNEE, MoveType.ELBOW, MoveType.UPPERCUT].includes(playerAction);
            const isAttacking = playerAction !== MoveType.IDLE && playerAction !== MoveType.BLOCK && playerAction !== MoveType.BLOCK_HIT;

            let lerpSpeed = 3.0;

            if (gameState === GameState.VICTORY) {
                // Zoom in on winner (assuming player wins for now, logic in endFight handles actions)
                if (playerAction === MoveType.VICTORY_POSE) {
                    targetZoom = 4;
                    targetY = 2;
                    center.copy(playerPosition);
                } else {
                    // Opponent wins
                    targetZoom = 4;
                    targetY = 2;
                    center.copy(opponentPosition);
                }
            } else if (isPowerfulCpuMove || isPowerfulPlayerMove) {
                targetZoom -= 3.5;
                targetY -= 1.2;
                lerpSpeed = 5.0;
            } else if (isAttacking || (cpuMove !== MoveType.IDLE && cpuMove !== MoveType.BLOCK)) {
                targetZoom -= 1.5;
                lerpSpeed = 4.0;
            }

            if (playerPosition.distanceTo(opponentPosition) < 2.0 && gameState !== GameState.VICTORY) {
                targetZoom -= 1.0;
            }

            // Fix: Clamp radius to prevent camera looking inside models or getting too close
            const radius = Math.max(3.0, targetZoom);
            const x = center.x + Math.sin(camState.current.azimuth) * radius;
            const z = center.z + Math.cos(camState.current.azimuth) * radius;

            const targetPos = new Vector3(x, targetY, z);

            camera.position.lerp(targetPos, delta * lerpSpeed);

            let desiredLook = center.clone().setY(targetLookY);

            if (isPowerfulPlayerMove) {
                desiredLook.lerp(opponentPosition, 0.4);
            } else if (isPowerfulCpuMove) {
                desiredLook.lerp(playerPosition, 0.4);
            }

            lookAtTarget.current.lerp(desiredLook, delta * 6);
            camera.lookAt(lookAtTarget.current);
        }
    });

    return null;
}

const GRAPHICS_MODE_ORDER: GraphicsMode[] = ['AUTO', 'LOW', 'BALANCED', 'HIGH', 'ULTRA'];

const RuntimePerformanceBridge = ({
    onTelemetry,
    onFpsSample
}: {
    onTelemetry: (telemetry: RendererTelemetry) => void;
    onFpsSample: (fps: number) => void;
}) => {
    const { gl } = useThree();
    const telemetryReported = useRef(false);
    const fpsWindowRef = useRef({ time: 0, frames: 0 });

    useEffect(() => {
        if (telemetryReported.current) return;
        telemetryReported.current = true;
        onTelemetry(readRendererTelemetry(gl));
    }, [gl, onTelemetry]);

    useFrame((_, delta) => {
        fpsWindowRef.current.time += delta;
        fpsWindowRef.current.frames += 1;

        if (fpsWindowRef.current.time >= 1.2) {
            onFpsSample(fpsWindowRef.current.frames / fpsWindowRef.current.time);
            fpsWindowRef.current = { time: 0, frames: 0 };
        }
    });

    return null;
};

const SceneEffects = ({ performanceProfile }: { performanceProfile: DevicePerformanceProfile }) => {
    if (!performanceProfile.enablePostProcessing) return null;

    return (
        <EffectComposer disableNormalPass>
            <Bloom luminanceThreshold={1} mipmapBlur intensity={performanceProfile.bloomIntensity} />
            <Vignette eskil={false} offset={0.1} darkness={performanceProfile.vignetteDarkness} />
        </EffectComposer>
    )
}

const PerformanceBadge = ({
    graphicsMode,
    performanceProfile,
    fps,
    assetStatus
}: {
    graphicsMode: GraphicsMode;
    performanceProfile: DevicePerformanceProfile;
    fps: number | null;
    assetStatus: AssetDownloadStatus;
}) => {
    const fpsLabel = fps ? `${Math.round(fps)} FPS` : 'Profiling';
    const modeLabel = graphicsMode === 'AUTO' ? `AUTO ${performanceProfile.preset}` : `MANUAL ${performanceProfile.preset}`;

    return (
        <div className="absolute top-4 left-4 z-20 pointer-events-none">
            <div className="rounded-xl border border-cyan-400/25 bg-black/55 px-3 py-2 text-white shadow-2xl backdrop-blur-md">
                <div className="flex items-center gap-2 text-xs font-black tracking-wide">
                    <Activity size={14} className="text-cyan-300" />
                    <span>{modeLabel}</span>
                    <span className="text-cyan-300">{fpsLabel}</span>
                </div>
                <div className="mt-1 text-[10px] text-gray-300">
                    {performanceProfile.gpuTier} GPU · {performanceProfile.cpuCores} threads · {performanceProfile.networkClass}
                </div>
                <div className="text-[10px] text-gray-400">
                    {assetStatus.plan} assets · {assetStatus.message}
                </div>
            </div>
        </div>
    );
};

// --- MAIN APP COMPONENT ---

const App: React.FC = () => {
    // Game State
    const [gameState, setGameState] = useState<GameState>(GameState.MENU);
    const [gameMode, setGameMode] = useState<GameMode>(GameMode.PVE);
    const [difficulty, setDifficulty] = useState<Difficulty>(Difficulty.MEDIUM);
    const [adventureStage, setAdventureStage] = useState(0);
    const [onlineState, setOnlineState] = useState<OnlineState | null>(null);
    const [selectedHero, setSelectedHero] = useState<HeroId>(HeroId.DARA);
    const [previewHero, setPreviewHero] = useState<HeroId | null>(null);

    // Fighters
    const [playerStats, setPlayerStats] = useState<FighterStats>(INITIAL_STATS);
    const [opponentStats, setOpponentStats] = useState<FighterStats>(INITIAL_STATS);
    const [playerAction, setPlayerAction] = useState<MoveType>(MoveType.IDLE);
    const [opponentAction, setOpponentAction] = useState<MoveType>(MoveType.IDLE);

    // Menu Hero Animation State
    const [menuHeroAction, setMenuHeroAction] = useState<MoveType>(MoveType.IDLE);

    // Logic
    const [comboCount, setComboCount] = useState(0);
    const [floatingTexts, setFloatingTexts] = useState<any[]>([]);
    const [sceneryTheme, setSceneryTheme] = useState<SceneryTheme>(SCENERY_THEMES[0]);
    const [isAudioOn, setIsAudioOn] = useState(true);

    // User/Inventory/Profile
    const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
    const [inventory, setInventory] = useState<PlayerInventory>(INITIAL_INVENTORY);
    const [playerProfile, setPlayerProfile] = useState<PlayerProfile>(INITIAL_PROFILE);
    const [equippedSakYantId, setEquippedSakYantId] = useState<SakYantType | null>(SakYantType.HANUMAN);
    const [previewSakYantId, setPreviewSakYantId] = useState<SakYantType | null>(null); // For Menu Preview
    const [returnToFight, setReturnToFight] = useState(false);
    const [lastMatchRewards, setLastMatchRewards] = useState({ xp: 0, currency: 0, heroXp: 0, levelUp: false, heroLevelUp: false });
    const [lootReward, setLootReward] = useState<LootReward | null>(null);

    // UI/View
    const [showHowToPlay, setShowHowToPlay] = useState(false);
    const [notification, setNotification] = useState<string | null>(null);
    const [isFirstPerson, setIsFirstPerson] = useState(false);
    const [deviceCapabilities, setDeviceCapabilities] = useState<DeviceCapabilities>(DEFAULT_DEVICE_CAPABILITIES);
    const [graphicsMode, setGraphicsMode] = useState<GraphicsMode>('AUTO');
    const [autoGraphicsPreset, setAutoGraphicsPreset] = useState<GraphicsPreset>(DEFAULT_DEVICE_CAPABILITIES.recommendedPreset);
    const [fpsEstimate, setFpsEstimate] = useState<number | null>(null);
    const [assetDownloadStatus, setAssetDownloadStatus] = useState<AssetDownloadStatus>(DEFAULT_ASSET_DOWNLOAD_STATUS);

    // Refs for real-time logic
    const gameStateRef = useRef(gameState);
    const playerStatsRef = useRef(playerStats);
    const opponentStatsRef = useRef(opponentStats);
    const keysPressed = useRef<Set<string>>(new Set());
    const playerPositionRef = useRef(new Vector3(-1.5, 0, 0));
    const opponentPositionRef = useRef(new Vector3(1.5, 0, 0));
    // Dummy opponent ref for menu/preview orientation
    const cameraDummyRef = useRef(new Vector3(0, 1.5, 5));

    const cpuActionRef = useRef<MoveType>(MoveType.IDLE);
    const comboCountRef = useRef(0);

    const playerActionRef = useRef<MoveType>(MoveType.IDLE);
    const deviceCapabilitiesRef = useRef(deviceCapabilities);
    const adaptivePresetCooldownRef = useRef(0);

    const activeGraphicsPreset = graphicsMode === 'AUTO' ? autoGraphicsPreset : graphicsMode;
    const performanceProfile = useMemo(
        () => buildPerformanceProfile(deviceCapabilities, activeGraphicsPreset),
        [activeGraphicsPreset, deviceCapabilities]
    );

    // Sync refs with state
    useEffect(() => {
        gameStateRef.current = gameState;
    }, [gameState]);

    useEffect(() => {
        comboCountRef.current = comboCount;
    }, [comboCount]);

    useEffect(() => {
        playerActionRef.current = playerAction;
    }, [playerAction]);

    // CRITICAL FIX: Sync Stats Refs with State updates
    useEffect(() => {
        playerStatsRef.current = playerStats;
    }, [playerStats]);

    useEffect(() => {
        opponentStatsRef.current = opponentStats;
    }, [opponentStats]);

    useEffect(() => {
        deviceCapabilitiesRef.current = deviceCapabilities;
    }, [deviceCapabilities]);

    useEffect(() => {
        const detected = detectDeviceCapabilities();
        setDeviceCapabilities(detected);
        setAutoGraphicsPreset(detected.recommendedPreset);
    }, []);

    useEffect(() => {
        if (graphicsMode === 'AUTO') {
            setAutoGraphicsPreset(deviceCapabilities.recommendedPreset);
        }
    }, [deviceCapabilities.recommendedPreset, graphicsMode]);

    useEffect(() => {
        if (graphicsMode !== 'AUTO' || fpsEstimate == null) return;

        const now = Date.now();
        if (now - adaptivePresetCooldownRef.current < 6000) return;

        const presetOrder: GraphicsPreset[] = ['LOW', 'BALANCED', 'HIGH', 'ULTRA'];
        const currentIndex = presetOrder.indexOf(autoGraphicsPreset);
        const recommendedIndex = presetOrder.indexOf(deviceCapabilities.recommendedPreset);

        if (fpsEstimate < 42 && currentIndex > 0) {
            adaptivePresetCooldownRef.current = now;
            setAutoGraphicsPreset(prev => shiftGraphicsPreset(prev, -1));
            return;
        }

        if (fpsEstimate > 57 && currentIndex < recommendedIndex) {
            adaptivePresetCooldownRef.current = now;
            setAutoGraphicsPreset(prev => shiftGraphicsPreset(prev, 1));
        }
    }, [autoGraphicsPreset, deviceCapabilities.recommendedPreset, fpsEstimate, graphicsMode]);

    useEffect(() => {
        return scheduleOptionalAssetDownloads(performanceProfile, setAssetDownloadStatus);
    }, [performanceProfile.assetPlan, performanceProfile.customModelUrls]);

    const handleRendererTelemetry = (telemetry: RendererTelemetry) => {
        const next = hydrateCapabilitiesWithRenderer(deviceCapabilitiesRef.current, telemetry);
        setDeviceCapabilities(next);
        if (graphicsMode === 'AUTO') {
            setAutoGraphicsPreset(next.recommendedPreset);
        }
    };

    const cycleGraphicsMode = () => {
        setGraphicsMode(prev => {
            const index = GRAPHICS_MODE_ORDER.indexOf(prev);
            const next = GRAPHICS_MODE_ORDER[(index + 1) % GRAPHICS_MODE_ORDER.length];
            if (next === 'AUTO') {
                setAutoGraphicsPreset(deviceCapabilitiesRef.current.recommendedPreset);
            }
            setNotification(`Graphics: ${next === 'AUTO' ? `AUTO ${deviceCapabilitiesRef.current.recommendedPreset}` : next}`);
            setTimeout(() => setNotification(null), 1600);
            return next;
        });
    };

    const handleToggleAudio = () => {
        const muted = toggleMute();
        setIsAudioOn(!muted);
    };

    // Ritual Complete Logic
    const handleRitualComplete = (accuracy: number) => {
        const hasBuff = accuracy >= 0.8;
        if (hasBuff) {
            playSound('win');
            setNotification("ANCESTOR'S BLESSING GRANTED!");
            setTimeout(() => setNotification(null), 2000);
        }

        const ritualBuff: RitualBuff = {
            isActive: hasBuff,
            timeLeft: 60, // 60 seconds
            staminaMultiplier: hasBuff ? 1.5 : 1.0,
            defenseMultiplier: hasBuff ? 0.75 : 1.0 // 75% dmg taken = +25% defense
        };

        setPlayerStats(prev => ({ ...prev, ritualBuff }));
        setGameState(GameState.FIGHTING);
    };

    // Stamina Regeneration Loop
    useEffect(() => {
        if (gameState !== GameState.FIGHTING) return;

        const regenInterval = setInterval(() => {
            if (gameStateRef.current !== GameState.FIGHTING) return;

            // --- PLAYER REGEN ---
            let pRegen = 0;
            const pAction = playerActionRef.current;
            const ritualBuff = playerStatsRef.current.ritualBuff;

            if (pAction === MoveType.BLOCK || pAction === MoveType.BLOCK_HIT) {
                pRegen = 2.0; // Blocking: Fast Regen (+20/sec)
            } else if (pAction === MoveType.IDLE || pAction === MoveType.VICTORY_POSE) {
                pRegen = 0.5; // Idle: Slow Regen (+5/sec)
            } else if (pAction === MoveType.TAUNT) {
                pRegen = 3.0; // Taunt: Very Fast Regen (+30/sec)
            }

            // Hero Attribute Bonus (Agility)
            if (playerStatsRef.current.heroId) {
                const hero = HEROES_DB[playerStatsRef.current.heroId];
                if (hero) {
                    const agiBonus = hero.attributes.agility * 0.15;
                    pRegen += agiBonus;
                }
            }

            // Sak Yant Bonuses (Hanuman)
            if (playerStatsRef.current.activeSakYant?.type === SakYantType.HANUMAN) {
                const lvl = playerStatsRef.current.activeSakYant.level;
                const mult = SAK_YANT_DB[SakYantType.HANUMAN].levels[lvl].effectValue;
                pRegen *= mult;
            }

            // Ritual Buff Application
            if (ritualBuff?.isActive) {
                pRegen *= ritualBuff.staminaMultiplier;
            }

            if (pRegen > 0 && playerStatsRef.current.stamina < playerStatsRef.current.maxStamina) {
                const newStamina = Math.min(playerStatsRef.current.maxStamina, playerStatsRef.current.stamina + pRegen);
                updateStats('player', { stamina: newStamina });
            }

            // Ritual Buff Timer
            if (ritualBuff?.isActive && ritualBuff.timeLeft > 0) {
                const newTime = ritualBuff.timeLeft - 0.1;
                updateStats('player', {
                    ritualBuff: {
                        ...ritualBuff,
                        timeLeft: newTime,
                        isActive: newTime > 0
                    }
                });
            }

            // --- OPPONENT REGEN ---
            let oRegen = 0;
            const oAction = cpuActionRef.current;

            if (oAction === MoveType.BLOCK || oAction === MoveType.IDLE) {
                oRegen = 1.0; // CPU Regens steadily (+10/sec)
            }

            if (oRegen > 0 && opponentStatsRef.current.stamina < opponentStatsRef.current.maxStamina) {
                const newStamina = Math.min(opponentStatsRef.current.maxStamina, opponentStatsRef.current.stamina + oRegen);
                updateStats('opponent', { stamina: newStamina });
            }

        }, 100); // 10 updates per second

        return () => clearInterval(regenInterval);
    }, [gameState]);

    // Shadow Boxing Logic for Main Menu AND Character Select
    useEffect(() => {
        if (gameState !== GameState.MENU && gameState !== GameState.CHARACTER_SELECT && gameState !== GameState.SAK_YANT_MENU) return;

        const shadowBoxRoutine = () => {
            const moves = [
                MoveType.PUNCH,
                MoveType.KICK,
                MoveType.ELBOW,
                MoveType.KNEE,
                MoveType.TAUNT,
                MoveType.BLOCK,
                MoveType.UPPERCUT
            ];

            if (Math.random() < 0.4) {
                const randomMove = moves[Math.floor(Math.random() * moves.length)];
                setMenuHeroAction(randomMove);

                setTimeout(() => {
                    setMenuHeroAction(MoveType.IDLE);
                }, 800);
            } else {
                setMenuHeroAction(MoveType.IDLE);
            }
        };

        const interval = setInterval(shadowBoxRoutine, 1500);

        return () => clearInterval(interval);
    }, [gameState]);

    // Load Profile Logic
    useEffect(() => {
        if (userProfile) {
            const loadedData = loadUserData(userProfile);
            if (loadedData) {
                /* Fix Record type errors using type assertions */
                setInventory({
                    ...INITIAL_INVENTORY,
                    ...loadedData.inventory,
                    unlockedYants: { ...INITIAL_INVENTORY.unlockedYants, ...(loadedData.inventory.unlockedYants || {}) } as Record<SakYantType, number>,
                    durabilityLevels: { ...INITIAL_INVENTORY.durabilityLevels!, ...(loadedData.inventory.durabilityLevels || {}) } as Record<SakYantType, number>,
                    sakYantPieces: { ...INITIAL_INVENTORY.sakYantPieces!, ...(loadedData.inventory.sakYantPieces || {}) } as Record<SakYantType, number>,
                    unlockedHeroes: { ...INITIAL_INVENTORY.unlockedHeroes!, ...(loadedData.inventory.unlockedHeroes || {}) } as Record<HeroId, boolean>,
                    heroLevels: { ...INITIAL_INVENTORY.heroLevels!, ...(loadedData.inventory.heroLevels || {}) } as Record<HeroId, number>,
                    heroExp: { ...INITIAL_INVENTORY.heroExp!, ...(loadedData.inventory.heroExp || {}) } as Record<HeroId, number>
                });
                if (loadedData.profile) {
                    setPlayerProfile({
                        ...INITIAL_PROFILE,
                        ...loadedData.profile
                    });
                }
            }
        } else {
            const localKey = 'kun_khmer_anon_profile';
            try {
                const saved = localStorage.getItem(localKey);
                if (saved) {
                    const p = JSON.parse(saved);
                    setPlayerProfile({
                        ...INITIAL_PROFILE,
                        ...p
                    });

                    const savedInv = localStorage.getItem('kun_khmer_anon_inventory');
                    if (savedInv) {
                        const loadedInv = JSON.parse(savedInv);
                        /* Fix Record type errors using type assertions */
                        setInventory({
                            ...INITIAL_INVENTORY,
                            ...loadedInv,
                            unlockedYants: { ...INITIAL_INVENTORY.unlockedYants, ...(loadedInv.unlockedYants || {}) } as Record<SakYantType, number>,
                            durabilityLevels: { ...INITIAL_INVENTORY.durabilityLevels!, ...(loadedInv.durabilityLevels || {}) } as Record<SakYantType, number>,
                            sakYantPieces: { ...INITIAL_INVENTORY.sakYantPieces!, ...(loadedInv.sakYantPieces || {}) } as Record<SakYantType, number>,
                            unlockedHeroes: { ...INITIAL_INVENTORY.unlockedHeroes!, ...(loadedInv.unlockedHeroes || {}) } as Record<HeroId, boolean>,
                            heroLevels: { ...INITIAL_INVENTORY.heroLevels!, ...(loadedInv.heroLevels || {}) } as Record<HeroId, number>,
                            heroExp: { ...INITIAL_INVENTORY.heroExp!, ...(loadedInv.heroExp || {}) } as Record<HeroId, number>
                        });
                    }
                }
            } catch (e) {
                console.error("Failed to load local save", e);
            }
        }
    }, [userProfile]);

    const saveGame = (newProfile: PlayerProfile, newInventory: PlayerInventory) => {
        setPlayerProfile(newProfile);
        setInventory(newInventory);

        if (userProfile) {
            saveUserData(userProfile, newInventory, newProfile);
        } else {
            try {
                localStorage.setItem('kun_khmer_anon_profile', JSON.stringify(newProfile));
                localStorage.setItem('kun_khmer_anon_inventory', JSON.stringify(newInventory));
            } catch (e) {
                console.error("Failed to save game", e);
            }
        }
    };

    // --- REWARD LOGIC ---
    const endFight = (isWin: boolean) => {
        // Guard clause: Prevent double calling (e.g. from race conditions in timeouts)
        if (gameStateRef.current !== GameState.FIGHTING) return;

        if (isWin) {
            playSound('win');

            // Trigger Victory Pose immediately
            setPlayerAction(MoveType.VICTORY_POSE);
            setOpponentAction(MoveType.KNOCKOUT);
            cpuActionRef.current = MoveType.KNOCKOUT;

            let xpGain = Math.round(GAME_ECONOMY.BASE_XP * GAME_ECONOMY.XP_DIFFICULTY_MULTIPLIER[difficulty]);
            let currencyGain = Math.round(GAME_ECONOMY.BASE_CURRENCY * GAME_ECONOMY.XP_DIFFICULTY_MULTIPLIER[difficulty]);

            if (gameMode === GameMode.ADVENTURE) {
                const stageMult = 1.0 + (adventureStage * 0.15);
                xpGain = Math.round(xpGain * stageMult);
                currencyGain = Math.round(currencyGain * stageMult);
            }

            let heroXpGain = GAME_ECONOMY.BASE_XP;

            const newExp = playerProfile.currentExp + xpGain;
            const newHeroExp = (inventory.heroExp?.[selectedHero] || 0) + heroXpGain;

            let newLevel = playerProfile.level;
            let newMaxExp = playerProfile.maxExp;
            let levelUp = false;

            let newHeroLevel = inventory.heroLevels?.[selectedHero] || 1;
            let newHeroMaxExp = Math.round(GAME_ECONOMY.HERO_BASE_XP * Math.pow(GAME_ECONOMY.HERO_LEVEL_MULTIPLIER, newHeroLevel - 1));
            let heroLevelUp = false;

            if (newExp >= newMaxExp) {
                newLevel++;
                newMaxExp = Math.round(newMaxExp * GAME_ECONOMY.LEVEL_MULTIPLIER);
                levelUp = true;
            }

            if (newHeroExp >= newHeroMaxExp) {
                newHeroLevel++;
                heroLevelUp = true;
            }

            setLastMatchRewards({ xp: xpGain, currency: currencyGain, heroXp: heroXpGain, levelUp, heroLevelUp });

            const newProfile = {
                ...playerProfile,
                level: newLevel,
                currentExp: levelUp ? (newExp - playerProfile.maxExp) : newExp,
                maxExp: newMaxExp,
                currency: playerProfile.currency + currencyGain
            };

            // IMPORTANT: Create deep copy for nested objects to prevent mutation issues and ensure no crash if property missing
            const newInventory: PlayerInventory = {
                ...inventory,
                unlockedYants: { ...inventory.unlockedYants },
                durabilityLevels: { ...(inventory.durabilityLevels || {}) },
                sakYantPieces: { ...(inventory.sakYantPieces || {}) },
                unlockedHeroes: { ...(inventory.unlockedHeroes || {}) },
                heroLevels: { ...(inventory.heroLevels || {}) },
                heroExp: { ...(inventory.heroExp || {}) }
            };

            if (gameMode === GameMode.ADVENTURE) {
                // Ensure adventureStage is capped correctly (max 14 for 15 levels)
                const maxStage = ADVENTURE_OPPONENTS.length - 1;
                const nextStage = Math.max(playerProfile.adventureStage || 0, adventureStage + 1);
                newProfile.adventureStage = Math.min(maxStage, nextStage);

                // Unlock Heroes Logic with Visual Indicator
                if (adventureStage === 4) { // Stage 5 beaten
                    if (newInventory.unlockedHeroes && !inventory.unlockedHeroes?.[HeroId.SOMBATH]) {
                        newInventory.unlockedHeroes[HeroId.SOMBATH] = true;
                        setNotification("HERO UNLOCKED: SOMBATH!");
                        playSound('win');
                        setTimeout(() => setNotification(null), 4000);
                    }
                }
                if (adventureStage === 9) { // Stage 10 beaten
                    if (newInventory.unlockedHeroes && !inventory.unlockedHeroes?.[HeroId.VIBOL]) {
                        newInventory.unlockedHeroes[HeroId.VIBOL] = true;
                        setNotification("HERO UNLOCKED: VIBOL!");
                        playSound('win');
                        setTimeout(() => setNotification(null), 4000);
                    }
                }

                // Loot Drop (Chance for Sak Yant Pieces)
                if (Math.random() < 0.4) { // 40% Chance
                    const yantTypes = Object.values(SakYantType);
                    const randomYant = yantTypes[Math.floor(Math.random() * yantTypes.length)];
                    const amount = Math.floor(Math.random() * 3) + 1; // 1-3 pieces
                    setLootReward({ type: randomYant, amount });
                } else {
                    setLootReward(null);
                }
            } else {
                setLootReward(null);
            }

            if (heroLevelUp) {
                if (newInventory.heroLevels) newInventory.heroLevels[selectedHero] = newHeroLevel;
                if (newInventory.heroExp) newInventory.heroExp[selectedHero] = newHeroExp - newHeroMaxExp;
            } else {
                if (newInventory.heroExp) newInventory.heroExp[selectedHero] = newHeroExp;
            }

            saveGame(newProfile, newInventory);
            submitScore(userProfile || { name: 'Guest', email: '', picture: '' }, 1);
            setGameState(GameState.VICTORY);

        } else {
            playSound('lose');
            // Player defeated
            setPlayerAction(MoveType.KNOCKOUT);
            // Opponent Victory Pose
            setOpponentAction(MoveType.VICTORY_POSE);
            cpuActionRef.current = MoveType.VICTORY_POSE;

            setGameState(GameState.GAME_OVER);
        }
        stopBackgroundMusic();
    };

    const handleClaimLoot = () => {
        if (!lootReward) return;

        // Safe Deep copy to ensure state update triggers correctly
        const newInventory: PlayerInventory = {
            ...inventory,
            sakYantPieces: { ...(inventory.sakYantPieces || INITIAL_INVENTORY.sakYantPieces!) }
        };

        const currentPieces = newInventory.sakYantPieces?.[lootReward.type] || 0;
        if (newInventory.sakYantPieces) {
            newInventory.sakYantPieces[lootReward.type] = currentPieces + lootReward.amount;
        }

        saveGame(playerProfile, newInventory);
        setLootReward(null); // Close overlay
    };

    const startFight = () => {
        // Reset Stats
        setPlayerStats({ ...INITIAL_STATS, heroId: selectedHero, damageModifiers: HEROES_DB[selectedHero]?.modifiers || { punch: 1, kick: 1, elbow: 1, knee: 1, speed: 1, defense: 1 } });

        // Scale Opponent based on Adventure Mode Stage
        if (gameMode === GameMode.ADVENTURE) {
            // Safe access for opponent
            const oppIndex = Math.min(adventureStage, ADVENTURE_OPPONENTS.length - 1);
            const baseOpponent = ADVENTURE_OPPONENTS[oppIndex];
            const stageMultiplier = 1.0 + (adventureStage * 0.12); // +12% stats per stage

            setOpponentStats({
                ...baseOpponent,
                currentHealth: Math.round(baseOpponent.maxHealth * stageMultiplier),
                maxHealth: Math.round(baseOpponent.maxHealth * stageMultiplier),
                stamina: Math.round(baseOpponent.maxStamina * stageMultiplier),
                maxStamina: Math.round(baseOpponent.maxStamina * stageMultiplier)
            });
        } else {
            // Standard PvE/PvP
            setOpponentStats({ ...INITIAL_STATS, maxHealth: 500, currentHealth: 500 });
        }

        setPlayerAction(MoveType.IDLE);
        setOpponentAction(MoveType.IDLE);
        setComboCount(0);
        setFloatingTexts([]);
        playerPositionRef.current.set(-1.5, 0, 0);
        opponentPositionRef.current.set(1.5, 0, 0);

        resetPlayerStats();

        // CHANGE: Start RITUAL phase instead of FIGHTING directly
        setGameState(GameState.RITUAL);
        startBackgroundMusic();
        playSound('start'); // Gong
    };

    const resetPlayerStats = () => {
        const activeYantType = equippedSakYantId;
        let activeYant = null;
        let yantLevel = 0;
        let maxIntegrity = 0;

        if (activeYantType && inventory.unlockedYants[activeYantType] > 0) {
            yantLevel = inventory.unlockedYants[activeYantType];
            const baseIntegrity = SAK_YANT_DB[activeYantType].levels[yantLevel].maxIntegrity;
            const reinforceBonus = (inventory.durabilityLevels?.[activeYantType] || 0) * GAME_ECONOMY.REINFORCE_INTEGRITY_BONUS;
            maxIntegrity = baseIntegrity + reinforceBonus;

            activeYant = {
                type: activeYantType,
                level: yantLevel,
                currentIntegrity: maxIntegrity,
                maxIntegrity: maxIntegrity
            };
        }

        // Hero Level Scaling
        const heroLevel = inventory.heroLevels?.[selectedHero] || 1;
        const statMult = 1.0 + ((heroLevel - 1) * GAME_ECONOMY.HERO_STAT_GAIN_PER_LEVEL);

        // Hero Attribute Scaling
        const heroData = HEROES_DB[selectedHero];
        if (!heroData) return; // Safeguard if hero data is momentarily missing

        const attributes = heroData.attributes;

        // Vitality -> Health (Base 500 + 25 per VIT)
        const healthFromVit = attributes.vitality * 25;
        const baseMaxHealth = 500 + healthFromVit;

        // Agility -> Stamina (Base 120 + 5 per AGI)
        const staminaFromAgi = attributes.agility * 5;
        const baseMaxStamina = 120 + staminaFromAgi;

        const finalMaxHealth = Math.round(baseMaxHealth * statMult);
        const finalMaxStamina = Math.round(baseMaxStamina * statMult);

        setPlayerStats(prev => ({
            ...INITIAL_STATS,
            heroId: selectedHero,
            damageModifiers: heroData.modifiers,
            maxHealth: finalMaxHealth,
            currentHealth: finalMaxHealth,
            maxStamina: finalMaxStamina,
            stamina: finalMaxStamina,
            activeSakYant: activeYant,
            ritualBuff: undefined // Reset buff
        }));
    }

    // Handle Updates
    const updateStats = (fighter: 'player' | 'opponent', updates: Partial<FighterStats>) => {
        if (fighter === 'player') {
            const newStats = { ...playerStatsRef.current, ...updates };
            playerStatsRef.current = newStats;
            setPlayerStats(newStats);
        } else {
            const newStats = { ...opponentStatsRef.current, ...updates };
            opponentStatsRef.current = newStats;
            setOpponentStats(newStats);
        }
    };

    const addFloatingText = (text: string, position: Vector3, color: string) => {
        setFloatingTexts(prev => [...prev, { id: Date.now() + Math.random(), text, position: position.toArray(), color }]);
    };

    // Re-pasting handlePvpData for safety in XML replacement
    const handlePvpData = (data: PeerData, peerId: string) => {
        if (data.type === 'MOVE') {
            setOpponentAction(data.move!);
            cpuActionRef.current = data.move!;
            if (data.move !== MoveType.BLOCK && data.move !== MoveType.BLOCK_HIT && data.move !== MoveType.IDLE) {
                setTimeout(() => {
                    setOpponentAction(MoveType.IDLE);
                    cpuActionRef.current = MoveType.IDLE;
                }, 600);
            }
        }
        else if (data.type === 'STATS_UPDATE') {
            const newStats = {
                ...opponentStatsRef.current,
                currentHealth: data.health!,
                stamina: data.stamina!,
                activeSakYant: data.sakYant
            };
            opponentStatsRef.current = newStats;
            setOpponentStats(newStats);
        }
        else if (data.type === 'HIT_CONFIRM') {
            playSound(data.isBlocked ? 'block' : 'damage');
            const damage = data.damage || 0;

            let newHp = Math.max(0, playerStatsRef.current.currentHealth - damage);

            let defenseMult = playerStatsRef.current.damageModifiers?.defense || 1.0;

            // APPLY RITUAL BUFF DEFENSE
            if (playerStatsRef.current.ritualBuff?.isActive) {
                defenseMult *= playerStatsRef.current.ritualBuff.defenseMultiplier;
            }

            if (!data.isBlocked) {
                newHp = Math.max(0, playerStatsRef.current.currentHealth - (damage * defenseMult));
            }

            let pYant = playerStatsRef.current.activeSakYant ? { ...playerStatsRef.current.activeSakYant } : null;
            if (pYant && pYant.currentIntegrity > 0) {
                pYant.currentIntegrity = Math.max(0, pYant.currentIntegrity - damage);
                if (pYant.currentIntegrity === 0) {
                    setNotification(`YOUR ${SAK_YANT_DB[pYant.type].name} BROKEN!`);
                    playSound('damage');
                }
            }

            updateStats('player', {
                currentHealth: newHp,
                activeSakYant: pYant
            });

            addFloatingText(data.isBlocked ? "BLOCKED" : `-${(damage * defenseMult).toFixed(0)}`, playerPositionRef.current, data.isBlocked ? "gray" : "red");

            sendData({
                type: 'STATS_UPDATE',
                health: newHp,
                stamina: playerStatsRef.current.stamina,
                sakYant: pYant
            });

            if (newHp <= 0) {
                endFight(false);
                sendData({ type: 'GAME_OVER', winner: 'OPPONENT' });
            } else {
                setPlayerAction(MoveType.HIT);
                setTimeout(() => setPlayerAction(MoveType.IDLE), 400);
            }
        }
        else if (data.type === 'GAME_OVER') {
            endFight(true);
        }
        else if (data.type === 'POSITION') {
            opponentPositionRef.current.set(data.position![0], data.position![1], data.position![2]);
        }
    };

    useEffect(() => {
        if (gameMode === GameMode.PVP_ONLINE && gameState === GameState.FIGHTING) {
            const interval = setInterval(() => {
                sendData({
                    type: 'POSITION',
                    position: playerPositionRef.current.toArray() as [number, number, number],
                    rotation: [0, 0, 0]
                });
            }, 100);
            return () => clearInterval(interval);
        }
    }, [gameMode, gameState]);


    useEffect(() => {
        const handleInteract = () => {
        };
        window.addEventListener('click', handleInteract);
        return () => window.removeEventListener('click', handleInteract);
    }, []);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.repeat) return; // Prevent key hold spam for attacks

            keysPressed.current.add(e.code);

            if (gameState === GameState.FIGHTING) {
                if (e.code === 'KeyU') {
                    if (e.shiftKey) handlePlayerAction(MoveType.UPPERCUT);
                    else handlePlayerAction(MoveType.PUNCH);
                }
                if (e.code === 'KeyI') handlePlayerAction(MoveType.KICK);
                if (e.code === 'KeyO') handlePlayerAction(MoveType.ELBOW);
                if (e.code === 'KeyP') handlePlayerAction(MoveType.KNEE);
                if (e.code === 'Space') handlePlayerAction(MoveType.BLOCK);
                if (e.code === 'KeyT') handlePlayerAction(MoveType.TAUNT);
                if (e.code === 'ShiftLeft' || e.code === 'ShiftRight') {
                    handlePlayerAction(MoveType.ROLL);
                }
            }
        };

        const handleKeyUp = (e: KeyboardEvent) => {
            keysPressed.current.delete(e.code);
            if (gameState === GameState.FIGHTING) {
                if (e.code === 'Space') {
                    setPlayerAction(MoveType.IDLE);
                }
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        window.addEventListener('keyup', handleKeyUp);
        return () => {
            window.removeEventListener('keydown', handleKeyDown);
            window.removeEventListener('keyup', handleKeyUp);
        };
    }, [gameState, gameMode]);

    const handleJoystickMove = (data: { x: number, y: number } | null) => {
        keysPressed.current.delete('KeyW');
        keysPressed.current.delete('KeyS');
        keysPressed.current.delete('KeyA');
        keysPressed.current.delete('KeyD');

        if (data) {
            const threshold = 0.2;
            if (data.y < -threshold) keysPressed.current.add('KeyW');
            if (data.y > threshold) keysPressed.current.add('KeyS');
            if (data.x < -threshold) keysPressed.current.add('KeyA');
            if (data.x > threshold) keysPressed.current.add('KeyD');
        }
    };

    const handlePlayerAction = (moveType: MoveType) => {
        // Basic check for dead/stamina
        if (playerStatsRef.current.currentHealth <= 0 || playerStatsRef.current.stamina <= 0) return;
        // Check if game is actually running
        if (gameStateRef.current !== GameState.FIGHTING) return;

        if (playerAction === MoveType.ROLL) return;

        const move = MOVES[moveType];

        if (move.staminaCost > 0 && playerStatsRef.current.stamina < move.staminaCost) {
            setNotification("NOT ENOUGH STAMINA!");
            setTimeout(() => setNotification(null), 1000);
            return;
        }

        setPlayerAction(moveType);

        if (gameMode === GameMode.PVP_ONLINE) {
            sendData({ type: 'MOVE', move: moveType });
        }

        updateStats('player', {
            stamina: Math.min(playerStatsRef.current.maxStamina, Math.max(0, playerStatsRef.current.stamina - move.staminaCost))
        });

        if (moveType === MoveType.BLOCK) return;
        if (moveType === MoveType.BLOCK_HIT) return;
        if (moveType === MoveType.TAUNT) {
            playSound('move');
            setTimeout(() => setPlayerAction(MoveType.IDLE), 1000);
            return;
        }
        if (moveType === MoveType.ROLL) {
            playSound('move');
            setTimeout(() => setPlayerAction(MoveType.IDLE), 500);
            return;
        }

        playSound('move');

        // Hit Detection
        setTimeout(() => {
            // Safe guard check against race conditions
            if (gameStateRef.current !== GameState.FIGHTING) return;

            if (gameMode === GameMode.PVP_ONLINE) return; // Host handles hit logic

            const dist = playerPositionRef.current.distanceTo(opponentPositionRef.current);
            // Adventure/PvE Hit Logic
            const hitRange = 1.8;

            if (dist < hitRange) {
                const isOpponentBlocking = opponentAction === MoveType.BLOCK || opponentAction === MoveType.BLOCK_HIT;
                // Roll dodging
                const isOpponentRolling = opponentAction === MoveType.ROLL;

                if (isOpponentRolling) {
                    addFloatingText("DODGED", opponentPositionRef.current, "gray");
                    return;
                }

                const hitRoll = Math.random();
                if (hitRoll < move.hitChance) {
                    // Calculate Damage with Modifiers
                    const heroData = HEROES_DB[selectedHero];
                    // Check safeguard
                    if (!heroData) return;

                    const attributes = heroData.attributes;

                    let damage = move.damage;

                    if (moveType === MoveType.PUNCH) damage *= heroData.modifiers.punch;
                    if (moveType === MoveType.UPPERCUT) damage *= (heroData.modifiers.punch * 1.2);
                    if (moveType === MoveType.KICK) damage *= heroData.modifiers.kick;
                    if (moveType === MoveType.ELBOW) damage *= heroData.modifiers.elbow;
                    if (moveType === MoveType.KNEE) damage *= heroData.modifiers.knee;

                    // Attribute Bonus (Strength) - Flat damage add
                    damage += (attributes.strength * 0.8);

                    // Attribute Bonus (Technique) - Crit Chance
                    const critChance = attributes.technique * 0.015; // 1.5% per point
                    const isCrit = Math.random() < critChance;
                    if (isCrit) {
                        damage *= 1.5;
                        addFloatingText("CRIT!", new Vector3(opponentPositionRef.current.x, opponentPositionRef.current.y + 0.5, opponentPositionRef.current.z), "orange");
                    }

                    // Sak Yant Buffs (Twin Tiger)
                    if (playerStatsRef.current.activeSakYant?.type === SakYantType.TWIN_TIGER) {
                        const lvl = playerStatsRef.current.activeSakYant.level;
                        const buff = SAK_YANT_DB[SakYantType.TWIN_TIGER].levels[lvl].effectValue;
                        damage *= buff;

                        // Integrity Cost for Offensive Yant
                        const newIntegrity = Math.max(0, playerStatsRef.current.activeSakYant.currentIntegrity - 1);
                        updateStats('player', { activeSakYant: { ...playerStatsRef.current.activeSakYant, currentIntegrity: newIntegrity } });
                    }

                    // Opponent Defense in Adventure Mode scales up (Damage reduction)
                    if (gameMode === GameMode.ADVENTURE) {
                        const defenseScaling = 1.0 - (adventureStage * 0.03); // -3% dmg taken per stage
                        damage *= defenseScaling;
                    }

                    if (isOpponentBlocking) {
                        playSound('block');
                        addFloatingText("BLOCKED", opponentPositionRef.current, "gray");
                        setComboCount(0);
                        // Trigger Block Hit Animation on Opponent
                        setOpponentAction(MoveType.BLOCK_HIT);
                        setTimeout(() => {
                            // Only revert if they haven't started another action
                            if (opponentStatsRef.current.currentHealth > 0) {
                                setOpponentAction(MoveType.BLOCK);
                            }
                        }, 300);
                    } else {
                        playSound('hit');
                        const newHp = Math.max(0, opponentStatsRef.current.currentHealth - damage);
                        updateStats('opponent', { currentHealth: newHp });
                        addFloatingText(damage.toFixed(0), opponentPositionRef.current, "white");
                        setComboCount(c => c + 1);

                        // Life Steal (Naga)
                        if (playerStatsRef.current.activeSakYant?.type === SakYantType.NAGA) {
                            const lvl = playerStatsRef.current.activeSakYant.level;
                            const lifesteal = SAK_YANT_DB[SakYantType.NAGA].levels[lvl].secondaryEffect || 0;
                            if (Math.random() < 0.5) {
                                const heal = damage * lifesteal;
                                updateStats('player', { currentHealth: Math.min(playerStatsRef.current.maxHealth, playerStatsRef.current.currentHealth + heal) });
                                // Integrity Cost
                                const newIntegrity = Math.max(0, playerStatsRef.current.activeSakYant.currentIntegrity - 2);
                                updateStats('player', { activeSakYant: { ...playerStatsRef.current.activeSakYant, currentIntegrity: newIntegrity } });
                            }
                        }

                        if (newHp <= 0) {
                            endFight(true);
                        }
                    }
                } else {
                    playSound('miss');
                    addFloatingText("MISS", opponentPositionRef.current, "gray");
                    setComboCount(0);
                }
            } else {
                playSound('miss');
            }
        }, 300);

        setTimeout(() => {
            if (playerActionRef.current === moveType) {
                setPlayerAction(MoveType.IDLE);
            }
        }, 600);
    };

    const handleCpuTurn = () => {
        // Basic AI Loop
        if (gameStateRef.current !== GameState.FIGHTING || opponentStatsRef.current.currentHealth <= 0) return;

        // AI Difficulty Scaling
        const reactionTime = gameMode === GameMode.ADVENTURE ? Math.max(800 - (adventureStage * 50), 400) : (difficulty === Difficulty.HARD ? 600 : 1200);
        const aggression = gameMode === GameMode.ADVENTURE ? Math.min(0.5 + (adventureStage * 0.05), 0.9) : (difficulty === Difficulty.HARD ? 0.8 : 0.4);

        setTimeout(() => {
            // Double check state inside timeout to prevent stale execution
            if (gameStateRef.current !== GameState.FIGHTING) return;

            const dist = opponentPositionRef.current.distanceTo(playerPositionRef.current);
            const moves = [MoveType.PUNCH, MoveType.KICK, MoveType.ELBOW, MoveType.KNEE];
            const randomMove = moves[Math.floor(Math.random() * moves.length)];

            // Decide: Attack, Block, or Move
            if (dist < 2.0) {
                // In range
                if (Math.random() < aggression) {
                    // Attack
                    cpuActionRef.current = randomMove;
                    setOpponentAction(randomMove);
                    playSound('move');

                    // Hit Check
                    setTimeout(() => {
                        // Triple check state to prevent endFight loops
                        if (gameStateRef.current !== GameState.FIGHTING) return;

                        const isPlayerBlocking = playerActionRef.current === MoveType.BLOCK || playerActionRef.current === MoveType.BLOCK_HIT;
                        if (isPlayerBlocking) {
                            playSound('block');
                            addFloatingText("BLOCKED", playerPositionRef.current, "gray");

                            // Trigger Player Block Hit VFX
                            setPlayerAction(MoveType.BLOCK_HIT);
                            // Don't auto-revert player action immediately as they might still be holding Space
                            // The keyUp handler will handle going back to IDLE, 
                            // but we need to ensure we don't get stuck in BLOCK_HIT if they release space right at impact
                            setTimeout(() => {
                                if (keysPressed.current.has('Space')) {
                                    setPlayerAction(MoveType.BLOCK);
                                } else {
                                    setPlayerAction(MoveType.IDLE);
                                }
                            }, 300);

                        } else if (playerActionRef.current === MoveType.ROLL) {
                            addFloatingText("DODGED", playerPositionRef.current, "gray");
                        } else {
                            // Roll for hit
                            if (Math.random() < 0.8) { // AI hit chance
                                playSound('damage');
                                // AI Damage Calculation
                                const baseDmg = MOVES[randomMove].damage;
                                let damage = baseDmg;

                                if (gameMode === GameMode.ADVENTURE) {
                                    const scaling = 1.0 + (adventureStage * 0.12); // +12% dmg per stage
                                    damage *= scaling;
                                }

                                // Player Defense Mod (Hero)
                                let defenseMod = (playerStatsRef.current.damageModifiers?.defense || 1.0);

                                // Player Defense Mod (Buff)
                                if (playerStatsRef.current.ritualBuff?.isActive) {
                                    defenseMod *= playerStatsRef.current.ritualBuff.defenseMultiplier;
                                }

                                damage *= defenseMod;

                                // Player Defense Mod (Sak Yant - Gao Yord)
                                if (playerStatsRef.current.activeSakYant?.type === SakYantType.GAO_YORD) {
                                    const lvl = playerStatsRef.current.activeSakYant.level;
                                    const reduce = SAK_YANT_DB[SakYantType.GAO_YORD].levels[lvl].effectValue;
                                    damage *= reduce;

                                    // Reflect Dmg
                                    const reflect = SAK_YANT_DB[SakYantType.GAO_YORD].levels[lvl].secondaryEffect || 0;
                                    if (reflect > 0) {
                                        const reflectDmg = damage * reflect;
                                        updateStats('opponent', { currentHealth: Math.max(0, opponentStatsRef.current.currentHealth - reflectDmg) });
                                        addFloatingText(`REFLECT ${reflectDmg.toFixed(0)}`, opponentPositionRef.current, "yellow");
                                    }

                                    // Integrity
                                    const newIntegrity = Math.max(0, playerStatsRef.current.activeSakYant.currentIntegrity - damage);
                                    updateStats('player', { activeSakYant: { ...playerStatsRef.current.activeSakYant, currentIntegrity: newIntegrity } });
                                }

                                // Passive Dodge (Hanuman Level 3+)
                                if (playerStatsRef.current.activeSakYant?.type === SakYantType.HANUMAN) {
                                    const lvl = playerStatsRef.current.activeSakYant.level;
                                    const dodgeChance = SAK_YANT_DB[SakYantType.HANUMAN].levels[lvl].secondaryEffect || 0;
                                    if (Math.random() < dodgeChance) {
                                        addFloatingText("HANUMAN DODGE", playerPositionRef.current, "green");
                                        // Integrity Cost
                                        const newIntegrity = Math.max(0, playerStatsRef.current.activeSakYant.currentIntegrity - 5);
                                        updateStats('player', { activeSakYant: { ...playerStatsRef.current.activeSakYant, currentIntegrity: newIntegrity } });
                                        return; // Skip damage
                                    }
                                }

                                let newHp = Math.max(0, playerStatsRef.current.currentHealth - damage);
                                updateStats('player', { currentHealth: newHp });
                                addFloatingText(`-${damage.toFixed(0)}`, playerPositionRef.current, "red");

                                // Player reaction
                                setPlayerAction(MoveType.HIT);
                                setTimeout(() => setPlayerAction(MoveType.IDLE), 400);

                                if (newHp <= 0) {
                                    endFight(false);
                                }
                            } else {
                                playSound('miss');
                                addFloatingText("MISS", playerPositionRef.current, "gray");
                            }
                        }
                    }, 300);

                    setTimeout(() => {
                        setOpponentAction(MoveType.IDLE);
                        cpuActionRef.current = MoveType.IDLE;
                    }, 800);
                } else {
                    // Block or wait
                    if (Math.random() > 0.5) {
                        setOpponentAction(MoveType.BLOCK);
                        setTimeout(() => setOpponentAction(MoveType.IDLE), 600);
                    }
                }
            }

            // Loop
            if (gameStateRef.current === GameState.FIGHTING && opponentStatsRef.current.currentHealth > 0) {
                handleCpuTurn();
            }
        }, reactionTime);
    };

    // Start AI Loop
    useEffect(() => {
        if (gameState === GameState.FIGHTING && gameMode !== GameMode.PVP_ONLINE) {
            handleCpuTurn();
        }
    }, [gameState]);

    // --- UPGRADE HANDLERS ---
    const handleUpgradeSakYant = (type: SakYantType) => {
        const level = inventory.unlockedYants[type] || 0;
        const data = SAK_YANT_DB[type].levels[level + 1];
        if (!data) return;

        const pieceCount = inventory.sakYantPieces?.[type] || 0;

        if (playerProfile.currency >= data.upgradeCost && pieceCount >= data.piecesRequired) {
            playSound('win'); // Upgrade sound

            // Deep copy to prevent mutation bugs and safely handle optional fields
            const newInventory: PlayerInventory = {
                ...inventory,
                unlockedYants: { ...inventory.unlockedYants },
                sakYantPieces: { ...(inventory.sakYantPieces || INITIAL_INVENTORY.sakYantPieces!) }
            };

            newInventory.unlockedYants[type] = level + 1;
            if (newInventory.sakYantPieces) {
                newInventory.sakYantPieces[type] = pieceCount - data.piecesRequired;
            }

            const newProfile = { ...playerProfile, currency: playerProfile.currency - data.upgradeCost };

            saveGame(newProfile, newInventory);

            // Notifications
            if (level === 0) {
                setNotification("SAK YANT UNLOCKED!");
            } else {
                setNotification("SAK YANT UPGRADED!");
            }
            setTimeout(() => setNotification(null), 2000);

            // Live Update if equipped
            if (equippedSakYantId === type) {
                const baseIntegrity = data.maxIntegrity;
                const reinforceBonus = (inventory.durabilityLevels?.[type] || 0) * GAME_ECONOMY.REINFORCE_INTEGRITY_BONUS;
                const maxIntegrity = baseIntegrity + reinforceBonus;

                // Restore integrity to full on upgrade!
                updateStats('player', {
                    activeSakYant: {
                        type: type,
                        level: level + 1,
                        currentIntegrity: maxIntegrity,
                        maxIntegrity: maxIntegrity
                    }
                });

                // If Naga, update max health immediately via reset
                if (type === SakYantType.NAGA) {
                    setTimeout(() => resetPlayerStats(), 100);
                }
            }
        } else {
            playSound('miss');
            setNotification("NOT ENOUGH RESOURCES!");
            setTimeout(() => setNotification(null), 1500);
        }
    };

    const handleReinforceSakYant = (type: SakYantType) => {
        const durabilityLvl = inventory.durabilityLevels?.[type] || 0;
        const cost = GAME_ECONOMY.REINFORCE_BASE_COST + (durabilityLvl * 50);

        if (playerProfile.currency >= cost) {
            playSound('block'); // Crafting sound

            // Deep copy for durability levels with fallback
            const newInventory: PlayerInventory = {
                ...inventory,
                durabilityLevels: { ...(inventory.durabilityLevels || INITIAL_INVENTORY.durabilityLevels!) }
            };

            if (!newInventory.durabilityLevels) newInventory.durabilityLevels = { ...INITIAL_INVENTORY.durabilityLevels! };
            newInventory.durabilityLevels[type] = durabilityLvl + 1;

            const newProfile = { ...playerProfile, currency: playerProfile.currency - cost };
            saveGame(newProfile, newInventory);

            // Live Update
            if (equippedSakYantId === type && playerStats.activeSakYant) {
                const bonus = GAME_ECONOMY.REINFORCE_INTEGRITY_BONUS;
                updateStats('player', {
                    activeSakYant: {
                        ...playerStats.activeSakYant,
                        maxIntegrity: playerStats.activeSakYant.maxIntegrity + bonus,
                        currentIntegrity: playerStats.activeSakYant.currentIntegrity + bonus
                    }
                });
            }
        }
    };

    // Helper to determine what Sak Yant VFX to show on the fighter
    const getDisplayedSakYant = () => {
        // If previewing in menu, show preview. Otherwise show equipped.
        if ((gameState === GameState.SAK_YANT_MENU) && previewSakYantId) {
            const level = inventory.unlockedYants[previewSakYantId] || 1; // Preview lvl 1 if locked
            // Dummy data for preview
            return { type: previewSakYantId, level, currentIntegrity: 100, maxIntegrity: 100 };
        }
        return playerStats.activeSakYant;
    }

    // Helper to determine what Hero to show on the fighter
    const getDisplayedHeroId = () => {
        if ((gameState === GameState.CHARACTER_SELECT) && previewHero) {
            return previewHero;
        }
        return selectedHero;
    }

    return (
        <div className="relative w-full h-[100dvh] overflow-hidden bg-black select-none">
            {/* Removed global VRButton here to avoid duplicate and HTTPS warning */}
            {/* --- 3D SCENE --- */}
            <Canvas
                shadows={performanceProfile.enableShadows}
                dpr={performanceProfile.dpr}
                gl={{
                    antialias: performanceProfile.antialias,
                    powerPreference: performanceProfile.preset === 'LOW' ? 'default' : 'high-performance'
                }}
                camera={{ position: [0, 2, 6], fov: 50 }}
                className="z-0"
            >
                <XR>
                    <RuntimePerformanceBridge
                        onTelemetry={handleRendererTelemetry}
                        onFpsSample={setFpsEstimate}
                    />
                    <VRControllerHandler onAction={handlePlayerAction} playerPositionRef={playerPositionRef} />
                    <VRFloatingHUD playerStats={playerStats} opponentStats={opponentStats} />

                    <ViewController
                        isFirstPerson={isFirstPerson}
                        playerPosition={playerPositionRef.current}
                        opponentPosition={opponentPositionRef.current}
                        playerAction={playerAction}
                        isHit={playerAction === MoveType.HIT}
                        inputState={keysPressed}
                        cpuActionRef={cpuActionRef}
                        gameState={gameState}
                    />

                    <Scenery theme={sceneryTheme} performanceProfile={performanceProfile} />

                    {/* PLAYER FIGHTER */}
                    {(gameState === GameState.FIGHTING || gameState === GameState.MENU || gameState === GameState.CHARACTER_SELECT || gameState === GameState.SAK_YANT_MENU || gameState === GameState.VICTORY || gameState === GameState.RITUAL) && (
                        <Fighter
                            position={
                                (gameState === GameState.MENU) ? [-0.5, 0, 0] :
                                    (gameState === GameState.CHARACTER_SELECT || gameState === GameState.SAK_YANT_MENU) ? [-1.0, 0, 0] :
                                        (gameState === GameState.RITUAL) ? [0, 0, 0] :
                                            playerStatsRef.current.currentHealth > 0 ? playerPositionRef.current.toArray() : [-100, 0, 0]
                            }
                            color={FIGHTER_CONFIG.PLAYER_COLOR}
                            action={
                                (gameState === GameState.MENU || gameState === GameState.CHARACTER_SELECT || gameState === GameState.SAK_YANT_MENU) ? menuHeroAction :
                                    (gameState === GameState.RITUAL) ? MoveType.RITUAL_DANCE :
                                        playerAction
                            }
                            isFacingRight={true} // Default
                            comboCount={comboCount}
                            sakYant={getDisplayedSakYant()}
                            isFirstPerson={isFirstPerson}
                            isPlayer={gameState === GameState.FIGHTING || gameState === GameState.VICTORY}
                            inputState={keysPressed}
                            positionRef={playerPositionRef}
                            ritualBuff={playerStats.ritualBuff}
                            gameState={gameState}
                            performanceProfile={performanceProfile}
                            // In menu modes, pass dummy opponent ref to force facing towards camera if Fighter component supports it
                            opponentPositionRef={
                                gameState === GameState.FIGHTING || gameState === GameState.VICTORY ? opponentPositionRef :
                                    (gameState === GameState.MENU || gameState === GameState.CHARACTER_SELECT || gameState === GameState.SAK_YANT_MENU) ? cameraDummyRef : undefined
                            }
                        />
                    )}

                    {/* CPU FIGHTER */}
                    {(gameState === GameState.FIGHTING || gameState === GameState.VICTORY) && (
                        <Fighter
                            position={opponentPositionRef.current.toArray()}
                            color={FIGHTER_CONFIG.CPU_COLOR}
                            action={opponentAction}
                            isFacingRight={false}
                            sakYant={opponentStats.activeSakYant}
                            opponentPositionRef={playerPositionRef}
                            gameState={gameState}
                            performanceProfile={performanceProfile}
                        />
                    )}

                    {gameState === GameState.FIGHTING && <Arena performanceProfile={performanceProfile} />}

                    {gameState === GameState.FIGHTING && floatingTexts.map(ft => (
                        <FloatingDamage key={ft.id} text={ft.text} position={ft.position} color={ft.color} onComplete={() => setFloatingTexts(prev => prev.filter(p => p.id !== ft.id))} />
                    ))}

                    <SceneEffects performanceProfile={performanceProfile} />
                    <ambientLight intensity={0.5} />
                    {/* Spotlight for Menu Hero */}
                    {(gameState === GameState.MENU || gameState === GameState.CHARACTER_SELECT || gameState === GameState.SAK_YANT_MENU) && (
                        <spotLight
                            position={[-2, 4, 3]}
                            intensity={200}
                            angle={0.5}
                            penumbra={1}
                            castShadow={performanceProfile.enableShadows}
                            color="white"
                        />
                    )}

                    {/* AI Controllers */}
                    {gameState === GameState.FIGHTING && gameMode !== GameMode.PVP_ONLINE && (
                        <AiController
                            playerPos={playerPositionRef}
                            opponentPos={opponentPositionRef}
                            isActive={true}
                            difficulty={difficulty}
                            action={opponentAction}
                        />
                    )}
                </XR>
            </Canvas>

            <PerformanceBadge
                graphicsMode={graphicsMode}
                performanceProfile={performanceProfile}
                fps={fpsEstimate}
                assetStatus={assetDownloadStatus}
            />

            {/* --- UI LAYERS --- */}

            {/* 1. NOTIFICATIONS */}
            {notification && (
                <div className="absolute top-1/4 left-1/2 -translate-x-1/2 z-[110] animate-bounce pointer-events-none">
                    <div className="bg-red-600 text-white font-black text-2xl px-6 py-2 skew-x-[-12deg] border-4 border-yellow-400 shadow-[0_0_20px_rgba(234,179,8,0.5)]">
                        <span className="skew-x-[12deg] inline-block">{notification}</span>
                    </div>
                </div>
            )}

            {/* RITUAL OVERLAY */}
            {gameState === GameState.RITUAL && (
                <RitualOverlay onComplete={handleRitualComplete} bpm={100} />
            )}

            {/* 2. GAME HUD */}
            {gameState === GameState.FIGHTING && (
                <div className="absolute inset-0 z-10 pointer-events-none flex flex-col justify-between p-2 md:p-6">
                    {/* Health Bars */}
                    <div className="flex justify-between items-start w-full max-w-5xl mx-auto gap-4">
                        {/* Player Health */}
                        <div className="flex-1">
                            <div className="flex justify-between text-white font-bold mb-1 drop-shadow-md">
                                <span className="text-blue-400 text-lg">{HEROES_DB[selectedHero]?.name || "Fighter"}</span>
                                <div className="flex items-center gap-2">
                                    <span className="text-sm">LVL {playerProfile.level}</span>
                                    {playerStats.ritualBuff?.isActive && (
                                        <span className="text-yellow-400 flex items-center gap-1 text-xs animate-pulse font-mono border border-yellow-500/50 bg-black/50 px-2 rounded">
                                            <Flame size={10} /> BUFF {playerStats.ritualBuff.timeLeft.toFixed(0)}s
                                        </span>
                                    )}
                                </div>
                            </div>
                            {/* Health */}
                            <div className="h-6 bg-gray-800 rounded-sm border-2 border-gray-600 relative overflow-hidden skew-x-[-10deg]">
                                <div className="h-full bg-blue-600 transition-all duration-300" style={{ width: `${(playerStats.currentHealth / playerStats.maxHealth) * 100}%` }}></div>
                            </div>
                            {/* Stamina */}
                            <div className="h-2 mt-1 bg-gray-800 rounded-sm relative overflow-hidden skew-x-[-10deg] w-3/4">
                                <div className="h-full bg-yellow-400 transition-all duration-100" style={{ width: `${(playerStats.stamina / playerStats.maxStamina) * 100}%` }}></div>
                            </div>
                            {/* Sak Yant Integrity */}
                            {playerStats.activeSakYant && (
                                <div className="mt-1 flex items-center gap-1">
                                    <Shield size={12} className="text-green-400" />
                                    <div className="h-1.5 flex-1 bg-gray-800 rounded-sm relative overflow-hidden">
                                        <div
                                            className="h-full transition-all duration-300"
                                            style={{
                                                width: `${(playerStats.activeSakYant.currentIntegrity / playerStats.activeSakYant.maxIntegrity) * 100}%`,
                                                backgroundColor: SAK_YANT_DB[playerStats.activeSakYant.type].color
                                            }}
                                        />
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* VS Timer */}
                        <div className="text-center pt-2">
                            <div className="text-3xl font-black text-yellow-500 drop-shadow-[0_2px_2px_rgba(0,0,0,0.8)]">VS</div>
                        </div>

                        {/* Opponent Health */}
                        <div className="flex-1 text-right">
                            <div className="flex justify-between text-white font-bold mb-1 drop-shadow-md flex-row-reverse">
                                <span className="text-red-500 text-lg uppercase">{opponentStats.name || "Opponent"}</span>
                                {gameMode === GameMode.ADVENTURE && <span className="text-sm text-gray-400">STAGE {adventureStage + 1}</span>}
                            </div>
                            <div className="h-6 bg-gray-800 rounded-sm border-2 border-gray-600 relative overflow-hidden skew-x-[10deg]">
                                <div className="h-full bg-red-600 transition-all duration-300 absolute right-0" style={{ width: `${(opponentStats.currentHealth / opponentStats.maxHealth) * 100}%` }}></div>
                            </div>
                            <div className="h-2 mt-1 bg-gray-800 rounded-sm relative overflow-hidden skew-x-[10deg] w-3/4 ml-auto">
                                <div className="h-full bg-orange-400 transition-all duration-100 absolute right-0" style={{ width: `${(opponentStats.stamina / opponentStats.maxStamina) * 100}%` }}></div>
                            </div>
                        </div>
                    </div>

                    {/* Combo Counter */}
                    {comboCount > 1 && (
                        <div className="absolute left-4 top-1/3 animate-pulse">
                            <div className="text-5xl font-black text-yellow-500 italic skew-x-[-12deg] drop-shadow-lg">{comboCount} HITS</div>
                            <div className="text-white font-bold text-xl ml-2">COMBO!</div>
                        </div>
                    )}

                    {/* Controls (Mobile) */}
                    <div className="pointer-events-auto mt-auto flex justify-between items-end pb-8">
                        <div className="w-1/3 pl-4 pb-4">
                            <Joystick onMove={handleJoystickMove} />
                        </div>

                        <div className="w-1/3 flex flex-col items-end gap-4 pr-4 pb-4">
                            <div className="flex gap-4">
                                <button
                                    className="w-16 h-16 bg-blue-600/80 rounded-full border-4 border-blue-400 active:bg-blue-500 active:scale-95 transition-all shadow-lg flex items-center justify-center"
                                    onTouchStart={() => handlePlayerAction(MoveType.PUNCH)}
                                    onMouseDown={() => handlePlayerAction(MoveType.PUNCH)}
                                >
                                    <span className="font-bold text-white drop-shadow-md">{MOVES[MoveType.PUNCH].khmerName}</span>
                                </button>
                                <button
                                    className="w-16 h-16 bg-yellow-600/80 rounded-full border-4 border-yellow-400 active:bg-yellow-500 active:scale-95 transition-all shadow-lg flex items-center justify-center mt-[-20px]"
                                    onTouchStart={() => handlePlayerAction(MoveType.KICK)}
                                    onMouseDown={() => handlePlayerAction(MoveType.KICK)}
                                >
                                    <span className="font-bold text-white drop-shadow-md">{MOVES[MoveType.KICK].khmerName}</span>
                                </button>
                            </div>
                            <div className="flex gap-4">
                                <button
                                    className="w-14 h-14 bg-green-600/80 rounded-full border-4 border-green-400 active:bg-green-500 active:scale-95 transition-all shadow-lg flex items-center justify-center"
                                    onTouchStart={() => handlePlayerAction(MoveType.BLOCK)}
                                    onMouseDown={() => handlePlayerAction(MoveType.BLOCK)}
                                >
                                    <Shield size={24} color="white" />
                                </button>
                                <button
                                    className="w-14 h-14 bg-blue-800/80 rounded-full border-4 border-blue-600 active:bg-blue-700 active:scale-95 transition-all shadow-lg flex items-center justify-center"
                                    onTouchStart={() => handlePlayerAction(MoveType.UPPERCUT)}
                                    onMouseDown={() => handlePlayerAction(MoveType.UPPERCUT)}
                                >
                                    <span className="font-bold text-white text-[10px] drop-shadow-md">{MOVES[MoveType.UPPERCUT].khmerName}</span>
                                </button>
                                <button
                                    className="w-14 h-14 bg-purple-600/80 rounded-full border-4 border-purple-400 active:bg-purple-500 active:scale-95 transition-all shadow-lg flex items-center justify-center"
                                    onTouchStart={() => handlePlayerAction(MoveType.KNEE)}
                                    onMouseDown={() => handlePlayerAction(MoveType.KNEE)}
                                >
                                    <span className="font-bold text-white text-xs drop-shadow-md">{MOVES[MoveType.KNEE].khmerName}</span>
                                </button>
                                <button
                                    className="w-14 h-14 bg-red-600/80 rounded-full border-4 border-red-400 active:bg-red-500 active:scale-95 transition-all shadow-lg flex items-center justify-center"
                                    onTouchStart={() => handlePlayerAction(MoveType.ELBOW)}
                                    onMouseDown={() => handlePlayerAction(MoveType.ELBOW)}
                                >
                                    <span className="font-bold text-white text-xs drop-shadow-md">{MOVES[MoveType.ELBOW].khmerName}</span>
                                </button>
                            </div>
                            <button
                                className="w-12 h-12 bg-gray-600/80 rounded-full border-2 border-gray-400 active:bg-gray-500 active:scale-95 transition-all shadow-lg flex items-center justify-center mt-2"
                                onTouchStart={() => handlePlayerAction(MoveType.ROLL)}
                                onMouseDown={() => handlePlayerAction(MoveType.ROLL)}
                            >
                                <Move size={20} color="white" />
                            </button>
                        </div>
                    </div>

                    {/* Top Right Menu */}
                    <div className="absolute top-4 right-4 flex gap-2 pointer-events-auto">
                        <button onClick={handleToggleAudio} className="p-2 bg-black/40 rounded-full backdrop-blur text-white hover:bg-black/60">
                            {isAudioOn ? <Volume2 size={20} /> : <VolumeX size={20} />}
                        </button>
                        <button
                            onClick={cycleGraphicsMode}
                            className="p-2 bg-black/40 rounded-full backdrop-blur text-white hover:bg-black/60"
                            title={`Graphics mode: ${graphicsMode === 'AUTO' ? `AUTO ${performanceProfile.preset}` : graphicsMode}`}
                        >
                            <Monitor size={20} />
                        </button>
                        <button
                            onClick={() => {
                                import('./services/audioService').then(mod => {
                                    const theme = mod.toggleMusicTheme();
                                    setNotification(`Music Theme: ${theme}`);
                                    setTimeout(() => setNotification(null), 2000);
                                });
                            }}
                            className="p-2 bg-black/40 rounded-full backdrop-blur text-white hover:bg-black/60"
                        >
                            <Music size={20} />
                        </button>
                        <button onClick={() => setSceneryTheme(t => SCENERY_THEMES[(SCENERY_THEMES.indexOf(t) + 1) % SCENERY_THEMES.length])} className="p-2 bg-black/40 rounded-full backdrop-blur text-white hover:bg-black/60">
                            <Settings size={20} />
                        </button>
                        <button onClick={() => setIsFirstPerson(!isFirstPerson)} className="p-2 bg-black/40 rounded-full backdrop-blur text-white hover:bg-black/60" title="First Person View">
                            {isFirstPerson ? <EyeOff size={20} /> : <Eye size={20} />}
                        </button>
                        <div className="vr-container relative p-2 bg-black/40 rounded-full backdrop-blur text-white hover:bg-black/60 group overflow-hidden flex items-center justify-center">
                            <VRButton />
                            <div className="pointer-events-none relative z-0 flex items-center justify-center">
                                <Glasses size={20} className="text-purple-400 group-hover:scale-110 transition-transform" />
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* 3. MAIN MENU */}
            {gameState === GameState.MENU && (
                <div className="absolute inset-0 z-20 flex flex-col md:flex-row font-sans h-full">
                    {/* Left Half: Transparent to show 3D Hero - smaller on mobile to prioritize menu */}
                    <div className="w-full md:w-1/2 h-1/4 md:h-full pointer-events-none" />
                    
                    {/* Right Half: UI Panel - larger on mobile to fill screen */}
                    <div className="w-full md:w-1/2 h-3/4 md:h-full bg-gradient-to-l from-black via-black/80 to-transparent flex flex-col justify-center p-6 md:p-12 shadow-2xl backdrop-blur-sm border-l border-gray-800/50 overflow-y-auto">
                        <div className="mb-6 md:mb-10 text-center md:text-left">
                            <h1 className="text-5xl md:text-7xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-500 to-cyan-300 italic tracking-tighter drop-shadow-lg">
                                KUN KHMER
                            </h1>
                            <h2 className="text-3xl md:text-5xl font-black text-white italic tracking-tighter -mt-2">
                                FIGHT 3D
                            </h2>
                            <div className="h-1 w-32 bg-yellow-500 mt-4 rounded-full mx-auto md:mx-0"></div>
                        </div>

                        {/* Profile Summary */}
                        <div className="w-full mb-6 bg-gray-900/50 p-4 rounded-xl border border-gray-700 flex items-center gap-4 hover:border-gray-500 transition-colors cursor-default">
                            <div className="w-12 h-12 rounded-full bg-blue-600 flex items-center justify-center font-bold text-xl border-2 border-white shadow-lg">
                                {playerProfile.level}
                            </div>
                            <div className="flex-1">
                                <div className="flex justify-between text-sm text-gray-400 font-bold mb-1">
                                    <span>LEVEL PROGRESS</span>
                                    <span>{playerProfile.currentExp} / {playerProfile.maxExp} XP</span>
                                </div>
                                <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
                                    <div className="h-full bg-blue-500" style={{ width: `${(playerProfile.currentExp / playerProfile.maxExp) * 100}%` }}></div>
                                </div>
                            </div>
                            <div className="flex flex-col items-end">
                                <div className="flex items-center gap-1 text-yellow-400 font-bold font-mono text-lg">
                                    <Coins size={16} /> {playerProfile.currency}
                                </div>
                                <span className="text-[10px] text-gray-500 uppercase">Prak Doung</span>
                            </div>
                        </div>

                        {/* Main Actions - Stacked for clarity */}
                        <div className="w-full space-y-3 mb-8">
                            <button
                                onClick={() => { setGameMode(GameMode.PVE); startFight(); }}
                                className="w-full relative group overflow-hidden bg-gray-900 rounded-xl p-1 transition-all hover:scale-[1.02] shadow-lg"
                            >
                                <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-blue-400 opacity-0 group-hover:opacity-20 transition-opacity" />
                                <div className="relative bg-gray-900/80 backdrop-blur-sm p-4 flex items-center justify-between border border-gray-700 group-hover:border-blue-500/50 rounded-lg">
                                    <div className="flex items-center gap-4">
                                        <div className="p-3 bg-blue-900/30 rounded-lg text-blue-400 border border-blue-500/30">
                                            <Sword size={24} />
                                        </div>
                                        <div className="text-left">
                                            <div className="text-lg font-black italic text-white group-hover:text-blue-200">QUICK FIGHT</div>
                                            <div className="text-[10px] font-bold text-blue-400 tracking-wider">TRAINING MODE</div>
                                        </div>
                                    </div>
                                    <ChevronRight className="text-blue-500 opacity-0 group-hover:opacity-100 transition-opacity transform group-hover:translate-x-1" />
                                </div>
                            </button>

                            <button
                                onClick={() => { setGameMode(GameMode.ADVENTURE); setGameState(GameState.ADVENTURE_MAP); }}
                                className="w-full relative group overflow-hidden bg-gray-900 rounded-xl p-1 transition-all hover:scale-[1.02] shadow-lg"
                            >
                                <div className="absolute inset-0 bg-gradient-to-r from-yellow-600 to-orange-400 opacity-0 group-hover:opacity-20 transition-opacity" />
                                <div className="relative bg-gray-900/80 backdrop-blur-sm p-4 flex items-center justify-between border border-gray-700 group-hover:border-yellow-500/50 rounded-lg">
                                    <div className="flex items-center gap-4">
                                        <div className="p-3 bg-yellow-900/30 rounded-lg text-yellow-400 border border-yellow-500/30">
                                            <Map size={24} />
                                        </div>
                                        <div className="text-left">
                                            <div className="text-lg font-black italic text-white group-hover:text-yellow-200">ADVENTURE</div>
                                            <div className="text-[10px] font-bold text-yellow-400 tracking-wider">STORY CAMPAIGN</div>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <span className="text-xs text-gray-500 font-mono">Stage {playerProfile.adventureStage || 0}</span>
                                        <ChevronRight className="text-yellow-500 opacity-0 group-hover:opacity-100 transition-opacity transform group-hover:translate-x-1" />
                                    </div>
                                </div>
                            </button>

                            <button
                                onClick={() => { setGameMode(GameMode.PVP_ONLINE); setGameState(GameState.ONLINE_LOBBY); }}
                                className="w-full relative group overflow-hidden bg-gray-900 rounded-xl p-1 transition-all hover:scale-[1.02] shadow-lg"
                            >
                                <div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-pink-400 opacity-0 group-hover:opacity-20 transition-opacity" />
                                <div className="relative bg-gray-900/80 backdrop-blur-sm p-4 flex items-center justify-between border border-gray-700 group-hover:border-purple-500/50 rounded-lg">
                                    <div className="flex items-center gap-4">
                                        <div className="p-3 bg-purple-900/30 rounded-lg text-purple-400 border border-purple-500/30">
                                            <Globe size={24} />
                                        </div>
                                        <div className="text-left">
                                            <div className="text-lg font-black italic text-white group-hover:text-purple-200">ONLINE PVP</div>
                                            <div className="text-[10px] font-bold text-purple-400 tracking-wider">CHALLENGE FRIENDS</div>
                                        </div>
                                    </div>
                                    <ChevronRight className="text-purple-500 opacity-0 group-hover:opacity-100 transition-opacity transform group-hover:translate-x-1" />
                                </div>
                            </button>
                        </div>

                        {/* Loadout / Customization */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 w-full">
                            <button
                                onClick={() => setGameState(GameState.CHARACTER_SELECT)}
                                className="bg-gray-800 hover:bg-gray-700 border border-gray-700 hover:border-gray-500 rounded-lg p-3 flex flex-col items-center gap-2 transition-all group"
                            >
                                <div className="relative">
                                    <User size={20} className="text-cyan-400 group-hover:scale-110 transition-transform" />
                                    <div className="absolute -top-1 -right-1 w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                                </div>
                                <span className="text-[10px] font-bold uppercase tracking-wide text-gray-400 group-hover:text-white">Heroes</span>
                            </button>

                            <button
                                onClick={() => setGameState(GameState.SAK_YANT_MENU)}
                                className="bg-gray-800 hover:bg-gray-700 border border-gray-700 hover:border-gray-500 rounded-lg p-3 flex flex-col items-center gap-2 transition-all group"
                            >
                                <div className="relative">
                                    <Book size={20} className="text-green-400 group-hover:scale-110 transition-transform" />
                                    {equippedSakYantId && <div className="absolute -top-1 -right-1 w-2 h-2 bg-green-500 rounded-full" />}
                                </div>
                                <span className="text-[10px] font-bold uppercase tracking-wide text-gray-400 group-hover:text-white">Sak Yant</span>
                            </button>

                            <div className="vr-container bg-gray-800 hover:bg-gray-700 border border-gray-700 hover:border-gray-500 rounded-lg flex flex-col items-center justify-center transition-all group overflow-hidden relative p-3 gap-2">
                                <VRButton />
                                {/* Overlay for icon/text since VRButton takes over click/text usually, but we made text transparent in CSS */}
                                <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center gap-2">
                                    <Glasses size={20} className="text-purple-400 group-hover:scale-110 transition-transform" />
                                    <span className="text-[10px] font-bold uppercase tracking-wide text-gray-400 group-hover:text-white">របៀប VR</span>
                                </div>
                            </div>

                            <button
                                onClick={() => setShowHowToPlay(true)}
                                className="bg-gray-800 hover:bg-gray-700 border border-gray-700 hover:border-gray-500 rounded-lg p-3 flex flex-col items-center gap-2 transition-all group"
                            >
                                <HelpCircle size={20} className="text-gray-500 group-hover:text-white group-hover:scale-110 transition-transform" />
                                <span className="text-[10px] font-bold uppercase tracking-wide text-gray-400 group-hover:text-white">Guide</span>
                            </button>
                        </div>

                        {/* Footer */}
                        <div className="mt-auto w-full pt-8 flex items-center justify-between text-xs text-gray-600 border-t border-gray-800/50 mt-6">
                            <span className="font-mono">VER 1.2.0 • ANGKOR EDITION</span>
                            <button onClick={handleToggleAudio} className="hover:text-white transition-colors flex items-center gap-1">
                                {isAudioOn ? <><Volume2 size={14} /> AUDIO ON</> : <><VolumeX size={14} /> AUDIO OFF</>}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* 4. OVERLAYS */}
            {gameState === GameState.VICTORY && (
                <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md">
                    <div className="text-center animate-in zoom-in duration-500">
                        <Trophy className="w-24 h-24 text-yellow-500 mx-auto mb-4 animate-bounce" />
                        <h1 className="text-6xl font-black text-yellow-500 italic tracking-tighter mb-2">K.O.</h1>
                        <p className="text-xl text-gray-400 mb-8 font-serif">The spirits favor you.</p>

                        <div className="grid grid-cols-2 gap-4 mb-8 max-w-sm mx-auto">
                            <div className="bg-gray-800 p-4 rounded-xl border border-gray-700">
                                <div className="text-xs text-gray-500 uppercase font-bold mb-1">XP Gained</div>
                                <div className="text-2xl font-black text-blue-400">+{lastMatchRewards.xp}</div>
                            </div>
                            <div className="bg-gray-800 p-4 rounded-xl border border-gray-700">
                                <div className="text-xs text-gray-500 uppercase font-bold mb-1">Prak Doung</div>
                                <div className="text-2xl font-black text-yellow-400">+{lastMatchRewards.currency}</div>
                            </div>
                        </div>

                        {lastMatchRewards.levelUp && (
                            <div className="mb-6 animate-pulse text-yellow-400 font-bold text-lg border border-yellow-500/50 bg-yellow-900/20 px-4 py-2 rounded-full inline-block">
                                LEVEL UP! {playerProfile.level}
                            </div>
                        )}

                        {lastMatchRewards.heroLevelUp && (
                            <div className="mb-6 block animate-pulse text-purple-400 font-bold text-sm border border-purple-500/50 bg-purple-900/20 px-4 py-2 rounded-full mt-2">
                                {HEROES_DB[selectedHero].name} Level Up!
                            </div>
                        )}

                        <div className="flex gap-4 justify-center">
                            <button
                                onClick={() => {
                                    if (gameMode === GameMode.ADVENTURE) {
                                        setGameState(GameState.ADVENTURE_MAP);
                                    } else {
                                        setGameState(GameState.MENU);
                                    }
                                }}
                                className="bg-white text-black px-8 py-3 rounded-full font-bold hover:bg-gray-200 transition-colors uppercase tracking-widest"
                            >
                                Continue
                            </button>
                        </div>
                    </div>
                    {lootReward && (
                        <TreasureBoxOverlay reward={lootReward} onClaim={handleClaimLoot} />
                    )}
                </div>
            )}

            {gameState === GameState.GAME_OVER && (
                <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md">
                    <div className="text-center animate-in zoom-in duration-500">
                        <div className="text-6xl mb-4">💀</div>
                        <h1 className="text-6xl font-black text-red-600 italic tracking-tighter mb-2">K.O.</h1>
                        <p className="text-xl text-gray-400 mb-8 font-serif">Train harder, warrior.</p>
                        <button
                            onClick={() => {
                                // Ensure state resets visually for menu hero
                                resetPlayerStats();
                                setGameState(GameState.MENU);
                            }}
                            className="bg-white text-black px-8 py-3 rounded-full font-bold hover:bg-gray-200 transition-colors uppercase tracking-widest"
                        >
                            Return to Gym
                        </button>
                    </div>
                </div>
            )}

            {gameState === GameState.SAK_YANT_MENU && (
                <SakYantMenu
                    inventory={inventory}
                    currency={playerProfile.currency}
                    equippedId={equippedSakYantId}
                    onEquip={(id) => setEquippedSakYantId(id)}
                    onUpgrade={handleUpgradeSakYant}
                    onReinforce={handleReinforceSakYant}
                    onPreview={(id) => setPreviewSakYantId(id)}
                    onBack={() => { setGameState(GameState.MENU); setPreviewSakYantId(null); }}
                />
            )}

            {gameState === GameState.CHARACTER_SELECT && (
                <CharacterSelect
                    inventory={inventory}
                    equippedHeroId={selectedHero}
                    onEquip={(id) => setSelectedHero(id)}
                    onPreview={(id) => setPreviewHero(id)}
                    onBack={() => { setGameState(GameState.MENU); setPreviewHero(null); }}
                />
            )}

            {gameState === GameState.ADVENTURE_MAP && (
                <AdventureMap
                    currentStage={playerProfile.adventureStage || 0}
                    onSelectLevel={(level) => {
                        setAdventureStage(level);
                        setGameMode(GameMode.ADVENTURE);
                        startFight();
                    }}
                    onBack={() => setGameState(GameState.MENU)}
                />
            )}

            {gameState === GameState.ONLINE_LOBBY && (
                <OnlineLobby
                    onBack={() => { setGameState(GameState.MENU); setOnlineState(null); }}
                    onGameStart={(isHost, roomId, conn) => {
                        setOnlineState(isHost ? 'HOSTING' : 'CONNECTED');
                        setGameMode(GameMode.PVP_ONLINE);
                        // For online, host sets random seed, etc.
                        // Simple start for now:
                        startFight();
                    }}
                />
            )}

            {showHowToPlay && (
                <HowToPlay onBack={() => setShowHowToPlay(false)} />
            )}

        </div>
    );
};

export default App;
