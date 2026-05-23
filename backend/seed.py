"""Seed script — populates the database with realistic sample data."""
import sys, os
sys.path.insert(0, os.path.dirname(__file__))

from app.database import SessionLocal, create_tables
from app.models.book import Book
from app.models.borrower import Borrower
from app.models.transaction import Transaction
from datetime import datetime, timedelta

BOOKS = [
    {"title": "The Great Gatsby", "author": "F. Scott Fitzgerald", "category": "Classic Fiction", "isbn": "9780743273565", "description": "A story of wealth and the American Dream in the 1920s.", "publisher": "Scribner", "published_year": 1925, "cover_color": "#2D6A4F"},
    {"title": "To Kill a Mockingbird", "author": "Harper Lee", "category": "Classic Fiction", "isbn": "9780061935466", "description": "Racial injustice and moral growth in the American South.", "publisher": "HarperCollins", "published_year": 1960, "cover_color": "#E76F51"},
    {"title": "1984", "author": "George Orwell", "category": "Dystopian Fiction", "isbn": "9780451524935", "description": "A chilling dystopia about totalitarianism and thought control.", "publisher": "Signet Classic", "published_year": 1949, "cover_color": "#264653"},
    {"title": "Pride and Prejudice", "author": "Jane Austen", "category": "Romance", "isbn": "9780141439518", "description": "Love, marriage, and social class in Regency-era England.", "publisher": "Penguin Classics", "published_year": 1813, "cover_color": "#A8DADC"},
    {"title": "The Hitchhiker's Guide to the Galaxy", "author": "Douglas Adams", "category": "Science Fiction", "isbn": "9780345391803", "description": "A comedic sci-fi adventure about the meaning of life.", "publisher": "Del Rey", "published_year": 1979, "cover_color": "#457B9D"},
    {"title": "Dune", "author": "Frank Herbert", "category": "Science Fiction", "isbn": "9780441013593", "description": "Epic science fiction set on the desert planet Arrakis.", "publisher": "Ace", "published_year": 1965, "cover_color": "#D4A017"},
    {"title": "The Alchemist", "author": "Paulo Coelho", "category": "Philosophy", "isbn": "9780062315007", "description": "A magical story about following your dreams.", "publisher": "HarperOne", "published_year": 1988, "cover_color": "#F4A261"},
    {"title": "Sapiens", "author": "Yuval Noah Harari", "category": "Non-Fiction", "isbn": "9780062316110", "description": "A sweeping history of humanity.", "publisher": "Harper", "published_year": 2011, "cover_color": "#2A9D8F"},
    {"title": "Atomic Habits", "author": "James Clear", "category": "Self-Help", "isbn": "9780735211292", "description": "Proven strategies for building good habits.", "publisher": "Avery", "published_year": 2018, "cover_color": "#E9C46A"},
    {"title": "Clean Code", "author": "Robert C. Martin", "category": "Technology", "isbn": "9780132350884", "description": "A handbook of agile software craftsmanship.", "publisher": "Prentice Hall", "published_year": 2008, "cover_color": "#6D6875"},
    {"title": "The Pragmatic Programmer", "author": "David Thomas", "category": "Technology", "isbn": "9780135957059", "description": "Wisdom for software developers.", "publisher": "Addison-Wesley", "published_year": 2019, "cover_color": "#B5838D"},
    {"title": "Harry Potter and the Sorcerer's Stone", "author": "J.K. Rowling", "category": "Fantasy", "isbn": "9780590353427", "description": "The magical journey of Harry Potter at Hogwarts.", "publisher": "Scholastic", "published_year": 1997, "cover_color": "#8338EC"},
    {"title": "The Lord of the Rings", "author": "J.R.R. Tolkien", "category": "Fantasy", "isbn": "9780618640157", "description": "The epic quest to destroy the One Ring.", "publisher": "Houghton Mifflin", "published_year": 1954, "cover_color": "#3A86FF"},
    {"title": "Thinking, Fast and Slow", "author": "Daniel Kahneman", "category": "Psychology", "isbn": "9780374533557", "description": "Two systems that drive the way we think.", "publisher": "Farrar Straus Giroux", "published_year": 2011, "cover_color": "#FF6B6B"},
    {"title": "Brave New World", "author": "Aldous Huxley", "category": "Dystopian Fiction", "isbn": "9780060850524", "description": "A futuristic world of engineered happiness.", "publisher": "Harper Perennial", "published_year": 1932, "cover_color": "#06D6A0"},
    {"title": "The Lean Startup", "author": "Eric Ries", "category": "Business", "isbn": "9780307887894", "description": "How entrepreneurs use continuous innovation.", "publisher": "Crown Business", "published_year": 2011, "cover_color": "#118AB2"},
    {"title": "Good to Great", "author": "Jim Collins", "category": "Business", "isbn": "9780066620992", "description": "Why some companies make the leap to greatness.", "publisher": "HarperBusiness", "published_year": 2001, "cover_color": "#073B4C"},
    {"title": "Deep Work", "author": "Cal Newport", "category": "Self-Help", "isbn": "9781455586691", "description": "Rules for focused success in a distracted world.", "publisher": "Grand Central Publishing", "published_year": 2016, "cover_color": "#4361EE"},
    {"title": "The Art of War", "author": "Sun Tzu", "category": "Classic", "isbn": "9781599869773", "description": "Ancient military treatise on strategy and leadership.", "publisher": "Filiquarian", "published_year": 2007, "cover_color": "#7B2D8B"},
    {"title": "Zero to One", "author": "Peter Thiel", "category": "Business", "isbn": "9780804139021", "description": "Notes on startups and building the future.", "publisher": "Crown Business", "published_year": 2014, "cover_color": "#F77F00"},
]

