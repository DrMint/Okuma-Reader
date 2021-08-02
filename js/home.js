"use strict";
import * as CONSTANTS from './constants.js';
import { findGetParameter, applyTheme, infoToPageURL, infoToImageURL, chooseAndFetchLanguage, fetchBook, fetchLibrary } from './tools.js';

var LIBRARY = findGetParameter('library');
if (LIBRARY == null) LIBRARY = CONSTANTS.booksURL();

applyTheme();

function applyLanguage(languageData) {
    document.title = CONSTANTS.websiteName() + ' - ' + languageData.homePage.home;
    document.getElementById("availableBooks").innerHTML = languageData.homePage.availableBooks;
}

function displayBook(bookData, title) {
  var link = document.createElement("a");
  var p = document.createElement("p");
  var cover = document.createElement("img");

  link.href = infoToPageURL(LIBRARY, title);
  p.innerHTML = bookData.title;
  cover.src = infoToImageURL(LIBRARY, title, 1, 1, bookData.fileExtension);

  link.appendChild(p);
  link.appendChild(cover);
  document.getElementById("books").appendChild(link);
}

chooseAndFetchLanguage()
  .then(languageData => applyLanguage(languageData))
  .then(() => fetchLibrary(LIBRARY))
  .then(libraryData => libraryData.titles.forEach((title, index) => {
    fetchBook(LIBRARY, title)
      .then(bookData => displayBook(bookData, title));
  }));
