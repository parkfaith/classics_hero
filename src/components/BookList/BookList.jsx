import { useState, useEffect } from 'react';
import BookCard from './BookCard';
import { fetchBooks } from '../../api';
import { useLearningProgress } from '../../hooks/useLearningProgress';
import './BookList.css';

const BookList = ({ onBookSelect, onTalkToHero }) => {
  const [filter, setFilter] = useState('all');
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { getBookStats } = useLearningProgress();

  useEffect(() => {
    const loadBooks = async () => {
      try {
        setLoading(true);
        const data = await fetchBooks();
        setBooks(data);
        setError(null);
      } catch (err) {
        setError('책 목록을 불러오는데 실패했습니다.');
        console.error('Failed to fetch books:', err);
      } finally {
        setLoading(false);
      }
    };
    loadBooks();
  }, []);

  const filteredBooks = books.filter(book => {
    if (filter === 'all') return true;
    return book.difficulty === filter;
  });

  if (loading) {
    return (
      <div className="book-list-container">
        <div className="loading">책 목록을 불러오는 중...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="book-list-container">
        <div className="error">{error}</div>
      </div>
    );
  }

  return (
    <div className="book-list-container">
      <div className="filter-section">
        <label>난이도:</label>
        <div className="filter-buttons">
          <button
            className={filter === 'all' ? 'active' : ''}
            onClick={() => setFilter('all')}
          >
            전체
          </button>
          <button
            className={filter === 'easy' ? 'active' : ''}
            onClick={() => setFilter('easy')}
          >
            쉬움
          </button>
          <button
            className={filter === 'medium' ? 'active' : ''}
            onClick={() => setFilter('medium')}
          >
            보통
          </button>
          <button
            className={filter === 'advanced' ? 'active' : ''}
            onClick={() => setFilter('advanced')}
          >
            어려움
          </button>
        </div>
      </div>

      <div className="books-grid">
        {filteredBooks.map(book => (
          <BookCard
            key={book.id}
            book={book}
            onSelect={onBookSelect}
            learningStats={getBookStats(book.id, book.chapters?.length || 0)}
          />
        ))}
      </div>

      {filteredBooks.length === 0 && (
        <div className="no-books">
          해당 난이도의 책이 없습니다.
        </div>
      )}
    </div>
  );
};

export default BookList;
