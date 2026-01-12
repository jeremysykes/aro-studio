import { Button } from '@aro-studio/ui';
import { FolderOpen } from 'lucide-react';
import { loadFolderFromPath } from '../utils/folderLoader';

export function FolderPicker() {
  const handlePickFolder = async () => {
    try {
      const selectedFolder = await window.electronAPI.pickDirectory();
      if (!selectedFolder) {
        return;
      }

      await loadFolderFromPath(selectedFolder, { cache: true, mode: 'manual' });
    } catch (error) {
      console.error('Error picking folder:', error);
      alert(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  return (
    <Button
      onClick={handlePickFolder}
      variant="ghost"
      size="icon"
      title="Open Tokens Folder"
      className="h-8 w-8"
    >
      <FolderOpen className="w-4 h-4" />
    </Button>
  );
}

