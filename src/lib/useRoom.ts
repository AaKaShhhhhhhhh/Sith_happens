import { useEffect, useState } from 'react'
import { supabase } from './supabase'
import { getRoomByCode, listPlayers, listVotes } from './game'
import type { Interrogation, Player, Room, Vote } from './types'

export interface RoomState {
  room: Room | null
  players: Player[]
  votes: Vote[]
  interrogations: Interrogation[]
  loading: boolean
  error: string | null
}

/** Subscribe to a room and its players/votes/interrogations in realtime. */
export function useRoom(code: string | undefined): RoomState {
  const [room, setRoom] = useState<Room | null>(null)
  const [players, setPlayers] = useState<Player[]>([])
  const [votes, setVotes] = useState<Vote[]>([])
  const [interrogations, setInterrogations] = useState<Interrogation[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!code || !supabase) {
      setLoading(false)
      return
    }
    const sb = supabase
    let active = true
    let channel: ReturnType<typeof sb.channel> | null = null

    void (async () => {
      try {
        const r = await getRoomByCode(code)
        if (!active) return
        if (!r) {
          setError('Room not found')
          setLoading(false)
          return
        }
        setRoom(r)
        setPlayers(await listPlayers(r.id))
        setVotes(await listVotes(r.id))
        const { data: initialInterros } = await sb
          .from('interrogations')
          .select()
          .eq('room_id', r.id)
          .order('created_at', { ascending: true })
        setInterrogations((initialInterros as Interrogation[]) ?? [])
        setLoading(false)

        channel = sb
          .channel(`room:${r.id}`)
          .on(
            'postgres_changes',
            { event: '*', schema: 'public', table: 'rooms', filter: `id=eq.${r.id}` },
            (payload) => {
              if (payload.new) setRoom(payload.new as Room)
            },
          )
          .on(
            'postgres_changes',
            { event: '*', schema: 'public', table: 'players', filter: `room_id=eq.${r.id}` },
            () => void listPlayers(r.id).then((p) => active && setPlayers(p)),
          )
          .on(
            'postgres_changes',
            { event: '*', schema: 'public', table: 'votes', filter: `room_id=eq.${r.id}` },
            () => void listVotes(r.id).then((v) => active && setVotes(v)),
          )
          .on(
            'postgres_changes',
            { event: 'INSERT', schema: 'public', table: 'interrogations', filter: `room_id=eq.${r.id}` },
            (payload) =>
              setInterrogations((prev) => [...prev, payload.new as Interrogation]),
          )
          .subscribe()
      } catch (e) {
        if (active) {
          setError((e as Error).message)
          setLoading(false)
        }
      }
    })()

    return () => {
      active = false
      if (channel) void sb.removeChannel(channel)
    }
  }, [code])

  return { room, players, votes, interrogations, loading, error }
}
