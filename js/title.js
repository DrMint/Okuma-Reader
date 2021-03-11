"use strict";
import * as CONSTANTS from './constants.js';
import {findGetParameter} from './tools.js';

var OCONFIG;
var TCONFIG;
var TINFO;

var LIBRARY = findGetParameter('library');
if (LIBRARY == null) LIBRARY = CONSTANTS.booksURL();
var TITLE;

var bookInfoDiv = document.getElementById("bookInfo");

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


        var bookTitle = document.createElement("h2");
        bookTitle.innerHTML = TCONFIG.title;
        bookInfoDiv.appendChild(bookTitle);

        fetch(LIBRARY + TITLE + '/'+ 'info.json')
          .then(response => response.json())
          .then(data => {
            TINFO = data;

            var status = document.createElement("p");
            status.innerHTML = TINFO.status;
            status.id = "status";
            bookInfoDiv.appendChild(status);

            var genres = document.createElement("div");
            genres.id = "genres";
            TINFO.genres.forEach((genre, index) => {
              var line = document.createElement("p");
              line.innerHTML = genre;
              genres.appendChild(line);
            });
            bookInfoDiv.appendChild(genres);

            var status = document.createElement("p");
            status.innerHTML = "Language: " + TINFO.language;
            status.id = "status";
            bookInfoDiv.appendChild(status);

            var authors = document.createElement("div");
            authors.id = "authors";
            TINFO.authors.forEach((author, index) => {
              var line = document.createElement("p");
              line.innerHTML = author[1] + ': ' + author[0];
              authors.appendChild(line);
            });
            bookInfoDiv.appendChild(authors);

            var serialization = document.createElement("p");
            serialization.innerHTML = "Serialization: " + TINFO.serialization;
            serialization.id = "serialization";
            bookInfoDiv.appendChild(serialization);

            var synopsis = document.createElement("p");
            synopsis.innerHTML = TINFO.synopsis;
            synopsis.id = "synopsis";
            bookInfoDiv.appendChild(synopsis);

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
