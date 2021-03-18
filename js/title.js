"use strict";
import * as CONSTANTS from './constants.js';
import { findGetParameter, applyTheme, writeBookInfo, fetchBookInfo, assertsTitleExists, chooseAndFetchLanguage, fetchLibrary, fetchBook } from './tools.js';

function displayBookData(bookData) {
  // Change the title of the webpage
  document.title = CONSTANTS.websiteName() + ' - ' + bookData.title;

  var bookTitle = document.createElement("h2");
  var bookInfoDiv = document.getElementById("bookInfo")
  bookTitle.innerHTML = bookData.title;
  bookInfoDiv.appendChild(bookTitle);

  fetchBookInfo(LIBRARY, TITLE)
    .then(bookInfo => writeBookInfo(bookInfo, LCONFIG, bookInfoDiv));

  for (var i = 1; i <= bookData.numVolumes; i++) {
    var link = document.createElement("a");
    var p = document.createElement("p");
    var cover = document.createElement("img");

    link.href = './read.html' + '?library=' + LIBRARY + '&title=' + TITLE + '&volume=' + i;
    if (bookData.numVolumes > 1) p.innerHTML = 'Volume ' + i;
    cover.src = LIBRARY + TITLE + '/' + i + '/1/1' + bookData.fileExtension;

    link.appendChild(p);
    link.appendChild(cover);
    document.getElementById("volumes").appendChild(link);
  }
}

var TCONFIG;
var TINFO;
var LCONFIG;
var LIBRARY = findGetParameter('library');
if (LIBRARY == null) LIBRARY = CONSTANTS.booksURL();
var TITLE = findGetParameter('title');

chooseAndFetchLanguage()
  .then(languageData => LCONFIG = languageData)
  .then(() => fetchLibrary(LIBRARY))
  .then(libraryData => assertsTitleExists(libraryData.titles, TITLE))
  .then(applyTheme)
  .then(() => fetchBook(LIBRARY, TITLE))
  .then(bookData => displayBookData(bookData));
