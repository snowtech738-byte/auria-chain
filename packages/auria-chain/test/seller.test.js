import { test } from "node:test";
import assert from "node:assert/strict";
import { createSellerMiddleware } from "../src/seller.js";
import { AuriaError } from "../src/errors.js";

const validArgs = {
  payTo: "0x0000000000000000000000000000000000dEaD",
  baseUrl: "http://localhost:4021",
  routes: { "POST /agent/summarize": { price: "$0.01" } },
};

test("createSellerMiddleware throws MISSING_PAY_TO when payTo is absent", () => {
  const { payTo, ...rest } = validArgs;
  assert.throws(
    () => createSellerMiddleware(rest),
    (error) => error instanceof AuriaError && error.code === "MISSING_PAY_TO",
  );
});

test("createSellerMiddleware throws MISSING_BASE_URL when baseUrl is absent", () => {
  const { baseUrl, ...rest } = validArgs;
  assert.throws(
    () => createSellerMiddleware(rest),
    (error) => error instanceof AuriaError && error.code === "MISSING_BASE_URL",
  );
});

test("createSellerMiddleware throws MISSING_ROUTES when routes is empty", () => {
  assert.throws(
    () => createSellerMiddleware({ ...validArgs, routes: {} }),
    (error) => error instanceof AuriaError && error.code === "MISSING_ROUTES",
  );
});

test("createSellerMiddleware throws MISSING_ROUTE_PRICE when a route has no price", () => {
  assert.throws(
    () => createSellerMiddleware({ ...validArgs, routes: { "POST /agent/summarize": {} } }),
    (error) => error instanceof AuriaError && error.code === "MISSING_ROUTE_PRICE",
  );
});

test("createSellerMiddleware throws UNKNOWN_NETWORK for an unrecognized network name", () => {
  assert.throws(
    () => createSellerMiddleware({ ...validArgs, network: "polygon" }),
    (error) => error instanceof AuriaError && error.code === "UNKNOWN_NETWORK",
  );
});

test("createSellerMiddleware returns an Express middleware function for valid config", () => {
  const middleware = createSellerMiddleware(validArgs);
  assert.equal(typeof middleware, "function");
});
