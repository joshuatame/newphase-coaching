import { useParams } from 'react-router-dom'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Check } from 'lucide-react'

export function WorkoutPlayerPage() {
  const { sessionId } = useParams()
  const [restSeconds, setRestSeconds] = useState<number | null>(null)
  const [isResting, setIsResting] = useState(false)
  const [reps, setReps] = useState('')
  const [weight, setWeight] = useState('')
  const [currentSet, setCurrentSet] = useState(1)
  const totalSets = 3

  const handleCompleteSet = () => {
    setCurrentSet((s) => s + 1)
    setReps('')
    setWeight('')
    setRestSeconds(60)
    setIsResting(true)
  }

  return (
    <div className="p-4 md:p-6 max-w-lg mx-auto">
      <h1 className="text-2xl font-bold mb-6">Workout Player</h1>
      {sessionId === 'new' || !sessionId ? (
        <p className="text-muted-foreground">Select a client and workout to start.</p>
      ) : (
        <div className="space-y-6">
          <div className="p-4 rounded-lg border border-border bg-card">
            <p className="font-medium mb-2">Exercise: Bench Press</p>
            <p className="text-sm text-muted-foreground">
              Set {currentSet} of {totalSets}
            </p>
          </div>

          {isResting && restSeconds !== null ? (
            <div className="text-center p-8 rounded-lg border border-primary/50 bg-primary/5">
              <p className="text-4xl font-mono font-bold mb-2">{restSeconds}s</p>
              <p className="text-muted-foreground mb-4">Rest</p>
              <div className="flex gap-2 justify-center">
                <Button variant="outline" size="sm" onClick={() => setRestSeconds((r) => (r ?? 0) + 15)}>
                  +15s
                </Button>
                <Button variant="outline" size="sm" onClick={() => setIsResting(false)}>
                  Skip
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <label className="text-sm">Reps</label>
                <Input
                  type="number"
                  value={reps}
                  onChange={(e) => setReps(e.target.value)}
                  placeholder="Actual reps"
                />
              </div>
              <div>
                <label className="text-sm">Weight (kg)</label>
                <Input
                  type="number"
                  value={weight}
                  onChange={(e) => setWeight(e.target.value)}
                  placeholder="Weight"
                />
              </div>
              <Button
                className="w-full"
                onClick={handleCompleteSet}
                disabled={!reps}
              >
                <Check className="mr-2 h-4 w-4" />
                Complete Set
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
