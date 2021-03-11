"use strict";
import * as CONSTANTS from './constants.js';
import { findGetParameter } from './tools.js';
import { getCookie } from './cookie.js';

var OCONFIG;
var TCONFIG;
var TINFO;
var LCONFIG;

var LIBRARY = findGetParameter('library');
if (LIBRARY == null) LIBRARY = CONSTANTS.booksURL();

var lang;
if (getCookie('lang') != '') {
  lang = getCookie('lang');
} else if (findGetParameter('lang') != null) {
  lang = findGetParameter('lang')
} else {
  lang = CONSTANTS.defaultLanguage();
}

var TITLE;
var bookInfoDiv = document.getElementById("bookInfo");


{
  const body = document.getElementsByTagName("body")[0];
  const themeSelection = parseInt(getCookie('themeSelection'));
  const themeNames = ['darkTheme', 'lightTheme'];
  for (var i = 0; i < themeNames.length; i++) {
    body.classList.remove(themeNames[i]);
  }
  body.classList.add(themeNames[themeSelection]);
}


fetch('../lang/' + lang + '.json')
  .then(response => response.json())
  .then(data => {
    LCONFIG = data;

    fetch(LIBRARY + 'config.json')
      .then(response => response.json())
      .then(data => {
        OCONFIG = data;

        // If the title isn't valid, go back to home page
        TITLE = findGetParameter('title');
        if (OCONFIG.titles.indexOf(TITLE) == -1) {
          window.location.href = CONSTANTS.homeURL();
        }

        fetch(LIBRARY + TITLE + '/'+ 'config.json')
          .then(response => response.json())
          .then(data => {
            TCONFIG = data;

            // Change the title of the webpage
            document.title = CONSTANTS.websiteName() + ' - ' + TCONFIG.title;


            var bookTitle = document.createElement("h2");
            bookTitle.innerHTML = TCONFIG.title;
            bookInfoDiv.appendChild(bookTitle);

            fetch(LIBRARY + TITLE + '/'+ 'info.json')
              .then(response => response.json())
              .then(data => {
                TINFO = data;

                if (TINFO.status && LCONFIG.titlePage.status[TINFO.status]) {
                  var status = document.createElement("p");
                  status.innerHTML = LCONFIG.titlePage.status[TINFO.status];
                  status.id = "status";
                  bookInfoDiv.appendChild(status);
                }

                if (TINFO.genres) {
                  var genres = document.createElement("div");
                  genres.id = "genres";
                  TINFO.genres.forEach((genre, index) => {
                    var line = document.createElement("p");
                    line.innerHTML = genre;
                    genres.appendChild(line);
                  });
                  bookInfoDiv.appendChild(genres);
                }

                if (TINFO.language) {
                  var status = document.createElement("p");
                  status.innerHTML = LCONFIG.titlePage.language + LCONFIG.ps + ": " + TINFO.language;
                  status.id = "status";
                  bookInfoDiv.appendChild(status);
                }

                if (TINFO.authors) {
                  var authors = document.createElement("div");
                  authors.id = "authors";
                  TINFO.authors.forEach((author, index) => {
                    if (LCONFIG.titlePage.authors[author[0]]) {
                      var line = document.createElement("p");
                      line.innerHTML = LCONFIG.titlePage.authors[author[0]] + LCONFIG.ps + ': ' + author[1];
                      authors.appendChild(line);
                    }
                  });
                  bookInfoDiv.appendChild(authors);
                }

                if (TINFO.serialization) {
                  var serialization = document.createElement("p");
                  serialization.innerHTML = LCONFIG.titlePage.publication + LCONFIG.ps + ": " + TINFO.serialization;
                  serialization.id = "serialization";
                  bookInfoDiv.appendChild(serialization);
                }

                if (TINFO.synopsis) {
                  var synopsis = document.createElement("p");
                  synopsis.innerHTML = TINFO.synopsis;
                  synopsis.id = "synopsis";
                  bookInfoDiv.appendChild(synopsis);
                }

              });



            for (var i = 1; i <= TCONFIG.numVolumes; i++) {
              var link = document.createElement("a");
              var p = document.createElement("p");
              var cover = document.createElement("img");

              link.href = './read.html' + '?library=' + LIBRARY + '&title=' + TITLE + '&volume=' + i + '&chapter=1&page=1';
              if (TCONFIG.numVolumes > 1) p.innerHTML = 'Volume ' + i;
              cover.src = LIBRARY + TITLE + '/' + i + '/1/1' + TCONFIG.fileExtension;

              link.appendChild(p);
              link.appendChild(cover);
              document.getElementById("volumes").appendChild(link);
            }

          });

      });


  });
