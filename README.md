
<p align="center">
  <img src="https://r-entries.com/etuliens/img/Reader/icon.png" width="20%">
</p>


# Okuma-Reader
Online book reader written in JS with some key features like Japanese page order, double-page view and pre-caching on next pages.
The design is entirely cilent-side, the server simply hosts the images.

[Demo](https://okuma.r-entries.com/)

## Features

- Support for series with multiple chapters and volumes.
- Support for Japanese page ordering.
- Support for various screen ratio.
- Support for non-book materials (such as image sets)
- Support for vertical continuous scrolling (such as webtoons).
- Optional filters that simulate the visual experience of reading a real book (see Interface for images).
- A main page to showcase all available books.
- Page turn with arrow keys or by clicking/tapping on the edge of a page.
- Next/previous chapter buttons and chapter selection drop-down menu.
- Asynchronous pre-caching of the next pages (or next chapter first pages when at the end of a chapter).
- Single and double-page display with the ability to display the cover page as a single page.
- Automatically save the current page/chapter and selected options for when the user comes reading again.
- Config files per title and per volume.
- Animation when loading a page
- Multilingual support (open the lang folder for the list of available languages)
- Light-weight: under 200KB (including icons, filters, and textures).

## Interface

![](https://r-entries.com/etuliens/img/Reader/1.JPG)

At the top, there is information about the current book, the current chapter, a button to enter/exit fullscreen mode, and a button to open the settings menu. At the bottom, you will find the current page, a slider you can use to quickly skim through the book, and the total number of pages.

![](https://r-entries.com/etuliens/img/Reader/12.JPG)
When a book/manga has multiple chapters, a chapter selection menu is also present with arrows to go to the previous or next chapter. Please note that in Japanese ordering mode, the current page number is at the right, the total number of pages is at the left.

### Interface on mobile
<p align="center">
  <img src="https://r-entries.com/etuliens/img/Reader/3.JPG" width="50%">
</p>
On mobile, the interface is pretty much the same. The main difference is that the chapter selection menu will be absent to safe space.

### Options
![](https://r-entries.com/etuliens/img/Reader/2.JPG)
There is also a light mode. The user can tweak the reader settings in the side menu, such as single or double pages mode, turning on or off the filters and the current theme.

### Filters
The reader includes quite a few visual effects called filters. Their goal is to make the plain images look more like an actual book.

![](https://r-entries.com/etuliens/img/Reader/11.JPG)
With all filters turned off, this is just two plain images.

![](https://r-entries.com/etuliens/img/Reader/10.JPG)
The same pages with the filters turned on.
Here what each filter does:
 - Paper texture: adds some grain to the paper. The amount and type of grain depends on the book type (see the Config files section).
 - Book fold: adds a self-shadowed area in the middle of the book.
 - Realistic lighting: adds specularity to the paper.
 - Side pages: accurately simulates the fact that the previous and next pages are visible on the side of the book. (see the Side pages section).
 - Book shadow: adds a shadow to the bottom and side of the book to make it seems as if the book is laying on the surface.

### Side pages
To make the experience more realistic, I added a feature called side pages.
![](https://r-entries.com/etuliens/img/Reader/4.JPG)
Side pages are not shown on single pages such as the first page.

![](https://r-entries.com/etuliens/img/Reader/5.JPG)
At the beginning of the book, there is a lot of side pages on the right side. The amount of side pages shown actually depends on the number of remaining pages.

![](https://r-entries.com/etuliens/img/Reader/6.JPG)
With each page turned, the number of side pages on the left side will gradually increase and the opposite will occours on the right side.

## Library structure

### Overview
- library/
	- an-example-book/
		- 1/
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
		- 2/
			- ...
			- config.json
		- config.json
		- info.json
	- another-one/
		- 1/
			- ... 
			- config.json
		- config.json
	- config.json

### Root folder
The library folder is where the titles (series/book/manga...) are stored. Its stucture uses the Okuma Library Directory Structure. This folder mush be accessible online in order to use it with Okuma Reader. It isn't necessary to enable files and directory listing on your web server.

The first layer is composed of folders, one for each "title". There is also a JSON file called config.json that contains a list of the folders. The name of a title folder is called the title's slug. A slug must only contain lowercase letters and numbers. Spaces are replaced with dashes. So a book called "My Awesome First Book" could use a slug like "awesome-first-book".

Here the stucture of the config.json file containing the titles' slugs / name of the folders:
```json
{
  "titles":
  [
    "an-example-book",
    "another-one"
  ]
}
```

### Second layer: Title folder
Inside each title folder, there is a folder for each of its volume. If the title in question is just a simple book, that book still has one volume. The volume are stored inside folders numbered `1`, `2`, `3`... There is also a config.json file that stored information about this title:
```json
{
  "title": "An Exemple Book",
  "bookType": "manga",
  "numVolumes": 3,
  "fileExtension": ".webp",
  "japaneseOrder": false
}
```

- `title` is the displayed name for that title. Contrary to the slug, it can be any string you want.
- `bookType` is the type of the book. Currently available types are: "manga", "book", "imageset", and "webtoon". Mangas and books are mostly the same thing, the only difference is the texture of the paper and of the side pages. Image sets are not books, nor have pages. Thus, the double-page mode is disabled. All filters are also unavailable except for the "book shadow". Webtoon are vertical "comics" supposed to be read on a web browser. This mode uses "vertical continuous scrolling". Again, all effect except for book shadow are unavailable.
- `numVolumes` is the number of volumes, which correspond to the number of sub-folders in the title folder.
- `fileExtension` is the image file format used for this title. All pages in all volumes of a title have to use the same file extension for this reason. The fileExtension value must contain the "." at the beginning.
- `japaneseOrder` is an optional parameter that controls the order of the book. Japanese books are meant to be read from right to left contrary to most western books. If the title isn't using japaneseOrder, you can set the property to false or just remove the line entirely.

If you want to add more information to a title, there is an optional info.json file that can be added next to the config.json file.
Here its structure:

```json
{
  "status": "completed",
  "published": "12-06-1982 to 06-11-1990",
  "genres": ["Action", "Sci-Fi", "Supernatural", "Drama", "Mature", "Seinen", "Tragedy"],
  "language": "English",
  "authors":
    [
      ["John Smith", "story"],
	  ["Ben Smith", "illustation"]
    ],
  "serialization": "Publishing Company Name",
  "synopsis": "A brief outline or general view, as of a subject or written work; an abstract or a summary..."
}
```

- `status` is the current status of the title. The available values are "completed", "ongoing", "cancelled".
- `published` is when the book started getting published. There aren't any restriction right now on how to format it.
- `genres` is a list of genres/tags to quickly understand what the title is about. In the future those tags will be useful to search titles of a particular genre.
- `language` is the language of the title. Again, there isn't any limitation on how to format it.
- `authors` is a list of names and their position. Currently the only translated position are "story" and "illustration". If you use something else such as "proof-reader", it will still be shown but it won't be localized when using a different language.
- `serialization` is a name of the publishing company.
- `synopsis` is the relatively short summary of the book. It can use HTML tags such as \<br> or \<strong> ...


### Third layer: Volume folder
Inside each volume folder, there is a folder for each of its chapters. If the volume in question doesn't really have chapters, you can consider is has just one chapter. The chapters are stored inside folders numbered `1`, `2`, `3`... There is also a config.json file that stored information about this volume:

```json
{
  "numPages": [38, 24, 40, 30, 30, 50],
  "fistPagesDouble": false,
  "disallowDoublePage": false
}
```

- `numPages` is a list with the number of pages/images for each chapter (subfolder).
- `fistPagesDouble` is used for double-page mode. If set to true, it indicates that the first two pages should be displayed as double pages (for exemple if the cover page is missing). It will only have an effect on the first chapter, not the following ones.
- `disallowDoublePage` indicates if the user is not allowed to enable double-page mode.

"fistPagesDouble" and "disallowDoublePage" can be ommited if false, or if the title "bookType" doesn't allow double-page mode anyway such as webtoons and image sets.

### Fourth layer: Chapter folder
This isn't much to say about this folder. The pages are stored as image files with the extension indicated by the title `config.json` file. The pages are numbered 1, 2, 3, ... All chapters use that numbering system: the first page of a chapter is always numbered "1".
If possible, all pages should have the same size (or at least the same ratio). An image should correspond to one page, images that display two pages side by side should be split.

### Okuma-Tools
I've released [Okuma-Tools](https://github.com/DrMint/Okuma-Tools) to help with preparing books. It has a couple of very nice features like conversion to WebP or JPG, cutting in half double pages, and even normalizing the image ratio throughout all the pages (useful when the source is a scan). It's still a WIP and, as of today, I haven't documented it. That being said, it's using argparse, which means it should guide you through the CLI.

## Installation

### Full installation using Git (recommended)

1. Clone the git: `git clone https://github.com/DrMint/Okuma-Reader.git`
2. Create library folder
3. Modify the js/constants.js with your website URLs

To update:
Simply use `git pull`.

If it fails with this kind of error:
```bash
error: Your local changes to the following files would be overwritten by merge:
        js/constants.js
Please commit your changes or stash them before you merge.
Aborting
```
It means that a new update changed constants.js. You will have to merge the differences yourself.
To do that:

1. Copy your modified js/constants.js: `cp js/constants.js ~/constants.js`
2. Undo changes to js/constants.js: `git checkout js/constants.js`
3. Update: `git pull`
4. Verify what's different between js/constants.js and your copy at ~/constants.js
5. If there is a new line in js/constants.js, add it to your ~/constants.js
6. Restore your modified js/constants.js: `cp ~/constants.js js/constants.js`

### Full installation using release packages

The [release packages](https://github.com/DrMint/Okuma-Reader/releases "release packages") are stable versions of Okuma. They are snapshot of the repository. This method doesn't requiere Git to be installed of your computer.

1. Download the lastest release
2. Create library folder
3. Modify the js/constants.js with your website URLs

One draw back of this method is that, without Git, there isn't a mechanism to update your instance of Okuma. You'll need to reiterate the steps above. Make sure to not delete your Okuma Library when deleting the old version.

### Without installing Okuma-Reader (Not recommended for production)

What? How is this possible? Well Okuma reader instances such as the one I'm running on my domain (https://okuma.r-entries.com) can display other people libraries.

Let's say you host a Okuma Library at this address https://okuma.mydomain.com/books/. To check that this URL is valid try accessing https://okuma.mydomain.com/books/config.json, it should give you the list of available slugs.

You can display this library using someone else instance of Okuma Reader by using GET parameter: https://okuma.r-entries.com?library=https://okuma.mydomain.com/books/. Don't forget the "/" at the end of the library URL. This feature of "making your reader usable by other people" cannot currently be disabled but it will be in the future.

Important detail: for this to work, browsers need to know that it's okay for your publicly available ressources (your library) to be accessed from another domain (the instance running Okuma Reader). As such, it's necessary to set this header for all ressources of your Okuma Library:

`Access-Control-Allow-Origin "*"` which allow any other domains to use your files.

For more security, you can specify the domain(s) that are allowed to access your library: 

`Access-Control-Allow-Origin: https://okuma.r-entries.com`. 

This header need to be set by your web server (or your reverse proxy if you're using one). Read https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Access-Control-Allow-Origin for more information about this header.

The benefit of using this method is that you don't need to worry about keeping Okuma Reader up-to-date. On the other hand, you are dependent on someone else instance to power your library.



## Prepare books

Convert PDFs into PNG images.

`-r600` means that the internal resolution is 600dpi

`-dDownScaleFactor=5` will downsampled the high resolution image into a more reasonable resolution.

`gs -dNOPAUSE -sDEVICE=png16m -r600 -dDownScaleFactor=5 -sOutputFile=export/%d.png name_of_my_book.pdf`

Then you can use a batch convertion tool to convert the images into JPGs, or even better, WebP.

## Things I want to add/change/improve (more or less in order of priority)
- Add a message/info pop-up when visiting the page for the first time with explanation on how to use it.
- When launching it for the first time, ask what "reading experience" the user wants: realistic (with the book filters) or simple (just the plain images)
- Add a book info pop-up where you can read the synopsis, learn about the author(s), status, date of release...
- Ability to give a name to each chapter.
- Ability to create bookmarks (especially for books)
- Ability for the user to create custom bookmarks
- Save the settings per book or globally.
- Give the user the ability to choose a custom color for the background.
- Add "reading mode" which is basically a blue-light filter. Later, add customizable filter layer.
- More flexibility per chapter.
- Page turning animation?!
- A Download page/chapter/book buttons? That would also open-up the idea of making it an offline Progressive Web App.
- The ability to display archives from the client's computer (without uploading it).

## License and attribution
This project uses [ironexdev](https://github.com/ironexdev)/[zoom](https://github.com/ironexdev/zoom) for handling pinch-zoom, pan, double-tap, zoom using the mouse wheel. It has been modified to allow single clicks (on the sides to go to the next/previous page and in the middle to toggle the top and bottom menus).
