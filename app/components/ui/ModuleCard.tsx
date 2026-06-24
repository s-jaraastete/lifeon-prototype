import React from 'react'


type ModuleCardProps = {
  icon: React.ReactNode;
  bgIcon: string;
  border?: string;
  borderColor?: string;
  size?: 'sm' | 'md' | 'lg';
}

const ModuleCard = ({ icon, bgIcon, border, borderColor, size }: ModuleCardProps) => {
  let sizeClasses = '';
  switch (size) {
    case 'sm':
      sizeClasses = 'w-8 h-8';
      break;
    case 'md':
      sizeClasses = 'w-12 h-12';
      break;
    case 'lg':
      sizeClasses = 'w-16 h-16';
      break;
    default:
      sizeClasses = 'w-12 h-12';
  }

  return (
    <div className={`flex items-center justify-center ${bgIcon} ${border} ${borderColor} rounded-2xl ${sizeClasses} relative transition-all duration-300 `}>
      {icon}
    </div>
  )
};

export default ModuleCard;