import * as CONSTANTS from './constants.js';

var OCONFIG;
var TCONFIG;

fetch(CONSTANTS.booksURL() + 'config.json')
  .then(response => response.json())
  .then(data => {
    OCONFIG = data;

    OCONFIG.titles.forEach((title, index) => {


      fetch(CONSTANTS.booksURL() + title + '/'+ 'config.json')
        .then(response => response.json())
        .then(data => {
          TCONFIG = data;
            var link = document.createElement("a");
            var p = document.createElement("p");
            var cover = document.createElement("img");

            link.href = CONSTANTS.readerURL() + '?title=' + title;
            p.innerHTML = TCONFIG.title;
            cover.src = CONSTANTS.booksURL() + title + '/1/1/1' + TCONFIG.fileExtension;

            link.appendChild(p);
            link.appendChild(cover);
            document.getElementById("books").appendChild(link);

        });

      });

  });