BORROWERS = [
    {"borrower_name": "Alice Johnson", "email": "alice.johnson@email.com", "phone": "+1-555-0101", "address": "123 Oak Street, Springfield"},
    {"borrower_name": "Bob Smith", "email": "bob.smith@email.com", "phone": "+1-555-0102", "address": "456 Maple Ave, Riverside"},
    {"borrower_name": "Carol Williams", "email": "carol.w@email.com", "phone": "+1-555-0103", "address": "789 Pine Road, Lakewood"},
    {"borrower_name": "David Brown", "email": "david.brown@email.com", "phone": "+1-555-0104", "address": "321 Elm Street, Hillcrest"},
    {"borrower_name": "Eva Martinez", "email": "eva.martinez@email.com", "phone": "+1-555-0105", "address": "654 Cedar Blvd, Meadowview"},
    {"borrower_name": "Frank Lee", "email": "frank.lee@email.com", "phone": "+1-555-0106", "address": "987 Birch Lane, Northgate"},
    {"borrower_name": "Grace Kim", "email": "grace.kim@email.com", "phone": "+1-555-0107", "address": "147 Walnut Drive, Westside"},
    {"borrower_name": "Henry Davis", "email": "henry.davis@email.com", "phone": "+1-555-0108", "address": "258 Spruce Court, Eastpark"},
]


def seed():
    create_tables()
    db = SessionLocal()
    try:
        if db.query(Book).count() > 0:
            print("Database already seeded. Skipping.")
            return
        books = []
        for b in BOOKS:
            book = Book(**b, availability_status=True)
            db.add(book)
            books.append(book)
        db.commit()
        for b in books:
            db.refresh(b)
        print(f"Added {len(books)} books")

        borrowers = []
        for br in BORROWERS:
            borrower = Borrower(**br)
            db.add(borrower)
            borrowers.append(borrower)
        db.commit()
        for br in borrowers:
            db.refresh(br)
        print(f"Added {len(borrowers)} borrowers")

        # Active borrows
        for book, borrower, days in [(books[0], borrowers[0], -10), (books[2], borrowers[1], -5),
                                      (books[4], borrowers[2], -3), (books[6], borrowers[3], -15),
                                      (books[8], borrowers[4], -1)]:
            bd = datetime.utcnow() + timedelta(days=days)
            tx = Transaction(book_id=book.book_id, borrower_id=borrower.borrower_id,
                borrow_date=bd, due_date=bd + timedelta(days=14), is_returned=False)
            book.availability_status = False
            db.add(tx)

        # Returned transactions
        for book, borrower, bd, rd in [(books[1], borrowers[5], -20, -8), (books[3], borrowers[6], -30, -18), (books[5], borrowers[7], -25, -12)]:
            b_date = datetime.utcnow() + timedelta(days=bd)
            r_date = datetime.utcnow() + timedelta(days=rd)
            tx = Transaction(book_id=book.book_id, borrower_id=borrower.borrower_id,
                borrow_date=b_date, due_date=b_date + timedelta(days=14), return_date=r_date, is_returned=True)
            db.add(tx)

        db.commit()
        print("Added sample transactions")
        print("Database seeded successfully!")
    except Exception as e:
        db.rollback()
        print(f"Seed error: {e}")
        raise
    finally:
        db.close()


if __name__ == "__main__":
    seed()
