import { useCallback, useState } from 'react'
import { Alert, FlatList, Pressable, StyleSheet, Text, TextInput, View } from 'react-native'
import { Link, Stack, useFocusEffect } from 'expo-router'
import { colors } from '@/lib/colors'
import { type Folder, addFolder, deleteFolder, getFolders } from '@/lib/storage'

export default function FolderListScreen() {
  const [folders, setFolders] = useState<Folder[]>([])
  const [showInput, setShowInput] = useState(false)
  const [newName, setNewName] = useState('')
  const [search, setSearch] = useState('')

  useFocusEffect(
    useCallback(() => {
      getFolders().then(setFolders)
    }, [])
  )

  const filtered = folders.filter((f) => f.name.toLowerCase().includes(search.toLowerCase()))

  const handleAdd = async () => {
    if (!newName.trim()) return
    await addFolder(newName.trim())
    setNewName('')
    setShowInput(false)
    getFolders().then(setFolders)
  }

  const handleDelete = (folder: Folder) => {
    Alert.alert('폴더 삭제', `"${folder.name}"을(를) 삭제할까요?`, [
      { text: '취소', style: 'cancel' },
      {
        text: '삭제',
        style: 'destructive',
        onPress: async () => {
          await deleteFolder(folder.id)
          getFolders().then(setFolders)
        },
      },
    ])
  }

  return (
    <>
      <Stack.Screen options={{ title: '품앗이' }} />
      <View style={styles.container}>
        <TextInput
          style={styles.searchInput}
          placeholder="폴더 또는 이미지명 검색"
          placeholderTextColor={colors.gray500}
          value={search}
          onChangeText={setSearch}
        />

        {showInput && (
          <View style={styles.addRow}>
            <TextInput
              style={styles.addInput}
              placeholder="폴더 이름 입력"
              placeholderTextColor={colors.gray500}
              value={newName}
              onChangeText={setNewName}
              onSubmitEditing={handleAdd}
              autoFocus
            />
            <Pressable style={styles.addButton} onPress={handleAdd}>
              <Text style={styles.addButtonText}>추가</Text>
            </Pressable>
          </View>
        )}

        <FlatList
          data={filtered}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Text style={styles.emptyText}>
                폴더가 없습니다.{'\n'}아래 버튼으로 새 폴더를 만들어보세요.
              </Text>
            </View>
          }
          renderItem={({ item }) => (
            <Link href={`/folder/${item.id}`} asChild>
              <Pressable style={styles.folderRow}>
                <View style={styles.folderInfo}>
                  <Text style={styles.folderIcon}>📁</Text>
                  <Text style={styles.folderName}>{item.name}</Text>
                </View>
                <View style={styles.folderMeta}>
                  <Text style={styles.folderDate}>
                    {item.createdAt.slice(0, 10).replace(/-/g, '.')}
                  </Text>
                  <Pressable onPress={() => handleDelete(item)} hitSlop={8}>
                    <Text style={styles.moreIcon}>⋮</Text>
                  </Pressable>
                </View>
              </Pressable>
            </Link>
          )}
        />

        <Pressable style={styles.fab} onPress={() => setShowInput(!showInput)}>
          <Text style={styles.fabIcon}>+</Text>
        </Pressable>
      </View>
    </>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.white,
  },
  searchInput: {
    margin: 16,
    padding: 12,
    backgroundColor: colors.gray100,
    borderRadius: 10,
    fontSize: 14,
    color: colors.gray900,
  },
  addRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    marginBottom: 8,
    gap: 8,
  },
  addInput: {
    flex: 1,
    padding: 12,
    borderWidth: 1,
    borderColor: colors.gray300,
    borderRadius: 8,
    fontSize: 14,
    color: colors.gray900,
  },
  addButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: 16,
    justifyContent: 'center',
    borderRadius: 8,
  },
  addButtonText: {
    color: colors.white,
    fontSize: 14,
    fontWeight: '600',
  },
  list: {
    flexGrow: 1,
  },
  folderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    height: 52,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray300,
  },
  folderInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  folderIcon: {
    fontSize: 18,
  },
  folderName: {
    fontSize: 15,
    fontWeight: '500',
    color: colors.gray900,
  },
  folderMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  folderDate: {
    fontSize: 12,
    color: colors.gray500,
  },
  moreIcon: {
    fontSize: 18,
    color: colors.gray500,
    paddingHorizontal: 4,
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
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 40,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  fabIcon: {
    fontSize: 28,
    color: colors.white,
    fontWeight: '300',
  },
})
