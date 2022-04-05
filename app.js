const kaholo = require("kaholo-plugin-library");
const gcpCli = require("./gcpcli");

async function runCommand(parameters) {
  let additionalFlags = "--format=json ";
  if (parameters.zone) {
    additionalFlags += `--zone=${parameters.zone} `;
  }
  if (parameters.project) {
    additionalFlags += `--project=${parameters.project} `;
  }

  try {
    const result = await gcpCli.execute(
      parameters.credentials,
      parameters.command,
      additionalFlags,
    );
    return result.stdout;
  } catch (error) {
    return Promise.reject(error.stderr ?? error);
  }
}

module.exports = kaholo.bootstrap({
  runCommand,
}, {});
