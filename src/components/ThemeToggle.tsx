import { Moon, Sun, SunHorizon } from '@phosphor-icons/react'
import { useTheme } from '@/lib/theme'
import { Button } from '@/components/ui/button'

export function ThemeToggle() {
  const { theme, resolvedTheme, setTheme } = useTheme()

  const cycle = () => {
    if (theme === 'dark') setTheme('light')
    else if (theme === 'light') setTheme('system')
    else setTheme('dark')
  }

  const icon = theme === 'system' 
    ? (resolvedTheme === 'dark' ? <SunHorizon className="h-5 w-5" weight="duotone" /> : <Sun className="h-5 w-5" weight="duotone" />)
    : theme === 'dark' 
      ? <Moon className="h-5 w-5" weight="duotone" /> 
      : <Sun className="h-5 w-5" weight="duotone" />

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={cycle}
      className="rounded-xl"
      title={theme === 'dark' ? 'Dark' : theme === 'light' ? 'Light' : 'System'}
    >
      {icon}
    </Button>
  )
}
