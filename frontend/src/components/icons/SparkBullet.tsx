'use client';

import React from 'react';
import { IconBase, IconBaseProps } from './IconBase';

type SparkBulletProps = Omit<IconBaseProps, 'children'>;

export const SparkBullet: React.FC<SparkBulletProps> = (props) => {
  return (
    <IconBase {...props} title={props.title || 'Bullet'}>
      {(gradientId) => (
        <g>
          {/* Central star */}
          <circle cx="12" cy="12" r="2" fill={`url(#${gradientId})`} />
          
          {/* Four rays */}
          <line x1="12" y1="6" x2="12" y2="9" stroke={`url(#${gradientId})`} strokeLinecap="round" />
          <line x1="12" y1="15" x2="12" y2="18" stroke={`url(#${gradientId})`} strokeLinecap="round" />
          <line x1="6" y1="12" x2="9" y2="12" stroke={`url(#${gradientId})`} strokeLinecap="round" />
          <line x1="15" y1="12" x2="18" y2="12" stroke={`url(#${gradientId})`} strokeLinecap="round" />
        </g>
      )}
    </IconBase>
  );
};
