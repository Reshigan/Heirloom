'use client';

import React from 'react';
import { IconBase, IconBaseProps } from './IconBase';

type ProgressOrbitProps = Omit<IconBaseProps, 'children'>;

export const ProgressOrbit: React.FC<ProgressOrbitProps> = (props) => {
  return (
    <IconBase {...props} title={props.title || 'In Progress'} className={`${props.className || ''} animate-spin-slow`}>
      {(gradientId) => (
        <g>
          {/* Circular orbital path */}
          <circle
            cx="12"
            cy="12"
            r="9"
            fill="none"
            stroke={`url(#${gradientId})`}
            strokeDasharray="4 2"
            opacity="0.4"
          />
          
          {/* Two star nodes on orbit */}
          <circle cx="12" cy="3" r="1.5" fill={`url(#${gradientId})`} />
          <circle cx="21" cy="12" r="1.5" fill={`url(#${gradientId})`} />
          
          {/* Connecting arc */}
          <path
            d="M12 3 A 9 9 0 0 1 21 12"
            fill="none"
            stroke={`url(#${gradientId})`}
            strokeLinecap="round"
          />
        </g>
      )}
    </IconBase>
  );
};
