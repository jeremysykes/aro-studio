import { useState, useCallback } from 'react';
import { ActionButton, MenuTrigger, Menu, Item, Text } from '@adobe/react-spectrum';
import FolderOpen from '@spectrum-icons/workflow/FolderOpen';
import Delete from '@spectrum-icons/workflow/Delete';
import Clock from '@spectrum-icons/workflow/Clock';
import { loadFolderFromPath, getRecentFolders, clearRecentFolders } from '../utils/folderLoader';

export function FolderPicker() {
  const [recentFolders, setRecentFolders] = useState<string[]>(() => getRecentFolders());

  const handlePickFolder = useCallback(async () => {
    try {
      const selectedFolder = await window.electronAPI.pickDirectory();
      if (!selectedFolder) {
        return;
      }

      const success = await loadFolderFromPath(selectedFolder, { cache: true, mode: 'manual' });
      if (success) {
        setRecentFolders(getRecentFolders());
      }
    } catch (error) {
      console.error('Error picking folder:', error);
      alert(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }, []);

  const handleOpenRecent = useCallback(async (folderPath: string) => {
    try {
      const success = await loadFolderFromPath(folderPath, { cache: true, mode: 'manual' });
      if (success) {
        setRecentFolders(getRecentFolders());
      }
    } catch (error) {
      console.error('Error opening recent folder:', error);
      alert(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }, []);

  const handleClearRecent = useCallback(() => {
    clearRecentFolders();
    setRecentFolders([]);
  }, []);

  const handleAction = useCallback(
    (key: React.Key) => {
      const keyStr = String(key);
      if (keyStr === 'browse') {
        handlePickFolder();
      } else if (keyStr === 'clear') {
        handleClearRecent();
      } else if (keyStr.startsWith('recent:')) {
        const path = keyStr.slice(7);
        handleOpenRecent(path);
      }
    },
    [handlePickFolder, handleClearRecent, handleOpenRecent]
  );

  // Get folder name from full path for display
  const getFolderName = useCallback((path: string) => {
    const parts = path.split('/');
    return parts[parts.length - 1] || path;
  }, []);

  // Build menu items
  const menuItems = [
    <Item key="browse" textValue="Browse...">
      <FolderOpen size="S" />
      <Text>Browse...</Text>
    </Item>,
    ...recentFolders.map((path) => (
      <Item key={`recent:${path}`} textValue={getFolderName(path)}>
        <Clock size="S" />
        <Text>{getFolderName(path)}</Text>
      </Item>
    )),
    ...(recentFolders.length > 0
      ? [
          <Item key="clear" textValue="Clear Recent">
            <Delete size="S" />
            <Text>Clear Recent</Text>
          </Item>,
        ]
      : []),
  ];

  return (
    <MenuTrigger>
      <ActionButton isQuiet aria-label="Open tokens folder">
        <FolderOpen size="S" />
      </ActionButton>
      <Menu onAction={handleAction}>{menuItems}</Menu>
    </MenuTrigger>
  );
}
