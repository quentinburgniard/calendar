import axios from 'axios';
import express from 'express';
import morgan from 'morgan';

const app = express();
const port = 80;

app.disable('x-powered-by');
app.set('view cache', false);
app.set('view engine', 'ejs');
app.use(express.urlencoded({ extended: false }));
app.use(morgan('tiny'));

app.get('/', (req, res, next) => {
  res.set({
    'content-type': 'text/calendar'
  });

  let token = req.query.t || '';
  axios.get('https://api.digitalleman.com/v2/events', {
    headers: {
      'authorization': `Bearer ${token}`
    }
  })
  .then((response) => {
    res.render('index', {
      events: response.data.data
    });
  })
  .catch((error) => {
    res.status(error.response.status);
    res.send();
  });
});

app.use((req, res, next) => {
  res.status(404);
  res.send();
});

app.use((err, req, res, next) => {
  res.status(500);
  res.send();
});

app.listen(port);