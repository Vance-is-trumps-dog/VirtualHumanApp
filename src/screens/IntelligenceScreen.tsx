/**
 * 智能功能界面
 * 显示记忆、情感分析、对话统计等
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Colors, Spacing, FontSizes, BorderRadius } from '../constants';
import IntelligentConversationManager from '../services/IntelligentConversationManager';
import MemoryManagementService from '../services/MemoryManagementService';

interface IntelligenceScreenProps {
  virtualHumanId: string;
}

export const IntelligenceScreen: React.FC<IntelligenceScreenProps> = ({
  virtualHumanId,
}) => {
  const [loading, setLoading] = useState(true);
  const [analytics, setAnalytics] = useState<any>(null);
  const [summary, setSummary] = useState<string>('');
  const [suggestions, setSuggestions] = useState<string[]>([]);

  useEffect(() => {
    loadData();
  }, [virtualHumanId]);

  const loadData = async () => {
    try {
      setLoading(true);

      // 加载分析数据
      const analyticsData = await IntelligentConversationManager.getConversationAnalytics(
        virtualHumanId
      );
      setAnalytics(analyticsData);

      // 加载对话总结
      const summaryText = await IntelligentConversationManager.generateConversationSummary(
        virtualHumanId
      );
      setSummary(summaryText);

      // 加载建议
      const suggestionsData = await IntelligentConversationManager.getPersonalizationSuggestions(
        virtualHumanId
      );
      setSuggestions(suggestionsData);

    } catch (error) {
      console.error('Failed to load intelligence data:', error);
      Alert.alert('错误', '加载数据失败');
    } finally {
      setLoading(false);
    }
  };

  const handleMemoryMaintenance = async () => {
    Alert.alert(
      '记忆整理',
      '这将合并相似的记忆并清理过时信息，是否继续？',
      [
        { text: '取消', style: 'cancel' },
        {
          text: '确定',
          onPress: async () => {
            try {
              const result = await IntelligentConversationManager.performMemoryMaintenance(
                virtualHumanId
              );
              Alert.alert(
                '完成',
                `已合并 ${result.consolidated} 条记忆\n已清理 ${result.forgotten} 条过时记忆`
              );
              loadData();
            } catch (error) {
              Alert.alert('错误', '记忆整理失败');
            }
          },
        },
      ]
    );
  };

  // 辅助方法
  const getCategoryName = (category: string): string => {
    const names: Record<string, string> = {
      basic_info: '基本信息',
      preferences: '偏好',
      experiences: '经历',
      relationships: '关系',
      other: '其他',
    };
    return names[category] || category;
  };

  const getEmotionName = (emotion: string): string => {
    const names: Record<string, string> = {
      neutral: '平静',
      happy: '开心',
      sad: '难过',
      angry: '生气',
      surprised: '惊讶',
      thinking: '思考',
      excited: '兴奋',
    };
    return names[emotion] || emotion;
  };

  const getTrendText = (trend: string): string => {
    const texts: Record<string, string> = {
      improving: '📈 向好',
      declining: '📉 下降',
      stable: '➡️ 稳定',
    };
    return texts[trend] || trend;
  };

  const getTrendColor = (trend: string): string => {
    const colors: Record<string, string> = {
      improving: Colors.light.success,
      declining: Colors.light.error,
      stable: Colors.light.text,
    };
    return colors[trend] || Colors.light.text;
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.light.primary} />
        <Text style={styles.loadingText}>加载中...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* 对话总结 */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>📊 对话总结</Text>
        <Text style={styles.summaryText}>{summary}</Text>
      </View>

      {/* 上下文统计 */}
      {analytics?.context && (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>💬 对话统计</Text>
          <View style={styles.statRow}>
            <Text style={styles.statLabel}>总消息数：</Text>
            <Text style={styles.statValue}>{analytics.context.totalMessages}</Text>
          </View>
          <View style={styles.statRow}>
            <Text style={styles.statLabel}>用户消息：</Text>
            <Text style={styles.statValue}>{analytics.context.userMessages}</Text>
          </View>
          <View style={styles.statRow}>
            <Text style={styles.statLabel}>AI消息：</Text>
            <Text style={styles.statValue}>{analytics.context.aiMessages}</Text>
          </View>
          <View style={styles.statRow}>
            <Text style={styles.statLabel}>平均长度：</Text>
            <Text style={styles.statValue}>
              {analytics.context.averageMessageLength} 字符
            </Text>
          </View>
          <View style={styles.statRow}>
            <Text style={styles.statLabel}>Token总计：</Text>
            <Text style={styles.statValue}>
              {analytics.context.estimatedTotalTokens}
            </Text>
          </View>
        </View>
      )}

      {/* 记忆统计 */}
      {analytics?.memory && (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>🧠 记忆统计</Text>
          <View style={styles.statRow}>
            <Text style={styles.statLabel}>总记忆数：</Text>
            <Text style={styles.statValue}>{analytics.memory.total}</Text>
          </View>
          <View style={styles.statRow}>
            <Text style={styles.statLabel}>平均重要性：</Text>
            <Text style={styles.statValue}>
              {analytics.memory.averageImportance.toFixed(1)} / 5
            </Text>
          </View>

          {analytics.memory.total > 0 && (
            <>
              <Text style={styles.subTitle}>按类别：</Text>
              {Object.entries(analytics.memory.byCategory).map(([category, count]) => (
                <View key={category} style={styles.categoryRow}>
                  <Text style={styles.categoryLabel}>{getCategoryName(category as any)}：</Text>
                  <Text style={styles.categoryValue}>{count as number}</Text>
                </View>
              ))}

              <TouchableOpacity
                style={styles.maintenanceButton}
                onPress={handleMemoryMaintenance}
              >
                <Text style={styles.maintenanceButtonText}>🔧 记忆整理</Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      )}

      {/* 情感趋势 */}
      {analytics?.emotionTrend && (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>😊 情感分析</Text>
          <View style={styles.statRow}>
            <Text style={styles.statLabel}>主导情绪：</Text>
            <Text style={styles.statValue}>
              {getEmotionName(analytics.emotionTrend.dominantEmotion)}
            </Text>
          </View>
          <View style={styles.statRow}>
            <Text style={styles.statLabel}>情绪稳定度：</Text>
            <Text style={styles.statValue}>
              {(analytics.emotionTrend.moodStability * 100).toFixed(0)}%
            </Text>
          </View>
          <View style={styles.statRow}>
            <Text style={styles.statLabel}>趋势：</Text>
            <Text style={[
              styles.statValue,
              { color: getTrendColor(analytics.emotionTrend.trend) }
            ]}>
              {getTrendText(analytics.emotionTrend.trend)}
            </Text>
          </View>
        </View>
      )}

      {/* 个性化建议 */}
      {suggestions.length > 0 && (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>💡 建议</Text>
          {suggestions.map((suggestion, index) => (
            <View key={index} style={styles.suggestionItem}>
              <Text style={styles.suggestionText}>• {suggestion}</Text>
            </View>
          ))}
        </View>
      )}

      <View style={styles.bottomSpacer} />
    </ScrollView>
  );

};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },

  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.light.background,
  },

  loadingText: {
    marginTop: Spacing.md,
    fontSize: FontSizes.md,
    color: Colors.light.textSecondary,
  },

  card: {
    backgroundColor: Colors.light.surface,
    marginHorizontal: Spacing.md,
    marginTop: Spacing.md,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },

  cardTitle: {
    fontSize: FontSizes.lg,
    fontWeight: 'bold',
    color: Colors.light.text,
    marginBottom: Spacing.md,
  },

  summaryText: {
    fontSize: FontSizes.sm,
    color: Colors.light.text,
    lineHeight: 20,
  },

  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: Spacing.sm,
  },

  statLabel: {
    fontSize: FontSizes.sm,
    color: Colors.light.textSecondary,
  },

  statValue: {
    fontSize: FontSizes.sm,
    color: Colors.light.text,
    fontWeight: '600',
  },

  subTitle: {
    fontSize: FontSizes.md,
    fontWeight: '600',
    color: Colors.light.text,
    marginTop: Spacing.md,
    marginBottom: Spacing.sm,
  },

  categoryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingLeft: Spacing.md,
    marginBottom: Spacing.xs,
  },

  categoryLabel: {
    fontSize: FontSizes.sm,
    color: Colors.light.textSecondary,
  },

  categoryValue: {
    fontSize: FontSizes.sm,
    color: Colors.light.text,
  },

  maintenanceButton: {
    marginTop: Spacing.md,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    backgroundColor: Colors.light.primary,
    borderRadius: BorderRadius.sm,
    alignItems: 'center',
  },

  maintenanceButtonText: {
    fontSize: FontSizes.sm,
    color: '#fff',
    fontWeight: '600',
  },

  suggestionItem: {
    marginBottom: Spacing.sm,
  },

  suggestionText: {
    fontSize: FontSizes.sm,
    color: Colors.light.text,
    lineHeight: 20,
  },

  bottomSpacer: {
    height: Spacing.xl,
  },
});

export default IntelligenceScreen;
