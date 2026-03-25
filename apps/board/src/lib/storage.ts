import AsyncStorage from '@react-native-async-storage/async-storage'

export type BoardRow = {
  label: string
  value: string
}

export type BoardData = {
  rows: BoardRow[]
}

export type BoardPosition = 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right'

export type Photo = {
  id: string
  uri: string
  board: BoardData
  boardPosition: BoardPosition
  description?: string
  createdAt: string
}

export type Folder = {
  id: string
  name: string
  photos: Photo[]
  createdAt: string
}

const FOLDERS_KEY = 'morton-board-folders'

export async function getFolders(): Promise<Folder[]> {
  const raw = await AsyncStorage.getItem(FOLDERS_KEY)
  return raw ? JSON.parse(raw) : []
}

export async function saveFolders(folders: Folder[]): Promise<void> {
  await AsyncStorage.setItem(FOLDERS_KEY, JSON.stringify(folders))
}

export async function addFolder(name: string): Promise<Folder> {
  const folders = await getFolders()
  const folder: Folder = {
    id: Date.now().toString(),
    name,
    photos: [],
    createdAt: new Date().toISOString(),
  }
  folders.unshift(folder)
  await saveFolders(folders)
  return folder
}

export async function deleteFolder(id: string): Promise<void> {
  const folders = await getFolders()
  await saveFolders(folders.filter((f) => f.id !== id))
}

export async function getFolder(id: string): Promise<Folder | undefined> {
  const folders = await getFolders()
  return folders.find((f) => f.id === id)
}

export async function addPhotoToFolder(
  folderId: string,
  photo: Omit<Photo, 'id' | 'createdAt'>
): Promise<void> {
  const folders = await getFolders()
  const folder = folders.find((f) => f.id === folderId)
  if (!folder) return

  folder.photos.unshift({
    ...photo,
    id: Date.now().toString(),
    createdAt: new Date().toISOString(),
  })
  await saveFolders(folders)
}
