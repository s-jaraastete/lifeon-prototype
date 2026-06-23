import React from 'react'
import { LuCheck } from 'react-icons/lu';


type CardPackProps = {
  chip: string;
  icon: React.ReactNode;
  bgIcon: string;
  title: string;
  description: string;
  details: string[];
  borderButtonColor?: string;
  hoverButton?: string;
  hoverBorderCard?: string;
}

const CardPack = ({ chip, icon, bgIcon, title, description, details, borderButtonColor, hoverButton, hoverBorderCard }: CardPackProps) => {
  return (
    <div className={`border-2 border-gray-300 rounded-xl p-6 w-full h-138.25 flex flex-col ${hoverBorderCard} transition duration-200`}>
      <div className="w-57">
        <p className="text-xs text-secondary bg-teal-50 px-3 py-1 rounded-xl w-auto">{chip}</p>
      </div>
      <div className="flex items-center gap-2">
        <div className={`w-12 h-12 flex items-center justify-center ${bgIcon} rounded-2xl mt-4`}>
        {icon}
        </div>
        <h3 className="text-xl font-semibold text-black mt-5">{title}</h3>
      </div>
      <p className="text-primary-text mt-5">{description}</p>

      <ul className="mt-5 flex flex-col gap-2">
        {details.map((detail, index) => (
          <li key={index} className="text-primary-text">
            <LuCheck size={20} className="inline-block mr-2 text-primary-text" /> 
            {detail}
          </li>
        ))}
      </ul>

      <div className="flex justify-center mt-auto">
        <button 
          className={`bg-white text-black border ${borderButtonColor} px-6 py-2 w-full rounded-xl mt-5 cursor-pointer ${hoverButton} transition duration-200`}
        >
          Conoce más
        </button>
      </div>
    </div>
  )
};

export default CardPack;