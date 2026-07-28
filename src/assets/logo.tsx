import { cn } from '@/lib/utils'

type LogoProps = {
  className?: string
  size?: number
}

export function Logo({ className, size = 24 }: LogoProps) {
  return (
    <img
      src='/images/nuclear-logo.jpg'
      alt='เกษตรนิวเคลียร์'
      width={size}
      height={size}
      className={cn('rounded-full object-cover', className)}
      style={{ width: size, height: size }}
    />
  )
}

export function LogoImage({ className }: { className?: string }) {
  return (
    <img
      src='/images/nuclear-logo.jpg'
      alt='เกษตรนิวเคลียร์'
      className={cn('size-full object-cover', className)}
    />
  )
}
