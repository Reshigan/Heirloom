'use client';

import React from 'react';
import { IconBase, IconBaseProps } from './IconBase';

type ErrorStarProps = Omit<IconBaseProps, 'children'>;

export const ErrorStar: React.FC<ErrorStarProps> = (props) => {
  return (
    <IconBase {...props} title={props.title || 'Error'}>
      {(gradientId) => (
        <g>
          {/* Four-point star constellation */}
          <circle cx="12" cy="4" r="1.5" fill={`url(#${gradientId})`} />
          <circle cx="20" cy="12" r="1.5" fill={`url(#${gradientId})`} />
          <circle cx="12" cy="20" r="1.5" fill={`url(#${gradientId})`} />
          <circle cx="4" cy="12" r="1.5" fill={`url(#${gradientId})`} />
          
          {/* Connecting lines forming X */}
          <line x1="12" y1="4" x2="20" y2="12" stroke={`url(#${gradientId})`} strokeLinecap="round" />
          <line x1="20" y1="12" x2="12" y2="20" stroke={`url(#${gradientId})`} strokeLinecap="round" />
          <line x1="12" y1="20" x2="4" y2="12" stroke={`url(#${gradientId})`} strokeLinecap="round" />
          <line x1="4" y1="12" x2="12" y2="4" stroke={`url(#${gradientId})`} strokeLinecap="round" />
          
          {/* X overlay */}
          <path
            d="M9 9l6 6M15 9l-6 6"
            stroke={`url(#${gradientId})`}
            strokeLinecap="round"
            strokeWidth="2"
          />
        </g>
      )}
    </IconBase>
  );
};
