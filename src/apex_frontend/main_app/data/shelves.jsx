/**
 * Shelves Data:
 * Now structured as an array of objects.
 * Each object contains a 'shelfName' and an array of 'books'.
 * Books will be loaded from IndexedDB.
 */
export const shelves = [
  {
    shelfName: 'Active Reading',
    books: [
      {
        id: 999,
        title: 'Troubleshooting Apex',
        author: 'Apex Team',
        progress: 50,
        currentPage: 10,
        totalPages: 20,
        status: 'literature',
        lastAccessed: new Date().toISOString(),
        cover: null
      }
    ]
  },
  {
    shelfName: 'New & Upcoming',
    books: []
  },
  {
    shelfName: 'Favorites',
    books: []
  }
];
