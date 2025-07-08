
import React from 'react';

export const TrophyIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    strokeWidth={1.5}
    stroke="currentColor"
    {...props}
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M16.5 18.75h-9a9.75 9.75 0 011.056-4.243 12.75 12.75 0 0115.888 0A9.75 9.75 0 0122.5 18.75h-2.25m-13.5 0h11.25m-11.25 0V15m11.25 3.75V15m0 0a12.75 12.75 0 00-11.25 0M12 2.25v9.75m0 0a2.25 2.25 0 01-2.25 2.25H7.5a2.25 2.25 0 01-2.25-2.25M12 12v-.003M12 12a2.25 2.25 0 002.25 2.25h2.25a2.25 2.25 0 002.25-2.25M12 12v-.003"
    />
  </svg>
);
