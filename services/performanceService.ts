import {
  AssetDownloadStatus,
  DeviceCapabilities,
  DevicePerformanceProfile,
  GraphicsPreset,
  GpuTier,
  NetworkClass,
  RendererTelemetry,
} from '../types';

type AssetPackEntry = {
  id: string;
  url: string;
  minPlan: DevicePerformanceProfile['assetPlan'];
  label: string;
};

const GRAPHICS_PRESET_ORDER: GraphicsPreset[] = ['LOW', 'BALANCED', 'HIGH', 'ULTRA'];

const OPTIONAL_ASSET_PACK: AssetPackEntry[] = [
  {
    id: 'sarama-audio',
    url: '/assets/audio/sarama.mp3',
    minPlan: 'BALANCED',
    label: 'local fight music',
  },
  {
    id: 'fighter-standard-vrm',
    url: '/assets/models/fighter.vrm',
    minPlan: 'BALANCED',
    label: 'humanoid VRM fighter',
  },
  {
    id: 'fighter-standard',
    url: '/assets/models/fighter.glb',
    minPlan: 'BALANCED',
    label: 'fighter model',
  },
  {
    id: 'fighter-hq-vrm',
    url: '/assets/models/fighter-hq.vrm',
    minPlan: 'FULL',
    label: 'high-detail VRM fighter',
  },
  {
    id: 'fighter-hq',
    url: '/assets/models/fighter-hq.glb',
    minPlan: 'FULL',
    label: 'high-detail fighter model',
  },
];

const PRESET_CONFIG: Record<
  GraphicsPreset,
  Omit<DevicePerformanceProfile, keyof DeviceCapabilities | 'recommendedPreset' | 'preset'>
> = {
  LOW: {
    dpr: [0.75, 1],
    antialias: false,
    enableShadows: false,
    shadowMapSize: 512,
    enablePostProcessing: false,
    bloomIntensity: 0,
    vignetteDarkness: 0,
    enableEnvironment: false,
    sceneryDensity: 0.45,
    crowdDensity: 0.35,
    particleMultiplier: 0.4,
    cloudSegments: 0,
    starCount: 700,
    characterDetail: 'low',
    enableAccentLights: false,
    assetPlan: 'ESSENTIAL',
    customModelUrls: [],
  },
  BALANCED: {
    dpr: [1, 1.25],
    antialias: true,
    enableShadows: true,
    shadowMapSize: 1024,
    enablePostProcessing: true,
    bloomIntensity: 0.24,
    vignetteDarkness: 0.65,
    enableEnvironment: true,
    sceneryDensity: 0.72,
    crowdDensity: 0.58,
    particleMultiplier: 0.72,
    cloudSegments: 10,
    starCount: 1500,
    characterDetail: 'medium',
    enableAccentLights: true,
    assetPlan: 'BALANCED',
    customModelUrls: ['/assets/models/fighter.vrm', '/assets/models/fighter.glb'],
  },
  HIGH: {
    dpr: [1, 1.5],
    antialias: true,
    enableShadows: true,
    shadowMapSize: 1536,
    enablePostProcessing: true,
    bloomIntensity: 0.4,
    vignetteDarkness: 0.9,
    enableEnvironment: true,
    sceneryDensity: 1,
    crowdDensity: 0.82,
    particleMultiplier: 1,
    cloudSegments: 18,
    starCount: 2800,
    characterDetail: 'high',
    enableAccentLights: true,
    assetPlan: 'FULL',
    customModelUrls: [
      '/assets/models/fighter-hq.vrm',
      '/assets/models/fighter-hq.glb',
      '/assets/models/fighter.vrm',
      '/assets/models/fighter.glb',
    ],
  },
  ULTRA: {
    dpr: [1, 2],
    antialias: true,
    enableShadows: true,
    shadowMapSize: 2048,
    enablePostProcessing: true,
    bloomIntensity: 0.52,
    vignetteDarkness: 1.08,
    enableEnvironment: true,
    sceneryDensity: 1.15,
    crowdDensity: 1,
    particleMultiplier: 1.15,
    cloudSegments: 24,
    starCount: 4000,
    characterDetail: 'high',
    enableAccentLights: true,
    assetPlan: 'FULL',
    customModelUrls: [
      '/assets/models/fighter-hq.vrm',
      '/assets/models/fighter-hq.glb',
      '/assets/models/fighter.vrm',
      '/assets/models/fighter.glb',
    ],
  },
};

