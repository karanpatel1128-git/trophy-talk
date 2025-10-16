import express from 'express';
import bodyParser from 'body-parser';
import cors from 'cors';
import http from 'http';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
import route from './routes/index.js';
import msg from './utils/message.js'

dotenv.config();

const app = express();
const server = http.createServer(app);

app.set('view engine', 'ejs');
app.set('views', path.join(path.resolve(), 'views'));

app.use(cors());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(express.static("public"));

// Use routes
app.use('/api', route);

const port = process.env.PORT || 4007;
server.listen(port, () => {
  console.log(`${msg.serverRunning} ${port}`);
});
