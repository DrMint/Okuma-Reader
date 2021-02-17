# Reader-JS
Online book reader written in JS with some key features like Japanese page order, double-page view and pre-caching on next pages.
The design is entirely cilent-side, the server simply host the images.

## Features

- Page turn with arrow keys or by clicking on the edge of a page.
- Support for books with multiple chapters
- Support for Japanese page ordering.
- Support for various screen ratio.
- Optional filters that simulate the visual experience of reading a real book (see Interface for images).
- Next/previous chapter buttons and chapter selection drop-down menu.
- Asynchronous pre-caching of the next pages (or next chapter first pages when at the end of a chapter).
- Single and double-page display with the ability to display the cover page as a single page.
- Suppoprt for vertical continuous scrolling (webtoons).
- Config files per book.

## Interface
![](https://r-entries.com/etuliens/img/Reader/1.jpg)
The image has been blurred to avoid copyright claims.

## Directory structure
- a-example-book/
	- 1/
		- 1.jpg
		- 2.jpg
		- ...
	- 2/
		- 1.jpg
		- 2.jpg
		- ...
	- 3/
		- 1.jpg
		- ...
	- ...
	- config.json
- another-one/
	- 1/
	- 2/
	- config.json
- index.html
- reader.css
- reader.js

A few rules and constraints:
- All images in a book must have the same extension
- The chapters must be numbered from 1 to n
- The pages of a chapter must be numbered from 1 to n
- If possible, all pages should have the same size (or at least the same ratio)
- A image should correspond to one page, images that have been combined as a double-page should be split

## Config files
A config file must be provided for each book. Here's an example:

```
{
  "title": "My book's title",
  "numPages": [38, 24, 40, 30],
  "fileExtension": ".jpg",
  "bookType": "manga",
  "japaneseOrder": true,
  "fistPageSingle": true,
  "preferDoublePage": true,
  "allowDoublePage": true
}

```

numPages is the number of pages for each chapter. In this example, this book has 4 chapters

## Things I want to add/change/improve
- Better support for vertical screen and more polished interface
- Give the user the ability to change things like the background color, blue-light filter
- Being able to save the current page in a book, to easily resume next time a user wants to read
- Not having to write the number of pages in the config.json
- More plexibility per chapter
- Ability to give a name to each chapter
- Page turning animation?!
- A main page to showcase all available books
- A Download page/chapter/book buttons? That would also open-up the idea of making it an offline Progressive Web App
