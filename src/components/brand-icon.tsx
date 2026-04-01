import { siteConfig } from '@/config/site.config';
import { icons, type LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils/cn';

interface BrandIconProps {
  className?: string;
  size?: number;
  withBackground?: boolean;
  bgClassName?: string;
}

export function BrandIcon({
  className,
  size = 18,
  withBackground = false,
  bgClassName = 'w-8 h-8',
}: BrandIconProps) {
  const config = siteConfig.brandIcon;

  let icon: React.ReactNode;

  if (config.type === 'lucide') {
    const IconComponent = icons[config.name as keyof typeof icons] as LucideIcon | undefined;
    if (IconComponent) {
      icon = <IconComponent className={className} size={size} />;
    } else {
      icon = (
        <span className={cn('font-bold', className)} style={{ fontSize: size * 0.7 }}>
          {siteConfig.name[0]}
        </span>
      );
    }
  } else {
    icon = (
      <span className={cn('font-bold', className)} style={{ fontSize: size * 0.7 }}>
        {siteConfig.name[0]}
      </span>
    );
  }

  if (withBackground) {
    return (
      <div className={cn('bg-primary rounded-lg flex items-center justify-center', bgClassName)}>
        <div className="text-primary-foreground">{icon}</div>
      </div>
    );
  }

  return <>{icon}</>;
}
