import type { paths, components } from '@/sdk/api'

const API_HOST = import.meta.env.VITE_API_HOST?.replace(/\/$/, '') || ''

export async function createBox(
  body: paths['/api/boxes']['post']['requestBody']['content']['application/json']
): Promise<components['schemas']['Box']> {
  const response = await fetch(`${API_HOST}/api/boxes`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  if (!response.ok) {
    throw new Error(`Failed to create box: ${response.status} ${response.statusText}`)
  }
  return await response.json()
}

/**
 * Fetch a single box by ID.
 */
export async function getBox(
  id: string
): Promise<components['schemas']['Box']> {
  const response = await fetch(`${API_HOST}/api/boxes/${id}`)
  if (!response.ok) {
    throw new Error(`Failed to fetch box: ${response.status} ${response.statusText}`)
  }
  return await response.json()
}

/**
 * Update a box's name by ID.
 */
export async function updateBox(
  id: string,
  body: paths['/api/boxes/{id}']['put']['requestBody']['content']['application/json']
): Promise<components['schemas']['Box']> {
  const response = await fetch(`${API_HOST}/api/boxes/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  if (!response.ok) {
    throw new Error(`Failed to update box: ${response.status} ${response.statusText}`)
  }
  return await response.json()
}

/**
 * Fetch all box-song relationships.
 */
export async function getBoxSongs(): Promise<components['schemas']['BoxSong'][]> {
  const response = await fetch(`${API_HOST}/api/box_songs`)
  if (!response.ok) {
    throw new Error(`Failed to fetch box-songs: ${response.status} ${response.statusText}`)
  }
  return await response.json()
}

/**
 * Fetch all songs.
 */
export async function getSongs(): Promise<components['schemas']['Song'][]> {
  const response = await fetch(`${API_HOST}/api/songs`)
  if (!response.ok) {
    throw new Error(`Failed to fetch songs: ${response.status} ${response.statusText}`)
  }
  return await response.json()
}

/**
 * Create a new song.
 */
export async function createSong(
  body: paths['/api/songs']['post']['requestBody']['content']['application/json']
): Promise<components['schemas']['Song']> {
  const response = await fetch(`${API_HOST}/api/songs`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  if (!response.ok) {
    throw new Error(`Failed to create song: ${response.status} ${response.statusText}`)
  }
  return await response.json()
}

/**
 * Add a song to a box (create box-song relation).
 */
export async function createBoxSong(
  body: paths['/api/box_songs']['post']['requestBody']['content']['application/json']
): Promise<components['schemas']['BoxSong']> {
  const response = await fetch(`${API_HOST}/api/box_songs`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  if (!response.ok) {
    throw new Error(`Failed to add song to box: ${response.status} ${response.statusText}`)
  }
  return await response.json()
}