import { useEffect } from 'react';

interface PageMetaOptions {
  title: string;
  description: string;
  keywords?: string;
  canonicalPath?: string;
  ogImage?: string;
  ogType?: string;
  noIndex?: boolean;
}

const BASE_URL = 'https://aulaclick.lovable.app';
const DEFAULT_OG_IMAGE = `${BASE_URL}/navicon.png`;

export const usePageMeta = ({
  title,
  description,
  keywords,
  canonicalPath = '/',
  ogImage = DEFAULT_OG_IMAGE,
  ogType = 'website',
  noIndex = false,
}: PageMetaOptions) => {
  useEffect(() => {
    // Update document title
    document.title = title;

    // Helper to update or create meta tag
    const setMetaTag = (name: string, content: string, isProperty = false) => {
      const attribute = isProperty ? 'property' : 'name';
      let element = document.querySelector(`meta[${attribute}="${name}"]`);
      
      if (!element) {
        element = document.createElement('meta');
        element.setAttribute(attribute, name);
        document.head.appendChild(element);
      }
      element.setAttribute('content', content);
    };

    // Helper to update or create link tag
    const setLinkTag = (rel: string, href: string) => {
      let element = document.querySelector(`link[rel="${rel}"]`);
      
      if (!element) {
        element = document.createElement('link');
        element.setAttribute('rel', rel);
        document.head.appendChild(element);
      }
      element.setAttribute('href', href);
    };

    // Primary meta tags
    setMetaTag('title', title);
    setMetaTag('description', description);
    if (keywords) {
      setMetaTag('keywords', keywords);
    }
    
    // Robots
    if (noIndex) {
      setMetaTag('robots', 'noindex, nofollow');
    } else {
      setMetaTag('robots', 'index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1');
    }

    // Canonical URL
    const canonicalUrl = `${BASE_URL}${canonicalPath}`;
    setLinkTag('canonical', canonicalUrl);

    // Open Graph tags
    setMetaTag('og:title', title, true);
    setMetaTag('og:description', description, true);
    setMetaTag('og:url', canonicalUrl, true);
    setMetaTag('og:image', ogImage, true);
    setMetaTag('og:type', ogType, true);

    // Twitter tags
    setMetaTag('twitter:title', title);
    setMetaTag('twitter:description', description);
    setMetaTag('twitter:url', canonicalUrl);
    setMetaTag('twitter:image', ogImage);

  }, [title, description, keywords, canonicalPath, ogImage, ogType, noIndex]);
};

export default usePageMeta;
