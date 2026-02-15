import atomicHabits from "../../../assets/book_covers/Atomic-habits.jpeg";
import biology from "../../../assets/book_covers/biology.jpeg";
import accounting from "../../../assets/book_covers/accounts.jpeg";
import physics from "../../../assets/book_covers/physics.jpeg";

/**
 * Shelves Data:
 * Now structured as an array of objects.
 * Each object contains a 'shelfName' and an array of 'books'.
 */
export const shelves = [
  {
    shelfName: 'Active Reading',
    books: [
      { id: 1, title: 'Atomic Habits', author: 'James Clear', progress: 50, cover: atomicHabits, status: 'Literature' },
      { id: 2, title: 'Biology', author: 'Thomas D. Polad', progress: 75, cover: biology, status: 'Science' },
    ]
  },
  {
    shelfName: 'New & Upcoming',
    books: [
      { id: 3, title: 'Accounting', author: 'Greg Shields', progress: 25, cover: accounting, status: 'Commerce' },
      { id: 4, title: 'Advanced Physics', author: 'Albert Einstein', progress: 67, cover: physics, status: 'Science' },
    ]
  },
  {
    shelfName: 'Favorites',
    books: [
       { id: 5, title: 'Psychology of Money', author: 'Morgan Housel', progress: 0, cover: atomicHabits, status: 'Literature' },
    ]
  }
];
