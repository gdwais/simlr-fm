/**
 * Cover Art Archive types
 */

export type CoverArtSize = 'small' | 'large';

export interface CoverArtImage {
  approved: boolean;
  back: boolean;
  front: boolean;
  id: string;
  thumbnails: {
    small: string;
    large: string;
  };
}

export interface CoverArtResponse {
  images: CoverArtImage[];
  release: string;
}
