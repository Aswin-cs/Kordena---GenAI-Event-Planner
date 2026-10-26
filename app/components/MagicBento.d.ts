import React from "react";

export interface MagicBentoItem {
  id?: string | number;
  title?: string;
  description?: string;
  label?: string;
  icon?: React.ReactNode;
  image?: string;
  visual?: string | React.ReactNode;
  content?: React.ReactNode;
  href?: string;
  target?: string;
  rel?: string;
  colSpan?: number;
  rowSpan?: number;
  onClick?: (event?: React.MouseEvent) => void;
  [key: string]: any;
}

export interface MagicBentoProps {
  items?: MagicBentoItem[];
  columns?: number;
  rowHeight?: number;
  gap?: number;
  radius?: number;
  theme?: "dark" | "light";
  glowColor?: string;
  textAutoHide?: boolean;
  enableBorderGlow?: boolean;
  enableSpotlight?: boolean;
  spotlightRadius?: number;
  enableStars?: boolean;
  particleCount?: number;
  enableTilt?: boolean;
  enableMagnetism?: boolean;
  clickEffect?: boolean;
  intro?: boolean;
  disableAnimations?: boolean;
  onItemClick?: (item: MagicBentoItem, index: number) => void;
  className?: string;
  style?: React.CSSProperties;
}

declare const MagicBento: React.FC<MagicBentoProps>;
export default MagicBento;
