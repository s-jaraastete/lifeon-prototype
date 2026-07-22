"use client";

/* Import Swiper React components */
import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay } from "swiper/modules";
/* import Swiper styles */
import "swiper/css";
import styles from "./styles/customSwiper.module.css";
import "swiper/css/autoplay";
import React from "react";

interface SwiperCarousel {
  children: React.ReactNode;
  rightToLeft?: boolean;
  slidesToShow?: number | "auto";
  slideTransitionSpeed?: number;
  slideOnScreenTime?: number;
  centeredSlides?: boolean;
  slidesOffsetBefore?: number;
  slidesOffsetAfter?: number;
  linear?: boolean;
  spaceBetween?: string | number | undefined;
  uniformGap?: number;
  breakpoints?: Record<number, any>;
}

const SwiperCarousel = ({
  rightToLeft = false,
  slidesToShow = 1,
  children,
  slideTransitionSpeed = 5000,
  slideOnScreenTime = 0,
  centeredSlides = false,
  slidesOffsetBefore = 0,
  slidesOffsetAfter = 0,
  linear = true,
  spaceBetween = 0,
  uniformGap = 0,
  breakpoints,
}: SwiperCarousel) => {
  return (
    <div
      className={` ${
        linear ? styles.mySwiperOverride : ""
      } w-full h-full`}
      style={uniformGap > 0 ? { "--swiper-gap": `${uniformGap}px` } as React.CSSProperties : undefined}
    >
      <Swiper
        speed={slideTransitionSpeed}
        modules={[Autoplay]}
        spaceBetween={uniformGap > 0 ? 0 : spaceBetween}
        slidesPerView={slidesToShow}
        breakpoints={breakpoints}
        autoplay={{
          delay: slideOnScreenTime,
          disableOnInteraction: false,
          pauseOnMouseEnter: true,
          reverseDirection: rightToLeft,
        }}
        loop={true}
        effect={"slide"}
        centeredSlides={centeredSlides}
        slidesOffsetBefore={slidesOffsetBefore}
        slidesOffsetAfter={slidesOffsetAfter}
      >
        {React.Children.map(children, (child, index) => (
          <SwiperSlide key={index}>{child}</SwiperSlide>
        ))}
      </Swiper>
    </div>
  );
};

export default SwiperCarousel;
