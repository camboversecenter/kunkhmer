
import { LeaderboardEntry, LeaderboardPeriod, PlayerInventory, UserProfile, PlayerProfile } from "../types";

declare global {
    interface Window {
        google: any;
    }
}

// Placeholder Client ID - In a real app, this comes from Google Cloud Console
// Since we are in a demo environment, we might not be able to actually auth against Google servers
// without a whitelisted domain, so we will handle errors gracefully.
const GOOGLE_CLIENT_ID = "212000149440-qv28mvr043e6p34bkpu1vojukg6ojoj7.apps.googleusercontent.com"; 

export const initializeGoogleAuth = (callback: (user: UserProfile) => void) => {
  if (window.google) {
    window.google.accounts.id.initialize({
      client_id: GOOGLE_CLIENT_ID,
      auto_select: false, // Disable auto-select to prevent unwanted overlays
      callback: (response: any) => {
        try {
            // Decode JWT
            const payload = JSON.parse(atob(response.credential.split('.')[1]));
            const user: UserProfile = {
              name: payload.name,
              email: payload.email,
              picture: payload.picture,
              sub: payload.sub
            };
            callback(user);
        } catch (e) {
            console.error("Google Auth Error:", e);
        }
      }
    });
  }
};

export const renderGoogleButton = (elementId: string) => {
  if (window.google) {
    window.google.accounts.id.renderButton(
      document.getElementById(elementId)!,
      { theme: "outline", size: "large", type: "standard" }
    );
  }
};

export const cancelAuth = () => {
    if (window.google) {
        window.google.accounts.id.cancel();
    }
};

// --- CLOUD STORAGE SIMULATION ---
const USER_DATA_KEY = 'kun_khmer_user_data_';

export const saveUserData = (user: UserProfile, inventory: PlayerInventory, profile: PlayerProfile) => {
    try {
        const key = USER_DATA_KEY + user.sub;
        const data = {
            inventory,
            profile,
            lastSave: Date.now()
        };
        localStorage.setItem(key, JSON.stringify(data));
    } catch (e) {
        console.error("Save User Data Error:", e);
    }
};

export const loadUserData = (user: UserProfile): { inventory: PlayerInventory, profile: PlayerProfile } | null => {
    try {
        const key = USER_DATA_KEY + user.sub;
        const stored = localStorage.getItem(key);
        if (stored) {
            return JSON.parse(stored);
        }
    } catch (e) {
        console.error("Load User Data Error:", e);
    }
    return null;
}

// --- LEADERBOARD BACKEND ---

const MOCK_LEADERBOARD_KEY = 'kun_khmer_leaderboard_v2'; 

interface StoredLeaderboardEntry {
    userId?: string; // Unique ID (sub)
    name: string;
    picture?: string;
    winTimestamps: number[];
}

const getStoredLeaderboard = (): StoredLeaderboardEntry[] => {
    try {
        const stored = localStorage.getItem(MOCK_LEADERBOARD_KEY);
        if (stored) {
            return JSON.parse(stored);
        }
    } catch (e) {
        console.error("Leaderboard read error:", e);
    }
    return [];
}

const saveStoredLeaderboard = (data: StoredLeaderboardEntry[]) => {
    try {
        localStorage.setItem(MOCK_LEADERBOARD_KEY, JSON.stringify(data));
    } catch (e) {
        console.error("Leaderboard save error:", e);
    }
}

export const getLeaderboard = (period: LeaderboardPeriod = 'ALL_TIME'): LeaderboardEntry[] => {
  const storedData = getStoredLeaderboard();
  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();

  const leaderboard: LeaderboardEntry[] = storedData.map(entry => {
      let wins = 0;
      if (!entry.winTimestamps) {
           wins = 0;
      } else if (period === 'ALL_TIME') {
          wins = entry.winTimestamps.length;
      } else if (period === 'THIS_SEASON') {
          // Filter for current month
          wins = entry.winTimestamps.filter(ts => {
              const date = new Date(ts);
              return date.getMonth() === currentMonth && date.getFullYear() === currentYear;
          }).length;
      }
      
      return {
          rank: 0, // Calculated below
          name: entry.name,
          wins: wins,
          picture: entry.picture
      };
  });

  // Filter out users with 0 wins for the selected period
  const activeLeaderboard = leaderboard.filter(e => e.wins > 0);

  // Sort by wins desc
  activeLeaderboard.sort((a, b) => b.wins - a.wins);

  // Assign Ranks
  activeLeaderboard.forEach((entry, idx) => entry.rank = idx + 1);

  return activeLeaderboard.slice(0, 50);
};

export const submitScore = (user: UserProfile, winsToAdd: number) => {
    // Note: In this game logic, winsToAdd is usually 1 for a victory.
    if (winsToAdd <= 0) return;

    const storedData = getStoredLeaderboard();
    const now = Date.now();
    
    // Create array of new timestamps
    const newTimestamps = Array(winsToAdd).fill(now);

    // Try to find by unique ID first (more robust), then by name (legacy support)
    let existingIndex = -1;
    if (user.sub) {
        existingIndex = storedData.findIndex(e => e.userId === user.sub);
    }
    
    if (existingIndex === -1) {
        existingIndex = storedData.findIndex(e => e.name === user.name);
    }

    if (existingIndex >= 0) {
        console.log(`Updating score for ${user.name}`);
        // Ensure userId is set for future robustness
        if (!storedData[existingIndex].userId && user.sub) {
            storedData[existingIndex].userId = user.sub;
        }

        storedData[existingIndex].winTimestamps = [
            ...(storedData[existingIndex].winTimestamps || []), // Handle legacy data safety
            ...newTimestamps
        ];
        // Update pic if the user logged in with a new one
        if (user.picture) storedData[existingIndex].picture = user.picture; 
    } else {
        console.log(`Creating new leaderboard entry for ${user.name}`);
        storedData.push({
            userId: user.sub,
            name: user.name,
            picture: user.picture,
            winTimestamps: newTimestamps
        });
    }

    saveStoredLeaderboard(storedData);
};
