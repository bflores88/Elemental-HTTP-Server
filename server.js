'use strict';

const http = require('http');
const fs = require('fs');
const qs = require('querystring');

const formData = ['elementName', 'elementSymbol', 'elementAtomicNumber', 'elementDescription'];

let elementNameReceived = '';
let elementSymbolReceived = '';
let elementAtomicNumberReceived = 0;
let elementDescriptionReceived = '';
let fileName = '';

const server = http.createServer((req, res) => {
  let reqURL = '/index.html';

  if (req.url !== '/') {
    if (fs.existsSync(`/public${req.url}`)) {
      reqURL = req.url;
    } else {
      reqURL = '/404.html';
    }
  }

  if (req.method === 'GET') {
    fs.readFile(`./public${reqURL}`, 'UTF-8', function(err, data) {
      res.writeHead(200, { 'Content-Type': 'text/html', 'Content-Length': data.length });
      res.write(data);
      res.end();
    });
  }

  if (req.method === 'POST' && req.url === '/elements') {
    let body = '';
    req.on('data', (chunk) => {
      body += chunk.toString(); // convert Buffer to string
      let bodyObject = qs.decode(body);

      let bodyKeys = Object.keys(bodyObject);
      let bodyValues = Object.values(bodyObject);

      if (
        bodyKeys[0] === formData[0] &&
        bodyKeys[1] === formData[1] &&
        bodyKeys[2] === formData[2] &&
        bodyKeys[3] === formData[3]
      ) {
        elementNameReceived = bodyValues[0];
        elementSymbolReceived = bodyValues[1];
        elementAtomicNumberReceived = bodyValues[2];
        elementDescriptionReceived = bodyValues[3];
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

        let indexAppend = `    <li>
      <a href="/${fileName}.html">${elementNameReceived}</a>
    </li>
  </ol>
</body>
</html>`;

        let indexWriteStream = fs.createWriteStream('./public/index.html', { flags: 'a', start: 380 });
        indexWriteStream.write(indexAppend);

        indexWriteStream.on('finish', () => {
          console.log('wrote all data to file');
        });

        indexWriteStream.end();
      } else {
        server.on('clientError', (err, socket) => {
          socket.end('HTTP/1.1 400 Bad Request\r\n\r\n');
        });
      }
    });
    req.on('end', () => {
      console.log(qs.decode(body));
      res.end('{ "success" : true }');
    });
  } else {
    server.on('clientError', (err, socket) => {
      socket.end('HTTP/1.1 400 Bad Request\r\n\r\n');
    });
  }
});

server.on('clientError', (err, socket) => {
  socket.end('HTTP/1.1 400 Bad Request\r\n\r\n');
});
server.listen(8080);
