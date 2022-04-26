require('dotenv').config();
const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const _ = require("lodash");

const app = express();

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({
  extended: true
}));

app.use(express.static("public"));

app.use('/favicon.ico', express.static('assets/favicon.ico'));

mongoose.connect(process.env.MONGO_URI);

const today = new Date();

const options = {
  weekday: "long",
  day: "numeric",
  month: "long",
  year: "numeric"
};

const day = today.toLocaleDateString("en-GB", options);

const itemsSchema = {
  name: String,
};

const Item = mongoose.model("Item", itemsSchema);

const task1 = new Item({
  name: "Welcome to your To Do List!",
});

const task2 = new Item({
  name: "Hit the + button to add a new item.",
});

const task3 = new Item({
  name: "Hit the checkbox to delete an item.",
});

const defaultItems = [task1, task2, task3];

const listSchema = {
  name: String,
  items: [itemsSchema]
};

const List = mongoose.model("List", listSchema);


app.get("/", function (req, res) {

  Item.find({}, function (err, foundItems) {

    if (foundItems.length === 0) {
      Item.insertMany(defaultItems, function (err) {
        if (err) {
          console.log(err);
        } else {
          console.log("Successfully saved default items to DB!");
        }
      });
      res.redirect("/");
    } else {
      res.render("list", {
        listTitle: day,
        newListItems: foundItems
      });
    }
  });
});


app.post("/", function (req, res) {

  const itemName = req.body.newItem;
  const listName = req.body.list;

  const item = new Item({
    name: itemName
  });

  if (listName === day) {
    item.save();
    res.redirect("/");
  } else {
    List.findOne({
      name: listName
    }, function (err, foundList) {
      foundList.items.push(item);
      foundList.save();
      res.redirect("/" + listName);
    });
  }

});


app.get("/newList", function (req, res) {
  res.render("newList", {
    listTitle: req.body.newListTitle
  });
});


app.get("/myLists", function (req, res) {
  List.find({}).distinct('name').exec(function (err, lists) {
    if (!err) {
      res.render("myLists", {
        listTitle: lists,
      });
    }
  });
});

app.get("/delete/:listName", function (req, res) {

  const foundName = req.params.listName

  List.findOneAndRemove({
    name: foundName
  }, function (err) {
    if (!err) {
      console.log("List deleted");
      res.redirect("/myLists");
    } else {
      console.log("Error");
    }
  })

})


app.post("/newList", function (req, res) {

  const newListName = _.capitalize(req.body.newListTitle);

  List.create({
    name: newListName
  }, function (err, newListName) {
    if (!err) {
      res.redirect("/" + newListName.name)
    } else {
      console.log(err);
    }
  });
});


app.get("/:customListName", function (req, res) {
  
  const customListName = _.capitalize(req.params.customListName);

  List.findOne({
    name: customListName
  }, function (err, foundList) {
    if (!err) {
      if (!foundList) {
        const list = new List({
          name: customListName,
          items: defaultItems
        });
        list.save();
        res.redirect("/" + customListName);
      } else {
        res.render("list", {
          listTitle: foundList.name,
          newListItems: foundList.items
        });
      }
    }
  });
});



app.post("/delete", function (req, res) {

  const checkedItemId = req.body.checkbox;
  const listName = req.body.listName;

  if (listName === day) {
    Item.findByIdAndRemove(checkedItemId, function (err) {
      if (!err) {
        console.log("Item Successfully deleted.");
        res.redirect("/");
      }
    });
  } else {
    List.findOneAndUpdate({
      name: listName
    }, {
      $pull: {
        items: {
          _id: checkedItemId
        }
      }
    }, function (err, foundList) {
      if (!err) {
        res.redirect("/" + listName);
      }
    });
  }

});

let port = process.env.PORT;
if (port == null || port == "") {
  port = 3000;
}

app.listen(port, function () {
  console.log("Server has started Successfully");
});