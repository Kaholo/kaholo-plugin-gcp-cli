const kaholo = require("@kaholo/plugin-library");
const gcpCli = require("./gcpcli");

async function runCommand(parameters) {
  try {
    const result = await gcpCli.execute(parameters);
    return result.stdout;
  } catch (error) {
    throw new Error(error.stderr ?? error);
  }
}

module.exports = kaholo.bootstrap({
  runCommand,
});
