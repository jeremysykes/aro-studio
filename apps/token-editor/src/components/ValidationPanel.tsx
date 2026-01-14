import { useAppStore } from '../store';
import { AlertCircle, AlertTriangle } from 'lucide-react';
import { View, Heading, Flex, Text } from '@adobe/react-spectrum';

export function ValidationPanel() {
  const { validationIssues } = useAppStore();

  const errors = validationIssues.filter((issue) => issue.severity === 'error');
  const warnings = validationIssues.filter((issue) => issue.severity === 'warning');

  if (validationIssues.length === 0) {
    return (
      <View padding="size-300">
        <Heading level={4}>Validation</Heading>
        <Text>No validation issues</Text>
      </View>
    );
  }

  return (
    <View padding="size-300" UNSAFE_style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      <Heading level={4}>Validation</Heading>

      {errors.length > 0 && (
        <View UNSAFE_style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <Flex alignItems="center" gap="size-100">
            <AlertCircle size={16} color="var(--spectrum-semantic-negative-color-default)" />
            <Text UNSAFE_style={{ color: 'var(--spectrum-semantic-negative-color-default)', fontWeight: 600 }}>
              Errors ({errors.length})
            </Text>
          </Flex>
          {errors.map((issue, index) => (
            <View key={index} padding="size-200" borderRadius="regular" borderWidth="thin" borderColor="negative">
              <Text UNSAFE_style={{ fontFamily: 'monospace', fontSize: 12, color: 'var(--spectrum-global-color-gray-700)' }}>
                {issue.path || '<root>'}
              </Text>
              <Text>{issue.message}</Text>
            </View>
          ))}
        </View>
      )}

      {warnings.length > 0 && (
        <View UNSAFE_style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <Flex alignItems="center" gap="size-100">
            <AlertTriangle size={16} color="var(--spectrum-semantic-caution-color-default)" />
            <Text UNSAFE_style={{ color: 'var(--spectrum-semantic-caution-color-default)', fontWeight: 600 }}>
              Warnings ({warnings.length})
            </Text>
          </Flex>
          {warnings.map((issue, index) => (
            <View key={index} padding="size-200" borderRadius="regular" borderWidth="thin" borderColor="yellow-600">
              <Text UNSAFE_style={{ fontFamily: 'monospace', fontSize: 12, color: 'var(--spectrum-global-color-gray-700)' }}>
                {issue.path || '<root>'}
              </Text>
              <Text>{issue.message}</Text>
            </View>
          ))}
        </View>
      )}
    </View>
  );
}

