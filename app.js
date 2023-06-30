const kaholo = require("@kaholo/plugin-library");
const gcpCli = require("./gcp-cli-service");

module.exports = kaholo.bootstrap({
  runCommand: gcpCli.execute,
});