export const DEFAULT_DEVICE_CAPABILITIES: DeviceCapabilities = {
  cpuCores: 4,
  memoryGB: null,
  devicePixelRatio: 1,
  screenPixels: 1280 * 720,
  isMobile: false,
  networkClass: 'STANDARD',
  saveData: false,
  renderer: 'Unknown renderer',
  vendor: 'Unknown vendor',
  gpuTier: 'UNKNOWN',
  recommendedPreset: 'BALANCED',
  maxTextureSize: null,
  anisotropy: 1,
};

export const DEFAULT_ASSET_DOWNLOAD_STATUS: AssetDownloadStatus = {
  phase: 'idle',
  plan: 'ESSENTIAL',
  requested: 0,
  available: 0,
  completed: 0,
  message: 'Waiting for device profile',
};

const planRank: Record<DevicePerformanceProfile['assetPlan'], number> = {
  ESSENTIAL: 0,
  BALANCED: 1,
  FULL: 2,
};

const mobilePattern = /android|iphone|ipad|ipod|mobile/i;

const lowTierGpuPattern =
  /swiftshader|llvmpipe|software|intel\(r\) hd graphics|uhd graphics 6|mali-4|mali-5|adreno \(tm\) 3|adreno \(tm\) 4/i;
const highTierGpuPattern =
  /rtx|radeon rx|arc|apple m[1-9]|apple gpu|geforce gtx 16|geforce rtx|iris xe|adreno \(tm\) 7|mali-g7|mali-g8/i;
const midTierGpuPattern =
  /iris|vega|adreno \(tm\) 6|mali-g6|uhd graphics|apple a1[4-9]|apple m1/i;

const getNavigatorHandle = () =>
  navigator as Navigator & {
    deviceMemory?: number;
    connection?: {
      effectiveType?: string;
      saveData?: boolean;
    };
  };

const inferGpuTier = (renderer: string): GpuTier => {
  const label = renderer.toLowerCase();
  if (!label || label.includes('unknown')) return 'UNKNOWN';
  if (lowTierGpuPattern.test(label)) return 'LOW';
  if (highTierGpuPattern.test(label)) return 'HIGH';
  if (midTierGpuPattern.test(label)) return 'MID';
  return 'MID';
};

const resolveNetworkClass = (
  effectiveType?: string,
  saveData?: boolean,
  online?: boolean,
): NetworkClass => {
  if (online === false) return 'OFFLINE';
  if (saveData) return 'SLOW';
  if (!effectiveType || effectiveType === '4g') return 'FAST';
  if (effectiveType === '3g') return 'STANDARD';
  return 'SLOW';
};

const scoreDevice = (capabilities: Omit<DeviceCapabilities, 'recommendedPreset' | 'gpuTier'> & { gpuTier: GpuTier }) => {
  let score = 0;

  if (capabilities.cpuCores >= 8) score += 2;
  else if (capabilities.cpuCores >= 4) score += 1;

  if ((capabilities.memoryGB ?? 4) >= 8) score += 2;
  else if ((capabilities.memoryGB ?? 4) >= 4) score += 1;

  if (capabilities.gpuTier === 'HIGH') score += 2;
  else if (capabilities.gpuTier === 'MID') score += 1;
  else if (capabilities.gpuTier === 'LOW') score -= 2;

  if (capabilities.screenPixels >= 2560 * 1440) score -= 1;
  if (capabilities.isMobile) score -= 1;

  return score;
};

