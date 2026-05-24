"""
Dataset generator for Library Management System Phase 2 ETL.
Generates realistic books, borrowers, and transactions CSVs with 150+ records.
Run: python generate_datasets.py
"""
import csv
import random
import uuid
from datetime import datetime, timedelta
import os

OUTPUT_DIR = os.path.dirname(os.path.abspath(__file__))
random.seed(42)

# ── Books data pool ────────────────────────────────────────────────────────────
BOOKS_DATA = [
    # (title, author, category, isbn, publisher, year, description)
    ("The Great Gatsby", "F. Scott Fitzgerald", "Classic Fiction", "9780743273565", "Scribner", 1925, "Wealth and the American Dream"),
    ("To Kill a Mockingbird", "Harper Lee", "Classic Fiction", "9780061935466", "HarperCollins", 1960, "Racial injustice in the American South"),
    ("1984", "George Orwell", "Dystopian Fiction", "9780451524935", "Signet Classic", 1949, "Totalitarianism and thought control"),
    ("Pride and Prejudice", "Jane Austen", "Romance", "9780141439518", "Penguin Classics", 1813, "Love and social class in Regency England"),
    ("The Hitchhiker's Guide to the Galaxy", "Douglas Adams", "Science Fiction", "9780345391803", "Del Rey", 1979, "Comedic sci-fi adventure"),
    ("Dune", "Frank Herbert", "Science Fiction", "9780441013593", "Ace", 1965, "Epic desert planet saga"),
    ("The Alchemist", "Paulo Coelho", "Philosophy", "9780062315007", "HarperOne", 1988, "Following your dreams"),
    ("Sapiens", "Yuval Noah Harari", "Non-Fiction", "9780062316110", "Harper", 2011, "History of humankind"),
    ("Atomic Habits", "James Clear", "Self-Help", "9780735211292", "Avery", 2018, "Building good habits"),
    ("Clean Code", "Robert C. Martin", "Technology", "9780132350884", "Prentice Hall", 2008, "Software craftsmanship"),
    ("The Pragmatic Programmer", "David Thomas", "Technology", "9780135957059", "Addison-Wesley", 2019, "Wisdom for developers"),
    ("Harry Potter and the Sorcerer's Stone", "J.K. Rowling", "Fantasy", "9780590353427", "Scholastic", 1997, "Magic at Hogwarts"),
    ("The Lord of the Rings", "J.R.R. Tolkien", "Fantasy", "9780618640157", "Houghton Mifflin", 1954, "Quest to destroy the One Ring"),
    ("Thinking, Fast and Slow", "Daniel Kahneman", "Psychology", "9780374533557", "Farrar Straus Giroux", 2011, "Two systems of thinking"),
    ("Brave New World", "Aldous Huxley", "Dystopian Fiction", "9780060850524", "Harper Perennial", 1932, "Engineered society"),
    ("The Lean Startup", "Eric Ries", "Business", "9780307887894", "Crown Business", 2011, "Continuous innovation"),
    ("Good to Great", "Jim Collins", "Business", "9780066620992", "HarperBusiness", 2001, "Company excellence"),
    ("Deep Work", "Cal Newport", "Self-Help", "9781455586691", "Grand Central", 2016, "Focused productivity"),
    ("The Art of War", "Sun Tzu", "Classic", "9781599869773", "Filiquarian", 500, "Military strategy"),
    ("Zero to One", "Peter Thiel", "Business", "9780804139021", "Crown Business", 2014, "Building the future"),
    ("Man's Search for Meaning", "Viktor Frankl", "Psychology", "9780807014271", "Beacon Press", 1946, "Finding purpose"),
    ("The Power of Habit", "Charles Duhigg", "Self-Help", "9780812981605", "Random House", 2012, "How habits work"),
    ("Meditations", "Marcus Aurelius", "Philosophy", "9780140449334", "Penguin Classics", 180, "Stoic philosophy"),
    ("The Brothers Karamazov", "Fyodor Dostoevsky", "Classic Fiction", "9780374528379", "Farrar Straus", 1880, "Russian classic"),
    ("Crime and Punishment", "Fyodor Dostoevsky", "Classic Fiction", "9780486415871", "Dover Publications", 1866, "Psychological thriller"),
    ("Anna Karenina", "Leo Tolstoy", "Classic Fiction", "9780143035008", "Penguin Classics", 1877, "Love and society"),
    ("Don Quixote", "Miguel de Cervantes", "Classic", "9780060934347", "Harper", 1605, "The first modern novel"),
    ("One Hundred Years of Solitude", "Gabriel Garcia Marquez", "Magical Realism", "9780060883287", "Harper", 1967, "Multigenerational saga"),
    ("The Catcher in the Rye", "J.D. Salinger", "Classic Fiction", "9780316769174", "Little Brown", 1951, "Teenage alienation"),
    ("Fahrenheit 451", "Ray Bradbury", "Science Fiction", "9780345342966", "Ballantine", 1953, "Book burning future"),
    ("The Handmaid's Tale", "Margaret Atwood", "Dystopian Fiction", "9780385490818", "Anchor Books", 1985, "Totalitarian future"),
    ("Neuromancer", "William Gibson", "Science Fiction", "9780441569595", "Ace", 1984, "Cyberpunk classic"),
    ("Ender's Game", "Orson Scott Card", "Science Fiction", "9780812550702", "Tor Books", 1985, "Alien war strategy"),
    ("The Foundation", "Isaac Asimov", "Science Fiction", "9780553293357", "Bantam", 1951, "Galactic empire decline"),
    ("Sherlock Holmes: Complete Works", "Arthur Conan Doyle", "Mystery", "9780517123447", "Gramercy", 1892, "Detective stories"),
    ("And Then There Were None", "Agatha Christie", "Mystery", "9780062073488", "Harper", 1939, "Island murder mystery"),
    ("The Girl with the Dragon Tattoo", "Stieg Larsson", "Thriller", "9780307454546", "Vintage Crime", 2005, "Swedish crime thriller"),
    ("Gone Girl", "Gillian Flynn", "Thriller", "9780307588371", "Crown", 2012, "Psychological thriller"),
    ("The Da Vinci Code", "Dan Brown", "Thriller", "9780307474278", "Anchor", 2003, "Religious conspiracy"),
    ("Inferno", "Dan Brown", "Thriller", "9781101904220", "Doubleday", 2013, "Dante-inspired thriller"),
    ("The Kite Runner", "Khaled Hosseini", "Literary Fiction", "9781594631931", "Riverhead", 2003, "Friendship and redemption"),
    ("A Thousand Splendid Suns", "Khaled Hosseini", "Literary Fiction", "9781594483073", "Riverhead", 2007, "Afghan women's story"),
    ("The Book Thief", "Markus Zusak", "Historical Fiction", "9780375842207", "Knopf", 2005, "WWII Germany narrative"),
    ("Life of Pi", "Yann Martel", "Literary Fiction", "9780156027328", "Mariner", 2001, "Survival at sea"),
    ("The Curious Incident of the Dog", "Mark Haddon", "Literary Fiction", "9781400032716", "Vintage", 2003, "Autism perspective mystery"),
    ("Educated", "Tara Westover", "Biography", "9780399590504", "Random House", 2018, "Memoir of self-reinvention"),
    ("Becoming", "Michelle Obama", "Biography", "9781524763138", "Crown", 2018, "First Lady memoir"),
    ("Steve Jobs", "Walter Isaacson", "Biography", "9781451648539", "Simon Schuster", 2011, "Apple founder biography"),
    ("Elon Musk", "Walter Isaacson", "Biography", "9781982181284", "Simon Schuster", 2023, "Tesla SpaceX founder"),
    ("The Innovators", "Walter Isaacson", "History", "9781476708706", "Simon Schuster", 2014, "Digital revolution history"),
    ("Guns Germs and Steel", "Jared Diamond", "History", "9780393317558", "Norton", 1997, "Why civilizations rise"),
    ("The Silk Roads", "Peter Frankopan", "History", "9781101912379", "Vintage", 2015, "History through trade routes"),
    ("A Brief History of Time", "Stephen Hawking", "Science", "9780553380163", "Bantam", 1988, "Cosmology for laypeople"),
    ("The Origin of Species", "Charles Darwin", "Science", "9780140432053", "Penguin Classics", 1859, "Theory of evolution"),
    ("The Selfish Gene", "Richard Dawkins", "Science", "9780199291151", "Oxford", 1976, "Genetic theory"),
    ("Thinking in Systems", "Donella Meadows", "Technology", "9781603580557", "Chelsea Green", 2008, "Systems thinking primer"),
    ("The Phoenix Project", "Gene Kim", "Technology", "9781942788294", "IT Revolution", 2013, "DevOps novel"),
    ("Designing Data-Intensive Applications", "Martin Kleppmann", "Technology", "9781491903124", "O'Reilly", 2017, "Distributed systems"),
    ("Python Crash Course", "Eric Matthes", "Technology", "9781593279288", "No Starch", 2015, "Python for beginners"),
    ("JavaScript: The Good Parts", "Douglas Crockford", "Technology", "9780596517748", "O'Reilly", 2008, "JS best practices"),
    ("Structure and Interpretation", "Harold Abelson", "Technology", "9780262510875", "MIT Press", 1996, "SICP classic"),
    ("The Wealth of Nations", "Adam Smith", "Business", "9780553585971", "Bantam Classics", 1776, "Free market economics"),
    ("Thinking and Getting Rich", "Napoleon Hill", "Self-Help", "9781585424337", "Tarcher", 1937, "Success principles"),
    ("The 7 Habits of Highly Effective People", "Stephen Covey", "Self-Help", "9780743269513", "Free Press", 1989, "Personal effectiveness"),
    ("Getting Things Done", "David Allen", "Self-Help", "9780142000281", "Penguin", 2001, "Productivity system"),
    ("Mindset", "Carol Dweck", "Psychology", "9780345472328", "Ballantine", 2006, "Growth vs fixed mindset"),
    ("Flow", "Mihaly Csikszentmihalyi", "Psychology", "9780061339202", "Harper", 1990, "Optimal experience"),
    ("Emotional Intelligence", "Daniel Goleman", "Psychology", "9780553383713", "Bantam", 1995, "EQ over IQ"),
    ("The Body Keeps the Score", "Bessel van der Kolk", "Psychology", "9780143127741", "Penguin", 2014, "Trauma and healing"),
    ("The Road Less Traveled", "M. Scott Peck", "Spirituality", "9780743243155", "Touchstone", 1978, "Mental and spiritual growth"),
    ("The Power of Now", "Eckhart Tolle", "Spirituality", "9781577314806", "New World Library", 1997, "Present moment awareness"),
    ("Man and His Symbols", "Carl Jung", "Psychology", "9780440351832", "Dell", 1964, "Jungian psychology"),
    ("The Prophet", "Kahlil Gibran", "Philosophy", "9780679405726", "Vintage", 1923, "Philosophical poetry"),
    ("Thus Spoke Zarathustra", "Friedrich Nietzsche", "Philosophy", "9780140441185", "Penguin Classics", 1883, "Nihilism and ubermensch"),
    ("Sophie's World", "Jostein Gaarder", "Philosophy", "9780374530716", "Farrar Straus", 1991, "History of philosophy novel"),
    ("The Republic", "Plato", "Philosophy", "9780140455113", "Penguin Classics", -380, "Justice and governance"),
    ("Nicomachean Ethics", "Aristotle", "Philosophy", "9780140449495", "Penguin Classics", -350, "Virtue ethics"),
    ("The Stranger", "Albert Camus", "Classic Fiction", "9780679720201", "Vintage", 1942, "Existentialist novel"),
    ("Nausea", "Jean-Paul Sartre", "Classic Fiction", "9780811201884", "New Directions", 1938, "Existential despair"),
    ("Siddhartha", "Hermann Hesse", "Spirituality", "9780553208849", "Bantam", 1922, "Buddhist philosophy journey"),
    ("Steppenwolf", "Hermann Hesse", "Classic Fiction", "9780312278670", "Picador", 1927, "Self-discovery"),
    ("The Trial", "Franz Kafka", "Classic Fiction", "9780805210408", "Schocken", 1925, "Absurdist bureaucracy"),
    ("Catch-22", "Joseph Heller", "Classic Fiction", "9781451626650", "Simon Schuster", 1961, "WWII satire"),
    ("Slaughterhouse-Five", "Kurt Vonnegut", "Science Fiction", "9780440180296", "Dell", 1969, "Anti-war time travel"),
    ("The Grapes of Wrath", "John Steinbeck", "Classic Fiction", "9780140186390", "Penguin", 1939, "Depression-era migration"),
    ("Of Mice and Men", "John Steinbeck", "Classic Fiction", "9780140177398", "Penguin", 1937, "Friendship and dreams"),
    ("East of Eden", "John Steinbeck", "Classic Fiction", "9780142004234", "Penguin", 1952, "Generational saga"),
    ("The Old Man and the Sea", "Ernest Hemingway", "Classic Fiction", "9780684801223", "Scribner", 1952, "Man vs nature"),
    ("A Farewell to Arms", "Ernest Hemingway", "Classic Fiction", "9780684801469", "Scribner", 1929, "WWI love story"),
    ("For Whom the Bell Tolls", "Ernest Hemingway", "Classic Fiction", "9780684803357", "Scribner", 1940, "Spanish Civil War"),
    ("Beloved", "Toni Morrison", "Literary Fiction", "9781400033416", "Vintage", 1987, "Post-Civil War trauma"),
    ("Song of Solomon", "Toni Morrison", "Literary Fiction", "9781400033423", "Vintage", 1977, "African American identity"),
    ("Their Eyes Were Watching God", "Zora Neale Hurston", "Classic Fiction", "9780060931414", "Harper", 1937, "African American woman's journey"),
    ("Invisible Man", "Ralph Ellison", "Classic Fiction", "9780679732761", "Vintage", 1952, "African American identity"),
    ("Native Son", "Richard Wright", "Classic Fiction", "9780061340055", "Harper Perennial", 1940, "Race in America"),
    ("The Color Purple", "Alice Walker", "Classic Fiction", "9780156028356", "Harvest", 1982, "African American women"),
    ("Atonement", "Ian McEwan", "Literary Fiction", "9780385721547", "Anchor", 2001, "WWII drama and guilt"),
    ("Never Let Me Go", "Kazuo Ishiguro", "Science Fiction", "9781400078776", "Vintage", 2005, "Clone dystopia"),
    ("The Remains of the Day", "Kazuo Ishiguro", "Literary Fiction", "9780679731726", "Vintage", 1989, "English butler memoir"),
    ("Middlemarch", "George Eliot", "Classic Fiction", "9780141439549", "Penguin Classics", 1871, "Victorian society"),
    ("Jane Eyre", "Charlotte Bronte", "Classic Fiction", "9780141441146", "Penguin Classics", 1847, "Independent woman's story"),
    ("Wuthering Heights", "Emily Bronte", "Classic Fiction", "9780141439556", "Penguin Classics", 1847, "Gothic romance"),
    ("Great Expectations", "Charles Dickens", "Classic Fiction", "9780141439563", "Penguin Classics", 1861, "Orphan's rise"),
    ("Oliver Twist", "Charles Dickens", "Classic Fiction", "9780141439747", "Penguin Classics", 1838, "Street child in London"),
    ("David Copperfield", "Charles Dickens", "Classic Fiction", "9780140439441", "Penguin Classics", 1850, "Autobiographical novel"),
    ("Moby Dick", "Herman Melville", "Classic Fiction", "9780142437247", "Penguin Classics", 1851, "Whale hunting obsession"),
    ("The Scarlet Letter", "Nathaniel Hawthorne", "Classic Fiction", "9780142437261", "Penguin Classics", 1850, "Puritan adultery tale"),
    ("Adventures of Huckleberry Finn", "Mark Twain", "Classic Fiction", "9780486280615", "Dover", 1884, "River adventure"),
    ("The Adventures of Tom Sawyer", "Mark Twain", "Classic Fiction", "9780486400778", "Dover", 1876, "Boyhood adventure"),
    ("Little Women", "Louisa May Alcott", "Classic Fiction", "9780143039099", "Penguin Classics", 1868, "Four sisters growing up"),
    ("The Odyssey", "Homer", "Classic", "9780140268867", "Penguin Classics", -800, "Epic journey home"),
    ("The Iliad", "Homer", "Classic", "9780140275360", "Penguin Classics", -850, "Trojan War epic"),
    ("Hamlet", "William Shakespeare", "Drama", "9780743477123", "Simon Schuster", 1603, "Prince of Denmark"),
    ("Macbeth", "William Shakespeare", "Drama", "9780743477109", "Simon Schuster", 1606, "Ambition and guilt"),
    ("King Lear", "William Shakespeare", "Drama", "9780743482769", "Simon Schuster", 1606, "Tragic king"),
    ("Othello", "William Shakespeare", "Drama", "9780743477550", "Simon Schuster", 1603, "Jealousy and betrayal"),
    ("A Midsummer Night's Dream", "William Shakespeare", "Drama", "9780743482820", "Simon Schuster", 1595, "Magical comedy"),
    ("The Metamorphosis", "Franz Kafka", "Classic Fiction", "9780553213690", "Bantam Classics", 1915, "Man transformed to insect"),
    ("Frankenstein", "Mary Shelley", "Horror", "9780486282114", "Dover", 1818, "Science creating life"),
    ("Dracula", "Bram Stoker", "Horror", "9780486411095", "Dover", 1897, "Vampire classic"),
    ("The Picture of Dorian Gray", "Oscar Wilde", "Classic Fiction", "9780486278070", "Dover", 1890, "Eternal youth bargain"),
    ("The Importance of Being Earnest", "Oscar Wilde", "Drama", "9780486264783", "Dover", 1895, "Victorian comedy"),
    ("Notes from Underground", "Fyodor Dostoevsky", "Classic Fiction", "9780486270531", "Dover", 1864, "Underground man"),
    ("The Idiot", "Fyodor Dostoevsky", "Classic Fiction", "9780140447927", "Penguin Classics", 1869, "Truly good man"),
    ("War and Peace", "Leo Tolstoy", "Classic Fiction", "9781400079988", "Vintage", 1869, "Napoleon's Russia"),
    ("Doctor Zhivago", "Boris Pasternak", "Historical Fiction", "9780375760402", "Vintage", 1957, "Russian Revolution"),
    ("The Master and Margarita", "Mikhail Bulgakov", "Classic Fiction", "9780143108276", "Penguin", 1967, "Devil visits Moscow"),
    ("Lolita", "Vladimir Nabokov", "Classic Fiction", "9780679723165", "Vintage", 1955, "Controversial literary novel"),
    ("Pale Fire", "Vladimir Nabokov", "Classic Fiction", "9780679723424", "Vintage", 1962, "Novel in poem and commentary"),
    ("Rebecca", "Daphne du Maurier", "Gothic Fiction", "9780380730407", "Avon", 1938, "Gothic romance mystery"),
    ("Jamaica Inn", "Daphne du Maurier", "Gothic Fiction", "9780316196253", "Back Bay", 1936, "Cornish smugglers"),
    ("The Secret Garden", "Frances Hodgson Burnett", "Classic Fiction", "9780141321066", "Penguin Classics", 1911, "Healing through nature"),
    ("A Little Princess", "Frances Hodgson Burnett", "Classic Fiction", "9780141321073", "Penguin Classics", 1905, "Resilient girl"),
    ("The Wind in the Willows", "Kenneth Grahame", "Classic Fiction", "9780141321134", "Penguin Classics", 1908, "River bank animals"),
    ("Winnie-the-Pooh", "A.A. Milne", "Classic Fiction", "9780525444443", "Dutton", 1926, "Hundred Acre Wood"),
    ("Alice in Wonderland", "Lewis Carroll", "Classic Fiction", "9780141321042", "Penguin Classics", 1865, "Magical fantasy world"),
    ("Through the Looking Glass", "Lewis Carroll", "Classic Fiction", "9780141321059", "Penguin Classics", 1871, "Mirror world adventure"),
    ("Gulliver's Travels", "Jonathan Swift", "Classic Fiction", "9780141439495", "Penguin Classics", 1726, "Satirical travel tales"),
    ("Robinson Crusoe", "Daniel Defoe", "Classic Fiction", "9780141439587", "Penguin Classics", 1719, "Desert island survival"),
    ("Treasure Island", "Robert Louis Stevenson", "Adventure", "9780486275598", "Dover", 1883, "Pirate treasure hunt"),
    ("The Strange Case of Dr Jekyll", "Robert Louis Stevenson", "Gothic Fiction", "9780486266886", "Dover", 1886, "Dual personality"),
    ("Heart of Darkness", "Joseph Conrad", "Classic Fiction", "9780141441672", "Penguin Classics", 1899, "Congo colonialism"),
    ("Lord Jim", "Joseph Conrad", "Classic Fiction", "9780141441610", "Penguin Classics", 1900, "Honor and cowardice"),
    ("The Jungle Book", "Rudyard Kipling", "Classic Fiction", "9780140367228", "Penguin Classics", 1894, "Boy raised by wolves"),
    ("Kim", "Rudyard Kipling", "Classic Fiction", "9780140185089", "Penguin Classics", 1901, "Anglo-Indian adventure"),
    ("The Mill on the Floss", "George Eliot", "Classic Fiction", "9780140431070", "Penguin Classics", 1860, "Rural English life"),
    ("Silas Marner", "George Eliot", "Classic Fiction", "9780141431819", "Penguin Classics", 1861, "Weaver and foundling"),
    ("North and South", "Elizabeth Gaskell", "Classic Fiction", "9780141439259", "Penguin Classics", 1855, "Industrial England romance"),
    ("Wives and Daughters", "Elizabeth Gaskell", "Classic Fiction", "9780140434064", "Penguin Classics", 1866, "Victorian women"),
    ("Persuasion", "Jane Austen", "Romance", "9780141439686", "Penguin Classics", 1817, "Second chance at love"),
    ("Emma", "Jane Austen", "Romance", "9780141439600", "Penguin Classics", 1815, "Matchmaking comedy"),
    ("Mansfield Park", "Jane Austen", "Romance", "9780141439808", "Penguin Classics", 1814, "Moral education"),
    ("Northanger Abbey", "Jane Austen", "Romance", "9780141439792", "Penguin Classics", 1817, "Gothic novel parody"),
]

