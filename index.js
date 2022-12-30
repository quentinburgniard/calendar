import axios from 'axios';
import cookieParser from 'cookie-parser';
import express from 'express';
import morgan from 'morgan';
import qs from 'qs';

const app = express();
const port = 80;

app.disable('x-powered-by');
app.set('view cache', false);
app.set('view engine', 'ejs');
app.use(cookieParser())
app.use(express.urlencoded({ extended: false }));
app.use(express.static('public', { maxAge: '7d' }));
app.use(morgan('tiny'));

const getDays = (startDate, endDate) => {
  let days = [];
  startDate = new Date(startDate);
  endDate = new Date(endDate);
  while (startDate < endDate) {
    days.push(new Date(startDate));
    startDate.setDate(startDate.getDate() + 1);
  }
  return days;
}

app.use((req, res, next) => {
  req.token = req.cookies.t || '';
  next();
});

app.get('/bda28174a0c5d13e671c.ics', (req, res, next) => {
  axios.get('https://api.digitalleman.com/v2/events', {
    headers: {
      'authorization': `Bearer ${process.env.TOKEN}`
    }
  })
  .then((response) => {
    res.set({
      'content-type': 'text/calendar'
    });
    res.render('ics', {
      events: response.data.data
    });
  })
  .catch((error) => {
    res.status(error.response.status);
    res.send();
  });
});

app.get('/chataigniers', (req, res) => {
  let startDate = new Date();
  startDate.setMonth(startDate.getMonth() - 1, 1);
  startDate.setHours(0, 0, 0, 0);

  let endDate = new Date();
  endDate.setMonth(endDate.getMonth() + 3, 0);
  endDate.setHours(23, 59, 59, 999);

  let params = {
    filters: {
      startDate: {
        $gte: startDate.toISOString(),
      },
      endDate: {
        $lte: endDate.toISOString(),
      }
    },
    sort: 'startDate'
  }

  axios.get('https://api.digitalleman.com/v2/events?' + qs.stringify(params), {
    headers: {
      'authorization': `Bearer ${req.token}`
    }
  })
  .then((response) => {
    let events = response.data.data.map((event) => {
      event.attributes.endDate = new Date(event.attributes.endDate);
      event.attributes.startDate = new Date(event.attributes.startDate);
      return event;
    });
    let nextDay = startDate;
    if (events.length) {
      nextDay = new Date(events[events.length - 1].attributes.startDate);
      nextDay.setDate(nextDay.getDate() + 1);
      nextDay.setHours(0, 0, 0, 0)
    } 

    res.render('chataigniers', {
      added: req.query.added || null,
      days: getDays(startDate, endDate),
      endDate: endDate,
      nextDay: nextDay,
      events: events
    });
  })
  .catch((error) => {
    console.log(error);
    if ([401, 403].includes(error.response.status)) {
      res.redirect('https://id.digitalleman.com?r=calendar.digitalleman.com%2Fchataigniers')
    }
    res.status(error.response.status);
    res.send();
  });
});

app.post('/chataigniers', (req, res, next) => {
  let endDate = new Date(req.body.date);
  let event = {
    title: 'Les Châtaigniers'
  }
  let startDate = new Date(req.body.date);

  switch (req.body.value) {
    case 'green-5':
      startDate.setHours(8, 0, 0, 0);
      endDate.setHours(19, 30, 0, 0);
      event.description = '5 Vert';
      break;
    case 'blue-7':
      startDate.setHours(10, 0, 0, 0);
      endDate.setHours(19, 30, 0, 0);
      event.description = '7 Bleu';
      break;
    case 'red-7':
      startDate.setHours(10, 30, 0, 0);
      endDate.setHours(19, 30, 0, 0);
      event.description = '7 Rouge';
      break;
    case 'red-f':
      startDate.setHours(0, 0, 0, 0);
      endDate.setHours(0, 0, 0, 0);
      event.description = 'Férié';
      event.title = 'Férié';
      break;
    case 'butterfly':
      startDate.setHours(6, 30, 0, 0);
      endDate.setHours(15, 0, 0, 0);
      event.description = 'Papillon';
      break;
    case 'rh':
      startDate.setHours(0, 0, 0, 0);
      endDate.setHours(0, 0, 0, 0);
      event.description = 'Congé';
      event.title = 'Congé';
      break;
  }
  event.endDate = endDate;
  event.startDate = startDate;
  
  axios.post('https://api.digitalleman.com/v2/events', { data: event }, {
    headers: {
      'authorization': `Bearer ${req.token}`
    }
  })
  .then((response) => {
    res.redirect(`/chataigniers?added=${response.data.data.id}`);
  })
  .catch((error) => {
    if ([401, 403].includes(error.response.status)) {
      res.redirect('https://id.digitalleman.com?r=calendar.digitalleman.com%2Fchataigniers')
    }
    res.status(error.response.status);
    res.send();
  });
});

app.use((req, res) => {
  res.status(404);
  res.send();
});

app.use((err, req, res) => {
  res.status(500);
  res.send();
});

app.listen(port);