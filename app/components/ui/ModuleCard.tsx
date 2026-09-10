import React from 'react'


type ModuleCardProps = {
  icon: React.ReactNode;
}

const ModuleCard = ({ icon }: ModuleCardProps) => {
  return (
    <div className="relative transition-all duration-300">
      {icon}
    </div>
  )
};

export default ModuleCard;
