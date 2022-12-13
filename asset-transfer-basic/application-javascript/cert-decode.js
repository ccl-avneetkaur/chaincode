const crypto = require("crypto");
const fs = require("fs");
const cert = new crypto.X509Certificate(fs.readFileSync("cert.pem"));

console.log(cert.subject.split("\n")[1].split("=")[1]);
