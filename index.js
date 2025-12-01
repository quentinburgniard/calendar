import axios from "axios";
import cookieParser from "cookie-parser";
import { createHash } from "crypto";
import express from "express";
import morgan from "morgan";
import qs from "qs";

const app = express();
const port = 80;

app.disable("x-powered-by");
app.set("view cache", false);
app.set("view engine", "ejs");
app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(express.static("public", { maxAge: "7d" }));
app.use(morgan("tiny"));

const getDays = (startDate, endDate) => {
  let days = [];
  startDate = new Date(startDate);
  endDate = new Date(endDate);
  while (startDate < endDate) {
    days.push(new Date(startDate));
    startDate.setDate(startDate.getDate() + 1);
  }
  return days;
};

app.use((req, _, next) => {
  req.token = req.cookies.t || "";
  next();
});

app.get("/bda28174a0c5d13e671c.ics", (req, res) => {
  const params = {
    filters: {
      user: 2,
    },
    pagination: {
      pageSize: 365,
    },
    sort: "startDate:desc",
  };

  axios
    .get(
      "https://api.preview.digitalleman.com/v5/events?" + qs.stringify(params),
      {
        headers: {
          authorization: `Bearer ${process.env.TOKEN}`,
        },
      }
    )
    .then((response) => {
      res.set({
        "content-type": "text/calendar",
      });
      let events = response.data.data.map((event) => {
        event.date = {
          endDate: new Date(event.endDate),
          startDate: new Date(event.startDate),
        };
        event.id = createHash("md5")
          .update(`${event.id}${event.updatedAt}`)
          .digest("hex");
        return event;
      });

      res.render("ics", {
        events: events,
      });
    })
    .catch((error) => {
      res.status(error.response.status);
      res.send();
    });
});

app.delete("/chataigniers/:id", (req, res) => {
  res.send();
});

app.get("/chataigniers", (req, res) => {
  let startDate = null;
  if (req.query.startDate) {
    startDate = new Date(req.query.startDate);
  } else {
    startDate = new Date();
    startDate.setMonth(startDate.getMonth() - 1, 1);
  }
  startDate.setHours(0, 0, 0, 0);

  let endDate = null;
  if (req.query.endDate) {
    endDate = new Date(req.query.endDate);
  } else {
    endDate = new Date();
    endDate.setMonth(endDate.getMonth() + 3, 0);
  }
  endDate.setHours(23, 59, 59, 999);

  const params = {
    filters: {
      startDate: {
        $gte: startDate.toISOString(),
      },
      endDate: {
        $lte: endDate.toISOString(),
      },
    },
    pagination: {
      pageSize: 200,
    },
    sort: "startDate",
  };

  axios
    .get(
      "https://api.preview.digitalleman.com/v5/events?" + qs.stringify(params),
      {
        headers: {
          authorization: `Bearer ${req.token}`,
        },
      }
    )
    .then(({ data }) => {
      let days = getDays(startDate, endDate);
      let events = data.data.map((event) => {
        event.endDate = new Date(event.endDate);
        event.startDate = new Date(event.startDate);
        return event;
      });
      let nextDay = startDate;
      if (events.length) {
        let found = days.find((day) => {
          let dayEnd = new Date(day);
          dayEnd.setHours(23, 59, 59, 999);
          return (
            events.filter(
              (event) => event.startDate >= day && event.endDate <= dayEnd
            ).length == 0
          );
        });
        if (found) {
          nextDay = new Date(found);
        } else {
          nextDay = new Date(events[events.length - 1].startDate);
          nextDay.setDate(nextDay.getDate() + 1);
        }
      }

      res.render("chataigniers/events", {
        added: req.query.added || null,
        days: days,
        endDate: endDate,
        nextDay: nextDay,
        events: events,
      });
    })
    .catch((error) => {
      if ([401, 403].includes(error.response.status)) {
        res.redirect(
          "https://id.preview.digitalleman.com/fr?r=calendar.preview.digitalleman.com%2Fchataigniers"
        );
      }
      res.status(error.response.status);
      res.send();
    });
});

app.get("/chataigniers/new", (req, res) => {
  let startDate = new Date();
  startDate.setMonth(startDate.getMonth() - 1, 1);
  startDate.setHours(0, 0, 0, 0);

  let endDate = new Date();
  endDate.setMonth(endDate.getMonth() + 3, 0);
  endDate.setHours(23, 59, 59, 999);

  const params = {
    filters: {
      startDate: {
        $gte: startDate.toISOString(),
      },
      endDate: {
        $lte: endDate.toISOString(),
      },
    },
    pagination: {
      pageSize: 200,
    },
    sort: "startDate",
  };

  axios
    .get(
      "https://api.preview.digitalleman.com/v5/events?" + qs.stringify(params),
      {
        headers: {
          authorization: `Bearer ${req.token}`,
        },
      }
    )
    .then((response) => {
      let days = getDays(startDate, endDate);
      let events = response.data.data.map((event) => {
        event.endDate = new Date(event.endDate);
        event.startDate = new Date(event.startDate);
        return event;
      });
      let nextDay = startDate;
      if (events.length) {
        let found = new Date(events.at(-1).endDate);
        found.setHours(23, 59, 59, 999);
        found.setDate(found.getDate() + 1);
        if (found) {
          nextDay = new Date(found);
        } else {
          nextDay = new Date(events[events.length - 1].startDate);
          nextDay.setDate(nextDay.getDate() + 1);
        }
      }

      res.render("chataigniers/new", {
        added: req.query.added || null,
        days: days,
        endDate: endDate,
        nextDay: nextDay,
        events: events,
      });
    })
    .catch((error) => {
      if ([401, 403].includes(error.response.status)) {
        res.redirect(
          "https://id.preview.digitalleman.com/fr?r=calendar.preview.digitalleman.com%2Fchataigniers"
        );
      }
      res.status(error.response.status);
      res.send();
    });
});

