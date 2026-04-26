import { createElement, type ImgHTMLAttributes } from 'react'

const BRAND_MARK_DIMENSION = 160

type BrandMarkProps = Omit<ImgHTMLAttributes<HTMLImageElement>, 'src' | 'alt' | 'width' | 'height'> & {
  alt?: string
  decorative?: boolean
}

export function BrandMark({
  alt = 'Eikon',
  className,
  decorative = false,
  ...props
}: BrandMarkProps) {
  const classes = ['shrink-0 select-none', className].filter(Boolean).join(' ')

  return createElement('img', {
    src: '/logo.svg',
    alt: decorative ? '' : alt,
    'aria-hidden': decorative ? true : undefined,
    width: BRAND_MARK_DIMENSION,
    height: BRAND_MARK_DIMENSION,
    className: classes,
    decoding: 'async',
    draggable: false,
    ...props,
  })
}
