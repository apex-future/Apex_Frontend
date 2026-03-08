/**
 * Shelves Data:
 * Now structured as an array of objects.
 * Each object contains a 'shelfName' and an array of 'books'.
 * Books will be loaded from IndexedDB.
 */
export const shelves = [
  {
    shelfName: 'Active Reading',
    books: []
  },
  {
    shelfName: 'New & Upcoming',
    books: []
  },
  {
    shelfName: 'Favorites',
    books: []
  },
  {
    shelfName: 'Bookmarks',
    books: []
  }
];
