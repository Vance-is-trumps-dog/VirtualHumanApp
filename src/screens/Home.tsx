/**
 * 首页 - 虚拟人列表
 */

import React, { useEffect } from 'react';
import {
  View,
  FlatList,
  StyleSheet,
  SafeAreaView,
} from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '@navigation/RootNavigator';
import { useVirtualHumanStore } from '@store';
import { VirtualHumanCard, EmptyState, Loading, Button } from '@components';
import { Colors, Spacing } from '@constants';
import { VirtualHuman } from '@types';

type HomeScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Main'>;

interface HomeScreenProps {
  navigation: HomeScreenNavigationProp;
}

export const HomeScreen: React.FC<HomeScreenProps> = ({ navigation }) => {
  const {
    virtualHumans,
    loading,
    loadVirtualHumans,
  } = useVirtualHumanStore();

  useEffect(() => {
    loadVirtualHumans();
  }, []);

  const handleCreateNew = () => {
    navigation.navigate('CreateVirtualHuman');
  };

  const handleCardPress = (virtualHuman: VirtualHuman) => {
    navigation.navigate('Chat', { virtualHumanId: virtualHuman.id });
  };

  const handleCardLongPress = (virtualHuman: VirtualHuman) => {
    navigation.navigate('VirtualHumanDetail', { virtualHumanId: virtualHuman.id });
  };

  if (loading && virtualHumans.length === 0) {
    return <Loading fullScreen message="加载中..." />;
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* 头部按钮 */}
      <View style={styles.header}>
        <Button
          title="+ 新建虚拟人"
          onPress={handleCreateNew}
          variant="primary"
          fullWidth
        />
      </View>

      {/* 虚拟人列表 */}
      {virtualHumans.length === 0 ? (
        <EmptyState
          title="还没有虚拟人"
          message="创建你的第一个虚拟人，开始有趣的对话吧！"
          actionTitle="立即创建"
          onAction={handleCreateNew}
        />
      ) : (
        <FlatList
          data={virtualHumans}
          keyExtractor={item => item.id}
          renderItem={({ item }) => (
            <VirtualHumanCard
              virtualHuman={item}
              onPress={() => handleCardPress(item)}
              onLongPress={() => handleCardLongPress(item)}
            />
          )}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },

  header: {
    padding: Spacing.md,
    backgroundColor: Colors.light.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.border,
  },

  list: {
    padding: Spacing.md,
  },
});

export default HomeScreen;
