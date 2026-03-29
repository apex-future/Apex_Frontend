const fs = require('fs');
const path = require('path');

const file = path.join(__dirname, 'src/main_app/context/BookContext.jsx');
let content = fs.readFileSync(file, 'utf8');

// 1. imports
content = content.replace(
  "import { shelves as initialShelves } from '../data/shelves';",
  "import useSpaceStore from '../store/spaceStore';"
);

// 2. State definition
content = content.replace(
  "const [shelves, setShelves] = useState(initialShelves);",
  "const [allBooks, setAllBooks] = useState([]);\n  const { spaces } = useSpaceStore();\n\n  const shelves = useMemo(() => {\n    const currentSpaceNames = spaces.map(s => s.name);\n    return spaces.map(space => {\n      const spaceBooks = allBooks.filter(b => {\n        if (space.id === 'favorites') return b.isFavorite;\n        if (space.id === 'bookmarks') return b.isBookmarked;\n        if (space.id === 'active-reading') {\n          const isOrphaned = b.shelfName && !currentSpaceNames.includes(b.shelfName);\n          return b.shelfName === 'Active Reading' || !b.shelfName || isOrphaned;\n        }\n        // Custom space\n        return space.bookIds && (space.bookIds.includes(b.id) || space.bookIds.includes(b.supabaseId));\n      });\n      return { ...space, shelfName: space.name, books: spaceBooks };\n    });\n  }, [spaces, allBooks]);\n\n  const books = allBooks;"
);

// 3. remove old books useMemo
const booksRegex = /const books = useMemo\(\(\) => \{[\s\S]*?\}, \[shelves\]\);/;
content = content.replace(booksRegex, '');

// 4. remove local setShelves logic
// We'll replace all setShelves blocks with setAllBooks blocks carefully.
// This is done by writing a generic replacer for common patterns.
const replacer = (match, p1) => {
  return "setAllBooks((prevBooks) => {\n" +
         "      let updatedBook = null;\n" +
         "      const newBooks = prevBooks.map((book) => {\n" +
         "        " + p1 + "\n" +
         "      });\n" +
         "      if (updatedBook) {\n"; // We'll patch the tail manually if needed
};

// Replace setShelves pattern
// Pattern: setShelves((prevShelves) => { \n let updatedBook = null; \n const newShelves = prevShelves.map((shelf) => ({ \n ...shelf, \n books: shelf.books.map((book) => { <inner> }) \n })); \n if(updatedBook) { <action> } \n return newShelves; \n });
// Actually, regex is hard. Let's just do bulk replacement using RegExp
content = content.replace(/setShelves\(\(prevShelves\) => \{\s*let updatedBook = null;\s*const newShelves = prevShelves\.map\(\(shelf\) => \(\{\s*\.\.\.shelf,\s*books: shelf\.books\.map\(\(book\) => \{([\s\S]*?)\}\),\s*\}\)\);\s*if \(updatedBook\) \{([\s\S]*?)\}\s*return newShelves;\s*\}\);/g, 
  "setAllBooks((prevBooks) => {\n      let updatedBook = null;\n      const newBooks = prevBooks.map((book) => {$1});\n      if (updatedBook) {$2}\n      return newBooks;\n    });"
);

// Update loadBooks: setShelves -> setAllBooks
content = content.replace(/setShelves\(prevShelves => \{[\s\S]*?\}\);/g, "setAllBooks(booksWithProgress);");

// Update addBookToShelf:
content = content.replace(/setShelves\(prev => prev\.map\(shelf =>[\s\S]*?\)\)/g, 
  "setAllBooks(prev => [newBook, ...prev])" // simplified, we'll fix exactly below
);

// Update downloadMissingFile:
content = content.replace(/setShelves\(prevShelves => prevShelves\.map\(shelf => \(\{\s*\.\.\.shelf,\s*books: shelf\.books\.map\(b => b\.id === bookId \? \{ \.\.\.b, file, fileBlob: blob \} : b\)\s*\}\)\)\);/g,
  "setAllBooks(prevBooks => prevBooks.map(b => b.id === bookId ? { ...b, file, fileBlob: blob } : b));"
);

// Update addNote & updateNote & deleteNote:
content = content.replace(/setShelves\(prev => prev\.map\(shelf => \(\{\s*\.\.\.shelf,\s*books: shelf\.books\.map\(book => \{([\s\S]*?)\}\),\s*\}\)\)\);/g, 
  "setAllBooks(prevBooks => prevBooks.map(book => {$1}));"
);

