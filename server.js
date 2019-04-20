'use strict';

const http = require('http');
const fs = require('fs');
const qs = require('querystring');

const server = http.createServer((req, res) => {
  console.log('what?');
  console.log(req.url);
  let reqURL = '/index.html';

  if (req.url !== '/') {
    if (fs.existsSync(`/public${req.url}`)) {
      reqURL = req.url;
    } else {
      reqURL = '/404.html';
    }
  }

  if (req.method === 'POST') {
    let body = '';
    req.on('data', (chunk) => {
      body += chunk.toString(); // convert Buffer to string
    });
    req.on('end', () => {
      console.log(body);
      res.end('ok');
    });
  }

  fs.readFile(`./public${reqURL}`, 'UTF-8', function(err, data) {
    res.writeHead(200, { 'Content-Type': 'text/html', 'Content-Length': data.length });
    res.write(data);
    res.end();
  });
});

server.on('clientError', (err, socket) => {
  socket.end('HTTP/1.1 400 Bad Request\r\n\r\n');
});
server.listen(8080);
