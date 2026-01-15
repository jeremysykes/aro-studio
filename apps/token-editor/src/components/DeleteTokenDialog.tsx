import { useState, useCallback, useMemo } from 'react';
import {
  Dialog,
  DialogTrigger,
  ActionButton,
  Content,
  Heading,
  Flex,
  Text,
  View,
} from '@adobe/react-spectrum';
import { Trash2 } from 'lucide-react';
import type { FlatTokenRow } from '@aro-studio/core';

interface DeleteTokenDialogProps {
  token: FlatTokenRow;
  allTokens: FlatTokenRow[];
  onDelete: () => void;
  isDisabled?: boolean;
}

/**
 * Find all tokens that reference the given token path
 */
function findReferencingTokens(targetPath: string, allTokens: FlatTokenRow[]): FlatTokenRow[] {
  const referencePattern = `{${targetPath}}`;
  return allTokens.filter((token) => {
    if (typeof token.value === 'string') {
      return token.value.includes(referencePattern);
    }
    return false;
  });
}

export function DeleteTokenDialog({ token, allTokens, onDelete, isDisabled }: DeleteTokenDialogProps) {
  const [isOpen, setIsOpen] = useState(false);

  const referencingTokens = useMemo(
    () => findReferencingTokens(token.path, allTokens),
    [token.path, allTokens]
  );

  const hasReferences = referencingTokens.length > 0;

  const handleDelete = useCallback(() => {
    onDelete();
    setIsOpen(false);
  }, [onDelete]);

  const handleOpenChange = useCallback((open: boolean) => {
    setIsOpen(open);
  }, []);

  return (
    <DialogTrigger isOpen={isOpen} onOpenChange={handleOpenChange}>
      <ActionButton
        isQuiet
        aria-label={`Delete ${token.path}`}
        isDisabled={isDisabled}
        UNSAFE_style={{ padding: 4, minWidth: 0 }}
      >
        <Trash2 size={14} />
      </ActionButton>
      <Dialog>
        <Heading>Delete Token</Heading>
        <Content>
          <Flex direction="column" gap="size-200">
            <Text>
              Are you sure you want to delete <strong>{token.path}</strong>?
            </Text>

            {hasReferences && (
              <View
                backgroundColor="negative"
                padding="size-200"
                borderRadius="regular"
              >
                <Flex direction="column" gap="size-100">
                  <Text UNSAFE_style={{ fontWeight: 600, color: 'var(--spectrum-semantic-negative-color-default)' }}>
                    Warning: This token is referenced by {referencingTokens.length} other token(s):
                  </Text>
                  <View maxHeight="size-2000" UNSAFE_style={{ overflowY: 'auto' }}>
                    {referencingTokens.slice(0, 10).map((ref) => (
                      <Text
                        key={ref.path}
                        UNSAFE_style={{ fontSize: 12, display: 'block', marginBottom: 4 }}
                      >
                        • {ref.path}
                      </Text>
                    ))}
                    {referencingTokens.length > 10 && (
                      <Text UNSAFE_style={{ fontSize: 12, fontStyle: 'italic' }}>
                        ... and {referencingTokens.length - 10} more
                      </Text>
                    )}
                  </View>
                  <Text UNSAFE_style={{ fontSize: 12 }}>
                    Deleting this token will break these references.
                  </Text>
                </Flex>
              </View>
            )}

            <Flex gap="size-100" justifyContent="end" marginTop="size-200">
              <ActionButton onPress={() => handleOpenChange(false)} isQuiet>
                Cancel
              </ActionButton>
              <ActionButton
                onPress={handleDelete}
                UNSAFE_style={{
                  backgroundColor: 'var(--spectrum-semantic-negative-color-background)',
                  color: 'white',
                }}
              >
                {hasReferences ? 'Delete Anyway' : 'Delete'}
              </ActionButton>
            </Flex>
          </Flex>
        </Content>
      </Dialog>
    </DialogTrigger>
  );
}
