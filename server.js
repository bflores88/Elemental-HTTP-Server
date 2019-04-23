'use strict';

const http = require('http');
const fs = require('fs');
const qs = require('querystring');

let authenticationObject = {
  something: 'imadethisup',
};

let existingFiles = ['css', '404.html', 'index.html', '.keep'];

let elementNameReceived = '';
let elementSymbolReceived = '';
let elementAtomicNumberReceived = 0;
let elementDescriptionReceived = '';
let fileName = '';

const server = http.createServer((req, res) => {
  let reqURL = '/index.html';

  //check if requested URL exists in current files
  if (req.url !== '/') {
    let currentFiles = [];
    fs.readdir('./public/', (err, files) => {
      if (err) throw err;
      currentFiles = files;
    });

    if (currentFiles.indexOf(req.url) === -1) {
      reqURL = '/404.html';
    } else {
      reqURL = req.url;
    }
  }

  if (req.method === 'GET') {
    fs.readFile(`./public${reqURL}`, 'UTF-8', function(err, data) {
      if (err) throw err;
      res.writeHead(200, { 'Content-Type': 'text/html', 'Content-Length': data.length });
      res.write(data);
      res.end();
      return;
    });
  }

  if (req.method === 'POST' || req.method === 'PUT' || req.method === 'DELETE') {
    if (req.headers.authorization === undefined) {
      res.writeHead(401, { 'WWW-Authenticate': 'Basic realm="Secure Area"' });
      res.end(`<html><body>Not Authorized</body></html>`);
      return;
    } else {
      let authHeader = req.headers.authorization;
      let findSpace = authHeader.indexOf(' ');
      let encodedString = authHeader.slice(findSpace + 1);
      let base64buffer = new Buffer.from(encodedString, 'base64');
      let decodedString = base64buffer.toString();
      let decodedArray = decodedString.split(':');

      if (authenticationObject.hasOwnProperty(decodedArray[0])) {
        if (authenticationObject[decodedArray[0]] === decodedArray[1]) {
          console.log('password correct!');
        } else {
          res.writeHead(401, { 'WWW-Authenticate': 'Basic realm="Secure Area"' });
          res.end(`<html><body>Invalid Authentication Credentials</body></html>`);
          return;
        }
      } else {
        res.writeHead(401, { 'WWW-Authenticate': 'Basic realm="Secure Area"' });
        res.end(`<html><body>Invalid Authentication Credentials</body></html>`);
        return;
      }
    }
  }

  if (req.method === 'POST') {
    if (req.url !== '/elements') {
      res.writeHead(400, { 'Content-Type': 'text/html' });
      res.end(`invalid request URL`);
      return;
    }

    let body = '';
    req.on('data', (chunk) => {
      body += chunk.toString();
      let bodyObject = qs.decode(body);
      let bodyKeys = Object.keys(bodyObject);

      if (
        bodyKeys.indexOf('elementName') !== -1 &&
        bodyKeys.indexOf('elementSymbol') !== -1 &&
        bodyKeys.indexOf('elementAtomicNumber') !== -1 &&
        bodyKeys.indexOf('elementDescription') !== -1
      ) {
        elementNameReceived = bodyObject.elementName;
        elementSymbolReceived = bodyObject.elementSymbol;
        elementAtomicNumberReceived = bodyObject.elementAtomicNumber;
        elementDescriptionReceived = bodyObject.elementDescription;
        fileName = elementNameReceived.toLowerCase();

        let elementTemplate = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>The Elements - ${elementNameReceived}</title>
  <link rel="stylesheet" href="/css/styles.css">
</head>
<body>
  <h1>${elementNameReceived}</h1>
  <h2>${elementSymbolReceived}</h2>
  <h3>Atomic number ${elementAtomicNumberReceived}</h3>
  <p>${elementDescriptionReceived}</p>
  <p><a href="/">back</a></p>
</body>`;

        fs.writeFile(`./public/${fileName}.html`, elementTemplate, (err) => {
          if (err) throw err;
          console.log('The file has been saved!');
        });

        let listOfFiles = '';
        let counter = 0;

        fs.readdir('./public/', (err, files) => {
          files.forEach((file) => {
            let fileTitle = file.charAt(0).toUpperCase() + file.slice(1);
            if (!existingFiles.includes(file)) {
              counter++;
              listOfFiles += `
    <li>
      <a href="/${file}.html">${fileTitle}</a>
    </li>`;
            }

            if (err) {
              res.send('[empty]');
              return;
            }
          });

          let updateHTML = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>The Elements</title>
  <link rel="stylesheet" href="/css/styles.css">
</head>
<body>
  <h1>The Elements</h1>
  <h2>These are all the known elements.</h2>
  <h3>These are ${counter}</h3>
  <ol>${listOfFiles}
  </ol>
</body>
</html>`;

          let indexWriteStream = fs.createWriteStream('./public/index.html');
          indexWriteStream.write(updateHTML);

          indexWriteStream.on('finish', () => {
            console.log('wrote all data to file');
          });
        });
      } else {
        server.on('clientError', (err, socket) => {
          socket.end('HTTP/1.1 400 Bad Request\r\n\r\n');
        });
      }
    });
    req.on('end', () => {
      res.writeHead(200, { 'Content-Type': 'application/JSON' });
      res.end('{ "success" : true }');
    });
  } else {
    server.on('clientError', (err, socket) => {
      socket.end('HTTP/1.1 400 Bad Request\r\n\r\n');
    });
  }

  if (req.method === 'PUT') {
    fs.access(`./public/${req.url.slice(1)}`, fs.constants.F_OK | fs.constants.W_OK, (err) => {
      if (err) {
        console.error(`${req.url.slice(1)} ${err.code === 'ENOENT' ? 'does not exist' : 'is read-only'}`);
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(`{ "error" : "resource ${req.url} does not exist }`);
      } else {
        console.log(`${req.url.slice(1)} exists, and it is writable`);

        let body = '';
        req.on('data', (chunk) => {
          body += chunk.toString();

          let bodyObject = qs.decode(body);
          let bodyKeys = Object.keys(bodyObject);

          if (
            bodyKeys.indexOf('elementName') !== -1 &&
            bodyKeys.indexOf('elementSymbol') !== -1 &&
            bodyKeys.indexOf('elementAtomicNumber') !== -1 &&
            bodyKeys.indexOf('elementDescription') !== -1
          ) {
            elementNameReceived = bodyObject.elementName;
            elementSymbolReceived = bodyObject.elementSymbol;
            elementAtomicNumberReceived = bodyObject.elementAtomicNumber;
            elementDescriptionReceived = bodyObject.elementDescription;
            fileName = elementNameReceived.toLowerCase();

            let elementTemplate = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>The Elements - ${elementNameReceived}</title>
  <link rel="stylesheet" href="/css/styles.css">
</head>
<body>
  <h1>${elementNameReceived}</h1>
  <h2>${elementSymbolReceived}</h2>
  <h3>Atomic number ${elementAtomicNumberReceived}</h3>
  <p>${elementDescriptionReceived}</p>
  <p><a href="/">back</a></p>
</body>`;

            fs.writeFile(`./public/${fileName}.html`, elementTemplate, (err) => {
              if (err) throw err;
              console.log('The file has been saved!');
              res.writeHead(200, { 'Content-Type': 'application/json' });
              res.end('{ "success" : true }');
            });
          }
        });
      }
    });
  }

  if (req.method === 'DELETE') {
    let checkFileExists = [];

    fs.readdir('./public/', (err, files) => {
      if (err) throw err;
      checkFileExists = files;
    });

    if (checkFileExists.indexOf(req.url)) {
      fs.unlink(`./public${req.url}`, function(err) {
        if (err) throw err;
        console.log('File deleted!');
      });

      let listOfFiles = '';
      let counter = 0;

      fs.readdir('./public/', (err, files) => {
        files.forEach((file) => {
          let fileTitle = file.charAt(0).toUpperCase() + file.slice(1);
          if (!existingFiles.includes(file)) {
            counter++;
            listOfFiles += `
    <li>
      <a href="/${file}.html">${fileTitle}</a>
    </li>`;
          }

          let updateHTML = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>The Elements</title>
  <link rel="stylesheet" href="/css/styles.css">
</head>
<body>
  <h1>The Elements</h1>
  <h2>These are all the known elements.</h2>
  <h3>These are ${counter}</h3>
  <ol>${listOfFiles}
  </ol>
</body>
</html>`;

          let indexWriteStream = fs.createWriteStream('./public/index.html');
          indexWriteStream.write(updateHTML);

          indexWriteStream.on('finish', () => {
            console.log('updated /index.html file');
          });

          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(`{ "success" : true }`);

          if (err) {
            res.send('[empty]');
            return;
          }
        });
      });
    } else {
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(`{ "error" : "resource ${req.url} does not exist }`);
    }
  }
  //don't write below this line
});

server.on('clientError', (err, socket) => {
  socket.end('HTTP/1.1 400 Bad Request\r\n\r\n');
});
server.listen(8080);
