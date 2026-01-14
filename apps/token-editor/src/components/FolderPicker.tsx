import { ActionButton } from '@adobe/react-spectrum';
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
    <ActionButton onPress={handlePickFolder} isQuiet aria-label="Open tokens folder">
      <FolderOpen size={14} />
    </ActionButton>
  );
}

