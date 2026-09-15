import { Ionicons } from '@expo/vector-icons';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import type { BottomTabBarButtonProps } from '@react-navigation/bottom-tabs';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Pressable, StyleSheet, View } from 'react-native';

import { HomeScreen } from '../screens/HomeScreen';
import { ProfileScreen } from '../screens/ProfileScreen';
import { ReviewScreen } from '../screens/ReviewScreen';
import { StudiesScreen } from '../screens/StudiesScreen';
import { TOQUE_MIN, colors, fontDado, radius, shadow, spacing } from '../theme';
import type { MainTabParamList, RootStackParamList } from './types';

const Tab = createBottomTabNavigator<MainTabParamList>();

const TAMANHO_BOTAO = 56;

/** A aba central nao tem tela propria: o toque e interceptado e abre a camera.
 *  Este componente existe so porque o navegador exige um componente por aba. */
function TelaFantasma() {
  return <View style={styles.fantasma} />;
}

function BotaoCaptura({ onPress }: BottomTabBarButtonProps) {
  return (
    <View style={styles.areaBotao}>
      <Pressable
        onPress={(evento) => onPress?.(evento)}
        accessibilityRole="button"
        accessibilityLabel="Abrir a câmera"
        accessibilityHint="Abre a câmera para capturar o conteúdo da aula"
        style={({ pressed }) => [styles.circulo, pressed && styles.circuloPressionado]}
      >
        <Ionicons name="camera" size={26} color={colors.onPrimary} />
      </Pressable>
    </View>
  );
}

export function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textFaint,
        tabBarStyle: styles.barra,
        tabBarLabelStyle: styles.rotulo,
      }}
    >
      <Tab.Screen
        name="Inicio"
        component={HomeScreen}
        options={{
          title: 'Início',
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons name={focused ? 'home' : 'home-outline'} size={size} color={color} />
          ),
        }}
      />

      <Tab.Screen
        name="Estudos"
        component={StudiesScreen}
        options={{
          title: 'Estudos',
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons name={focused ? 'folder' : 'folder-outline'} size={size} color={color} />
          ),
        }}
      />

      <Tab.Screen
        name="Capturar"
        component={TelaFantasma}
        options={{
          title: '',
          tabBarButton: (props) => <BotaoCaptura {...props} />,
        }}
        listeners={({ navigation }) => ({
          tabPress: (evento) => {
            // Nao e uma aba de verdade: intercepta o toque e abre a camera no stack.
            evento.preventDefault();
            navigation.getParent<NativeStackNavigationProp<RootStackParamList>>()?.navigate('Camera');
          },
        })}
      />

      <Tab.Screen
        name="Revisao"
        component={ReviewScreen}
        options={{
          title: 'Revisão',
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons name={focused ? 'albums' : 'albums-outline'} size={size} color={color} />
          ),
        }}
      />

      <Tab.Screen
        name="Perfil"
        component={ProfileScreen}
        options={{
          title: 'Perfil',
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons name={focused ? 'person' : 'person-outline'} size={size} color={color} />
          ),
        }}
      />
    </Tab.Navigator>
  );
}

const styles = StyleSheet.create({
  barra: {
    backgroundColor: colors.bgElev,
    borderTopWidth: 1,
    borderTopColor: colors.borderSoft,
  },
  rotulo: {
    ...fontDado.rotulo,
    textTransform: 'none',
    letterSpacing: 0,
  },
  fantasma: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  areaBotao: {
    minWidth: TOQUE_MIN,
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  circulo: {
    width: TAMANHO_BOTAO,
    height: TAMANHO_BOTAO,
    borderRadius: radius.pill,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    transform: [{ translateY: -spacing(3) }],
    ...shadow.glow,
  },
  circuloPressionado: {
    backgroundColor: colors.primaryDim,
  },
});