BORROWER_NAMES = [
    ("Alice Johnson", "alice.johnson"), ("Bob Smith", "bob.smith"),
    ("Carol Williams", "carol.w"), ("David Brown", "david.brown"),
    ("Eva Martinez", "eva.martinez"), ("Frank Lee", "frank.lee"),
    ("Grace Kim", "grace.kim"), ("Henry Davis", "henry.davis"),
    ("Isabelle Chen", "isabelle.chen"), ("James Wilson", "james.wilson"),
    ("Karen Taylor", "karen.taylor"), ("Luis Garcia", "luis.garcia"),
    ("Maria Rodriguez", "maria.r"), ("Nathan Clark", "nathan.clark"),
    ("Olivia Lewis", "olivia.lewis"), ("Patrick Hall", "patrick.hall"),
    ("Quinn Adams", "quinn.adams"), ("Rachel Young", "rachel.young"),
    ("Samuel Turner", "sam.turner"), ("Tina Parker", "tina.parker"),
    ("Uma Sharma", "uma.sharma"), ("Victor Nguyen", "victor.n"),
    ("Wendy Cooper", "wendy.cooper"), ("Xavier Bell", "xavier.bell"),
    ("Yvonne Foster", "yvonne.f"), ("Zachary Reed", "zack.reed"),
    ("Amanda Scott", "amanda.scott"), ("Brian Morris", "brian.morris"),
    ("Catherine Ward", "cath.ward"), ("Derek Hughes", "derek.h"),
    ("Eleanor Price", "eleanor.p"), ("Frederick Bailey", "fred.bailey"),
    ("Georgia Cox", "georgia.cox"), ("Howard Barnes", "h.barnes"),
    ("Irene Butler", "irene.butler"), ("Jason Collins", "jason.c"),
    ("Kimberly Hayes", "kim.hayes"), ("Leonard Bennett", "leo.b"),
    ("Monica Patterson", "monica.p"), ("Nicholas Kelly", "nick.kelly"),
    ("Pamela Simmons", "pam.simmons"), ("Robert Jenkins", "rob.j"),
    ("Samantha Perry", "samantha.p"), ("Timothy Robinson", "tim.r"),
    ("Ursula Powell", "ursula.p"), ("Vincent Russell", "vincent.r"),
    ("Wanda Griffin", "wanda.g"), ("Yusuf Diaz", "yusuf.d"),
    ("Zoe Henderson", "zoe.h"), ("Aaron Mitchell", "aaron.m"),
    ("Beatrice Turner", "bea.turner"), ("Carlos White", "carlos.w"),
    ("Diana Martin", "diana.martin"), ("Edward Thompson", "ed.t"),
    ("Fiona Jackson", "fiona.j"), ("George Harris", "george.h"),
    ("Hannah Walker", "hannah.w"), ("Ian Hall", "ian.hall"),
    ("Jennifer Thomas", "jennifer.t"), ("Kevin Moore", "kevin.m"),
    ("Laura Anderson", "laura.a"), ("Michael Taylor", "michael.t"),
]

