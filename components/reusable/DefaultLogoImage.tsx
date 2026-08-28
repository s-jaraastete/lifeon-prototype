import Image from "next/image";
import React from "react";

const DefaultLogoImage = () => {
  return (
    <div className='bg-black w-full h-full rounded-l-lg flex justify-center items-center'>
      <div className='w-[150px] h-[50px] relative'>
        <Image src='/images/safety-academy-logo-white.png' fill alt='default-image'
               className='object-contain rounded-l-lg' sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 20vw"/>
      </div>
    </div>
  )
}

export default DefaultLogoImage