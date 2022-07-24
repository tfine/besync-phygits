// Initialize BeSync Web Server

/**
 * Load key libraries for fastify, multer for uploads, and Web3Storage
 */

// Require the fastify framework and instantiate it
const fastify = require("fastify")({
  // Set this to true for detailed logging:
  logger: true,
});

// environment files
require('dotenv').config()

// child process
const { exec } = require("child_process");

// External multer library for proper uploading

const multer = require("fastify-multer");

// bodyparser for data
const bodyParser = require('body-parser')

// Make local /uploads directory for all files
// In future, may want to put everything more securely in the cloud
const upload = multer({ dest: "./uploads" });

// libraries for web3 storage
const { Web3Storage, getFilesFromPath } = require("web3.storage");
const storage = new Web3Storage({ token: process.env.WEBSTORAGE_KEY });
const path = require("path");

// libraries for tableland
const ethers = require("ethers");
const tableland = require("@tableland/sdk");

// Setup static files
fastify.register(require("@fastify/static"), {
  root: path.join(__dirname, "public"),
  prefix: "/", // optional: default '/'
});

// Formbody for form parsing in fastify
fastify.register(require("@fastify/formbody"));

// View is a templating manager for fastify, using handlebars, same engine as Express
fastify.register(require("@fastify/view"), {
  engine: {
    handlebars: require("handlebars"),
  },
});

// Load and parse SEO data (was from Glitch template, could be useful down the line)
const seo = require("./src/seo.json");
if (seo.url === "glitch-default") {
  seo.url = `https://${process.env.PROJECT_DOMAIN}.glitch.me`;
}

// register multer in fastify
fastify.register(multer.contentParser);

var ExifImage = require("exif").ExifImage;

function exifpump(filename) {
  try {
    new ExifImage({ image: filename }, function (error, exifData) {
      if (error) console.log("Error: " + error.message);
      else console.log("success");
      console.log(
        latlongtodegrees(exifData["gps"]["GPSLatitude"]),
        latlongtodegrees(exifData["gps"]["GPSLongitude"]),
        exifData["gps"]["GPSAltitude"],
        exifData["exif"]["DateTimeOriginal"]
      );
      lat = latlongtodegrees(exifData["gps"]["GPSLatitude"]);
      long = latlongtodegrees(exifData["gps"]["GPSLongitude"]);
      alt = exifData["gps"]["GPSAltitude"];
      dt = exifData["exif"]["DateTimeOriginal"];
    });
  } catch (error) {
    console.log("Error: " + error.message);
  }
}

// convert lat and long from exif format
function latlongtodegrees(latorlong) {
  var degrees = latorlong[0] + latorlong[1] / 60 + latorlong[2] / 3600;
  return degrees;
}

// boilerplate function to check if image
function isFileImage(file) {
  const acceptedImageTypes = ['image/jpeg'];
  return file && acceptedImageTypes.includes(file['type'])
}

/**
 * Simple home page route
 *
 * Returns src/pages/index.hbs with basic BeSync form
 */

fastify.get("/", function (request, reply) {
  // params is an object we'll pass to our handlebars template
  let params = { seo: seo };
  return reply.view("/src/pages/index.hbs", params);
});

/**
 * POST routes handles and reacts to form submissions
 * In future, might make more dynamic
 */

fastify.route({
  method: "POST",
  url: "/",
  preHandler: upload.single("avatar"),
  handler: async function (request, reply) {
    // put information about form submission to log
    console.log(request.body);

    var alt = request.body.alt;
    var lat = request.body.lat;
    var long = request.body.long;
    var dt = request.body.dt;

    var filecopy = request.file.path;

    // check exif if image
    if (isFileImage(filecopy)) {
      try {
        new ExifImage({ image: filecopy }, function (error, exifData) {
          if (error) {
            console.log("Error: " + error.message);
          }
          else console.log("success");
          try {
            lat = latlongtodegrees(exifData["gps"]["GPSLatitude"]);
            long = latlongtodegrees(exifData["gps"]["GPSLongitude"]);
            alt = exifData["gps"]["GPSAltitude"];
            dt = exifData["exif"]["DateTimeOriginal"];
          }
          catch (error) {
            console.log("Error: " + error.message);
          } 
          });
      } catch (error) {
        console.log("Error: " + error.message);
      }
    }

    const file = await getFilesFromPath(request.file.path);

    // get CID and upload to Web3 Storage
    const cid = await storage.put(file);

    // print CID to console
    console.log(`IPFS CID: ${cid}`);

    // check current variables
    console.log(lat, long, alt, dt);
    
    // connect to polygon through infura with private key
    const wallet = new ethers.Wallet(process.env.TBL_PRIVATE_KEY);
    const provider = new ethers.providers.InfuraProvider("maticmum", process.env.TBL_INFURA);
    const signer = wallet.connect(provider);

    // connect to tableland
    const tbl = await tableland.connect({ signer, chain: "polygon-mumbai" });
    console.log(tbl);

    // add new data to phygit table through tableland
    const writeRes = await tbl.write(`INSERT INTO phygit_collection_80001_667 (id, phygit_CID, phygit_latitude, phygit_longitude, phygit_altitude) VALUES (4, '${cid}', '${lat}', '${long}', '${alt}');`);
    console.log(writeRes);

    // receive hash of successful transaction 
    // consider storing
    console.log("Successful transaction");
    const receiptRes = await tbl.receipt(writeRes['hash']);
    console.log(receiptRes);

    // show current phygit table -- will soon get too big
    const readRes = await tbl.read(`SELECT * FROM phygit_collection_80001_667;`);
    console.log(readRes);

    // send params to page with successful transaction
    let params = { seo: seo, lat: lat, long: long, year: dt, cid: cid };

    // display page
    await reply.view("/src/pages/index.hbs", params);
  },
});

fastify.get("/phygits", async function (request, reply) {
  // params is an object we'll pass to our handlebars template
  
  const wallet = new ethers.Wallet(process.env.TBL_PRIVATE_KEY);
  const provider = new ethers.providers.InfuraProvider("maticmum", process.env.TBL_INFURA);

  const signer = wallet.connect(provider);
  const tbl = await tableland.connect({ signer, chain: "polygon-mumbai" });

  const readRes = await tbl.read(`SELECT * FROM phygit_collection_80001_667;`);
  const rows = readRes["rows"];
  console.log("CURRENT ROWS");
  console.log(readRes["rows"]);

  console.log(rows[0]);

  let params = { seo: seo, rows:rows };

  return reply.view("/src/pages/phygits.hbs", params);

});

// Run the server and report out to the logs
fastify.listen(
  { port: process.env.PORT, host: "0.0.0.0" },
  function (err, address) {
    if (err) {
      fastify.log.error(err);
      process.exit(1);
    }
    console.log(`Your app is listening on ${address}`);
    fastify.log.info(`server listening on ${address}`);
  }
);
