import { useState } from 'react';
import './BookCard.css';

// 기본 책 아이콘 컴포넌트
const DefaultBookIcon = () => (
  <svg viewBox="0 0 24 24" fill="white" className="book-card-icon">
    <path d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
  </svg>
);

const BookCard = ({ book, onSelect, learningStats }) => {
  const [imageError, setImageError] = useState(false);
  const hasProgress = learningStats && (learningStats.readingCompleted > 0 || learningStats.speakingCompleted > 0);
  const isFullyCompleted = learningStats && learningStats.overallPercentage === 100;

  // 이미지 로드 실패 핸들러
  const handleImageError = () => {
    setImageError(true);
  };

  return (
    <div className={`book-card ${isFullyCompleted ? 'completed' : ''}`} onClick={() => onSelect(book)}>
      <div className="book-card-cover" style={{ background: book.coverColor || '#3b82f6' }}>
        {book.coverImage && !imageError ? (
          <img
            src={book.coverImage}
            alt={book.title}
            className="book-card-image"
            onError={handleImageError}
          />
        ) : (
          <DefaultBookIcon />
        )}
        {isFullyCompleted && (
          <div className="completed-badge">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
            </svg>
          </div>
        )}
      </div>

      {hasProgress && (
        <div className="learning-progress-bar">
          <div className="progress-track">
            <div
              className="progress-reading"
              style={{ width: `${learningStats.readingPercentage}%` }}
              title={`읽기 ${learningStats.readingPercentage}%`}
            />
            <div
              className="progress-speaking"
              style={{ width: `${learningStats.speakingPercentage}%` }}
              title={`말하기 ${learningStats.speakingPercentage}%`}
            />
          </div>
          <div className="progress-labels">
            <span className="label-reading">📖 {learningStats.readingCompleted}/{learningStats.totalChapters}</span>
            <span className="label-speaking">🎤 {learningStats.speakingCompleted}/{learningStats.totalChapters}</span>
          </div>
        </div>
      )}

      <div className="book-card-content">
        <div className="book-card-header">
          <h3 className="book-card-title">{book.title}</h3>
          <p className="book-card-title-korean">{book.description?.split('.')[0]}</p>
        </div>

        <div className="book-card-meta">
          <span className="card-meta-item">
            <svg className="card-meta-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
            {book.author}
          </span>
          <span className="card-meta-item">
            <svg className="card-meta-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
            </svg>
            {book.genre}
          </span>
        </div>

        <div className="book-card-meta">
          <span className="card-meta-item">
            <svg className="card-meta-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            {book.year > 0 ? book.year : `BC ${Math.abs(book.year)}`}
          </span>
          <span className={`card-meta-item difficulty ${book.difficulty}`}>
            <svg className="card-meta-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            {book.difficulty === 'easy' ? '초급' : book.difficulty === 'medium' ? '중급' : '고급'}
          </span>
          <span className="card-meta-item">
            <svg className="card-meta-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {book.readingTime}
          </span>
        </div>

        <div className="book-card-stats">
          <span className="stat-item">
            <svg className="stat-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            {book.chapters.length}개 챕터
          </span>
          <span className="stat-item">
            <svg className="stat-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
            </svg>
            약 {book.wordCount || 'N/A'}단어
          </span>
        </div>
      </div>
    </div>
  );
};

export default BookCard;
