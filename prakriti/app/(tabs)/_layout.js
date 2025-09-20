import { Tabs } from 'expo-router/tabs';
import { StyleSheet } from 'react-native';

const styles = StyleSheet.create({
  tabBar: { backgroundColor: '#28a745' },
  tabLabel: { color: '#fff' },
});

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: '#fff',
        tabBarStyle: styles.tabBar,
        tabBarLabelStyle: styles.tabLabel,
      }}
    >
      <Tabs.Screen name="index" options={{ title: 'Dashboard' }} />
      <Tabs.Screen name="profile" options={{ title: 'Profile' }} />
      <Tabs.Screen name="leaderboard" options={{ title: 'Leaderboard' }} />
      <Tabs.Screen name="quests/index" options={{ title: 'Quests' }} />
    </Tabs>
  );
}