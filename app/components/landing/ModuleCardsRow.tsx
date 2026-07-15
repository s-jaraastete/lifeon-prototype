'use client'

import { useEffect, useState } from 'react'
import ModuleCard from '../ui/ModuleCard'

// Icons
import { LuBookCheck, LuBotMessageSquare, LuCircleCheck, LuFileSearch2, LuSearch, LuTable } from 'react-icons/lu'

const cards = [
  { icon: <LuTable size={24} className="text-black" />, bgIcon: 'bg-purple-300', border: 'border-2', borderColor: 'border-gray-200' },
  { icon: <LuFileSearch2 size={24} className="text-black" />, bgIcon: 'bg-sky-300', border: 'border-2', borderColor: 'border-gray-200' },
  { icon: <LuBotMessageSquare size={24} className="text-black" />, bgIcon: 'bg-[rgb(0,199,189)]', border: 'border-2', borderColor: 'border-gray-200' },
  { icon: <LuCircleCheck size={24} className="text-gray-700" />, bgIcon: 'bg-gray-300', border: 'border-2', borderColor: 'border-gray-200' },
  { icon: <LuBookCheck size={24} className="text-gray-700" />, bgIcon: 'bg-gray-300', border: 'border-2', borderColor: 'border-gray-200' },
  { icon: <LuSearch size={24} className="text-gray-700" />, bgIcon: 'bg-gray-300', border: 'border-2', borderColor: 'border-gray-200' },
]

const ModuleCardsRow = ({ isActive }: { isActive: boolean }) => {
  const [burst, setBurst] = useState(false)

  useEffect(() => {
    if (!isActive) return

    // Separar las cards 500ms después de aparecer la slide
    const t1 = setTimeout(() => setBurst(true), 500)
    // Volver a juntar 800ms después
    const t2 = setTimeout(() => setBurst(false), 1300)

    return () => {
      clearTimeout(t1)
      clearTimeout(t2)
      setBurst(false)
    }
  }, [isActive])

  const gapClass = burst
    ? 'space-x-4'
    : '-space-x-2.5 group-hover:space-x-4'

  return (
    <div className={`hidden md:flex items-center justify-center transition-all duration-300 ${gapClass}`}>
      {cards.map((card, index) => (
        <ModuleCard
          key={index}
          icon={card.icon}
          bgIcon={card.bgIcon}
          border={card.border}
          borderColor={card.borderColor}
          size="md"
        />
      ))}
    </div>
  )
}

export default ModuleCardsRow;