// Update deleteBookFromShelves optimistic UI remove:
content = content.replace(/setShelves\(prev => prev\.map\(shelf => \(\{\s*\.\.\.shelf,\s*books: shelf\.books\.filter\(b => b\.id !== targetId\),\s*\}\)\)\);/g,
  "setAllBooks(prevBooks => prevBooks.filter(b => b.id !== targetId));"
);

// Fix toggleFavorite:
content = content.replace(/setShelves\(\(prevShelves\) => \{[\s\S]*?let updatedBook = null;\s*prevShelves\.forEach\(shelf => \{[\s\S]*?const found = shelf\.books\.find\(b => b\.id === targetId\);[\s\S]*?if \(found\) updatedBook = \{ \.\.\.found, isFavorite: !found\.isFavorite \};[\s\S]*?\}\);[\s\S]*?if \(!updatedBook\) return prevShelves;[\s\S]*?const newShelves = prevShelves\.map\(\(shelf\) => \{[\s\S]*?\}\);[\s\S]*?db\.books\.update\(targetId, \{ isFavorite: updatedBook\.isFavorite \}\)[\s\S]*?\.catch\(err => console\.error\("Failed to update favorite status:", err\)\);[\s\S]*?if \(updatedBook\) \{([\s\S]*?)\}[\s\S]*?return newShelves;[\s\S]*?\}\);/g, 
`setAllBooks((prevBooks) => {
      let updatedBook = null;
      const newBooks = prevBooks.map((book) => {
        if (book.id === targetId) {
          updatedBook = { ...book, isFavorite: !book.isFavorite };
          return updatedBook;
        }
        return book;
      });
      if (!updatedBook) return prevBooks;
      
      db.books.update(targetId, { isFavorite: updatedBook.isFavorite })
        .catch(err => console.error("Failed to update favorite status:", err));

      if (updatedBook) {
        $1
      }
      return newBooks;
    });`
);

// Fix toggleBookmarkedBook:
content = content.replace(/setShelves\(\(prevShelves\) => \{[\s\S]*?let updatedBook = null;\s*prevShelves\.forEach\(shelf => \{[\s\S]*?const found = shelf\.books\.find\(b => b\.id === targetId\);[\s\S]*?if \(found\) updatedBook = \{ \.\.\.found, isBookmarked: !found\.isBookmarked \};[\s\S]*?\}\);[\s\S]*?if \(!updatedBook\) return prevShelves;[\s\S]*?const newShelves = prevShelves\.map\(\(shelf\) => \{[\s\S]*?\}\);[\s\S]*?db\.books\.update\(targetId, \{ isBookmarked: updatedBook\.isBookmarked \}\)[\s\S]*?\.catch\(err => console\.error\("Failed to update bookmark status:", err\)\);[\s\S]*?if \(updatedBook\) \{([\s\S]*?)\}[\s\S]*?return newShelves;[\s\S]*?\}\);/g, 
`setAllBooks((prevBooks) => {
      let updatedBook = null;
      const newBooks = prevBooks.map((book) => {
        if (book.id === targetId) {
          updatedBook = { ...book, isBookmarked: !book.isBookmarked };
          return updatedBook;
        }
        return book;
      });
      if (!updatedBook) return prevBooks;
      
      db.books.update(targetId, { isBookmarked: updatedBook.isBookmarked })
        .catch(err => console.error("Failed to update bookmark status:", err));

      if (updatedBook) {
        $1
      }
      return newBooks;
    });`
);

// Update addBookToShelf manual patches
content = content.replace("setShelves(prev => prev.map(shelf =>\n      shelf.shelfName === shelfName\n        ? { ...shelf, books: [newBook, ...shelf.books] }\n        : shelf\n    ));", "setAllBooks(prev => [newBook, ...prev]);");
content = content.replace("setShelves(prev => prev.map(shelf => ({\n            ...shelf,\n            books: shelf.books.map(b =>\n              b.id === id ? { ...b, isUploading: false, supabaseId: result.id } : b\n            ),\n          })));", "setAllBooks(prev => prev.map(b => b.id === id ? { ...b, isUploading: false, supabaseId: result.id } : b));");
content = content.replace("setShelves(prev => prev.map(shelf => ({\n            ...shelf,\n            books: shelf.books.map(b =>\n              b.id === id ? { ...b, isUploading: false } : b\n            ),\n          })));", "setAllBooks(prev => prev.map(b => b.id === id ? { ...b, isUploading: false } : b));");
content = content.replace("setShelves(prev => prev.map(shelf => ({\n          ...shelf,\n          books: shelf.books.map(b =>\n            b.id === id ? { ...b, isUploading: false } : b\n          ),\n        })));", "setAllBooks(prev => prev.map(b => b.id === id ? { ...b, isUploading: false } : b));");


fs.writeFileSync(file, content, 'utf8');
console.log('Refactor complete');
