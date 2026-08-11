import Image from 'next/image';
import Link from 'next/link';
import { type ReactNode } from 'react';

import { LuChevronRight } from 'react-icons/lu';

type BannerSectionProps = {
  title: ReactNode;
  description: string;
  buttonLabel?: string;
  buttonUrl: string;
  image?: string;
  textColor?: 'light' | 'dark';
};

const BannerSection = ({
  title,
  description,
  buttonLabel = 'Comienza ahora',
  buttonUrl = '/',
  image = '/images/banner-notebook.png',
  textColor = 'light',
}: BannerSectionProps) => {
  const textClasses = textColor === 'dark' ? 'text-base-black' : 'text-white';
  return (
    <section className="w-full py-5 lg:py-15 px-4 xl:px-0">
      <div className="max-w-325 mx-auto">
        <div
          className="relative w-full flex flex-col min-h-40 sm:min-h-72 md:min-h-80 lg:min-h-96 rounded-[22px] overflow-hidden"
        >
          <Image
            src={image}
            alt="Banner"
            fill
            className="h-full object-cover object-[45%]"
          />

          <div className="relative flex-1 p-5 md:p-8 lg:p-10 flex flex-col justify-between">
            <div className="w-[80%] lg:w-160 flex flex-col gap-2.5">
              <h2 className={`text-2xl sm:text-4xl md:text-5xl font-semibold leading-tight lg:w-160 ${textClasses}`}>
                {title}
              </h2>
              <p className={`hidden lg:block lg:text-lg ${textClasses}`}>
                {description}
              </p>
            </div>
            <div className="flex lg:mt-5.5">
              <Link
                href={buttonUrl}
                className="text-white sm:text-black sm:bg-white sm:px-6 py-3 rounded-xl sm:hover:bg-gray-300 transition cursor-pointer flex items-center"
              >
                {buttonLabel}
                <LuChevronRight
                  size={20}
                  className="inline-block sm:ml-2 text-white sm:text-black"
                />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
};

export default BannerSection;
