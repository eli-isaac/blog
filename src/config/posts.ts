// Post layout configuration
// Adjust these values to change the appearance of all blog post pages.

export const postLayout = {
  /** Max width class for the article container (Tailwind) */
  maxWidth: 'max-w-2xl',

  /** Center content horizontally on desktop */
  desktopCenter: 'mx-auto',

  /** Top padding: mobile / desktop */
  paddingTop: 'pt-12 md:pt-24',

  /** Bottom padding */
  paddingBottom: 'pb-24',

  /** Horizontal padding on mobile (removed on desktop) */
  mobilePaddingX: 'px-6 md:px-0',
}

// Post text styling
export const postText = {
  /** Body text color (Tailwind arbitrary color) — softer than pure black */
  body: 'text-[#4a5568]',

  /** Heading text color */
  heading: 'text-[#2d3748]',

  /** Table header text color */
  tableHeader: 'text-[#2d3748]',

  /** Muted/secondary text (blockquotes, captions) */
  muted: 'text-[#718096]',
}
