const kaholo = require("@kaholo/plugin-library");
const gcpCli = require("./gcpcli");

async function runCommand(parameters) {
  let additionalFlags = "--format=json ";
  if (parameters.project) {
    additionalFlags += `--project=${parameters.project} `;
  }

  try {
    const result = await gcpCli.execute({
      credentials: parameters.credentials,
      command: parameters.command,
      additionalFlags,
      workingDirectory: parameters.workingDirectory,
      cliTool: "gcloud",
    });

    return result.stdout;
  } catch (error) {
    throw new Error(error.stderr ?? error);
  }
}

async function runGsutilCommand(parameters) {
  const additionalFlags = parameters.project ? `-p ${parameters.project}` : "";

  try {
    const result = await gcpCli.execute({
      credentials: parameters.credentials,
      command: parameters.command,
      additionalFlags,
      workingDirectory: parameters.workingDirectory,
      cliTool: "gsutil",
    });

    return result.stdout;
  } catch (error) {
    throw new Error(error.stderr ?? error);
  }
}

module.exports = kaholo.bootstrap({
  runCommand,
  runGsutilCommand,
});