DOMAINS = ["gmail.com", "yahoo.com", "outlook.com", "email.com", "library.edu", "bookclub.org", "reading.net"]
PHONES = [f"+1-555-{str(i).zfill(4)}" for i in range(1000, 1070)]
CITIES = [
    "Springfield", "Riverside", "Lakewood", "Hillcrest", "Meadowview",
    "Northgate", "Westside", "Eastpark", "Downtown", "Oakwood",
    "Pinehurst", "Cedar Falls", "Maplewood", "Elmwood", "Birchwood",
]
STREETS = ["Oak St", "Maple Ave", "Pine Rd", "Elm St", "Cedar Blvd",
           "Birch Ln", "Walnut Dr", "Spruce Ct", "Ash Way", "Willow Pl"]

COVER_COLORS = [
    "#2D6A4F", "#E76F51", "#264653", "#A8DADC", "#457B9D",
    "#D4A017", "#F4A261", "#2A9D8F", "#E9C46A", "#6D6875",
    "#B5838D", "#8338EC", "#3A86FF", "#FF6B6B", "#06D6A0",
    "#118AB2", "#073B4C", "#F77F00", "#4361EE", "#7B2D8B",
]


def generate_books_csv():
    rows = []
    for i, (title, author, category, isbn, publisher, year, desc) in enumerate(BOOKS_DATA):
        rows.append({
            "title": title, "author": author, "category": category,
            "isbn": isbn, "publisher": publisher, "published_year": year,
            "description": desc,
            "availability_status": "true" if random.random() > 0.2 else "false",
            "cover_color": random.choice(COVER_COLORS),
        })
    path = os.path.join(OUTPUT_DIR, "books_dataset.csv")
    with open(path, "w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=rows[0].keys())
        writer.writeheader()
        writer.writerows(rows)
    print(f"Generated {len(rows)} books -> {path}")
    return len(rows)


def generate_borrowers_csv():
    rows = []
    for i, (name, email_prefix) in enumerate(BORROWER_NAMES):
        domain = DOMAINS[i % len(DOMAINS)]
        rows.append({
            "borrower_name": name,
            "email": f"{email_prefix}@{domain}",
            "phone": PHONES[i % len(PHONES)],
            "address": f"{random.randint(100,999)} {random.choice(STREETS)}, {random.choice(CITIES)}",
        })
    path = os.path.join(OUTPUT_DIR, "borrowers_dataset.csv")
    with open(path, "w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=rows[0].keys())
        writer.writeheader()
        writer.writerows(rows)
    print(f"Generated {len(rows)} borrowers -> {path}")
    return len(rows)


def generate_transactions_csv(num_books, num_borrowers):
    rows = []
    now = datetime.now()

    # Generate ~260 transactions with varied patterns
    for i in range(260):
        book_id = random.randint(1, num_books)
        borrower_id = random.randint(1, num_borrowers)

        # Historical borrows: 1-18 months ago
        days_ago = random.randint(5, 548)
        borrow_date = now - timedelta(days=days_ago)
        due_date = borrow_date + timedelta(days=14)

        # 75% returned
        is_returned = random.random() < 0.75
        return_date = ""

        if is_returned:
            # Some returned on time, some late
            if random.random() < 0.25:  # 25% late returns
                extra_days = random.randint(1, 30)
                return_days = 14 + extra_days
            else:
                return_days = random.randint(1, 13)
            return_date = (borrow_date + timedelta(days=return_days)).strftime("%Y-%m-%d %H:%M:%S")

        rows.append({
            "book_id": book_id,
            "borrower_id": borrower_id,
            "borrow_date": borrow_date.strftime("%Y-%m-%d %H:%M:%S"),
            "due_date": due_date.strftime("%Y-%m-%d %H:%M:%S"),
            "return_date": return_date,
            "is_returned": str(is_returned).lower(),
        })

    path = os.path.join(OUTPUT_DIR, "transactions_dataset.csv")
    with open(path, "w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=rows[0].keys())
        writer.writeheader()
        writer.writerows(rows)
    print(f"Generated {len(rows)} transactions -> {path}")
    return len(rows)


if __name__ == "__main__":
    print("Generating Library Management System datasets...")
    n_books = generate_books_csv()
    n_borrowers = generate_borrowers_csv()
    n_tx = generate_transactions_csv(n_books, n_borrowers)
    print(f"\nDone! Total records: {n_books + n_borrowers + n_tx}")
    print(f"   Books: {n_books} | Borrowers: {n_borrowers} | Transactions: {n_tx}")
