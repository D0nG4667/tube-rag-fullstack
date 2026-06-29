'use client'

import { forwardRef, useImperativeHandle, useRef } from 'react'
import ReactPlayer from 'react-player/youtube'

export interface VideoPlayerRef {
  seekTo: (seconds: number) => void
}

interface VideoPlayerProps {
  youtubeId: string
  onProgress?: (state: { playedSeconds: number }) => void
}

export const VideoPlayer = forwardRef<VideoPlayerRef, VideoPlayerProps>(
  ({ youtubeId, onProgress }, ref) => {
    const playerRef = useRef<ReactPlayer>(null)

    useImperativeHandle(ref, () => ({
      seekTo: (seconds: number) => {
        if (playerRef.current) {
          playerRef.current.seekTo(seconds, 'seconds')
        }
      },
    }))

    const videoUrl = `https://www.youtube.com/watch?v=${youtubeId}`

    return (
      <div className="relative w-full aspect-video rounded-xl overflow-hidden glass-panel flex items-center justify-center">
        {youtubeId ? (
          <ReactPlayer
            ref={playerRef}
            url={videoUrl}
            width="100%"
            height="100%"
            controls
            playing
            onProgress={onProgress}
            config={{
              youtube: {
                playerVars: { autoplay: 1, rel: 0 },
              },
            // biome-ignore lint/suspicious/noExplicitAny: ReactPlayer config types are overly restrictive for playerVars
            } as any}
          />
        ) : (
          <div className="text-zinc-500 italic text-sm">Select a video from the control drawer to begin.</div>
        )}
      </div>
    )
  }
)

VideoPlayer.displayName = 'VideoPlayer'
