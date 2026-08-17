import Image from 'next/image';
import Link from 'next/link';
import React, { ReactNode } from 'react'


type EcoSystemProps = {
  title: ReactNode;
  description: string;
  image: string;
}

const EcoSystemSection = ({title, description, image}: EcoSystemProps) => {
  return (
    <section className="w-full mb-10 mt-25 px-4 xl:px-0">
      <div className="max-w-325 mx-auto flex">
        <div className='w-full flex justify-center mt-10 mr-10'>
          <Image className='object-cover w-112.5 border' src={image} alt='img-module' width={1000}  height={1000} />
        </div>

        <div className='flex flex-col justify-center'>
          <h2 className="text-[30px] leading-14 font-semibold mb-4 text-base-black lg:w-165.75 lg:text-5xl">
            {title}
          </h2>
          <p className="text-lg text-primary-text lg:w-185">
            {description}
          </p>
          <Link className='mt-7.5' href={"/modulos"}>
            <button className="w-full border border-secondary text-secondary py-3 rounded-xl hover:bg-gray-300 transition cursor-pointer sm:w-59.25">
              Conoce todos los módulos
            </button>
          </Link>
        </div>
      </div>
    </section>
  )
};

export default EcoSystemSection;