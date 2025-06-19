import { useState, useEffect } from 'react'
import type { FormEvent } from 'react'
import { useParams } from 'react-router-dom'

import { Input } from '@/components/ui/8bit/input'
import { Button } from '@/components/ui/8bit/button'
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from '@/components/ui/8bit/table'
import { getBox, getBoxSongs, getSongs, createSong, createBoxSong } from '@/sdk'

interface SongRow {
  id: string
  position: number
  title?: string
  artist?: string | null
}

export default function SharePage() {
  const { boxId } = useParams<{ boxId: string }>()
  const [boxName, setBoxName] = useState('')
  const [rows, setRows] = useState<SongRow[]>([])
  const [loading, setLoading] = useState(true)
  const [title, setTitle] = useState('')
  const [artist, setArtist] = useState('')
  const [isAdding, setIsAdding] = useState(false)

  useEffect(() => {
    if (!boxId) return
    setLoading(true)
    ;(async () => {
      try {
        const [box, boxSongs, songs] = await Promise.all([
          getBox(boxId),
          getBoxSongs(),
          getSongs(),
        ])
        setBoxName(box.name ?? '')
        const filtered = boxSongs
          .filter((bs) => bs.box_id === boxId)
          .sort((a, b) => (a.position ?? 0) - (b.position ?? 0))
        const songMap = new Map(songs.map((s) => [s.id, s]))
        setRows(
          filtered.map((bs) => ({
            id: bs.id || '',
            position: bs.position ?? 0,
            title: songMap.get(bs.song_id || '')?.title,
            artist: songMap.get(bs.song_id || '')?.artist,
          }))
        )
      } catch (error) {
        console.error('Error loading share data:', error)
      } finally {
        setLoading(false)
      }
    })()
  }, [boxId])

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (!boxId || !title) return
    setIsAdding(true)
    try {
      const song = await createSong({ title, artist: artist || undefined })
      const relation = await createBoxSong({
        box_id: boxId,
        song_id: song.id || '',
        position: rows.length,
      })
      setRows((prev) => [
        ...prev,
        { id: relation.id || '', position: relation.position ?? 0, title: song.title, artist: song.artist },
      ])
      setTitle('')
      setArtist('')
    } catch (error) {
      console.error('Error adding song:', error)
    } finally {
      setIsAdding(false)
    }
  }

  if (loading) {
    return <div>Loading...</div>
  }

  return (
    <div className="space-y-6 p-4">
      <h2 className="text-2xl font-bold">Add Songs to “{boxName}”</h2>

      <form className="flex space-x-2" onSubmit={handleSubmit}>
        <Input
          placeholder="Song Title"
          value={title}
          onChange={(e) => setTitle(e.currentTarget.value)}
        />
        <Input
          placeholder="Artist (optional)"
          value={artist}
          onChange={(e) => setArtist(e.currentTarget.value)}
        />
        <Button type="submit" disabled={isAdding}>
          {isAdding ? 'Adding...' : 'Add Song'}
        </Button>
      </form>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>#</TableHead>
            <TableHead>Title</TableHead>
            <TableHead>Artist</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((row, idx) => (
            <TableRow key={row.id}>
              <TableCell>{idx + 1}</TableCell>
              <TableCell>{row.title}</TableCell>
              <TableCell>{row.artist}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}