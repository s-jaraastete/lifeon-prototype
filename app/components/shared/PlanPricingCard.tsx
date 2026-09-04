import React from 'react'

export type PlanFeature = {
  icon: React.ReactNode
  text: string
  boldText?: string
  suffix?: string
  hasAiBadge?: boolean
}

export type PlanPricingCardProps = {
  title: string
  subtitle: string
  price?: string | null
  period?: string | null
  buttonText: string
  buttonVariant?: 'primary' | 'secondary'
  badge?: string | null
  isPopular?: boolean
  features: PlanFeature[]
  footerText?: string | null
  onButtonClick?: () => void
}

const PlanPricingCard = ({
  title,
  subtitle,
  price,
  period,
  buttonText,
  buttonVariant = 'primary',
  badge,
  isPopular = false,
  features,
  footerText,
  onButtonClick,
}: PlanPricingCardProps) => {
  return (
    <div
      className={`relative bg-white rounded-[22px] p-6 lg:p-5 flex flex-col justify-between w-full h-full transition-all duration-200 ${
        isPopular ? 'border-2 border-primary' : 'border border-gray-400'
      }`}
    >
      {/* Top Badge */}
      {badge && (
        <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-red-100 text-primary border-3 border-white text-xs font-medium px-3 py-0.5 rounded-full whitespace-nowrap z-10">
          {badge}
        </div>
      )}

      <div>
        <div className="min-h-28 flex flex-col gap-2 justify-between">
          {/* Card Header */}
          <div>
            <h3 className="text-2xl font-semibold text-base-black">{title}</h3>
            <p className="text-primary-text leading-snug">{subtitle}</p>
          </div>
          {/* Price Section */}
          <div className="flex items-center gap-1.5">
            {price ? (
              <>
                <span className="text-3xl font-semibold text-base-black">{price}</span>
                {period && <span className="text-sm text-primary-text font-normal">{period}</span>}
              </>
            ) : null}
          </div>
        </div>

        {/* CTA Button */}
        <button
          type="button"
          onClick={onButtonClick}
          className={`w-full py-3 px-4 rounded-[14px] font-medium text-center transition cursor-pointer mt-5.5 text-sm lg:text-base ${
            buttonVariant === 'secondary'
              ? 'bg-secondary text-white hover:bg-teal-600'
              : 'bg-primary text-white hover:bg-primary-hover'
          }`}
        >
          {buttonText}
        </button>

        {/* Divider */}
        <div className="w-full h-px bg-gray-400 my-6" />

        {/* Features List */}
        <ul className="space-y-3.5 flex-1">
          {features.map((feature, index) => (
            <li key={index} className="flex items-center gap-3 text-sm">
              {feature.icon}

              {/* Feature Text */}
              <span className="text-sm text-primary-text leading-snug">
                {feature.text}
                {feature.boldText && (
                  <strong className="font-medium">{feature.boldText}</strong>
                )}
                {feature.suffix && <span>{feature.suffix}</span>}
                {feature.hasAiBadge && (
                  <span className="ml-1.5 inline-flex items-center text-[8px] font-medium bg-[#dbeafe] text-[#2563eb] px-1 py-0.5 rounded-md align-middle">
                    IA
                  </span>
                )}
              </span>
            </li>
          ))}
        </ul>
      </div>

      {/* Footer Text */}
      {footerText ? (
        <p className="text-xs text-secondary-text mt-8">{footerText}</p>
      ) : null}
    </div>
  )
}

export default PlanPricingCard
