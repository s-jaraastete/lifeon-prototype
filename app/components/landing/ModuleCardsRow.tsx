'use client'

import { useEffect, useState } from 'react'
import ModuleCard from '../ui/ModuleCard'
import { AprIcon, DocumentacionIcon, MiperIcon, ModuleBox } from '../shared/baseModules';

// Icons
import { LuBookCheck, LuCircleCheck, LuSearch } from 'react-icons/lu'

const cardBox = "w-12 h-12 border-2 border-gray-200";

const cards = [
  {
    icon: <MiperIcon box={cardBox} iconSize={24} />,
  },
  {
    icon: <DocumentacionIcon box={cardBox} iconSize={24} />,
  },
  {
    icon: <AprIcon box={cardBox} iconSize={22} />,
  },
  {
    icon: (
      <ModuleBox bg="bg-gray-300" box={cardBox}>
        <LuCircleCheck size={24} className="text-gray-700" />
      </ModuleBox>
    ),
  },
  {
    icon: (
      <ModuleBox bg="bg-gray-300" box={cardBox}>
        <LuBookCheck size={24} className="text-gray-700" />
      </ModuleBox>
    ),
  },
  {
    icon: (
      <ModuleBox bg="bg-gray-300" box={cardBox}>
        <LuSearch size={24} className="text-gray-700" />
      </ModuleBox>
    ),
  },
];

const ModuleCardsRow = ({ isActive }: { isActive: boolean }) => {
  const [burst, setBurst] = useState(false);

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
        />
      ))}
    </div>
  )
}

export default ModuleCardsRow;