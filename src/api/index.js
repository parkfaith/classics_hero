const API_BASE = '/api';

export const fetchBooks = async (difficulty = null) => {
  const url = difficulty ? `${API_BASE}/books?difficulty=${difficulty}` : `${API_BASE}/books`;
  const response = await fetch(url);
  if (!response.ok) throw new Error('Failed to fetch books');
  return response.json();
};

export const fetchBook = async (bookId) => {
  const response = await fetch(`${API_BASE}/books/${bookId}`);
  if (!response.ok) throw new Error('Failed to fetch book');
  return response.json();
};

export const fetchBookChapters = async (bookId) => {
  const response = await fetch(`${API_BASE}/books/${bookId}/chapters`);
  if (!response.ok) throw new Error('Failed to fetch chapters');
  return response.json();
};

export const fetchHeroes = async (difficulty = null) => {
  const url = difficulty ? `${API_BASE}/heroes?difficulty=${difficulty}` : `${API_BASE}/heroes`;
  const response = await fetch(url);
  if (!response.ok) throw new Error('Failed to fetch heroes');
  return response.json();
};

export const fetchHero = async (heroId) => {
  const response = await fetch(`${API_BASE}/heroes/${heroId}`);
  if (!response.ok) throw new Error('Failed to fetch hero');
  return response.json();
};

// Archaic Words API
export const fetchArchaicWords = async (category = null) => {
  const url = category ? `${API_BASE}/archaic-words?category=${category}` : `${API_BASE}/archaic-words`;
  const response = await fetch(url);
  if (!response.ok) throw new Error('Failed to fetch archaic words');
  return response.json();
};

export const fetchArchaicWord = async (word) => {
  const response = await fetch(`${API_BASE}/archaic-words/${encodeURIComponent(word)}`);
  if (!response.ok) throw new Error('Failed to fetch archaic word');
  return response.json();
};

// Semantic Shifts API
export const fetchSemanticShifts = async () => {
  const response = await fetch(`${API_BASE}/semantic-shifts`);
  if (!response.ok) throw new Error('Failed to fetch semantic shifts');
  return response.json();
};

export const fetchSemanticShift = async (word) => {
  const response = await fetch(`${API_BASE}/semantic-shifts/${encodeURIComponent(word)}`);
  if (!response.ok) throw new Error('Failed to fetch semantic shift');
  return response.json();
};

// Detect archaic words in text
export const detectArchaicWords = async (text) => {
  const response = await fetch(`${API_BASE}/detect-archaic?text=${encodeURIComponent(text)}`, {
    method: 'POST'
  });
  if (!response.ok) throw new Error('Failed to detect archaic words');
  return response.json();
};
