'use client';

import React from 'react';
import { IconBase, IconBaseProps } from './IconBase';

type WarningStarProps = Omit<IconBaseProps, 'children'>;

export const WarningStar: React.FC<WarningStarProps> = (props) => {
  return (
    <IconBase {...props} title={props.title || 'Warning'}>
      {(gradientId) => (
        <g>
          {/* Triangle constellation - three star nodes */}
          <circle cx="12" cy="5" r="1.5" fill={`url(#${gradientId})`} />
          <circle cx="5" cy="19" r="1.5" fill={`url(#${gradientId})`} />
          <circle cx="19" cy="19" r="1.5" fill={`url(#${gradientId})`} />
          
          {/* Connecting lines */}
          <line x1="12" y1="5" x2="5" y2="19" stroke={`url(#${gradientId})`} strokeLinecap="round" />
          <line x1="5" y1="19" x2="19" y2="19" stroke={`url(#${gradientId})`} strokeLinecap="round" />
          <line x1="19" y1="19" x2="12" y2="5" stroke={`url(#${gradientId})`} strokeLinecap="round" />
          
          {/* Exclamation mark overlay */}
          <path
            d="M12 9v4M12 16h.01"
            stroke={`url(#${gradientId})`}
            strokeLinecap="round"
            strokeWidth="2"
          />
        </g>
      )}
    </IconBase>
  );
};
