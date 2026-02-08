/**
 * 导航配置
 */

import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Text } from 'react-native';

// 屏幕导入
import HomeScreen from '@screens/Home';
import CreateVirtualHumanScreen from '@screens/CreateVirtualHuman';
import CreateVirtualHumanAdvancedScreen from '@screens/CreateVirtualHumanAdvanced';
import ChatScreen from '@screens/Chat';
import VoiceChatScreen from '@screens/VoiceChat';
import VideoChatScreen from '@screens/VideoChat';
import SettingsScreen from '@screens/SettingsScreen';
import VirtualHumanDetailScreen from '@screens/VirtualHumanDetail';
import IntelligenceScreen from '@screens/IntelligenceScreen';
import DataManagementScreen from '@screens/DataManagementScreen';

// 类型定义
export type RootStackParamList = {
  Main: undefined;
  CreateVirtualHuman: undefined;
  CreateVirtualHumanAdvanced: undefined;
  Chat: { virtualHumanId: string };
  VoiceChat: { virtualHumanId: string };
  VideoChat: { virtualHumanId: string };
  VirtualHumanDetail: { virtualHumanId: string };
  Intelligence: { virtualHumanId: string };
  DataManagement: { virtualHumanId?: string };
};

export type MainTabParamList = {
  Home: undefined;
  Settings: undefined;
};

const Stack = createStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator<MainTabParamList>();

/**
 * 底部Tab导航
 */
function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: true,
        tabBarActiveTintColor: '#6200EE',
        tabBarInactiveTintColor: '#757575',
        headerStyle: {
          backgroundColor: '#6200EE',
        },
        headerTintColor: '#fff',
        headerTitleStyle: {
          fontWeight: 'bold',
        },
      }}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{
          title: '虚拟人',
          tabBarLabel: '首页',
          tabBarIcon: ({ color }) => (
            <Text style={{ fontSize: 24, color }}>🏠</Text>
          ),
        }}
      />
      <Tab.Screen
        name="Settings"
        component={SettingsScreen}
        options={{
          title: '设置',
          tabBarLabel: '设置',
          tabBarIcon: ({ color }) => (
            <Text style={{ fontSize: 24, color }}>⚙️</Text>
          ),
        }}
      />
    </Tab.Navigator>
  );
}

/**
 * 根导航
 */
export function RootNavigator() {
  return (
    <NavigationContainer>
      <Stack.Navigator
        screenOptions={{
          headerStyle: {
            backgroundColor: '#6200EE',
          },
          headerTintColor: '#fff',
          headerTitleStyle: {
            fontWeight: 'bold',
          },
        }}
      >
        <Stack.Screen
          name="Main"
          component={MainTabs}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="CreateVirtualHuman"
          component={CreateVirtualHumanScreen}
          options={{ title: '快速创建' }}
        />
        <Stack.Screen
          name="CreateVirtualHumanAdvanced"
          component={CreateVirtualHumanAdvancedScreen}
          options={{ title: '高级创建' }}
        />
        <Stack.Screen
          name="Chat"
          component={ChatScreen}
          options={({ route }) => ({
            title: '对话',
            headerBackTitle: '返回'
          })}
        />
        <Stack.Screen
          name="VoiceChat"
          component={VoiceChatScreen}
          options={{ title: '语音对话' }}
        />
        <Stack.Screen
          name="VideoChat"
          component={VideoChatScreen}
          options={{ title: '视频对话' }}
        />
        <Stack.Screen
          name="VirtualHumanDetail"
          component={VirtualHumanDetailScreen}
          options={{ title: '详情' }}
        />
        <Stack.Screen
          name="Intelligence"
          component={IntelligenceScreen}
          options={{ title: '智能分析' }}
        />
        <Stack.Screen
          name="DataManagement"
          component={DataManagementScreen}
          options={{ title: '数据管理' }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
