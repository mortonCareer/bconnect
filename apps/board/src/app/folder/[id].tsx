import { useCallback, useState } from 'react'
import { Alert, FlatList, Image, Pressable, StyleSheet, Text, View } from 'react-native'
import { Link, Stack, useFocusEffect, useLocalSearchParams } from 'expo-router'
import * as ImagePicker from 'expo-image-picker'
import { colors } from '@/lib/colors'
import {
  type Folder,
  type Photo,
  addPhotoToFolder,
  getFolder,
  getFolders,
  saveFolders,
} from '@/lib/storage'

const DEFAULT_BOARD_ROWS = [
  { label: '공사명', value: '' },
  { label: '내용', value: '' },
  { label: '위치', value: '' },
  { label: '일시', value: new Date().toISOString().slice(0, 10).replace(/-/g, '.') },
]

export default function FolderDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const [folder, setFolder] = useState<Folder | undefined>()

  useFocusEffect(
    useCallback(() => {
      if (id) getFolder(id).then(setFolder)
    }, [id])
  )

  const handlePickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.8,
    })

    if (result.canceled || !result.assets[0]) return

    const uri = result.assets[0].uri

    await addPhotoToFolder(id, {
      uri,
      board: { rows: DEFAULT_BOARD_ROWS },
      boardPosition: 'bottom-left',
    })

    if (id) getFolder(id).then(setFolder)
  }

  const handleTakePhoto = async () => {
    const permission = await ImagePicker.requestCameraPermissionsAsync()
    if (!permission.granted) {
      Alert.alert('권한 필요', '카메라 접근 권한이 필요합니다.')
      return
    }

    const result = await ImagePicker.launchCameraAsync({
      quality: 0.8,
    })

    if (result.canceled || !result.assets[0]) return

    await addPhotoToFolder(id, {
      uri: result.assets[0].uri,
      board: { rows: DEFAULT_BOARD_ROWS },
      boardPosition: 'bottom-left',
    })

    if (id) getFolder(id).then(setFolder)
  }

  const handleDeletePhoto = async (photoId: string) => {
    if (!folder) return
    const folders = await getFolders()
    const target = folders.find((f) => f.id === id)
    if (!target) return
    target.photos = target.photos.filter((p) => p.id !== photoId)
    await saveFolders(folders)
    getFolder(id).then(setFolder)
  }

  if (!folder) {
    return (
      <View style={styles.container}>
        <Text style={styles.emptyText}>폴더를 찾을 수 없습니다.</Text>
      </View>
    )
  }

  return (
    <>
      <Stack.Screen options={{ title: folder.name }} />
      <View style={styles.container}>
        <FlatList
          data={folder.photos}
          keyExtractor={(item) => item.id}
          numColumns={3}
          contentContainerStyle={styles.grid}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Text style={styles.emptyText}>
                사진이 없습니다.{'\n'}아래 버튼으로 사진을 추가하세요.
              </Text>
            </View>
          }
          renderItem={({ item }: { item: Photo }) => (
            <Pressable
              style={styles.photoCell}
              onLongPress={() => {
                Alert.alert('사진 삭제', '이 사진을 삭제할까요?', [
                  { text: '취소', style: 'cancel' },
                  {
                    text: '삭제',
                    style: 'destructive',
                    onPress: () => handleDeletePhoto(item.id),
                  },
                ])
              }}
            >
              <Image source={{ uri: item.uri }} style={styles.photo} />
              <View style={[styles.boardOverlay, boardPositionStyle[item.boardPosition]]}>
                {item.board.rows
                  .filter((r) => r.value)
                  .map((row, i) => (
                    <Text key={i} style={styles.boardText}>
                      {row.label}: {row.value}
                    </Text>
                  ))}
              </View>
            </Pressable>
          )}
        />

        <View style={styles.bottomBar}>
          <Link href={`/board/new?folderId=${id}`} asChild>
            <Pressable style={styles.bottomButtonOutline}>
              <Text style={styles.bottomButtonOutlineText}>📋 보드 작성</Text>
            </Pressable>
          </Link>
          <Pressable style={styles.bottomButton} onPress={handleTakePhoto}>
            <Text style={styles.bottomButtonText}>📷 촬영</Text>
          </Pressable>
          <Pressable style={styles.bottomButton} onPress={handlePickImage}>
            <Text style={styles.bottomButtonText}>🖼 갤러리</Text>
          </Pressable>
        </View>
      </View>
    </>
  )
}

const boardPositionStyle = {
  'top-left': { top: 4, left: 4 },
  'top-right': { top: 4, right: 4 },
  'bottom-left': { bottom: 4, left: 4 },
  'bottom-right': { bottom: 4, right: 4 },
} as const

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.white,
  },
  grid: {
    padding: 2,
    flexGrow: 1,
  },
  photoCell: {
    flex: 1 / 3,
    aspectRatio: 1,
    margin: 2,
    position: 'relative',
  },
  photo: {
    width: '100%',
    height: '100%',
    borderRadius: 4,
  },
  boardOverlay: {
    position: 'absolute',
    backgroundColor: 'rgba(0,0,0,0.6)',
    padding: 3,
    borderRadius: 2,
    maxWidth: '90%',
  },
  boardText: {
    color: colors.white,
    fontSize: 6,
    lineHeight: 9,
  },
  empty: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 120,
  },
  emptyText: {
    fontSize: 14,
    color: colors.gray500,
    textAlign: 'center',
    lineHeight: 22,
  },
  bottomBar: {
    flexDirection: 'row',
    gap: 12,
    padding: 16,
    paddingBottom: 40,
    borderTopWidth: 1,
    borderTopColor: colors.gray300,
  },
  bottomButton: {
    flex: 1,
    backgroundColor: colors.primary,
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
  },
  bottomButtonText: {
    color: colors.white,
    fontSize: 15,
    fontWeight: '600',
  },
  bottomButtonOutline: {
    flex: 1,
    borderWidth: 1.5,
    borderColor: colors.primary,
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
  },
  bottomButtonOutlineText: {
    color: colors.primary,
    fontSize: 15,
    fontWeight: '600',
  },
})
