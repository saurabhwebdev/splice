const UNSPLASH_ACCESS_KEY = 'pv6Kih29tDJKIFyOu3PW9Wc9v_1rG1vpzcpDS-1XD-I';

export interface UnsplashImage {
  id: string;
  urls: {
    regular: string;
    small: string;
  };
  alt_description: string;
  user: {
    name: string;
    links: {
      html: string;
    };
  };
}

export async function searchUnsplashImages(query: string): Promise<UnsplashImage[]> {
  try {
    const response = await fetch(
      `https://api.unsplash.com/search/photos?query=${encodeURIComponent(query)}&per_page=12`,
      {
        headers: {
          'Authorization': `Client-ID ${UNSPLASH_ACCESS_KEY}`,
          'Accept-Version': 'v1',
          'Content-Type': 'application/json',
        },
        mode: 'cors',
      }
    );

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data.results;
  } catch (error) {
    console.error('Unsplash API error:', error);
    throw new Error('Failed to fetch images from Unsplash. Please try again later.');
  }
}

export function getUnsplashAttribution(image: UnsplashImage): string {
  return `Photo by ${image.user.name} on Unsplash`;
} 