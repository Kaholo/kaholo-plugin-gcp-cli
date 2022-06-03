const util = require("util");
const childProcess = require("child_process");
const { docker } = require("@kaholo/plugin-library");
const { assertPathExistence } = require("./helpers");
const {
  DOCKER_COMMAND,
  DOCKER_IMAGE,
  AUTH_COMMAND,
  SET_DEFAULT_PROJECT_COMMAND,
} = require("./consts.json");

const exec = util.promisify(childProcess.exec);

async function execute({
  credentials,
  command,
  workingDirectory,
  project,
  additionalArguments,
}) {
  const volumeConfigsMap = new Map();
  if (workingDirectory) {
    await assertPathExistence(workingDirectory);
    volumeConfigsMap.set("workingDirectory", docker.createVolumeConfig(workingDirectory));
  }

  const volumeConfigsArray = [...volumeConfigsMap.values()];
  const {
    environmentVariablesRequiredByDocker,
    environmentVariablesRequiredByShell,
  } = docker.extractEnvironmentVariablesFromVolumeConfigs(volumeConfigsArray);

  const environmentVariables = [
    "GCP_CREDENTIALS",
    "AUTH_COMMAND",
    "SANITIZED_COMMAND",
    "PROJECT_ID",
    ...Object.keys(environmentVariablesRequiredByDocker),
  ];
  const dockerCommandBuildOptions = {
    command: DOCKER_COMMAND,
    image: DOCKER_IMAGE,
    environmentVariables,
    volumeConfigs: volumeConfigsArray,
  };
  if (volumeConfigsMap.has("workingDirectory")) {
    dockerCommandBuildOptions.workingDirectory = volumeConfigsMap.get("workingDirectory").mountPoint.value;
  }

  const cliTool = command.startsWith("gsutil ") ? "gsutil" : "gcloud";
  const gcloudCommand = buildGcloudCommand({
    command,
    project,
    cliTool,
    additionalArguments,
  });
  const dockerCommand = docker.buildDockerCommand(dockerCommandBuildOptions);

  return exec(dockerCommand, {
    env: {
      AUTH_COMMAND,
      GCP_CREDENTIALS: credentials,
      SANITIZED_COMMAND: gcloudCommand,
      PROJECT_ID: project,
      ...environmentVariablesRequiredByShell,
    },
  });
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