app.post("/chataigniers", (req, res) => {
  let endDate = new Date(req.body.date);
  let event = {
    title: "Les Châtaigniers",
  };
  let startDate = new Date(req.body.date);

  switch (req.body.value) {
    case "green-5":
      startDate.setHours(8, 0, 0, 0);
      endDate.setHours(19, 30, 0, 0);
      event.description = "5 Vert";
      break;
    case "blue-7":
      startDate.setHours(10, 0, 0, 0);
      endDate.setHours(19, 30, 0, 0);
      event.description = "7 Bleu";
      break;
    case "red-7":
      startDate.setHours(10, 30, 0, 0);
      endDate.setHours(19, 30, 0, 0);
      event.description = "7 Rouge";
      break;
    case "red-f":
      startDate.setHours(0, 0, 0, 0);
      endDate.setHours(0, 0, 0, 0);
      event.description = "Férié";
      event.title = `Férié (${event.title})`;
      break;
    case "butterfly":
      startDate.setHours(6, 30, 0, 0);
      endDate.setHours(15, 0, 0, 0);
      event.description = "Papillon";
      break;
    case "3r":
      //startDate.setHours(6, 30, 0, 0);
      //endDate.setHours(15, 0, 0, 0);
      event.description = "3R";
      break;
    case "p0":
      //startDate.setHours(6, 30, 0, 0);
      //endDate.setHours(15, 0, 0, 0);
      event.description = "P0";
      break;
    case "rh":
      startDate.setHours(0, 0, 0, 0);
      endDate.setHours(0, 0, 0, 0);
      event.description = "Congé";
      event.title = `Congé (${event.title})`;
      break;
  }
  event.endDate = endDate;
  event.startDate = startDate;

  axios
    .post(
      "https://api.preview.digitalleman.com/v5/events",
      { data: event },
      {
        headers: {
          authorization: `Bearer ${req.token}`,
        },
      }
    )
    .then((response) => {
      if (req.query.response == "json") {
        res.status(response.status);
        let message = "";

        if (response.data.data.attributes) {
          let data = response.data.data.attributes;
          let date = new Date(data.startDate);
          date = `${date.toLocaleDateString("fr", {
            weekday: "long",
          })} ${date.toLocaleDateString("fr", {
            day: "numeric",
          })} ${date.toLocaleDateString("fr", { month: "long" })}`;
          message = `${date} enregistré en ${data.description}`;
        }

        res.send({
          id: response.data.data.id,
          message: message,
        });
      } else {
        res.redirect(303, `/chataigniers/new`);
      }
    })
    .catch((error) => {
      if ([401, 403].includes(error.response.status)) {
        res.redirect(
          "https://id.preview.digitalleman.com/fr?r=calendar.preview.digitalleman.com%2Fchataigniers"
        );
      }
      res.status(error.response.status);
      res.send();
    });
});

app.put("/chataigniers/:id", (req, res) => {
  let endDate = new Date(req.body.date);
  let event = {
    title: "Les Châtaigniers",
  };
  let startDate = new Date(req.body.date);

  switch (req.body.value) {
    case "green-5":
      startDate.setHours(8, 0, 0, 0);
      endDate.setHours(19, 30, 0, 0);
      event.description = "5 Vert";
      break;
    case "blue-7":
      startDate.setHours(10, 0, 0, 0);
      endDate.setHours(19, 30, 0, 0);
      event.description = "7 Bleu";
      break;
    case "red-7":
      startDate.setHours(10, 30, 0, 0);
      endDate.setHours(19, 30, 0, 0);
      event.description = "7 Rouge";
      break;
    case "red-f":
      startDate.setHours(0, 0, 0, 0);
      endDate.setHours(0, 0, 0, 0);
      event.description = "Férié";
      event.title = `Férié (${event.title})`;
      break;
    case "butterfly":
      startDate.setHours(6, 30, 0, 0);
      endDate.setHours(15, 0, 0, 0);
      event.description = "Papillon";
      break;
    case "3r":
      //startDate.setHours(6, 30, 0, 0);
      //endDate.setHours(15, 0, 0, 0);
      event.description = "3R";
      break;
    case "p0":
      //startDate.setHours(6, 30, 0, 0);
      //endDate.setHours(15, 0, 0, 0);
      event.description = "P0";
      break;
    case "rh":
      startDate.setHours(0, 0, 0, 0);
      endDate.setHours(0, 0, 0, 0);
      event.description = "Congé";
      event.title = `Congé (${event.title})`;
      break;
  }
  event.endDate = endDate;
  event.startDate = startDate;

  axios
    .put(
      `https://api.preview.digitalleman.com/v5/events/${req.params.id}`,
      { data: event },
      {
        headers: {
          authorization: `Bearer ${req.token}`,
        },
      }
    )
    .then((response) => {
      res.status(response.status);
      let message = "";

      if (response.data.data.attributes) {
        let data = response.data.data.attributes;
        let date = new Date(data.startDate);
        date = `${date.toLocaleDateString("fr", {
          weekday: "long",
        })} ${date.toLocaleDateString("fr", {
          day: "numeric",
        })} ${date.toLocaleDateString("fr", { month: "long" })}`;
        message = `${date} enregistré en ${data.description}`;
      }

      res.send({
        message: message,
      });
    })
    .catch((error) => {
      res.status(error.response.status);
      res.send();
    });
});

app.use((_, res) => {
  res.status(404);
  res.send();
});

app.use((_, __, res, ___) => {
  res.status(500);
  res.send();
});

app.listen(port);
