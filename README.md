# BeSync Phygits

Written for the ETH Global HackFS hackathon, BeSync Phygits is an attempt to initiate a universal geotemporal data layer on the blockchain for all sorts of applications.

In this version, we used a webapp, using [fastify](https://fastify.io) and [Handlebars](https://handlesjs.com/), running on node.js, to accept files and basic metadata. We extract EXIF data from any JPGs.

We then upload the data to Web3.Storage using their API, and then receive a Content Identifier (CID) in return.

The CID becomes a key identifier in our data layer, which is at home on Polygon Mumbai using the [Tableland protocol](https://tableland.xyz/).

Installation requires an Web3 API key, an Infura key, and a Polygon wallet with faucet from the Mumbai testnet.

## Potential 

Although this is just a basic implementation, we are impressed at the instant decentralization and scability at our fingertips for such an ambitious idea. Refining the metadata standard and creating more ways to upload and onboard phygits will be the next task.

Please contact us if interested!

## Installation

Clone the git repo
npm install
add relevant keys to .env (WEB3 STORAGE, POLYGON MUMBAI PRIVATE KEY, AND INFURA API KEY): 

WEBSTORAGE_KEY=e
TBL_PRIVATE_KEY=
TBL_INFURA=

CREATE YOUR OWN TABLES ON TABLELAND. WILL OFFER MORE ON THIS LATER.

npm install nodemon
nodemon npm run
go to url at 0.0.0.0:XXXXX
