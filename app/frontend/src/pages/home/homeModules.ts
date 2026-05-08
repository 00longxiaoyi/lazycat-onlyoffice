import type { HomeModuleConfig, HomeModuleKey } from './types';

export const HOME_MODULE_STORAGE_KEY = 'onlyoffice.home.modules';

export const DEFAULT_HOME_MODULES: Record<HomeModuleKey, boolean> = {
  drive: true
};

export const HOME_MODULES: HomeModuleConfig[] = [
  { key: 'drive', title: '懒猫网盘', description: '显示当前用户文件、共享文件、外接磁盘和网络挂载。' }
];

export function readEnabledModules(): Record<HomeModuleKey, boolean> {
  try {
    const raw = window.localStorage.getItem(HOME_MODULE_STORAGE_KEY);
    if (!raw) {
      return DEFAULT_HOME_MODULES;
    }

    const parsed = JSON.parse(raw) as Partial<Record<HomeModuleKey, boolean>>;
    return {
      drive: typeof parsed.drive === 'boolean' ? parsed.drive : DEFAULT_HOME_MODULES.drive
    };
  } catch {
    return DEFAULT_HOME_MODULES;
  }
}

export function writeEnabledModules(value: Record<HomeModuleKey, boolean>): void {
  try {
    window.localStorage.setItem(HOME_MODULE_STORAGE_KEY, JSON.stringify(value));
  } catch {
    // localStorage may be unavailable in restricted browser contexts.
  }
}
