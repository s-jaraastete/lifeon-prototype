import React from 'react'
import Link from 'next/link';
import { LuCheck } from 'react-icons/lu';

type ModuleCardProps = {
  icon: React.ReactNode;
  bgIcon: string;
  title: string;
  description: string;
  details?: string[];
  chip?: string;
  titleChip?: string;
  buttonLink?: string;
};

const ModuleCard = ({
  chip,
  icon,
  bgIcon,
  title,
  description,
  details,
  titleChip,
  buttonLink
}: ModuleCardProps) => {
  return (
    <div className="border border-gray-300 rounded-3xl p-6 lg:p-7.5 w-full h-full flex flex-col transition duration-200">
      <div className="flex gap-2 items-center">
        <div
          className={`w-12 h-12 flex items-center justify-center ${bgIcon} rounded-2xl`}
        >
          {icon}
        </div>
        <h3 className="text-lg font-semibold leading-tight text-base-black w-[80%]">
          {title}
          {titleChip && (
            <span className="ml-2 text-[10px] font-medium bg-[#DBEAFE] text-[#155DFC] px-1.5 py-0.5 rounded-lg align-middle">
              {titleChip}
            </span>
          )}
        </h3>
      </div>
      <p className="text-primary-text text-sm mt-2.5">{description}</p>

      {details && (
        <ul className="mt-5 flex flex-col gap-2">
          {details.map((detail, index) => (
            <li key={index} className="text-primary-text flex gap-2">
              <LuCheck
                size={20}
                className="inline-block mt-1 text-primary"
              />
              {detail}
            </li>
          ))}
        </ul>
      )}

      {chip && (
        <div className="mt-3">
          <p className="text-xs font-medium text-secondary bg-teal-50 px-3 py-1 rounded-xl w-fit">
            {chip}
          </p>
        </div>
      )}

      <div className="mt-auto w-full">
        {buttonLink && (
          <Link href={buttonLink}>
            <button
              className={`
                bg-white text-secondary border border-secondary
                px-6 py-2 w-full rounded-[14px] mt-5
                hover:bg-teal-50 cursor-pointer transition duration-200
              `}
            >
              Más información
            </button>
          </Link>
        )}
      </div>
    </div>
  );
};

export default ModuleCard;