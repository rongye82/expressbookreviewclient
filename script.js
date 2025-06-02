const API_BASE_URL = 'https://express-book-reviews-beta.vercel.app';

// DOM Elements
const sections = {
    'all-books': document.getElementById('all-books'),
    'search-books': document.getElementById('search-books'),
    'reviews-section': document.getElementById('reviews-section'),
    'book-details': document.getElementById('book-details')
};

let currentUser = null;
let currentToken = null;
let selectedBook = null;

// Initialize the app
document.addEventListener('DOMContentLoaded', initApp);

function initApp() {
    setupEventListeners();
    loadAllBooks();
}

function setupEventListeners() {
    // Navigation
    document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const sectionId = btn.dataset.section;
            showSection(sectionId);
        });
    });

    // Authentication
    document.getElementById('login-btn').addEventListener('click', handleLogin);
    document.getElementById('register-btn').addEventListener('click', handleRegister);
    document.getElementById('logout-btn').addEventListener('click', handleLogout);

    // Search
    document.getElementById('search-btn').addEventListener('click', handleSearch);

    // Reviews
    document.getElementById('submit-review').addEventListener('click', handleSubmitReview);
    document.getElementById('update-review').addEventListener('click', handleUpdateReview);
    document.getElementById('delete-review').addEventListener('click', handleDeleteReview);
    document.getElementById('back-btn').addEventListener('click', () => showSection('all-books'));
}

// Section Management
function showSection(sectionId) {
    // Update active state for nav buttons
    document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.section === sectionId);
    });

    // Show/hide sections
    Object.values(sections).forEach(section => {
        section.classList.toggle('active', section.id === sectionId);
    });

    // Load section-specific data
    if (sectionId === 'reviews-section' && currentUser) {
        loadUserReviews();
    }
}

// Authentication Functions
async function handleLogin() {
    const username = document.getElementById('username').value.trim();
    const password = document.getElementById('password').value.trim();

    if (!username || !password) {
        showAlert('Please enter both username and password', 'error');
        return;
    }

    try {
        const response = await fetch(`${API_BASE_URL}/customer/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password })
        });

        const data = await response.json();
        
        if (response.ok) {
            currentUser = username;
            currentToken = data.token;
            updateAuthUI();
            showAlert('Login successful', 'success');
        } else {
            showAlert(data.message || 'Login failed', 'error');
        }
    } catch (error) {
        console.error('Login error:', error);
        showAlert('Login failed. Please try again.', 'error');
    }
}

async function handleRegister() {
    const username = document.getElementById('username').value.trim();
    const password = document.getElementById('password').value.trim();

    if (!username || !password) {
        showAlert('Please enter both username and password', 'error');
        return;
    }

    try {
        const response = await fetch(`${API_BASE_URL}/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password })
        });

        const result = await response.text();
        showAlert(result, response.ok ? 'success' : 'error');
    } catch (error) {
        console.error('Registration error:', error);
        showAlert('Registration failed. Please try again.', 'error');
    }
}

function handleLogout() {
    currentUser = null;
    currentToken = null;
    updateAuthUI();
    showAlert('Logged out successfully', 'success');
    loadAllBooks();
    showSection('all-books');
}

function updateAuthUI() {
    const loginForm = document.getElementById('login-form');
    const userInfo = document.getElementById('user-info');
    const reviewsBtn = document.getElementById('reviews-btn');

    if (currentUser) {
        loginForm.style.display = 'none';
        userInfo.style.display = 'block';
        reviewsBtn.style.display = 'block';
        document.getElementById('logged-in-user').textContent = `Welcome, ${currentUser}`;
        document.getElementById('username').value = '';
        document.getElementById('password').value = '';
    } else {
        loginForm.style.display = 'block';
        userInfo.style.display = 'none';
        reviewsBtn.style.display = 'none';
    }
}

// Book Functions
async function loadAllBooks() {
    try {
        const response = await fetch(`${API_BASE_URL}/`);
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        
        const data = await response.json();
        const books = data.books ? Object.values(data.books) : [];
        displayBooks(books, 'books-container');
    } catch (error) {
        console.error('Error loading books:', error);
        document.getElementById('books-container').innerHTML = 
            `<div class="error-message">Error loading books: ${error.message}</div>`;
    }
}

