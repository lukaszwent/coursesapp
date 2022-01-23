const express = require("express");
const methodOverride = require("method-override");
require("dotenv").config();
const path = require("path");
const PORT = process.env.PORT || 3000;
const DB_HOST = process.env.DB_HOST;
const app = express();
const { connect } = require("./db");
const coursesSchema = require("./models/courses");
const ejsmate = require("ejs-mate");
const bcrypt = require("bcrypt");
const session = require("express-session");
const User = require("./models/user");
connect(DB_HOST);

app.engine("ejs", ejsmate);
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

app.use(express.urlencoded({ extended: true }));
app.use(methodOverride("_method"));
app.use(express.static(path.join(__dirname, "public")));
app.use(session({ secret: "secretpass" }));
app.use((req, res, next) => {
  res.locals.user_id = req.session.user_id;
  next();
});
const isLoggedIn = (req, res, next) => {
  if (!req.session.user_id) {
    req.session.lastUrl = req.originalUrl;
    return res.redirect("/login");
  }
  next();
};

const isAuthor = async (req, res, next) => {
  const id = req.params.id;
  const course = await coursesSchema.findById(id);

  if (!course.author.equals(req.session.user_id)) {
    return res.redirect("/courses");
  }

  next();
};

const catchErrorAsync = (surroundedFunc) => (req, res, next) => {
  surroundedFunc(req, res, next).catch((e) => next(e));
};

app.get("/register", (req, res) => {
  res.render("register");
});

app.post(
  "/register",
  catchErrorAsync(async (req, res) => {
    const { password, username } = req.body;

    const userExist = await User.findOne({ username });
    console.log(userExist);
    if (userExist) return res.redirect("/register");

    cryptedPassword = await bcrypt.hash(password, 12);
    const user = new User({ username, password: cryptedPassword });
    await user.save();
    req.session.user_id = user._id;
    res.redirect("/courses");
  })
);

app.get("/login", (req, res) => {
  res.render("login");
});

app.post(
  "/login",
  catchErrorAsync(async (req, res) => {
    const { username, password } = req.body;
    const foundUser = await User.findOne({ username });

    if (!foundUser) return res.redirect("/login");

    const isValid = bcrypt.compare(password, foundUser.password);
    if (isValid) {
      req.session.user_id = foundUser._id;
      if (req.session.lastUrl) res.redirect(req.session.lastUrl);
      else res.redirect("/courses");
    } else {
      res.redirect("/login");
    }
  })
);

app.post("/logout", (req, res) => {
  req.session.user_id = null;
  req.session.lastUrl = null;
  res.redirect("/login");
});

app.get("/", (req, res) => {
  res.render("home");
});
app.get(
  "/courses",
  isLoggedIn,
  catchErrorAsync(async (req, res) => {
    const allcourses = await coursesSchema.find({
      isArchived: false,
      author: req.session.user_id,
    });
    res.render("courses/index", { allcourses });
  })
);

app.post(
  "/courses",
  isLoggedIn,
  catchErrorAsync(async (req, res) => {
    const btime =
      req.body.timeFormat === "hours" ? req.body.time * 60 : req.body.time;
    if (!req.body.image) delete req.body.image;
    let reqBody = { ...req.body, time: btime, author: req.session.user_id };
    const course = new coursesSchema({ ...reqBody });
    await course.save();
    res.redirect("/courses");
  })
);

app.get("/courses/new", isLoggedIn, (req, res) => {
  res.render("courses/newForm");
});

app.get(
  "/courses/:id",
  isLoggedIn,
  isAuthor,
  catchErrorAsync(async (req, res) => {
    const course = await coursesSchema.findById(req.params.id);
    res.render("courses/show", { course });
  })
);

app.get(
  "/courses/:id/edit",
  isLoggedIn,
  isAuthor,
  catchErrorAsync(async (req, res) => {
    const course = await coursesSchema.findById(req.params.id);
    res.render("courses/editForm", { course });
  })
);

app.put(
  "/courses/:id",
  isLoggedIn,
  isAuthor,
  catchErrorAsync(async (req, res) => {
    await coursesSchema.findByIdAndUpdate(
      { _id: req.params.id },
      { ...req.body, author: req.session.user_id }
    );

    res.redirect(`/courses/${req.params.id}`);
  })
);

app.delete(
  "/courses/:id",
  isLoggedIn,
  isAuthor,
  catchErrorAsync(async (req, res) => {
    await coursesSchema.findByIdAndDelete(req.params.id);
    res.redirect("/courses");
  })
);

app.patch(
  "/courses/:id/addMinutes",
  isLoggedIn,
  isAuthor,
  catchErrorAsync(async (req, res) => {
    const course = await coursesSchema.findById(req.params.id);
    let amount = course.usersTime;
    if (amount + parseInt(req.body.usersTime) <= course.time) {
      course.usersTime += parseInt(req.body.usersTime);
      await course.save();
    }
    if (req.query.show) {
      res.redirect(`/courses/${req.params.id}`);
    } else {
      res.redirect("/courses");
    }
  })
);

app.patch(
  "/courses/:id/archive",
  isLoggedIn,
  isAuthor,
  catchErrorAsync(async (req, res) => {
    const course = await coursesSchema.findById(req.params.id);
    course.isArchived = true;
    await course.save();
    res.redirect("/courses");
  })
);

app.patch(
  "/courses/:id/reset",
  isAuthor,
  isLoggedIn,
  catchErrorAsync(async (req, res) => {
    await coursesSchema.findByIdAndUpdate(
      { _id: req.params.id },
      { usersTime: 0, isArchived: false }
    );
    res.redirect("/courses");
  })
);

app.get(
  "/history",
  isLoggedIn,
  catchErrorAsync(async (req, res) => {
    const allcourses = await coursesSchema.find({
      isArchived: true,
      author: req.session.user_id,
    });

    res.render("history", { allcourses });
  })
);

app.listen(PORT, () => {
  console.log(`Serwer nasłuchuje na localhost:${PORT}`);
});
