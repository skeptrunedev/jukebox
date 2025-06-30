import React from "react";

const SpikeIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 200 200"
    className="text-foreground"
    {...props}
  >
    <path
      fill="currentColor"
      d="m100 5 18.05 63.737L182.272 52.5 136.1 100l46.172 47.5-64.222-16.236L100 195l-18.05-63.736L17.728 147.5 63.9 100 17.728 52.5 81.95 68.737z"
    />
  </svg>
);

export default SpikeIcon;
