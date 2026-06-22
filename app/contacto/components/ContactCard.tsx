import { ComponentType, ReactNode } from 'react';

interface ContactCardProps {
  icon: ComponentType<{ className?: string }>;
  title: string;
  content: ReactNode;
}

export default function ContactCard({ icon: Icon, title, content }: ContactCardProps) {
  return (
    <div className="flex flex-col bg-white rounded-[22px] p-7.5 gap-7.5 border border-gray-300">
      <div className="flex items-center gap-5.5">
        <div className="bg-secondary rounded-[14px] p-3 flex items-center justify-center">
          <Icon className="w-6 h-6 text-white" />
        </div>
        <h3 className="text-2xl font-semibold">{title}</h3>
      </div>
      <div className="flex flex-col text-lg text-primary-text">{content}</div>
    </div>
  );
}
