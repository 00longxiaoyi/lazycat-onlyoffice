import type { OnlyOfficeConfig } from '../../../shared/editor';

declare global {
  interface Window {
    DocsAPI?: {
      DocEditor: new (elementId: string, config: OnlyOfficeConfig) => {
        destroyEditor?: () => void;
      };
    };
  }
}

export {};
