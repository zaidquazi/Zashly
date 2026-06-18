/**
 * Performance-optimized image with lazy loading and async decode.
 */
const OptimizedImage = ({
  src,
  alt,
  className = "",
  width,
  height,
  priority = false,
  ...props
}) => (
  <img
    src={src}
    alt={alt}
    className={className}
    width={width}
    height={height}
    loading={priority ? "eager" : "lazy"}
    decoding="async"
    fetchPriority={priority ? "high" : "auto"}
    {...props}
  />
);

export default OptimizedImage;