async function handleSearch() {
    const searchType = document.getElementById('search-type').value;
    const searchTerm = document.getElementById('search-input').value.trim();
    const resultsContainer = document.getElementById('search-results');

    if (!searchTerm) {
        resultsContainer.innerHTML = '<div class="info-message">Please enter a search term</div>';
        return;
    }

    try {
        let endpoint = '';
        switch(searchType) {
            case 'isbn': endpoint = `/isbn/${searchTerm}`; break;
            case 'author': endpoint = `/author/${encodeURIComponent(searchTerm)}`; break;
            case 'title': endpoint = `/title/${encodeURIComponent(searchTerm)}`; break;
            default: 
                resultsContainer.innerHTML = '<div class="error-message">Invalid search type</div>';
                return;
        }

        const response = await fetch(`${API_BASE_URL}${endpoint}`);
        
        if (!response.ok) {
            const error = await response.text();
            throw new Error(error || 'Search failed');
        }

        const result = await response.json();
        displayBooks(Array.isArray(result) ? result : [result], 'search-results');
    } catch (error) {
        console.error('Search error:', error);
        resultsContainer.innerHTML = `
            <div class="error-message">${error.message}</div>
            <p>Please try again later.</p>
        `;
    }
}

function displayBooks(books, containerId) {
    const container = document.getElementById(containerId);
    container.innerHTML = '';

    if (!books || books.length === 0) {
        container.innerHTML = '<div class="info-message">No books found</div>';
        return;
    }

    books.forEach(book => {
        const bookData = book.title ? book : (book.book || book[Object.keys(book)[0]]);
        const isbn = book.isbn || Object.keys(book)[0];
        const title = bookData?.title || 'Unknown Title';
        const author = bookData?.author || 'Unknown Author';

        const bookCard = document.createElement('div');
        bookCard.className = 'book-card';
        bookCard.dataset.isbn = isbn;
        bookCard.innerHTML = `
            <h3>${title}</h3>
            <p class="author">By ${author}</p>
            <button class="view-details-btn">View Details</button>
        `;
        container.appendChild(bookCard);
    });

    // Add event listeners to view details buttons
    document.querySelectorAll('.view-details-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const isbn = e.target.closest('.book-card').dataset.isbn;
            showBookDetails(isbn);
        });
    });
}

async function showBookDetails(isbn) {
    try {
        const response = await fetch(`${API_BASE_URL}/isbn/${isbn}`);
        if (!response.ok) {
            const error = await response.text();
            throw new Error(error || 'Failed to fetch book details');
        }

        const bookData = await response.json();
        if (!bookData?.title) throw new Error("Invalid book data received");

        selectedBook = {
            isbn: isbn,
            title: bookData.title,
            author: bookData.author,
            reviews: bookData.reviews || {}
        };

        // Update UI
        document.getElementById('book-title').textContent = selectedBook.title;
        document.getElementById('book-author').textContent = `By ${selectedBook.author}`;
        
        // Reset review form
        document.getElementById('review-text').value = '';
        document.getElementById('update-review').style.display = 'none';
        document.getElementById('delete-review').style.display = 'none';
        document.getElementById('submit-review').style.display = 'block';
        
        // Load reviews
        await loadBookReviews(isbn);
        showSection('book-details');
    } catch (error) {
        console.error('Error showing book details:', error);
        showAlert(`Error loading book details: ${error.message}`, 'error');
    }
}

async function loadBookReviews(isbn) {
    const reviewsList = document.getElementById('reviews-list');
    reviewsList.innerHTML = '<div class="loading-message">Loading reviews...</div>';

    try {
        const response = await fetch(`${API_BASE_URL}/review/${isbn}`);
        
        if (!response.ok) {
            reviewsList.innerHTML = '<div class="info-message">No reviews yet</div>';
            return;
        }

        const reviews = await response.json();
        reviewsList.innerHTML = '';

        if (reviews && Object.keys(reviews).length > 0) {
            Object.entries(reviews).forEach(([reviewId, review]) => {
                const reviewElement = document.createElement('div');
                reviewElement.className = 'review';
                reviewElement.innerHTML = `
                    <div class="review-content">
                        <p><strong>${review.username}</strong>: ${review.review}</p>
                        ${review.username === currentUser ? `
                            <div class="review-actions">
                                <button class="edit-review" data-review-id="${reviewId}">Edit</button>
                                <button class="delete-review" data-review-id="${reviewId}">Delete</button>
                            </div>
                        ` : ''}
                    </div>
                `;
                reviewsList.appendChild(reviewElement);
            });

            // Add event listeners for edit/delete buttons
            document.querySelectorAll('.edit-review').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    const reviewId = e.target.dataset.reviewId;
                    const reviewText = e.target.closest('.review').querySelector('p').textContent.split(': ')[1];
                    document.getElementById('review-text').value = reviewText;
                    document.getElementById('update-review').style.display = 'block';
                    document.getElementById('delete-review').style.display = 'block';
                    document.getElementById('submit-review').style.display = 'none';
                    document.getElementById('update-review').dataset.reviewId = reviewId;
                });
            });

            document.querySelectorAll('.delete-review').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    const reviewId = e.target.dataset.reviewId;
                    if (confirm('Are you sure you want to delete this review?')) {
                        deleteReview(reviewId);
                    }
                });
            });
        } else {
            reviewsList.innerHTML = '<div class="info-message">No reviews yet</div>';
        }
    } catch (error) {
        console.error('Error loading reviews:', error);
        reviewsList.innerHTML = '<div class="error-message">Error loading reviews</div>';
    }
}

