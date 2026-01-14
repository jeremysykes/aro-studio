import { Flex, View } from '@adobe/react-spectrum';
import type { ReactNode } from 'react';

interface ChromeBarProps {
  left?: ReactNode;
  center?: ReactNode;
  right?: ReactNode;
}

export function ChromeBar({ left, center, right }: ChromeBarProps) {
  return (
    <View
      paddingX="size-200"
      paddingY="size-150"
      borderBottomWidth="thin"
      borderColor="gray-300"
      backgroundColor="gray-50"
    >
      <Flex alignItems="center" justifyContent="space-between" gap="size-200">
        <Flex alignItems="center" gap="size-150" flex="1 1 0" UNSAFE_style={{ minWidth: 0 }}>
          {left}
        </Flex>
        <Flex
          alignItems="center"
          gap="size-150"
          flex="1 1 0"
          justifyContent="center"
          UNSAFE_style={{ minWidth: 0 }}
        >
          {center}
        </Flex>
        <Flex
          alignItems="center"
          gap="size-150"
          flex="1 1 0"
          justifyContent="end"
          UNSAFE_style={{ minWidth: 0 }}
        >
          {right}
        </Flex>
      </Flex>
    </View>
  );
}

interface ChromeStatusProps {
  left?: ReactNode;
  right?: ReactNode;
}

export function ChromeStatus({ left, right }: ChromeStatusProps) {
  return (
    <View
      paddingX="size-200"
      paddingY="size-150"
      borderTopWidth="thin"
      borderColor="gray-300"
      backgroundColor="gray-50"
    >
      <Flex alignItems="center" justifyContent="space-between" gap="size-200" UNSAFE_style={{ fontSize: 11 }}>
        <View UNSAFE_style={{ minWidth: 0 }}>{left}</View>
        <View UNSAFE_style={{ minWidth: 0, textAlign: 'right' }}>{right}</View>
      </Flex>
    </View>
  );
}
