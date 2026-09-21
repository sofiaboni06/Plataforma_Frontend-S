import heroImage from './hero.png'
import senaLogo from './sena-logo.svg'

export const assets = {
  hero: heroImage,
  senaLogo,
  programs: {
    coffee:
      'https://images.unsplash.com/photo-1447933601403-0c6688de566e?auto=format&fit=crop&w=900&q=80',
    chocolate:
      'https://images.unsplash.com/photo-1511381939415-e44015466834?auto=format&fit=crop&w=900&q=80',
    environmental:
      'https://images.unsplash.com/photo-1473445361085-b9a07f55608b?auto=format&fit=crop&w=900&q=80',
    technology:
      'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=900&q=80',
  },
} as const

export { heroImage, senaLogo }
