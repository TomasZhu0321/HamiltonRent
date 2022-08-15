const express = require("express");
const router = express.Router();
const catchAsync = require("../utils/catchAsync");
const { isLoggedIn, isAuthor, validateHouse } = require("../middleware");

const House = require("../models/house");

//FIND:
//syn: Model.find()
router.get(
  "/",
  catchAsync(async (req, res) => {
    const houses = await House.find({});
    res.render("houses/index", { houses });
  })
);

router.get("/new", isLoggedIn, (req, res) => {
  res.render("houses/new");
});

//CREATE:
//According to Model to create instance
//using save() to mongoDB
router.post(
  "/",
  isLoggedIn,
  validateHouse,
  catchAsync(async (req, res) => {
    const house = new House(req.body.house);
    house.author = req.user._id;
    await house.save();
    req.flash("success", "Successfully made a new houses");
    res.redirect(`/houses/${house._id}`);
  })
);

// req.params : url [compared to req.body: user submitted]
router.get(
  "/:id",
  isLoggedIn,
  catchAsync(async (req, res) => {
    const house = await House.findById(req.params.id)
      .populate({ path: "reviews", populate: { path: "author" } })
      .populate("author");
    if (!house) {
      req.flash("error", "Cannot find that house information!");
      return res.redirect("/houses");
    }
    res.render("houses/show", { house });
  })
);

router.get(
  "/:id/edit",
  isLoggedIn,
  isAuthor,
  catchAsync(async (req, res) => {
    const { id } = req.params;
    const house = await House.findById(id);
    if (!house) {
      req.flash("error", "Cannot find that house information!");
      return res.redirect("/houses");
    }
    res.render("houses/edit", { house });
  })
);

//...: 1. spread; 2. overwirte same key content
router.put(
  "/:id",
  isLoggedIn,
  isAuthor,
  validateHouse,
  catchAsync(async (req, res) => {
    const { id } = req.params;
    const house = await House.findByIdAndUpdate(id, { ...req.body.house });
    req.flash("success", "Thanks for your update;)");
    res.redirect(`/houses/${house._id}`);
  })
);

router.delete(
  "/:id",
  isLoggedIn,
  isAuthor,
  catchAsync(async (req, res) => {
    const { id } = req.params;
    await House.findByIdAndDelete(id);
    req.flash("success", "This house is not available anymore");
    res.redirect("/houses");
  })
);

module.exports = router;
