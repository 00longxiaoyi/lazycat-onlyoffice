export type HomeView = 'home' | 'recent' | 'favorites' | 'online' | 'fonts';
export type HomeModuleKey = 'drive';

export type HomeModuleConfig = {
  key: HomeModuleKey;
  title: string;
  description: string;
};
