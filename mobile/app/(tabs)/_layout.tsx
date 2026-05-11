import { Tabs } from 'expo-router';
import { T } from '../../styles/tokens';
import { View, Text } from 'react-native';

function TabIcon({ name, focused }: { name: string; focused: boolean }) {
  const color = focused ? T.accent : T.faint;
  const icons: Record<string, string> = { index: '↓', convert: '⇄', history: '⏱' };
  return <Text style={{ fontSize: 18, color }}>{icons[name]}</Text>;
}

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: T.panel,
          borderTopColor: T.border,
          borderTopWidth: 0.5,
          height: 60,
          paddingBottom: 8,
        },
        tabBarActiveTintColor: T.accent,
        tabBarInactiveTintColor: T.faint,
        tabBarLabelStyle: { fontSize: 10, fontWeight: '600', letterSpacing: 0.5 },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'YouTube',
          tabBarIcon: ({ focused }) => <TabIcon name="index" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="convert"
        options={{
          title: 'Convert',
          tabBarIcon: ({ focused }) => <TabIcon name="convert" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="history"
        options={{
          title: 'History',
          tabBarIcon: ({ focused }) => <TabIcon name="history" focused={focused} />,
        }}
      />
    </Tabs>
  );
}
