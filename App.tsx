import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';

import { colors, font, spacing } from './src/theme';

// A navegacao raiz entra aqui na Fase 3. Ate la, tela minima so para o app abrir.
export default function App() {
  return (
    <SafeAreaProvider>
      <SafeAreaView style={styles.area}>
        <View style={styles.centro}>
          <Text style={styles.titulo}>JOVI Flow</Text>
          <Text style={styles.subtitulo}>Fundacao visual pronta</Text>
        </View>
        <StatusBar style="light" />
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  area: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  centro: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  titulo: {
    ...font.h1,
    color: colors.text,
  },
  subtitulo: {
    ...font.small,
    color: colors.textDim,
    marginTop: spacing(2),
  },
});
