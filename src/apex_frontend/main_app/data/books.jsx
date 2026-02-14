import atomicHabits from "../../../assets/book_covers/Atomic-habits.jpeg";
import biology from "../../../assets/book_covers/biology.jpeg";
import accounting from "../../../assets/book_covers/accounts.jpeg";


export const books = [
    { id: 1, title: 'Atomic Habits', author: 'James Clear', progress: 50, currentPage: 150, totalPages: 300, cover: atomicHabits, status: 'uncompleted', lastAccessed: '2024-02-14T12:00:00' },
    { id: 2, title: 'Biology', author: 'Thomas D. Polad', progress: 75, currentPage: 300, totalPages: 400, cover: biology, status: 'uncompleted', lastAccessed: '2024-02-14T12:00:00' },
    { id: 3, title: 'Accounting', author: 'Greg Shields', progress: 25, currentPage: 25, totalPages: 100, cover: accounting, status: 'new', lastAccessed: '2024-01-01T09:00:00' },
];