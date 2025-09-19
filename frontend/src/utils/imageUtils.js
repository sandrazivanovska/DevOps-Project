const createPlaceholderImage = (width = 400, height = 300, text = 'No Image') => {
  const svg = `
    <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
      <rect width="100%" height="100%" fill="#f3f4f6"/>
      <text x="50%" y="50%" font-family="Arial, sans-serif" font-size="14" fill="#6b7280" text-anchor="middle" dy=".3em">
        ${text}
      </text>
    </svg>
  `;
  return `data:image/svg+xml;base64,${btoa(svg)}`;
};

export const getProductImage = (imageUrl, productName = 'Product', width = 400, height = 300) => {
  if (imageUrl && imageUrl.trim() !== '') {
    return imageUrl;
  }
  
  return createPlaceholderImage(width, height, productName);
};

export const handleImageError = (event, productName = 'Product', width = 400, height = 300) => {
  event.target.src = createPlaceholderImage(width, height, productName);
  event.target.onerror = null; 
};

export const ProductImage = ({ 
  src, 
  alt, 
  className = '', 
  width = 400, 
  height = 300,
  ...props 
}) => {
  const imageSrc = getProductImage(src, alt, width, height);
  
  return (
    <img
      src={imageSrc}
      alt={alt}
      className={className}
      onError={(e) => handleImageError(e, alt, width, height)}
      {...props}
    />
  );
};
