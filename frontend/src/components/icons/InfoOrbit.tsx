'use client';

import React from 'react';
import { IconBase, IconBaseProps } from './IconBase';

type InfoOrbitProps = Omit<IconBaseProps, 'children'>;

export const InfoOrbit: React.FC<InfoOrbitProps> = (props) => {
  return (
    <IconBase {...props} title={props.title || 'Info'}>
      {(gradientId) => (
        <g>
          {/* Central planet */}
          <circle cx="12" cy="12" r="3" fill="none" stroke={`url(#${gradientId})`} />
          
          {/* Orbital ring */}
          <ellipse
            cx="12"
            cy="12"
            rx="9"
            ry="9"
            fill="none"
            stroke={`url(#${gradientId})`}
            strokeDasharray="2 3"
            opacity="0.6"
          />
          
          {/* Info "i" dot */}
          <circle cx="12" cy="8" r="1" fill={`url(#${gradientId})`} />
          
          {/* Info "i" stem */}
          <line
            x1="12"
            y1="11"
            x2="12"
            y2="16"
            stroke={`url(#${gradientId})`}
            strokeLinecap="round"
            strokeWidth="2"
          />
        </g>
      )}
    </IconBase>
  );
};
