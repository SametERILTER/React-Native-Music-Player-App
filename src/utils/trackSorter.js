export const SORT_MODES = {
  DEFAULT: 'default',
  TITLE_ASC: 'title_asc',
  TITLE_DESC: 'title_desc',
  DATE_DESC: 'date_desc',
  DURATION_DESC: 'duration_desc',
  DURATION_ASC: 'duration_asc',
};

/**
 * Şarkı listesini belirtilen sıralama moduna göre sıralar.
 * Orijinal diziyi bozmadan yeni bir dizi döndürür.
 */
export const sortTrackList = (tracksList, sortMode) => {
  if (!Array.isArray(tracksList) || tracksList.length <= 1) {
    return tracksList ? [...tracksList] : [];
  }
  const list = [...tracksList];

  switch (sortMode) {
    case 'title_asc':
      return list.sort((a, b) =>
        (a.title || '').localeCompare(b.title || '', 'tr', { sensitivity: 'base', numeric: true })
      );
    case 'title_desc':
      return list.sort((a, b) =>
        (b.title || '').localeCompare(a.title || '', 'tr', { sensitivity: 'base', numeric: true })
      );
    case 'date_desc':
      return list.sort((a, b) => {
        const timeA = a.creationTime || a.dateAdded || 0;
        const timeB = b.creationTime || b.dateAdded || 0;
        if (timeA !== timeB) return timeB - timeA;
        return (b.id || '').localeCompare(a.id || '', undefined, { numeric: true });
      });
    case 'duration_desc':
      return list.sort((a, b) => (b.duration || 0) - (a.duration || 0));
    case 'duration_asc':
      return list.sort((a, b) => (a.duration || 0) - (b.duration || 0));
    case 'default':
    default:
      return list;
  }
};

