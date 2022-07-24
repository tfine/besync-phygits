import { connect } from "@tableland/sdk";

async function setup(){
  // Import `connect` from the Tableland library

  // Connect to the Tableland testnet (defaults to Goerli testnet)
  // @return {Connection} Interface to access the Tableland network and target chain
  const tableland = await connect({ network: "polygon-mumbai" });

  // Create a new table with a supplied SQL schema and optional `prefix`
  // @return {Connection} Connection object, including the table's `name`
  const { name } = await tableland.create(
    `name text, id int, primary key (id)`, // Table schema definition
    `mytable` // Optional `prefix` used to define a human-readable string
  );

  // The table's `name` is in the format `{prefix}_{chainId}_{tableId}`
  console.log(name); // e.g., mytable_5_30
  // Without the supplied `prefix`, `name` would be be `_5_30`

  // Insert a row into the table
  // @return {WriteQueryResult} On-chain transaction hash of the write query
  const writeRes = await tableland.write(`INSERT INTO ${name} (id, name) VALUES (0, 'Bobby Tables');`);

  // Perform a read query, requesting all rows from the table
  const readRes = await tableland.read(`SELECT * FROM ${name};`);
  // Note: a table *must first exist* in Tableland before performing `read`.
  // Similarly, a `write` must first be included in a block before it's accessible in `read`.
  // See the utility function `waitConfirm` (not an export, yet) to validate when Tableland performed the instructions.
  // Function here: https://github.com/tablelandnetwork/js-tableland/blob/46c3fb8f47f6c13721b3e3cff5a2cb01ddbd04d7/src/lib/util.ts#L122
  
}

setup();