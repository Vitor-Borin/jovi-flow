import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { ActionsScreen } from '../screens/ActionsScreen';
import { CameraScreen } from '../screens/CameraScreen';
import { FeasibilityScreen } from '../screens/FeasibilityScreen';
import { IdentifiedScreen } from '../screens/IdentifiedScreen';
import { LessonScreen } from '../screens/LessonScreen';
import { OrganizeScreen } from '../screens/OrganizeScreen';
import { PlatformsScreen } from '../screens/PlatformsScreen';
import { ProcessingScreen } from '../screens/ProcessingScreen';
import { QuestionsScreen } from '../screens/QuestionsScreen';
import { SummaryScreen } from '../screens/SummaryScreen';
import { colors } from '../theme';
import { MainTabs } from './MainTabs';
import type { RootStackParamList } from './types';

const Stack = createNativeStackNavigator<RootStackParamList>();

export function RootStack() {
  return (
    <Stack.Navigator
      // O Flow e uma funcionalidade da camera do aparelho, e nao um aplicativo
      // de loja. Por isso o app abre no visor: a primeira tela precisa sustentar
      // a tese do projeto, em vez de depender de explicacao verbal.
      initialRouteName="Camera"
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.bg },
      }}
    >
      {/* gestureEnabled desligado aqui e em Processing: um swipe acidental no
          meio do pitch quebraria a demonstracao da captura. */}
      <Stack.Screen
        name="Camera"
        component={CameraScreen}
        options={{ animation: 'fade', gestureEnabled: false }}
      />

      <Stack.Screen name="Tabs" component={MainTabs} options={{ animation: 'slide_from_right' }} />
      <Stack.Screen
        name="Processing"
        component={ProcessingScreen}
        options={{ animation: 'fade', gestureEnabled: false }}
      />

      <Stack.Screen
        name="Identified"
        component={IdentifiedScreen}
        options={{ animation: 'slide_from_right' }}
      />
      <Stack.Screen
        name="Organize"
        component={OrganizeScreen}
        options={{ animation: 'slide_from_right' }}
      />
      <Stack.Screen
        name="Actions"
        component={ActionsScreen}
        options={{ animation: 'slide_from_bottom' }}
      />
      <Stack.Screen
        name="Summary"
        component={SummaryScreen}
        options={{ animation: 'slide_from_right' }}
      />
      <Stack.Screen
        name="Questions"
        component={QuestionsScreen}
        options={{ animation: 'slide_from_right' }}
      />
      <Stack.Screen name="Aula" component={LessonScreen} options={{ animation: 'slide_from_right' }} />
      <Stack.Screen
        name="Feasibility"
        component={FeasibilityScreen}
        options={{ animation: 'slide_from_right' }}
      />
      <Stack.Screen
        name="Platforms"
        component={PlatformsScreen}
        options={{ animation: 'slide_from_right' }}
      />
    </Stack.Navigator>
  );
}
