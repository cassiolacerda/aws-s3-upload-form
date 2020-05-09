/**
 * $env:AWS_ACCESS_KEY_ID="*"; $env:AWS_SECRET_ACCESS_KEY="*"; $env:BUCKET_NAME="*"; node .\generate-form.js
 */

const crypto = require("crypto");
const fs = require("fs");

const msPerDay = 24 * 60 * 60 * 1000;
const expiration = new Date(Date.now() + msPerDay).toISOString();
const bucketUrl = `https://${process.env.BUCKET_NAME}.s3.amazonaws.com`;

const policy = {
  expiration,
  conditions: [
    ["starts-with", "$key", "uploads/"],
    { bucket: process.env.BUCKET_NAME },
    { acl: "public-read" },
    ["starts-with", "$Content-Type", "image/png"],
    { success_action_status: "201" },
  ],
};

const policyB64 = Buffer(JSON.stringify(policy), "utf-8").toString("base64");
const signature = crypto
  .createHmac("sha1", process.env.AWS_SECRET_ACCESS_KEY)
  .update(new Buffer(policyB64, "utf-8"))
  .digest("base64");

fs.readFile("./index.template.html", "utf8", (err, input) => {
  if (err) {
    console.log(err);
  }

  const data = input
    .replace(/%BUCKET_URL%/g, bucketUrl)
    .replace(/%AWS_ACCESS_KEY%/g, process.env.AWS_ACCESS_KEY_ID)
    .replace(/%POLICY_BASE64%/g, policyB64)
    .replace(/%SIGNATURE%/g, signature);

  fs.writeFile("./index.html", data, "utf8", (e) => {
    if (e) {
      console.log(e);
    }
  });
});
