import { useState, useRef, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage'
import { doc, updateDoc, addDoc, collection, serverTimestamp } from 'firebase/firestore'
import { db, storage } from '@/lib/firebase'
import { X, Record, Stop, Monitor } from '@phosphor-icons/react'

interface CheckinFeedbackRecorderProps {
  checkinId: string
  clientId: string
  clientUid?: string
  date: string
  onComplete: () => void
  onCancel: () => void
}

export function CheckinFeedbackRecorder({
  checkinId,
  clientUid,
  date,
  onComplete,
  onCancel,
}: CheckinFeedbackRecorderProps) {
  const [status, setStatus] = useState<'idle' | 'recording' | 'uploading' | 'done' | 'error'>('idle')
  const [error, setError] = useState<string | null>(null)
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const streamRef = useRef<MediaStream[]>([])
  const recordingActiveRef = useRef(false)

  const drawFrame = useCallback((screenVideo: HTMLVideoElement, cameraVideo: HTMLVideoElement) => {
    const canvas = canvasRef.current
    if (!canvas || !recordingActiveRef.current) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const w = canvas.width
    const h = canvas.height

    if (screenVideo.readyState >= 2) {
      ctx.drawImage(screenVideo, 0, 0, w, h)
    }

    if (cameraVideo.readyState >= 2) {
      const pipSize = 140
      const margin = 16
      const x = w - pipSize - margin
      const y = h - pipSize - margin

      ctx.save()
      ctx.beginPath()
      ctx.arc(x + pipSize / 2, y + pipSize / 2, pipSize / 2, 0, Math.PI * 2)
      ctx.closePath()
      ctx.clip()
      ctx.drawImage(cameraVideo, x, y, pipSize, pipSize)
      ctx.restore()

      ctx.beginPath()
      ctx.arc(x + pipSize / 2, y + pipSize / 2, pipSize / 2, 0, Math.PI * 2)
      ctx.strokeStyle = 'rgba(255,255,255,0.6)'
      ctx.lineWidth = 2
      ctx.stroke()
    }

    requestAnimationFrame(() => drawFrame(screenVideo, cameraVideo))
  }, [])

  const startRecording = async () => {
    setError(null)
    try {
      const [screenStream, cameraStream] = await Promise.all([
        navigator.mediaDevices.getDisplayMedia({
          video: { displaySurface: 'browser' },
          audio: false,
        }),
        navigator.mediaDevices.getUserMedia({
          video: { width: 320, height: 240, facingMode: 'user' },
          audio: true,
        }),
      ])

      streamRef.current = [screenStream, cameraStream]

      const screenVideo = document.createElement('video')
      screenVideo.srcObject = screenStream
      screenVideo.play()

      const cameraVideo = document.createElement('video')
      cameraVideo.srcObject = cameraStream
      cameraVideo.play()

      await new Promise<void>((resolve, reject) => {
        screenVideo.onloadedmetadata = () => {
          screenVideo.onloadedmetadata = null
          resolve()
        }
        screenVideo.onerror = reject
      })
      await new Promise<void>((resolve, reject) => {
        cameraVideo.onloadedmetadata = () => {
          cameraVideo.onloadedmetadata = null
          resolve()
        }
        cameraVideo.onerror = reject
      })

      const canvas = document.createElement('canvas')
      canvas.width = 1280
      canvas.height = 720
      canvasRef.current = canvas

      const audioTrack = cameraStream.getAudioTracks()[0]
      const compositeStream = canvas.captureStream(30)
      if (audioTrack) compositeStream.addTrack(audioTrack)

      const recorder = new MediaRecorder(compositeStream, {
        mimeType: MediaRecorder.isTypeSupported('video/webm;codecs=vp9')
          ? 'video/webm;codecs=vp9'
          : 'video/webm',
        videoBitsPerSecond: 2500000,
      })

      chunksRef.current = []
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data)
      }
      recorder.onstop = () => {}
      recorder.start(1000)

      mediaRecorderRef.current = recorder
      recordingActiveRef.current = true
      setStatus('recording')
      drawFrame(screenVideo, cameraVideo)

      screenStream.getVideoTracks()[0].addEventListener('ended', () => {
        stopRecording()
      })
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to start recording')
      setStatus('error')
    }
  }

  const stopRecording = async () => {
    const recorder = mediaRecorderRef.current
    if (!recorder) return

    recordingActiveRef.current = false
    recorder.stop()
    streamRef.current.forEach((s) => s.getTracks().forEach((t) => t.stop()))
    streamRef.current = []
    mediaRecorderRef.current = null

    setStatus('uploading')

    await new Promise<void>((resolve) => {
      recorder.onstop = () => resolve()
    })

    const blob = new Blob(chunksRef.current, { type: 'video/webm' })
    try {
      const path = `checkinFeedback/${checkinId}_${Date.now()}.webm`
      const storageRef = ref(storage, path)
      await uploadBytes(storageRef, blob)
      const videoUrl = await getDownloadURL(storageRef)

      await updateDoc(doc(db, 'checkins', checkinId), {
        feedbackVideoUrl: videoUrl,
        feedbackRecordedAt: serverTimestamp(),
        status: 'complete',
        updatedAt: serverTimestamp(),
      })

      if (clientUid) {
        await addDoc(collection(db, 'notifications'), {
          userId: clientUid,
          title: 'Check-in feedback',
          body: `Your trainer has recorded feedback for your check-in (${date}).`,
          screen: '/checkins',
          createdAt: serverTimestamp(),
        })
      }

      setStatus('done')
      onComplete()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Upload failed')
      setStatus('error')
    }
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80">
      <div className="bg-card border border-border rounded-2xl shadow-xl max-w-md w-full p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold">Record check-in feedback</h3>
          <Button variant="ghost" size="icon" onClick={onCancel} disabled={status === 'recording'}>
            <X className="h-5 w-5" />
          </Button>
        </div>

        <p className="text-sm text-muted-foreground mb-4">
          Records your screen, camera (bottom-right), and voice. Click Start, share your screen, then click Stop when done.
        </p>

        {error && (
          <div className="mb-4 p-3 rounded-xl bg-destructive/20 text-destructive text-sm">{error}</div>
        )}

        <div className="flex flex-col sm:flex-row gap-2">
          {status === 'idle' && (
            <Button onClick={startRecording} className="flex-1">
              <Monitor className="h-5 w-5 mr-2" weight="bold" />
              Start recording
            </Button>
          )}
          {status === 'recording' && (
            <Button variant="destructive" onClick={stopRecording} className="flex-1">
              <Stop className="h-5 w-5 mr-2" weight="fill" />
              Stop & save
            </Button>
          )}
          {status === 'uploading' && (
            <p className="text-sm text-muted-foreground py-2">Uploading video…</p>
          )}
          {(status === 'idle' || status === 'error') && (
            <Button variant="outline" onClick={onCancel}>
              Cancel
            </Button>
          )}
        </div>

        {status === 'recording' && (
          <div className="mt-4 flex items-center gap-2 text-red-500">
            <Record className="h-4 w-4 animate-pulse" weight="fill" />
            <span className="text-sm font-medium">Recording… Share your screen if prompted.</span>
          </div>
        )}
      </div>
    </div>
  )
}
