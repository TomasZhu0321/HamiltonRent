const House = require("../models/house");
const { cloudinary } = require("../cloudinary");
const mbxGeocoding = require("@mapbox/mapbox-sdk/services/geocoding");
const mapBoxToken = process.env.MAPBOX_TOKEN;
const geocoder = mbxGeocoding({ accessToken: mapBoxToken });

module.exports.index = async (req, res) => {
  const houses = await House.find({});
  const list = [];
  for (let i = 0; i < houses.length; i++) {
    list.push(houses[i].title);
  }
  if (req.query.search) {
    const fuzzyQuery = (list, keyWord) => {
      const reg = new RegExp(keyWord);
      const arr = [];
      for (let i = 0; i < list.length; i++) {
        if (reg.test(list[i])) {
          arr.push(list[i]);
        }
      }
      return arr;
    };
    const arr = fuzzyQuery(list, req.query.search);
    const houses = await House.find({ title: arr });
    console.log(houses);
    res.render("houses/index", { houses });
  } else {
    res.render("houses/index", { houses });
  }
};

module.exports.renderNewForm = (req, res) => {
  res.render("houses/new");
};

//CREATE:
//According to Model to create instance
//using save() to mongoDB
module.exports.createHouse = async (req, res) => {
  const geoData = await geocoder
    .forwardGeocode({
      query: req.body.house.location,
      limit: 1,
    })
    .send();
  const house = new House(req.body.house);
  house.geometry = geoData.body.features[0].geometry;
  house.images = req.files.map((f) => ({ url: f.path, filename: f.filename }));
  house.author = req.user._id;
  await house.save();
  req.flash("success", "Successfully made a new houses");
  res.redirect(`/houses/${house._id}`);
};

// req.params : url [compared to req.body: user submitted]
module.exports.showHouse = async (req, res) => {
  const house = await House.findById(req.params.id)
    .populate({ path: "reviews", populate: { path: "author" } })
    .populate("author");
  if (!house) {
    req.flash("error", "Cannot find that house information!");
    return res.redirect("/houses");
  }
  res.render("houses/show", { house });
};
module.exports.renderEditForm = async (req, res) => {
  const { id } = req.params;
  const house = await House.findById(id);
  if (!house) {
    req.flash("error", "Cannot find that house information!");
    return res.redirect("/houses");
  }
  res.render("houses/edit", { house });
};
//...: 1. spread; 2. overwirte same key content
module.exports.updateHouse = async (req, res) => {
  const { id } = req.params;
  const house = await House.findByIdAndUpdate(id, { ...req.body.house });
  const imgs = req.files.map((f) => ({ url: f.path, filename: f.filename }));
  house.images.push(...imgs);
  await house.save();
  if (req.body.deleteImages) {
    for (let filename of req.body.deleteImages) {
      await cloudinary.uploader.destroy(filename);
    }
    await house.updateOne({
      $pull: { images: { filename: { $in: req.body.deleteImages } } },
    });
  }
  req.flash("success", "Thanks for your update ;)");
  res.redirect(`/houses/${house._id}`);
};

module.exports.deleteHouse = async (req, res) => {
  const { id } = req.params;
  await House.findByIdAndDelete(id);
  req.flash("success", "This house is not available anymore");
  res.redirect("/houses");
};
