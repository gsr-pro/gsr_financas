import React from 'react';
import { Composition } from 'remotion';
import { ConstructionLogo } from './ConstructionLogo';

export const RemotionRoot: React.FC = () => {
  return (
    <Composition
      id="ConstructionLogoIntro"
      component={ConstructionLogo}
      durationInFrames={150}
      fps={30}
      width={1080}
      height={1080}
      defaultProps={{
        backgroundColor: '#0B132B',
        primaryColor: '#10B981',
        blueprintColor: '#38BDF8',
        accentColor: '#F59E0B',
        showTypography: true,
      }}
    />
  );
};

export default RemotionRoot;
