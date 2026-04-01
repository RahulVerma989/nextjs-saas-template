export type OGPageType =
  | 'home'
  | 'page'
  | 'privacy'
  | 'terms'
  | 'contact'
  | 'about'
  | 'login'
  | 'default';

export interface OGImageData {
  type: OGPageType;
  title: string;
  description?: string;
  primaryColor?: string;
  logoUrl?: string;
  authorName?: string;
  date?: string;
  tags?: string[];
}
