import { useEffect, useState } from 'react'

const useCooldown = (defaultCooldown: number) => {
  const [cooldown, setCooldown] = useState<number>(0)

  useEffect(() => {
    if (cooldown > 0) {
      const timer = setInterval(() => {
        setCooldown((prev) => prev - 1)
      }, 1000)
      return () => clearInterval(timer)
    }
  }, [cooldown])

  const triggerCooldown = (cooldown: number = defaultCooldown) => setCooldown(cooldown)

  return {
    cooldown,
    triggerCooldown
  }
}

export default useCooldown