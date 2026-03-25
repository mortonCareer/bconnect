import { useState } from 'react'
import { Alert, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native'
import { Stack, useLocalSearchParams, useRouter } from 'expo-router'
import * as ImagePicker from 'expo-image-picker'
import { colors } from '@/lib/colors'
import type { BoardRow } from '@/lib/storage'

const DEFAULT_ROWS: BoardRow[] = [
  { label: '공사명', value: '' },
  { label: '내용', value: '' },
  { label: '위치', value: '' },
  { label: '일시', value: new Date().toISOString().slice(0, 10).replace(/-/g, '.') },
]

export default function BoardNewScreen() {
  const { folderId } = useLocalSearchParams<{ folderId: string }>()
  const router = useRouter()
  const [rows, setRows] = useState<BoardRow[]>(DEFAULT_ROWS)
  const [newLabel, setNewLabel] = useState('')
  const [showAddRow, setShowAddRow] = useState(false)

  const updateRow = (index: number, field: 'label' | 'value', text: string) => {
    setRows((prev) => prev.map((row, i) => (i === index ? { ...row, [field]: text } : row)))
  }

  const removeRow = (index: number) => {
    if (rows.length <= 1) return
    setRows((prev) => prev.filter((_, i) => i !== index))
  }

  const addRow = () => {
    if (!newLabel.trim()) return
    setRows((prev) => [...prev, { label: newLabel.trim(), value: '' }])
    setNewLabel('')
    setShowAddRow(false)
  }

  const pickAndNavigate = async (source: 'camera' | 'gallery') => {
    const hasValues = rows.some((r) => r.value.trim())
    if (!hasValues) {
      Alert.alert('입력 필요', '최소 하나의 항목을 입력해주세요.')
      return
    }

    let result: ImagePicker.ImagePickerResult

    if (source === 'camera') {
      const permission = await ImagePicker.requestCameraPermissionsAsync()
      if (!permission.granted) {
        Alert.alert('권한 필요', '카메라 접근 권한이 필요합니다.')
        return
      }
      result = await ImagePicker.launchCameraAsync({ quality: 0.8 })
    } else {
      result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        quality: 0.8,
      })
    }

    if (result.canceled || !result.assets[0]) return

    router.push({
      pathname: '/photo/preview',
      params: {
        uri: result.assets[0].uri,
        folderId,
        boardRows: JSON.stringify(rows),
      },
    })
  }

  return (
    <>
      <Stack.Screen
        options={{
          title: '보드 작성',
          headerRight: () => (
            <View style={{ flexDirection: 'row', gap: 12 }}>
              <Pressable onPress={() => pickAndNavigate('camera')}>
                <Text style={styles.headerAction}>📷</Text>
              </Pressable>
              <Pressable onPress={() => pickAndNavigate('gallery')}>
                <Text style={styles.headerAction}>🖼</Text>
              </Pressable>
            </View>
          ),
        }}
      />
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <View style={styles.table}>
          {rows.map((row, index) => (
            <View key={index} style={styles.tableRow}>
              <View style={styles.labelCell}>
                <Text style={styles.labelText}>{row.label}</Text>
              </View>
              <View style={styles.valueCell}>
                <TextInput
                  style={styles.valueInput}
                  value={row.value}
                  onChangeText={(text) => updateRow(index, 'value', text)}
                  placeholder={`${row.label} 입력`}
                  placeholderTextColor={colors.gray500}
                />
                <Pressable onPress={() => removeRow(index)} hitSlop={8}>
                  <Text style={styles.removeIcon}>—</Text>
                </Pressable>
              </View>
            </View>
          ))}
        </View>

        {showAddRow ? (
          <View style={styles.addRowInput}>
            <TextInput
              style={styles.newLabelInput}
              value={newLabel}
              onChangeText={setNewLabel}
              placeholder="항목 이름 입력"
              placeholderTextColor={colors.gray500}
              autoFocus
              onSubmitEditing={addRow}
            />
            <Pressable style={styles.addConfirmButton} onPress={addRow}>
              <Text style={styles.addConfirmText}>추가</Text>
            </Pressable>
            <Pressable onPress={() => setShowAddRow(false)}>
              <Text style={styles.cancelText}>취소</Text>
            </Pressable>
          </View>
        ) : (
          <Pressable style={styles.addRowButton} onPress={() => setShowAddRow(true)}>
            <Text style={styles.addRowIcon}>+</Text>
            <Text style={styles.addRowText}>새로운 행 추가하기</Text>
          </Pressable>
        )}

        <Text style={styles.hint}>입력된 보드판은 이후 사진마다 개별 수정 할 수 있어요.</Text>
      </ScrollView>
    </>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.white,
  },
  content: {
    paddingBottom: 40,
  },
  headerAction: {
    color: colors.primary,
    fontSize: 16,
    fontWeight: '600',
  },
  table: {
    borderTopWidth: 1,
    borderTopColor: colors.gray300,
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: colors.gray300,
    minHeight: 52,
  },
  labelCell: {
    width: 72,
    backgroundColor: colors.gray100,
    borderRightWidth: 1,
    borderRightColor: colors.gray300,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 16,
  },
  labelText: {
    fontSize: 13,
    fontWeight: '500',
    color: colors.gray700,
  },
  valueCell: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 14,
  },
  valueInput: {
    flex: 1,
    fontSize: 14,
    color: colors.gray900,
  },
  removeIcon: {
    color: colors.error,
    fontSize: 18,
    paddingHorizontal: 4,
  },
  addRowButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  addRowIcon: {
    fontSize: 16,
    color: colors.primary,
  },
  addRowText: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.primary,
  },
  addRowInput: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  newLabelInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: colors.gray300,
    borderRadius: 8,
    padding: 10,
    fontSize: 14,
    color: colors.gray900,
  },
  addConfirmButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 8,
  },
  addConfirmText: {
    color: colors.white,
    fontSize: 14,
    fontWeight: '600',
  },
  cancelText: {
    color: colors.gray500,
    fontSize: 14,
    paddingHorizontal: 8,
  },
  hint: {
    paddingHorizontal: 16,
    fontSize: 12,
    color: colors.gray500,
    lineHeight: 18,
  },
})
