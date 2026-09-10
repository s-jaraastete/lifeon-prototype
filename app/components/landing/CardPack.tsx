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
  titleStart?: boolean;
  titleChip?: string;
}

const CardPack = ({ chip, icon, bgIcon, title, description, details, borderButtonColor, hoverButton, hoverBorderCard, titleStart = false, titleChip }: CardPackProps) => {
  return (
    <div className={`border-2 border-gray-300 rounded-3xl p-6 w-full h-full lg:h-138.25 flex flex-col ${hoverBorderCard} transition duration-200`}>
      <div className="w-57">
        <p className="text-xs text-secondary bg-teal-50 px-3 py-1 rounded-xl w-auto">{chip}</p>
      </div>
      <div className={`flex gap-2 ${titleStart ? 'items-start' : 'items-center'}`}>
        <div className={`w-12 h-12 flex items-center justify-center ${bgIcon} rounded-2xl mt-4`}>
        {icon}
        </div>
        <h3 className="text-xl font-semibold text-base-black w-50 mt-3">
          {title}
          {titleChip && (
            <span className="ml-2 text-[10px] font-medium bg-[#DBEAFE] text-blue-600 px-1.5 py-0.5 rounded-lg align-middle">
              {titleChip}
            </span>
          )}
        </h3>
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