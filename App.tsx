import { DarkTheme, NavigationContainer } from '@react-navigation/native';
import type { Theme } from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { RootStack } from './src/navigation/RootStack';
import { FlowProvider } from './src/store/FlowContext';
import { colors } from './src/theme';

// Tema do navegador alinhado ao theme do app: evita o flash branco entre telas.
const temaNavegacao: Theme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    background: colors.bg,
    card: colors.bgElev,
    border: colors.borderSoft,
    primary: colors.primary,
    text: colors.text,
    notification: colors.danger,
  },
};

export default function App() {
  return (
    <SafeAreaProvider>
      <FlowProvider>
        <NavigationContainer theme={temaNavegacao}>
          <RootStack />
        </NavigationContainer>
        <StatusBar style="light" />
      </FlowProvider>
    </SafeAreaProvider>
  );
}