const recommendPreset = (capabilities: Omit<DeviceCapabilities, 'recommendedPreset'>): GraphicsPreset => {
  const score = scoreDevice(capabilities);
  let preset: GraphicsPreset = 'BALANCED';

  if (score <= 0) preset = 'LOW';
  else if (score <= 2) preset = 'BALANCED';
  else if (score <= 4) preset = 'HIGH';
  else preset = 'ULTRA';

  if (capabilities.networkClass === 'SLOW' && preset === 'ULTRA') return 'HIGH';
  if (capabilities.saveData && preset !== 'LOW') return shiftGraphicsPreset(preset, -1);

  return preset;
};

export const shiftGraphicsPreset = (preset: GraphicsPreset, direction: -1 | 1): GraphicsPreset => {
  const index = GRAPHICS_PRESET_ORDER.indexOf(preset);
  const nextIndex = Math.max(0, Math.min(GRAPHICS_PRESET_ORDER.length - 1, index + direction));
  return GRAPHICS_PRESET_ORDER[nextIndex];
};

export const detectDeviceCapabilities = (): DeviceCapabilities => {
  if (typeof window === 'undefined' || typeof navigator === 'undefined') {
    return DEFAULT_DEVICE_CAPABILITIES;
  }

  const nav = getNavigatorHandle();
  const cpuCores = nav.hardwareConcurrency || 4;
  const memoryGB = nav.deviceMemory ?? null;
  const devicePixelRatio = window.devicePixelRatio || 1;
  const screenPixels = window.innerWidth * window.innerHeight;
  const isMobile = mobilePattern.test(nav.userAgent);
  const networkClass = resolveNetworkClass(nav.connection?.effectiveType, nav.connection?.saveData, nav.onLine);
  const saveData = Boolean(nav.connection?.saveData);

  const partial: Omit<DeviceCapabilities, 'recommendedPreset'> = {
    cpuCores,
    memoryGB,
    devicePixelRatio,
    screenPixels,
    isMobile,
    networkClass,
    saveData,
    renderer: DEFAULT_DEVICE_CAPABILITIES.renderer,
    vendor: DEFAULT_DEVICE_CAPABILITIES.vendor,
    gpuTier: 'UNKNOWN',
    maxTextureSize: null,
    anisotropy: 1,
  };

  return {
    ...partial,
    recommendedPreset: recommendPreset(partial),
  };
};

export const readRendererTelemetry = (gl: {
  getContext: () => WebGLRenderingContext | WebGL2RenderingContext;
  capabilities?: { getMaxAnisotropy?: () => number };
}): RendererTelemetry => {
  const context = gl.getContext();
  const debugInfo = context.getExtension('WEBGL_debug_renderer_info');

  const renderer = debugInfo
    ? context.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL)
    : `${context.getParameter(context.RENDERER) || 'Unknown renderer'}`;
  const vendor = debugInfo
    ? context.getParameter(debugInfo.UNMASKED_VENDOR_WEBGL)
    : `${context.getParameter(context.VENDOR) || 'Unknown vendor'}`;

  return {
    renderer,
    vendor,
    maxTextureSize: context.getParameter(context.MAX_TEXTURE_SIZE) as number,
    anisotropy: gl.capabilities?.getMaxAnisotropy?.() ?? 1,
  };
};

export const hydrateCapabilitiesWithRenderer = (
  capabilities: DeviceCapabilities,
  telemetry: RendererTelemetry,
): DeviceCapabilities => {
  const nextBase: Omit<DeviceCapabilities, 'recommendedPreset'> = {
    ...capabilities,
    renderer: telemetry.renderer,
    vendor: telemetry.vendor,
    maxTextureSize: telemetry.maxTextureSize,
    anisotropy: telemetry.anisotropy,
    gpuTier: inferGpuTier(telemetry.renderer),
  };

  return {
    ...nextBase,
    recommendedPreset: recommendPreset(nextBase),
  };
};