// Review Functions
async function handleSubmitReview() {
    if (!currentUser) {
        showAlert('Please login to submit a review', 'error');
        return;
    }

    const reviewText = document.getElementById('review-text').value.trim();
    if (!reviewText) {
        showAlert('Please enter a review', 'error');
        return;
    }

    try {
        const response = await fetch(`${API_BASE_URL}/customer/auth/review/${selectedBook.isbn}?review=${encodeURIComponent(reviewText)}`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${currentToken}` }
        });

        const result = await response.text();
        showAlert(result, response.ok ? 'success' : 'error');
        loadBookReviews(selectedBook.isbn);
    } catch (error) {
        console.error('Error submitting review:', error);
        showAlert('Error submitting review. Please try again.', 'error');
    }
}

async function handleUpdateReview() {
    const reviewText = document.getElementById('review-text').value.trim();
    if (!reviewText) {
        showAlert('Please enter a review', 'error');
        return;
    }

    try {
        const response = await fetch(`${API_BASE_URL}/customer/auth/review/${selectedBook.isbn}?review=${encodeURIComponent(reviewText)}`, {
            method: 'PUT',
            headers: { 'Authorization': `Bearer ${currentToken}` }
        });

        const result = await response.text();
        showAlert(result, response.ok ? 'success' : 'error');
        loadBookReviews(selectedBook.isbn);
    } catch (error) {
        console.error('Error updating review:', error);
        showAlert('Error updating review. Please try again.', 'error');
    }
}

async function handleDeleteReview() {
    if (!confirm('Are you sure you want to delete this review?')) return;

    try {
        const response = await fetch(`${API_BASE_URL}/customer/auth/review/${selectedBook.isbn}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${currentToken}` }
        });

        const result = await response.text();
        showAlert(result, response.ok ? 'success' : 'error');
        loadBookReviews(selectedBook.isbn);
    } catch (error) {
        console.error('Error deleting review:', error);
        showAlert('Error deleting review. Please try again.', 'error');
    }
}

async function loadUserReviews() {
    if (!currentUser) {
        document.getElementById('reviews-container').innerHTML = 
            '<div class="info-message">Please login to view your reviews</div>';
        return;
    }

    try {
        const container = document.getElementById('reviews-container');
        container.innerHTML = '<div class="loading-message">Loading your reviews...</div>';

        // First get all books
        const booksResponse = await fetch(`${API_BASE_URL}/`);
        if (!booksResponse.ok) {
            throw new Error('Failed to fetch books');
        }

        const booksData = await booksResponse.json();
        const books = booksData.books || booksData; // Handle both response formats
        const isbns = Object.keys(books);
        let userReviews = [];

        // Check reviews for each book
        for (const isbn of isbns) {
            try {
                const reviewResponse = await fetch(`${API_BASE_URL}/review/${isbn}`);
                if (!reviewResponse.ok) continue; // Skip if no reviews

                const reviews = await reviewResponse.json();
                
                // Handle different review formats
                if (reviews && typeof reviews === 'object') {
                    Object.entries(reviews).forEach(([reviewId, review]) => {
                        if (review.username === currentUser) {
                            userReviews.push({
                                book: books[isbn],
                                review: review,
                                isbn: isbn,
                                reviewId: reviewId
                            });
                        }
                    });
                }
            } catch (error) {
                console.error(`Error checking reviews for book ${isbn}:`, error);
                continue; // Skip to next book if error occurs
            }
        }

        // Display results
        if (userReviews.length === 0) {
            container.innerHTML = '<div class="info-message">You have not submitted any reviews yet.</div>';
        } else {
            container.innerHTML = userReviews.map(item => `
                <div class="review-item">
                    <h3>${item.book.title}</h3>
                    <p class="author">By ${item.book.author}</p>
                    <div class="review-content">
                        <p>${item.review.review}</p>
                        <button class="edit-book-review" data-isbn="${item.isbn}">Edit Review</button>
                    </div>
                </div>
            `).join('');

            // Add event listeners to edit buttons
            document.querySelectorAll('.edit-book-review').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    const isbn = e.target.dataset.isbn;
                    showBookDetails(isbn);
                });
            });
        }
    } catch (error) {
        console.error('Error loading user reviews:', error);
        document.getElementById('reviews-container').innerHTML = `
            <div class="error-message">
                Error loading your reviews: ${error.message || 'Unknown error'}
            </div>
        `;
    }
}
// Utility Functions
function showAlert(message, type = 'info') {
    alert(`${type.toUpperCase()}: ${message}`);
}