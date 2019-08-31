const ep = require("express");
ep().use("/", ep.static("./")).listen(80);