export const buildPerformanceProfile = (
  capabilities: DeviceCapabilities,
  preset: GraphicsPreset = capabilities.recommendedPreset,
): DevicePerformanceProfile => {
  const safePreset = PRESET_CONFIG[preset] ? preset : capabilities.recommendedPreset;
  const config = PRESET_CONFIG[safePreset];
  const assetPlan =
    capabilities.networkClass === 'OFFLINE'
      ? 'ESSENTIAL'
      : capabilities.saveData
        ? 'ESSENTIAL'
        : config.assetPlan === 'FULL' && capabilities.networkClass !== 'FAST'
          ? 'BALANCED'
          : config.assetPlan;

  return {
    ...capabilities,
    ...config,
    preset: safePreset,
    assetPlan,
    customModelUrls:
      assetPlan === 'FULL'
        ? [
            '/assets/models/fighter-hq.vrm',
            '/assets/models/fighter-hq.glb',
            '/assets/models/fighter.vrm',
            '/assets/models/fighter.glb',
          ]
        : assetPlan === 'BALANCED'
          ? ['/assets/models/fighter.vrm', '/assets/models/fighter.glb']
          : [],
  };
};

const requestIdle = (callback: () => void) => {
  if (typeof window === 'undefined') {
    callback();
    return () => undefined;
  }

  if (typeof window.requestIdleCallback === 'function') {
    const id = window.requestIdleCallback(() => callback());
    return () => window.cancelIdleCallback(id);
  }

  const id = window.setTimeout(callback, 350);
  return () => window.clearTimeout(id);
};

const canUseAssetPlan = (
  entryPlan: DevicePerformanceProfile['assetPlan'],
  profilePlan: DevicePerformanceProfile['assetPlan'],
) => planRank[entryPlan] <= planRank[profilePlan];

const assetExists = async (url: string) => {
  try {
    const response = await fetch(url, { method: 'HEAD', cache: 'force-cache' });
    const contentType = response.headers.get('content-type') || '';
    return response.ok && !contentType.includes('text/html');
  } catch {
    return false;
  }
};

const warmAsset = async (url: string) => {
  const response = await fetch(url, { cache: 'force-cache' });
  await response.blob();
};

export const scheduleOptionalAssetDownloads = (
  profile: DevicePerformanceProfile,
  onStatusChange: (status: AssetDownloadStatus) => void,
) => {
  const queue = OPTIONAL_ASSET_PACK.filter(entry => canUseAssetPlan(entry.minPlan, profile.assetPlan));
  let cancelled = false;

  onStatusChange({
    phase: queue.length ? 'checking' : 'ready',
    plan: profile.assetPlan,
    requested: queue.length,
    available: 0,
    completed: 0,
    message: queue.length ? 'Checking optional assets' : 'No optional downloads for this device tier',
  });

  const cancelIdle = requestIdle(async () => {
    let available = 0;
    let completed = 0;

    for (const entry of queue) {
      if (cancelled) return;

      const exists = await assetExists(entry.url);
      if (!exists) continue;

      available += 1;
      onStatusChange({
        phase: 'downloading',
        plan: profile.assetPlan,
        requested: queue.length,
        available,
        completed,
        message: `Preparing ${entry.label}`,
      });

      try {
        await warmAsset(entry.url);
        completed += 1;
      } catch {
        continue;
      }

      onStatusChange({
        phase: 'downloading',
        plan: profile.assetPlan,
        requested: queue.length,
        available,
        completed,
        message: `Prepared ${completed}/${available} optional assets`,
      });
    }

    if (cancelled) return;

    onStatusChange({
      phase: 'ready',
      plan: profile.assetPlan,
      requested: queue.length,
      available,
      completed,
      message:
        available === 0
          ? 'Optional quality pack not installed'
          : completed === available
            ? 'Optional assets ready'
            : 'Optional assets partially ready',
    });
  });

  return () => {
    cancelled = true;
    cancelIdle();
  };
};
