import React from "react";

const OpensourceIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 800 768"
    fill="none"
    {...props}
  >
    <path
      d="M400 10C615.398 10 790 184.585 790 399.958C790 557.315 696.772 692.954 562.483 754.562L468.604 510.384C505.457 487.481 530 446.609 530 399.958C530 328.161 471.802 269.971 400 269.971C328.198 269.971 270 328.161 270 399.958C270 446.619 294.587 487.487 331.438 510.419L237.559 754.599C103.226 692.917 10 557.313 10 399.958C10 184.585 184.602 10 400 10Z"
      className="md:fill-black fill-main md:stroke-none stroke-black md:dark:fill-black dark:fill-main"
      strokeWidth={30}
    />
  </svg>
);

export default OpensourceIcon;
