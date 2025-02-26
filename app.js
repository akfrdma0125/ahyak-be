// 모듈 설정
const express = require('express');
const http = require('http');
const debug = require('debug')('ahyak-be:server');
const responseAdvisor = require('./common/responseAdvisor');

let app = express();
app.use(express.json());
app.use(responseAdvisor);
app.set('port', 3000);

let server = http.createServer(app);
server.listen(3000);

let indexRouter = require('./routes/index');

app.use('/', indexRouter);


