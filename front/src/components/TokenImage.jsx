import React, { useState, useEffect } from 'react';

const fallbackUrl =
  'https://upload.wikimedia.org/wikipedia/commons/8/89/HD_transparent_picture.png'; // transparent fallback

const TokenImage = ({ src, size = 64, style = {} }) => {
  const [imgSrc, setImgSrc] = useState(src);

  // Update imgSrc when src prop changes
  useEffect(() => {
    console.log('TokenImage received src:', src);
    setImgSrc(src);
  }, [src]);

  return (
    <img
      src={imgSrc || fallbackUrl}
      alt="Token Logo"
      width={size}
      height={size}
      style={{
        borderRadius: '8px',
        objectFit: 'cover',
        display: 'block',
        ...style,
      }}
      onError={(e) => {
        console.error('TokenImage failed to load:', imgSrc, e);
        setImgSrc(fallbackUrl);
      }}
      onLoad={() => {
        console.log('TokenImage loaded successfully:', imgSrc);
      }}
    />
  );
};

export default TokenImage; 