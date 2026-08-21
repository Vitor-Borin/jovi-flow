import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View } from 'react-native';

// Esqueleto da Fase 0: valida apenas que o app abre no Expo Go com o fundo escuro.
// As cores passam a vir de src/theme.ts na Fase 1.
export default function App() {
  return (
    <View style={styles.container}>
      <Text style={styles.titulo}>JOVI Flow</Text>
      <Text style={styles.subtitulo}>Fase 0 — ambiente pronto</Text>
      <StatusBar style="light" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0B0F0D',
    alignItems: 'center',
    justifyContent: 'center',
  },
  titulo: {
    color: '#F1F5F3',
    fontSize: 26,
    fontWeight: '700',
    letterSpacing: -0.5,
  },
  subtitulo: {
    color: '#93A29B',
    fontSize: 14,
    marginTop: 8,
  },
});
