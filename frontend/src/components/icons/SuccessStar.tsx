'use client';

import React from 'react';
import { IconBase, IconBaseProps } from './IconBase';

type SuccessStarProps = Omit<IconBaseProps, 'children'>;

export const SuccessStar: React.FC<SuccessStarProps> = (props) => {
  return (
    <IconBase {...props} title={props.title || 'Success'}>
      {(gradientId) => (
        <g>
          {/* Constellation triangle - three star nodes */}
          <circle cx="12" cy="6" r="1.5" fill={`url(#${gradientId})`} />
          <circle cx="6" cy="16" r="1.5" fill={`url(#${gradientId})`} />
          <circle cx="18" cy="16" r="1.5" fill={`url(#${gradientId})`} />
          
          {/* Connecting lines */}
          <line x1="12" y1="6" x2="6" y2="16" stroke={`url(#${gradientId})`} strokeLinecap="round" />
          <line x1="6" y1="16" x2="18" y2="16" stroke={`url(#${gradientId})`} strokeLinecap="round" />
          <line x1="18" y1="16" x2="12" y2="6" stroke={`url(#${gradientId})`} strokeLinecap="round" />
          
          {/* Checkmark overlay */}
          <path
            d="M8 12l2.5 2.5L16 9"
            stroke={`url(#${gradientId})`}
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
          />
        </g>
      )}
    </IconBase>
  );
};
