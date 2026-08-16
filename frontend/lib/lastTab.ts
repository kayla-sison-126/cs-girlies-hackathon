// lib/lastTab.ts
let lastActiveTab = '/(tabs)/goals';

export const setLastTab = (path: string) => {
  if (path && !path.includes('camera')) {
    lastActiveTab = path;
  }
};

export const getLastTab = () => lastActiveTab;