import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { View } from 'react-native';
import { ToastProvider } from '../components/Toast';

export default function RootLayout() {
  return (
    <ToastProvider>
      <View style={{ flex: 1, backgroundColor: '#0e1014' }}>
        <StatusBar style="light" />
        <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: '#0e1014' } }} />
      </View>
    </ToastProvider>
  );
}
