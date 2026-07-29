import Image from "next/image";
import { cn } from "@/lib/cn";

type Props = {
  size?: number;
  className?: string;
  priority?: boolean;
};

/** 品牌 Logo：/logo.webp */
export function BrandLogo({ size = 32, className, priority }: Props) {
  return (
    <Image
      src="/logo.webp"
      alt="Zpdf_practice"
      width={size}
      height={size}
      priority={priority}
      className={cn("rounded-lg object-cover", className)}
    />
  );
}
