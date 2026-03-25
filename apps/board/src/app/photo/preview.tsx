import { useState } from 'react'
import {
  Alert,
  Dimensions,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native'
import { Stack, useLocalSearchParams, useRouter } from 'expo-router'
import * as MediaLibrary from 'expo-media-library'
import { colors } from '@/lib/colors'
import { type BoardPosition, type BoardRow, addPhotoToFolder } from '@/lib/storage'

const POSITIONS: { key: BoardPosition; label: string }[] = [
  { key: 'top-left', label: '↖' },
  { key: 'top-right', label: '↗' },
  { key: 'bottom-left', label: '↙' },
  { key: 'bottom-right', label: '↘' },
]

const { width: SCREEN_WIDTH } = Dimensions.get('window')
const IMAGE_SIZE = SCREEN_WIDTH - 32

export default function PhotoPreviewScreen() {
  const { uri, folderId, boardRows } = useLocalSearchParams<{
    uri: string
    folderId: string
    boardRows: string
  }>()
  const router = useRouter()
  const [position, setPosition] = useState<BoardPosition>('bottom-left')

  const rows: BoardRow[] = boardRows ? JSON.parse(boardRows) : []
  const filledRows = rows.filter((r) => r.value.trim())

  const handleSave = async () => {
    if (!uri || !folderId) return

    await addPhotoToFolder(folderId, {
      uri,
      board: { rows },
      boardPosition: position,
    })

    const { status } = await MediaLibrary.requestPermissionsAsync()
    if (status === 'granted') {
      try {
        await MediaLibrary.saveToLibraryAsync(uri)
      } catch {
        // 저장 실패해도 앱 내 데이터는 유지
      }
    }

    Alert.alert('저장 완료', '사진이 저장되었습니다.', [
      { text: '확인', onPress: () => router.dismissAll() },
    ])
  }

  return (
    <>
      <Stack.Screen
        options={{
          title: '사진 미리보기',
          headerRight: () => (
            <Pressable onPress={handleSave}>
              <Text style={styles.headerAction}>완료</Text>
            </Pressable>
          ),
        }}
      />
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <View style={styles.imageContainer}>
          {uri ? (
            <Image source={{ uri }} style={styles.image} resizeMode="contain" />
          ) : (
            <View style={[styles.image, styles.placeholder]}>
              <Text style={styles.placeholderText}>이미지</Text>
            </View>
          )}

          {filledRows.length > 0 && (
            <View style={[styles.boardOverlay, overlayPositionStyle[position]]}>
              {filledRows.map((row, i) => (
                <Text key={i} style={styles.boardText}>
                  {row.label}: {row.value}
                </Text>
              ))}
            </View>
          )}
        </View>

        <Text style={styles.sectionTitle}>보드 위치</Text>
        <View style={styles.positionRow}>
          {POSITIONS.map((p) => (
            <Pressable
              key={p.key}
              style={[styles.positionButton, position === p.key && styles.positionButtonActive]}
              onPress={() => setPosition(p.key)}
            >
              <Text
                style={[styles.positionLabel, position === p.key && styles.positionLabelActive]}
              >
                {p.label}
              </Text>
            </Pressable>
          ))}
        </View>

        <Text style={styles.sectionTitle}>보드 내용</Text>
        <View style={styles.boardPreview}>
          {rows.map((row, i) => (
            <View key={i} style={styles.boardPreviewRow}>
              <Text style={styles.boardPreviewLabel}>{row.label}</Text>
              <Text style={styles.boardPreviewValue}>{row.value || '-'}</Text>
            </View>
          ))}
        </View>
      </ScrollView>
    </>
  )
}

const overlayPositionStyle = {
  'top-left': { top: 8, left: 8 },
  'top-right': { top: 8, right: 8 },
  'bottom-left': { bottom: 8, left: 8 },
  'bottom-right': { bottom: 8, right: 8 },
} as const

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.white,
  },
  content: {
    padding: 16,
    paddingBottom: 60,
  },
  headerAction: {
    color: colors.primary,
    fontSize: 16,
    fontWeight: '600',
  },
  imageContainer: {
    width: IMAGE_SIZE,
    height: IMAGE_SIZE * 0.75,
    backgroundColor: colors.gray100,
    borderRadius: 8,
    overflow: 'hidden',
    position: 'relative',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  placeholder: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.gray300,
  },
  placeholderText: {
    color: colors.gray700,
    fontSize: 16,
  },
  boardOverlay: {
    position: 'absolute',
    backgroundColor: 'rgba(0,0,0,0.7)',
    padding: 8,
    borderRadius: 4,
    maxWidth: '60%',
  },
  boardText: {
    color: colors.white,
    fontSize: 10,
    lineHeight: 15,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.gray900,
    marginTop: 24,
    marginBottom: 12,
  },
  positionRow: {
    flexDirection: 'row',
    gap: 8,
  },
  positionButton: {
    flex: 1,
    height: 40,
    backgroundColor: colors.gray100,
    borderRadius: 4,
    justifyContent: 'center',
    alignItems: 'center',
  },
  positionButtonActive: {
    backgroundColor: colors.primary,
  },
  positionLabel: {
    fontSize: 18,
    color: colors.gray700,
  },
  positionLabelActive: {
    color: colors.white,
  },
  boardPreview: {
    borderTopWidth: 1,
    borderTopColor: colors.gray300,
  },
  boardPreviewRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: colors.gray300,
    minHeight: 44,
  },
  boardPreviewLabel: {
    width: 72,
    backgroundColor: colors.gray100,
    borderRightWidth: 1,
    borderRightColor: colors.gray300,
    justifyContent: 'center',
    padding: 12,
    fontSize: 13,
    fontWeight: '500',
    color: colors.gray700,
    textAlignVertical: 'center',
  },
  boardPreviewValue: {
    flex: 1,
    padding: 12,
    fontSize: 14,
    color: colors.gray900,
    textAlignVertical: 'center',
  },
})
