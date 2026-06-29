'use client'

import { useEffect, useState, useRef, useCallback } from 'react'
import MatrixCanvas from '@/components/MatrixCanvas'
import ControlDrawer from '@/components/ControlDrawer'
import { VideoPlayer, type VideoPlayerRef } from '@/components/VideoPlayer'
import ChatPanel from '@/components/ChatPanel'
import { supabase } from '@/lib/supabase'
import { Sparkles, Library } from 'lucide-react'

interface VideoNode {
  id: string
  youtube_id: string
  title: string
  status: string
}

export default function Dashboard() {
  const [videos, setVideos] = useState<VideoNode[]>([])
  const [selectedVideo, setSelectedVideo] = useState<VideoNode | null>(null)
  const playerRef = useRef<VideoPlayerRef>(null)

  // Fetch ingested videos list
  const fetchVideos = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('videos')
        .select('id, youtube_id, title, status')
        .order('created_at', { ascending: false })

      if (error) throw error
      if (data && data.length > 0) {
        setVideos(data)
        // Auto-select first video if none selected
        setSelectedVideo((current) => {
          if (!current) {
            return data[0]
          }
          return current
        })
      } else {
        // Use default demo mock list if database is empty
        const mockList = [
          {
            id: 'mock-id-1',
            youtube_id: 'dQw4w9WgXcQ',
            title: 'Rick Astley - Never Gonna Give You Up (Official Music Video)',
            status: 'completed',
          },
        ]
        setVideos(mockList)
        setSelectedVideo((current) => current || mockList[0])
      }
    } catch (err) {
      console.error('Error fetching videos:', err)
      // Fallback fallback mock list if Supabase config is missing
      const mockList = [
        {
          id: 'mock-id-1',
          youtube_id: 'dQw4w9WgXcQ',
          title: 'Rick Astley - Never Gonna Give You Up (Official Music Video)',
          status: 'completed',
        },
      ]
      setVideos(mockList)
      setSelectedVideo((current) => current || mockList[0])
    }
  }, [])

  useEffect(() => {
    fetchVideos()

    // Subscribe to supabase database real-time pipeline changes
    const channel = supabase
      .channel('video_changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'videos' },
        () => {
          fetchVideos()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [fetchVideos])

  const handleSeek = (seconds: number) => {
    if (playerRef.current) {
      playerRef.current.seekTo(seconds)
    }
  }

  // Active state switches on if any ingestion is in progress
  const hasActiveJob = videos.some((vid) => vid.status !== 'completed' && vid.status !== 'failed')

  return (
    <main className="relative min-h-screen w-screen flex text-zinc-100 overflow-hidden">
      {/* 3D background canvas layer */}
      <MatrixCanvas active={hasActiveJob} />

      {/* Collapsible Left drawer control */}
      <ControlDrawer
        videos={videos}
        selectedVideoId={selectedVideo?.id || ''}
        onSelectVideo={(video) => setSelectedVideo(video)}
        onIngestSuccess={fetchVideos}
      />

      {/* Main Core Viewport Split Grid */}
      <div className="flex-1 flex flex-col p-6 overflow-hidden h-screen gap-6">
        {/* Header toolbar */}
        <header className="flex justify-between items-center glass-panel p-4 rounded-xl shrink-0">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-accent-cyan" />
            <h1 className="text-sm font-semibold tracking-wider uppercase text-zinc-200">
              TubeRAG / RAG Viewport Workspace
            </h1>
          </div>
          {selectedVideo && (
            <div className="flex items-center gap-2 text-xs bg-zinc-900/60 px-3 py-1 rounded border border-zinc-800/80">
              <Library className="w-3.5 h-3.5 text-accent-cyan" />
              <span className="font-mono text-zinc-400">ACTIVE YT ID: {selectedVideo.youtube_id}</span>
            </div>
          )}
        </header>

        {/* Viewport & chat splits */}
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-6 min-h-0 overflow-hidden">
          {/* Left panel: player container */}
          <div className="flex flex-col gap-4 min-h-0">
            <div className="glass-panel p-4 rounded-xl flex-1 flex flex-col justify-center min-h-0">
              <span className="text-xs text-zinc-500 font-semibold tracking-widest mb-3 block">
                VIDEO PLAYER ENGINE
              </span>
              <VideoPlayer
                ref={playerRef}
                youtubeId={selectedVideo?.youtube_id || ''}
              />
            </div>
          </div>

          {/* Right panel: Agentic chat module */}
          <div className="flex flex-col min-h-0">
            <ChatPanel
              videoId={selectedVideo?.id || ''}
              onSeek={handleSeek}
            />
          </div>
        </div>
      </div>
    </main>
  )
}
