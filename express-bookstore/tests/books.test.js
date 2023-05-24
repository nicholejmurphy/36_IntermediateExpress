process.env.NODE_ENV = "test";

const request = require("supertest");
const app = require("../app");
const db = require("../db");

let testBook = {
  isbn: "0691161518",
  "amazon-url": "http://a.co/eobPtX2",
  author: "Matthew Lane",
  language: "english",
  pages: 264,
  publisher: "Princeton University Press",
  title: "Power-Up: Unlocking Hidden Math in Video Games",
  year: 2017,
};

// Add a test book to db
beforeEach(async function () {
  await db.query(
    `INSERT INTO books (
          isbn,
          amazon_url,
          author,
          language,
          pages,
          publisher,
          title,
          year) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8) 
       RETURNING isbn,
                 amazon_url,
                 author,
                 language,
                 pages,
                 publisher,
                 title,
                 year`,
    [
      testBook.isbn,
      testBook.amazon_url,
      testBook.author,
      testBook.language,
      testBook.pages,
      testBook.publisher,
      testBook.title,
      testBook.year,
    ]
  );
});

describe("GET /books", function () {
  test("Returns list of books", async function () {
    const response = await request(app).get("/books/");
    expect(response.statusCode).toEqual(200);
    expect(response.body).toEqual({
      books: expect.any(Array),
    });
  });
});

describe("GET /books/:id", function () {
  test("Returns 404 if book not found", async function () {
    const response = await request(app).get("/books/notfound");
    expect(response.statusCode).toEqual(404);
  });
  test("Returns book", async function () {
    const response = await request(app).get("/books/0691161518");
    expect(response.statusCode).toEqual(200);
    expect(response.body).toEqual({
      book: {
        isbn: "0691161518",
        amazon_url: null,
        author: "Matthew Lane",
        language: "english",
        pages: 264,
        publisher: "Princeton University Press",
        title: "Power-Up: Unlocking Hidden Math in Video Games",
        year: 2017,
      },
    });
  });
});

describe("POST /books/", function () {
  test("Returns 404 if invalid book data", async function () {
    const response = await request(app).post("/books/").send({ isbn: 45321 });
    expect(response.statusCode).toEqual(400);
  });
  test("Returns new book", async function () {
    const response = await request(app).post("/books/").send({
      isbn: "012345678",
      amazon_url: "http://a.co/ef3254",
      author: "Unknown",
      language: "english",
      pages: 300,
      publisher: "Unknown",
      title: "Fake Title",
      year: 2023,
    });
    expect(response.statusCode).toEqual(201);
    expect(response.body).toEqual({
      book: {
        isbn: "012345678",
        amazon_url: "http://a.co/ef3254",
        author: "Unknown",
        language: "english",
        pages: 300,
        publisher: "Unknown",
        title: "Fake Title",
        year: 2023,
      },
    });
  });
});

describe("PUT /books/:id", function () {
  test("Returns 404 if invalid book id", async function () {
    const response = await request(app).put("/books/12345");
    expect(response.statusCode).toEqual(400);
  });
  test("Returns updated book", async function () {
    const response = await request(app).put("/books/0691161518").send({
      amazon_url: "http://a.co/eobPtX2",
      author: "Matthew Lane",
      language: "english",
      pages: 300,
      publisher: "Princeton University Press",
      title: "Power-Up: Unlocking Hidden Math in Video Games",
      year: 2017,
    });
    expect(response.statusCode).toEqual(200);
    expect(response.body).toEqual({
      book: {
        isbn: "0691161518",
        amazon_url: "http://a.co/eobPtX2",
        author: "Matthew Lane",
        language: "english",
        pages: 300,
        publisher: "Princeton University Press",
        title: "Power-Up: Unlocking Hidden Math in Video Games",
        year: 2017,
      },
    });
  });
});

describe("DELETE /books/:isbn", function () {
  test("Returns 404 if book not found", async function () {
    const response = await request(app).delete("/books/12");
    expect(response.statusCode).toEqual(404);
  });
  test("Deletes book and returns msg", async function () {
    const response = await request(app).delete("/books/0691161518");
    expect(response.statusCode).toEqual(200);
    expect(response.body).toEqual({ message: "Book deleted" });
  });
});

// Delete data created by the test
afterEach(async function () {
  await db.query(`DELETE FROM books`);
});

// End connection to db
afterAll(async function () {
  await db.end();
});
