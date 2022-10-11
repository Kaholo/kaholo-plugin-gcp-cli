const util = require("util");
const childProcess = require("child_process");
const path = require("path");
const { docker } = require("@kaholo/plugin-library");

const { assertPathExistence } = require("./helpers");

const {
  DOCKER_COMMAND,
  DOCKER_IMAGE,
  AUTH_COMMAND,
  SET_DEFAULT_PROJECT_COMMAND,
} = require("./consts.json");

const exec = util.promisify(childProcess.exec);

async function execute(params) {
  const {
    credentials,
    command,
    workingDirectory,
    project,
    additionalArguments,
  } = params;

  const gcloudCommand = buildGcloudCommand({
    cliTool: command.startsWith("gsutil ") ? "gsutil" : "gcloud",
    command,
    project,
    additionalArguments,
  });
  const environmentVariables = {
    GCP_CREDENTIALS: credentials,
    PROJECT_ID: project,
    AUTH_COMMAND,
    SANITIZED_COMMAND: gcloudCommand,
  };
  const buildDockerCommandOptions = {
    command: DOCKER_COMMAND,
    image: DOCKER_IMAGE,
    environmentVariables,
    volumeDefinitionsArray: [],
  };

  if (workingDirectory) {
    const absoluteWorkingDir = path.resolve(workingDirectory);
    await assertPathExistence(absoluteWorkingDir);
    const volumeDefinition = docker.createVolumeDefinition(absoluteWorkingDir);

    buildDockerCommandOptions.volumeDefinitionsArray.push(volumeDefinition);
    environmentVariables[volumeDefinition.mountPoint.name] = (
      environmentVariables[volumeDefinition.mountPoint.value]
    );
    environmentVariables[volumeDefinition.path.name] = (
      environmentVariables[volumeDefinition.path.value]
    );
    buildDockerCommandOptions.workingDirectory = `$${volumeDefinition.mountPoint.name}`;
  }

  const dockerCommand = docker.buildDockerCommand(buildDockerCommandOptions);

  let result;
  try {
    result = await exec(dockerCommand, { env: environmentVariables });
  } catch (error) {
    throw new Error(error.stderr ?? error);
  }

  if (result.stderr && !result.stdout) {
    throw new Error(result.stderr);
  } else if (result.stderr) {
    console.error(result.stderr);
  }
  return result.stdout;
}

function buildGcloudCommand({
  command,
  additionalArguments = [],
  project,
  cliTool,
}) {
  const commandArguments = [command, ...additionalArguments];

  if (cliTool === "gcloud") {
    commandArguments.push("--format", "json");
  }

  let sanitizedCommand = docker.sanitizeCommand(commandArguments.join(" "), cliTool);
  if (project) {
    sanitizedCommand = `${SET_DEFAULT_PROJECT_COMMAND} && ${sanitizedCommand}`;
  }

  return sanitizedCommand;
}

module.exports = {
  execute,
};
