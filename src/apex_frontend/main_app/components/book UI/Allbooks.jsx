import { books } from '../../data/books';
import BookCard from '../books/BookCard';

export default function Allbooks() {
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 p-3">
            {books.map(book => <BookCard key={book.id} book={book} />)}
        </div>
    );
}
