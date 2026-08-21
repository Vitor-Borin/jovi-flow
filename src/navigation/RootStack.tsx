import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { ActionsScreen } from '../screens/ActionsScreen';
import { CameraScreen } from '../screens/CameraScreen';
import { IdentifiedScreen } from '../screens/IdentifiedScreen';
import { OrganizeScreen } from '../screens/OrganizeScreen';
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
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.bg },
      }}
    >
      <Stack.Screen name="Tabs" component={MainTabs} />

      {/* gestureEnabled desligado nestas duas: um swipe acidental no meio do
          pitch quebraria a demonstracao da captura. */}
      <Stack.Screen
        name="Camera"
        component={CameraScreen}
        options={{ animation: 'fade', gestureEnabled: false }}
      />
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
    </Stack.Navigator>
  );
}
