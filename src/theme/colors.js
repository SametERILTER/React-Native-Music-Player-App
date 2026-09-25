/**
 * Uygulama Renk Paleti (Refined Neutral Luxe)
 * Verilen palet üzerinden optimize edilmiş temel renk tokenları.
 */

export const colors = {
  // Zemin ve Arka Plan
  background: '#f3f3f3ff',
  backgroundSecondary: '#F3F3F4',

  // Kartlar ve Yüzeyler
  card: '#FFFFFF',                  // surface-container-lowest
  cardSubtle: '#F3F3F4',            // surface-container-low
  cardSelected: '#EEEEEE',          // surface-container
  cardHigh: '#E8E8E8',              // surface-container-high

  // Kenarlıklar ve Çizgiler
  border: '#E2E2E2',                // surface-container-highest
  borderLight: '#EEEEEE',           // surface-container
  borderMuted: '#C8C5CA',           // outline-variant

  // Tipografi ve Metin Renkleri
  headerTitle: '#000000ff',           // Ekran başlıkları (tam koyu siyah)
  textPrimary: '#000000',           // on-surface / on-background
  textSecondary: '#47464A',         // on-surface-variant
  textMuted: '#78767B',             // outline
  textTertiary: '#9E9CA1',          // yumuşak sayaç/süre tonu
  textInverse: '#FFFFFF',           // on-primary

  // Birincil ve Vurgu Renkleri
  primary: '#000000',               // primary
  primaryHover: '#1C1B1D',          // primary-container
  primaryContrast: '#FFFFFF',       // on-primary
  secondary: '#5D5E66',             // secondary

  // Yüzen Tab Bar ve Mini Player (Koyu Grimsi Ton: #28292E)
  tabBarBackground: '#FFFFFF',
  tabBarActive: '#28292E',
  tabBarInactive: '#78767B',
  tabBarPill: '#28292E',

  // Mini Player
  miniPlayerBackground: '#28292E',
  miniPlayerTextPrimary: '#FFFFFF',
  miniPlayerTextSecondary: '#A5A6AF',
  progressBarBackground: '#E8E8E8',
  progressBarFill: '#000000',

  // Hata ve Vurgu
  error: '#BA1A1A',
};

export default colors;
