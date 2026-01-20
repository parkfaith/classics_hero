import { useState, useEffect } from 'react';

export const useReadingProgress = (bookId) => {
  const [progress, setProgress] = useState({
    currentChapter: 0,
    lastReadDate: null,
    completionPercentage: 0,
  });

  useEffect(() => {
    const savedProgress = localStorage.getItem(`progress-${bookId}`);
    if (savedProgress) {
      setProgress(JSON.parse(savedProgress));
    }
  }, [bookId]);

  const updateProgress = (currentChapter, totalChapters) => {
    const newProgress = {
      currentChapter,
      lastReadDate: new Date().toISOString(),
      completionPercentage: Math.round(((currentChapter + 1) / totalChapters) * 100),
    };

    setProgress(newProgress);
    localStorage.setItem(`progress-${bookId}`, JSON.stringify(newProgress));
  };

  const resetProgress = () => {
    localStorage.removeItem(`progress-${bookId}`);
    setProgress({
      currentChapter: 0,
      lastReadDate: null,
      completionPercentage: 0,
    });
  };

  return {
    progress,
    updateProgress,
    resetProgress,
  };
};
