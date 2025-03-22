// 모듈 설정
const express = require('express');
const http = require('http');
require('dotenv').config();
const debug = require('debug')('ahyak-be:server');
const bodyParser = require('body-parser');
const multer = require('multer');
const form_data = multer();
const responseAdvisor = require('./middlewares/responseAdvisor');
const jwtUtils = require('./middlewares/jwtUtils');
require('./infra/database');
// require('./util/init');

let app = express();
app.use(express.json());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));
app.use(form_data.array());
app.use(responseAdvisor);
app.use(jwtUtils.authenticateToken);
app.set('port', 3000);

let server = http.createServer(app);
server.listen(3000);

let indexRouter = require('./routes/index');
let authRouter = require('./routes/auth');
let medicineRouter = require('./routes/medicine');
let dailyStatusRouter = require('./routes/dailyStatus');
let prescriptionRouter = require('./routes/prescription');

app.use('/auth', authRouter);
app.use('/', indexRouter);
app.use('/medicine', medicineRouter);
app.use('/dailyStatus', dailyStatusRouter);
app.use('/prescription', prescriptionRouter);



