const express = require("express");
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const PORT = process.env.PORT || 3000;

const app = express();

app.set('view engine', 'ejs');
mongoose.set('strictQuery', false);

app.use(express.urlencoded({ extended: true }));
app.use(express.static("public"));

dotenv.config();

main().catch(err => console.log(err));
async function main() {

  await mongoose.connect(process.env.MONGOATLAS_URI, {
    useNewUrlParser: true
  });
  console.log("Connected to mongoose.")
}

const itemsSchema = new mongoose.Schema({
  name: {
    type: String,
    require: [1, "Need to fill the area."]
  }
});

const Item = mongoose.model("Item", itemsSchema);

const item1 = new Item({
  name: "Work"
});

const item2 = new Item({
  name: "Clean"
});

const item3 = new Item({
  name: "Work Out"
});

const defaultItems = [item1, item2, item3];

const listSchema = {
  name: String,
  items: [itemsSchema]
};

const List = mongoose.model("List", listSchema);




app.get("/", function (req, res) {

  Item.find({})
    .then(function (result) {
      if (result.length === 0) {
        Item.insertMany(defaultItems)
          .then(function (result) {
            console.log("Successfully inserted items.");
            res.redirect("/");
          })
          .catch(function (err) {
            console.log(err);
          });
      } else {
        res.render("list", { listTitle: "Today", newListItems: result });
      }

    })
    .catch(function (err) {
      console.log(err);
    });

});


app.get("/:newList", function (req, res) {
  const newListName = req.params.newList

  List.findOne({ name: newListName })
    .then(function (result) {
      if (!result) {
        const list = new List({
          name: newListName,
          items: defaultItems
        });
        list.save();
        res.redirect("/" + newListName);
      } else if (result.length === 0) {
        List.insertMany(defaultItems)
        res.redirect("/" + newListName);
      } else {
        res.render("list", { listTitle: result.name, newListItems: result.items });
      }
    });
});

app.post("/", function (req, res) {

  const itemName = req.body.newItem;
  const listName = req.body.list;

  const itemEntry = new Item({
    name: itemName
  });

  if (listName === "Today") {
    itemEntry.save();
    res.redirect("/");
  } else {
    List.findOne({ name: listName })
      .then(function (result) {
        result.items.push(itemEntry);
        result.save();
        res.redirect("/" + listName);
      });
  }
});

app.post("/delete", function (req, res) {
  const checkedItemID = req.body.checkbox;
  const listName = req.body.listName;

  if (listName === "Today") {
    Item.findByIdAndRemove(checkedItemID)
      .then(function (result) {
        console.log("Successfully deleted item.");
        res.redirect("/");
      })
  } else {
    List.findOneAndUpdate({ name: listName }, { $pull: { items: { _id: checkedItemID } } })
      .then(function (result) {
        res.redirect("/" + listName);
      });
  }
});



app.get("/about", function (req, res) {
  res.render("about");
});

app.listen(PORT, function () {
  console.log(`Server started on port ${PORT}`);
});
