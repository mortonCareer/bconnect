import { Stack } from 'expo-router'
import { StatusBar } from 'expo-status-bar'

export default function RootLayout() {
  return (
    <>
      <StatusBar style="dark" />
      <Stack
        screenOptions={{
          headerTitleStyle: { fontWeight: '600', fontSize: 16 },
          headerShadowVisible: false,
          headerBackTitle: '',
        }}
      />
    </>
  )
}
