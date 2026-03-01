import React from "react";
import { Link } from "react-router-dom";

interface Props {
  title: string;
  subtitle?: string;
  icon: React.ReactNode;
  to?: string;
  iconColor?: string; // Golden color e.g. "#e8c597" or "#b78f3a"
  squareBg?: string; // Background color of the small square under the icon (transparent)
  size?: "sm" | "md" | "lg"; // Easily adjust card size
}

const sizeMap = {
  sm: { card: "w-36 h-36", iconBox: "w-14 h-14", iconSize: "w-8 h-8", title: "text-sm" },
  md: { card: "w-44 h-44", iconBox: "w-16 h-16", iconSize: "w-10 h-10", title: "text-base" },
  lg: { card: "w-52 h-52", iconBox: "w-20 h-20", iconSize: "w-12 h-12", title: "text-lg" },
};

const CategoryCard: React.FC<Props> = ({
  title,
  subtitle,
  icon,
  to,
  iconColor = "#e8c597",
  squareBg = "rgba(232,197,151,0.08)",
  size = "md",
}) => {
  const s = sizeMap[size];

  const content = (
    <div
      className={`bg-white rounded-xl shadow-md border border-gray-100 flex flex-col items-center text-center p-4 ${s.card} transition transform hover:-translate-y-1 hover:shadow-lg`}
      style={{ overflow: "hidden" }}
    >
      {/* Icon inside a transparent golden square */}
      <div
        className={`flex items-center justify-center rounded-lg mb-3 ${s.iconBox}`}
        style={{ background: squareBg }}
      >
        <div style={{ color: iconColor }} className={`${s.iconSize} flex items-center justify-center`}>
          {/* Ensure any SVG uses currentColor for the color */}
          {icon}
        </div>
      </div>

      {/* Title */}
      <div className={`font-playfair font-medium text-gray-900 ${s.title}`}>
        {title}
      </div>

      {subtitle && <div className="text-xs text-gray-500 mt-1">{subtitle}</div>}
    </div>
  );

  if (to) {
    return (
      <Link to={to} className="block">
        {content}
      </Link>
    );
  }

  return content;
};

export default CategoryCard;
