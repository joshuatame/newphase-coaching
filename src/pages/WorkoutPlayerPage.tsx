import { useParams, useNavigate } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { collection, getDocs } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Check, Trophy } from '@phosphor-icons/react'
import { PostSessionSurveyDialog } from '@/components/PostSessionSurveyDialog'

export function WorkoutPlayerPage() {
  const { sessionId } = useParams()
  const navigate = useNavigate()
  const [restSeconds, setRestSeconds] = useState<number | null>(null)
  const [isResting, setIsResting] = useState(false)
  const [reps, setReps] = useState('')
  const [weight, setWeight] = useState('')
  const [currentSet, setCurrentSet] = useState(1)
  const [showCompleteWorkout, setShowCompleteWorkout] = useState(false)
  const [showSurvey, setShowSurvey] = useState(false)
  const totalSets = 3

  const { data: surveyTemplates = [] } = useQuery({
    queryKey: ['sessionSurveyTemplates'],
    queryFn: async () => {
      const snap = await getDocs(collection(db, 'sessionSurveyTemplates'))
      return snap.docs.map((d) => ({ id: d.id, ...d.data() }))
    },
    enabled: !!sessionId && sessionId !== 'new',
  })

  const defaultSurveyTemplate = surveyTemplates.find((t) => (t as { active?: boolean }).active !== false) ?? surveyTemplates[0]

  useEffect(() => {
    if (isResting && restSeconds !== null && restSeconds > 0) {
      const t = setInterval(() => setRestSeconds((r) => (r ?? 0) - 1), 1000)
      return () => clearInterval(t)
    }
  }, [isResting, restSeconds])

  const handleCompleteSet = () => {
    if (currentSet >= totalSets) {
      setShowCompleteWorkout(true)
    } else {
      setCurrentSet((s) => s + 1)
      setReps('')
      setWeight('')
      setRestSeconds(60)
      setIsResting(true)
    }
  }

  const handleCompleteWorkout = () => {
    if (defaultSurveyTemplate) {
      setShowSurvey(true)
    } else {
      handleSurveyComplete()
    }
  }

  const handleSurveyComplete = () => {
    setShowSurvey(false)
    setShowCompleteWorkout(false)
    navigate('/')
  }

  return (
    <div className="p-4 md:p-6 max-w-lg mx-auto">
      <h1 className="text-2xl font-bold mb-6">Workout Player</h1>
      {sessionId === 'new' || !sessionId ? (
        <p className="text-muted-foreground">Select a client and workout to start.</p>
      ) : (
        <div className="space-y-6">
          {showCompleteWorkout ? (
            <div className="p-6 rounded-xl border border-primary/50 bg-primary/5 text-center">
              <Trophy className="h-12 w-12 mx-auto mb-3 text-primary" weight="duotone" />
              <p className="font-semibold mb-1">All sets complete!</p>
              <p className="text-sm text-muted-foreground mb-4">Tap below to finish the workout.</p>
              <Button className="w-full" onClick={handleCompleteWorkout}>
                <Check className="mr-2 h-4 w-4" />
                Complete Workout
              </Button>
            </div>
          ) : (
            <>
              <div className="p-4 rounded-lg border border-border bg-card">
                <p className="font-medium mb-2">Exercise: Bench Press</p>
                <p className="text-sm text-muted-foreground">
                  Set {currentSet} of {totalSets}
                </p>
                <p className="text-xs text-primary mt-2 font-mono">Tempo: 3-1-2-0 (eccentric-pause-concentric-pause)</p>
              </div>

              {isResting && restSeconds !== null ? (
                <div className="text-center p-8 rounded-lg border border-primary/50 bg-primary/5">
                  <p className="text-5xl font-mono font-bold mb-2 tabular-nums">{restSeconds}s</p>
                  <p className="text-muted-foreground mb-4">Rest</p>
                  <div className="flex flex-wrap gap-2 justify-center">
                    <Button variant="outline" size="sm" onClick={() => setRestSeconds((r) => (r ?? 0) + 15)}>
                      +15s
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => setRestSeconds((r) => (r ?? 0) + 30)}>
                      +30s
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => setRestSeconds((r) => (r ?? 0) + 60)}>
                      +60s
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
            </>
          )}
        </div>
      )}

      {showSurvey && defaultSurveyTemplate && sessionId && sessionId !== 'new' && (
        <PostSessionSurveyDialog
          template={defaultSurveyTemplate as { id: string; name: string; questions?: { id: string; question: string; type: string; options?: string[] }[] }}
          sessionId={sessionId}
          onComplete={handleSurveyComplete}
        />
      )}
    </div>
  )
}
