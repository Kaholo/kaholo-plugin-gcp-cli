const util = require("util");
const childProcess = require("child_process");
const path = require("path");
const randomString = require("randomstring");
const { docker } = require("@kaholo/plugin-library");

const {
  assertPathExistence,
  tryParseJson,
} = require("./helpers");

const {
  DOCKER_COMMAND,
  DOCKER_IMAGE,
  AUTH_COMMAND,
  SET_DEFAULT_PROJECT_COMMAND,
} = require("./consts.json");

const exec = util.promisify(childProcess.exec);

const COMMAND_OUTPUT_SEPARATOR = `%COMMAND_OUTPUT_SEPARATOR_${randomString.generate(128)}%`;

async function execute(params) {
  const {
    credentials,
    command: commands,
    workingDirectory,
    project,
  } = params;

  const gcloudCommand = buildGcloudCommand({
    commands,
    project,
  });
  const environmentVariables = {
    GCP_CREDENTIALS: `${credentials}\n`,
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

  const absoluteWorkingDir = path.resolve(workingDirectory || "");
  await assertPathExistence(absoluteWorkingDir);
  const volumeDefinition = docker.createVolumeDefinition(absoluteWorkingDir);

  buildDockerCommandOptions.volumeDefinitionsArray.push(volumeDefinition);
  environmentVariables[volumeDefinition.mountPoint.name] = volumeDefinition.mountPoint.value;
  environmentVariables[volumeDefinition.path.name] = volumeDefinition.path.value;
  buildDockerCommandOptions.workingDirectory = `$${volumeDefinition.mountPoint.name}`;

  const dockerCommand = docker.buildDockerCommand(buildDockerCommandOptions);

  let result;
  try {
    result = await exec(dockerCommand, { env: environmentVariables });
  } catch (error) {
    throw new Error(error.stderr ?? error);
  }

  // It's not unusual for GCP CLI to provide result with stderr
  // and empty string stdout, e.g. "gsutil cp" does this.
  if (result.stderr) {
    console.error(result.stderr);
  }

  const commandOutputs = result.stdout.split(COMMAND_OUTPUT_SEPARATOR).map(tryParseJson);

  if (commandOutputs.length === 1) {
    return commandOutputs[0];
  }
  return commandOutputs;
}

function buildGcloudCommand({
  commands: gcpCommands = [],
  project,
}) {
  const commands = gcpCommands.map((rawCommand) => {
    const cliTool = rawCommand.startsWith("gsutil ") ? "gsutil" : "gcloud";

    return docker.sanitizeCommand(rawCommand.replace(/;$/g, ""), cliTool);
  });

  const userCommandsJoined = commands.join(`; echo -n ${JSON.stringify(COMMAND_OUTPUT_SEPARATOR)};`);

  if (project) {
    return `${SET_DEFAULT_PROJECT_COMMAND}; ${userCommandsJoined}`;
  }
  return userCommandsJoined;
}

module.exports = {
  execute,
};
