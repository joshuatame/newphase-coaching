import { useState, useRef } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  collection,
  getDocs,
  addDoc,
  deleteDoc,
  doc,
  query,
  where,
  orderBy,
  serverTimestamp,
} from 'firebase/firestore'
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage'
import { db, storage } from '@/lib/firebase'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Camera, Trash, Images } from '@phosphor-icons/react'
import { ProgressPhotoCompare } from '@/components/ProgressPhotoCompare'

type ProgressPhoto = {
  id: string
  clientId: string
  url: string
  date: string
  caption?: string
  createdAt?: unknown
}

export function ProgressPhotosSection({
  clientId,
  isTrainer,
}: {
  clientId: string
  isTrainer: boolean
}) {
  const qc = useQueryClient()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [caption, setCaption] = useState('')
  const [uploading, setUploading] = useState(false)
  const [compareOpen, setCompareOpen] = useState(false)

  const { data: photos = [] } = useQuery({
    queryKey: ['progressPhotos', clientId],
    queryFn: async () => {
      const snap = await getDocs(
        query(
          collection(db, 'progressPhotos'),
          where('clientId', '==', clientId),
          orderBy('date', 'desc')
        )
      )
      return snap.docs.map((d) => ({ id: d.id, ...d.data() })) as ProgressPhoto[]
    },
    enabled: !!clientId,
  })

  const uploadMutation = useMutation({
    mutationFn: async (file: File) => {
      const date = new Date().toISOString().slice(0, 10)
      const storageRef = ref(
        storage,
        `progress/${clientId}/${date}_${Date.now()}.jpg`
      )
      await uploadBytes(storageRef, file)
      const url = await getDownloadURL(storageRef)
      await addDoc(collection(db, 'progressPhotos'), {
        clientId,
        url,
        date,
        caption: caption.trim() || undefined,
        createdAt: serverTimestamp(),
      })
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['progressPhotos', clientId] })
      setCaption('')
    },
  })

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await deleteDoc(doc(db, 'progressPhotos', id))
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['progressPhotos', clientId] }),
  })

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !file.type.startsWith('image/')) return
    setUploading(true)
    try {
      await uploadMutation.mutateAsync(file)
    } finally {
      setUploading(false)
      e.target.value = ''
    }
  }

  const byDate = photos.reduce<Record<string, ProgressPhoto[]>>((acc, p) => {
    const d = p.date
    if (!acc[d]) acc[d] = []
    acc[d].push(p)
    return acc
  }, {})

  return (
    <div className="space-y-4">
      <h3 className="font-semibold flex items-center gap-2">
        <Images className="h-5 w-5 text-primary" weight="duotone" />
        Progress Photos
      </h3>
      <div className="flex flex-wrap gap-4 items-center">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleFileSelect}
          disabled={uploading}
        />
        <Button
          variant="outline"
          size="sm"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
        >
          <Camera className="h-4 w-4 mr-2" /> Add photo
        </Button>
        <Input
          placeholder="Caption (optional)"
          value={caption}
          onChange={(e) => setCaption(e.target.value)}
          className="max-w-[200px]"
        />
        <ProgressPhotoCompare
          photos={photos}
          open={compareOpen}
          onOpenChange={setCompareOpen}
        />
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
        {Object.entries(byDate).flatMap(([date, imgs]) =>
          imgs.map((p) => (
            <div
              key={p.id}
              className="rounded-xl border border-border overflow-hidden bg-muted/30 group relative"
            >
              <img
                src={p.url}
                alt={p.caption ?? date}
                className="w-full aspect-square object-cover"
              />
              <div className="p-2 text-xs text-muted-foreground">
                {date}
                {p.caption && ` · ${p.caption}`}
              </div>
              {isTrainer && (
                <Button
                  variant="destructive"
                  size="icon"
                  className="absolute top-2 right-2 h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={() => deleteMutation.mutate(p.id)}
                >
                  <Trash className="h-4 w-4" />
                </Button>
              )}
            </div>
          ))
        )}
      </div>
      {photos.length === 0 && (
        <p className="text-sm text-muted-foreground">No progress photos yet.</p>
      )}
    </div>
  )
}
