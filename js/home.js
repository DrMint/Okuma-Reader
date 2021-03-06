"use strict";
import * as CONSTANTS from './constants.js';
import {findGetParameter} from './tools.js';

var OCONFIG;
var TCONFIG;

var LIBRARY = findGetParameter('library');
if (LIBRARY == null) LIBRARY = CONSTANTS.booksURL();

fetch(LIBRARY + 'config.json')
  .then(response => response.json())
  .then(data => {
    OCONFIG = data;

    OCONFIG.titles.forEach((title, index) => {


      fetch(LIBRARY + title + '/'+ 'config.json')
        .then(response => response.json())
        .then(data => {
          TCONFIG = data;
            var link = document.createElement("a");
            var p = document.createElement("p");
            var cover = document.createElement("img");

            link.href = CONSTANTS.readerURL() + '?library=' + LIBRARY + '&title=' + title;
            p.innerHTML = TCONFIG.title;
            cover.src = LIBRARY + title + '/1/1/1' + TCONFIG.fileExtension;

            link.appendChild(p);
            link.appendChild(cover);
            document.getElementById("books").appendChild(link);

        });

      });

  });
