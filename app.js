let express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");
const bodyParser = require("body-parser");
const crypto = require("crypto");
const Razorpay = require("razorpay");
var MongoClient = require('mongodb').MongoClient;
var uri = "mongodb+srv://ludofirst:kargan82@ludo.gyzkr.mongodb.net/myFirstDatabase?retryWrites=true&w=majority";

dotenv.config();
let app = express();
const instance = new Razorpay({
  key_id: "rzp_test_zJL9AiBPgD6OMg",
  key_secret: "tqfWa57F8piYzBJDHQJadJcm",
});
//Middlewares
app.use(cors());
app.use(express.json());
app.use(
  bodyParser.urlencoded({
    extended: false,
  })
);
app.use(bodyParser.json());
app.set("view engine", "ejs");
let user_email;

//Routes
//http://localhost:3000/payments?email=karthikgtech@gmail.com
//http://localhost:3000/payments?email=karthikgtech@gmail.com&amount=5000&mobile=9894483627
app.get("/payments", (req, res) => {
  user_email = req.query.email;
  console.log(user_email);
  res.render("payment", {
    key: "rzp_test_zJL9AiBPgD6OMg",
    amount: (req.query.amount+"00"),
    email: user_email,
    mobile: req.query.mobile,
  });
});

app.post("/api/payment/order", (req, res) => {
  params = req.body;
  instance.orders
    .create(params)
    .then((data) => {
      res.send({ sub: data, status: "success" });
    })
    .catch((error) => {
      res.send({ sub: error, status: "failed" });
    });
});

app.post("/api/payment/verify", (req, res) => {
  body = req.body.razorpay_order_id + "|" + req.body.razorpay_payment_id;
  var expectedSignature = crypto
    .createHmac("sha256", "tqfWa57F8piYzBJDHQJadJcm")
    .update(body.toString())
    .digest("hex");
  console.log("sig" + req.body.razorpay_signature+" "+ req.body.amount);

  var response = { status: "failure" };
  if (expectedSignature === req.body.razorpay_signature) {

    VerifyUserMongoDB(user_email, req.body.amount);
    response = { status: "success" };
  }
  console.log(response);

  res.send(response);
});
app.listen("3002", () => {
  console.log("server started");
});



function VerifyUserMongoDB(email, user_chips) {
  MongoClient.connect(uri, function (err, db) {
    if (err)
      console.log("not connected ");
    var dbo = db.db("ludofirst");
    var query = { email: email };
    dbo.collection("player").find(query).toArray(function (err, result) {
      if (err) {
      } else {
        if (result.length != 0) {
          var chValue = parseInt(result[0].chips,10);
          chValue += (parseInt(user_chips,10)/100);
          console.log("nn " + result[0].email + " " + chValue);
           Updated_Chips(result[0].email, chValue);
        }
      }
      //console.log(result);
      db.close();
    });
  });
}
function Updated_Chips(email, chips) {
  MongoClient.connect(uri, function (err, db) {
    var dbo = db.db("ludofirst");
    var myquery = { email: email };
    var newvalues = { $set: { chips: chips } };
    dbo.collection("player").updateOne(myquery, newvalues, function (error, result) {
      if (error) {
        console.log("error update document");
      } else {
        console.log("update success");
      }

      db.close();
    });
  });
}