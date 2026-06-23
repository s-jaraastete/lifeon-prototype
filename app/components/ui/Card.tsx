import { ComponentType, ReactNode } from 'react';

interface CardProps {
  title?: string;
  content?: ReactNode;
  icon?: ComponentType<{ className?: string }>;
  iconBgColor?: string;
  iconColor?: string;
}

export default function Card({
  title,
  content,
  icon: Icon,
  iconBgColor,
  iconColor,
}: CardProps) {
  return (
    <div className="flex flex-col bg-white rounded-[22px] p-7.5 gap-7.5 border border-gray-300">
      {(Icon || title) && (
        <div className="flex items-center gap-5.5">
          {Icon && (
            <div className={`
              rounded-[14px] p-3 flex items-center justify-center
              ${iconBgColor || 'bg-secondary'}
            `}>
              <Icon className={`w-6 h-6 ${iconColor || 'text-white'}`} />
            </div>
          )}
          {title && (
            <h3 className="text-2xl font-semibold">
              {title}
            </h3>
          )}
        </div>
      )}
      {content && (
        <div className="flex flex-col text-lg text-primary-text">
          {content}
        </div>
      )}
    </div>
  );
}
