// Utility functions for handling product images

// Create a simple SVG placeholder as a data URI
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

// Get product image with fallback
export const getProductImage = (imageUrl, productName = 'Product', width = 400, height = 300) => {
  // If imageUrl exists and is not empty, use it
  if (imageUrl && imageUrl.trim() !== '') {
    return imageUrl;
  }
  
  // Otherwise, use our SVG placeholder
  return createPlaceholderImage(width, height, productName);
};

// Handle image load errors
export const handleImageError = (event, productName = 'Product', width = 400, height = 300) => {
  event.target.src = createPlaceholderImage(width, height, productName);
  event.target.onerror = null; // Prevent infinite loop
};

// Image component with error handling
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
