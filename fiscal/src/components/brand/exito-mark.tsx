import Image from "next/image";

type Props = {
  size?: number;
  priority?: boolean;
  className?: string;
};

export function ExitoMark({ size = 32, priority = false, className = "" }: Props) {
  return (
    <Image
      src="/exito-logo.png"
      alt=""
      aria-hidden
      width={size}
      height={size}
      priority={priority}
      className={`shrink-0 object-contain ${className}`}
      style={{ width: size, height: size }}
    />
  );
}
