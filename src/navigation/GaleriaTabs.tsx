import { Ionicons } from '@expo/vector-icons';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { StyleSheet } from 'react-native';

import { PhotosScreen } from '../screens/PhotosScreen';
import { StudiesScreen } from '../screens/StudiesScreen';
import { colors, fontDado } from '../theme';
import type { GaleriaTabParamList } from './types';

const Tab = createBottomTabNavigator<GaleriaTabParamList>();

/**
 * A galeria do aparelho, aberta pela miniatura da camera.
 *
 * Ate a Sprint 4 aqui havia um aplicativo de cinco abas (Inicio, Estudos,
 * captura, Revisao e Perfil), exatamente a cara de "app para baixar" que o
 * DESIGN.md proibe. O Flow mora em lugares que o aparelho ja tem: a captura na
 * camera, as aulas na galeria, ao lado das fotos, e os ajustes na engrenagem da
 * camera. As duas abas deixam o contraste do pitch a um toque de distancia: a
 * mesma foto que em Fotos e so mais uma, em Aulas ja esta na materia certa.
 */
export function GaleriaTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primaryHi,
        tabBarInactiveTintColor: colors.textFaint,
        tabBarStyle: styles.barra,
        tabBarLabelStyle: styles.rotulo,
      }}
    >
      <Tab.Screen
        name="Fotos"
        component={PhotosScreen}
        options={{
          title: 'Fotos',
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons name={focused ? 'images' : 'images-outline'} size={size} color={color} />
          ),
        }}
      />

      <Tab.Screen
        name="Aulas"
        component={StudiesScreen}
        options={{
          title: 'Aulas',
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons name={focused ? 'school' : 'school-outline'} size={size} color={color} />
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
});
