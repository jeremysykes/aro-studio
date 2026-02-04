import type { LoadTokensResult, SaveTokensPayload, SaveTokensResult } from '@aro-studio/core';
/**
 * Electron API exposed to renderer process
 */
export interface ElectronAPI {
    pickDirectory: () => Promise<string | null>;
    discoverTokenRoot: (selectedFolder: string) => Promise<{
        data?: {
            tokensDir: string;
        };
        error?: string;
    }>;
    discoverBusinessUnits: (tokensDir: string) => Promise<{
        data?: unknown[];
        error?: string;
    }>;
    discoverCore: (tokensDir: string) => Promise<{
        data?: unknown[];
        error?: string;
    }>;
    readJson: (path: string) => Promise<{
        data?: unknown;
        error?: string;
    }>;
    writeJson: (path: string, data: unknown) => Promise<{
        success?: boolean;
        error?: string;
    }>;
    readFile: (path: string) => Promise<{
        data?: string;
        error?: string;
    }>;
    listDir: (path: string) => Promise<{
        data?: string[];
        error?: string;
    }>;
    loadTokens: (tokensDir: string, bu: string) => Promise<{
        data?: LoadTokensResult;
        error?: string;
    }>;
    saveTokens: (payload: SaveTokensPayload) => Promise<{
        data?: SaveTokensResult;
        error?: string;
    }>;
}
declare global {
    interface Window {
        electronAPI: ElectronAPI;
    }
}
//# sourceMappingURL=index.d.ts.map