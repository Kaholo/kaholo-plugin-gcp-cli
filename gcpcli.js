const util = require("util");
const childProcess = require("child_process");
const { docker } = require("@kaholo/plugin-library");
const { assertPathExistence } = require("./helpers");
const {
  DOCKER_COMMAND,
  DOCKER_IMAGE,
  AUTH_COMMAND,
} = require("./consts.json");

const exec = util.promisify(childProcess.exec);

async function execute({
  credentials,
  command,
  workingDirectory,
  cliTool,
  additionalFlags = "",
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
    ...Object.keys(environmentVariablesRequiredByDocker),
  ];
  const dockerCommandBuildOptions = {
    command: DOCKER_COMMAND,
    image: DOCKER_IMAGE,
    environmentVariables,
    volumeConfigs: volumeConfigsArray,
  };
  if (volumeConfigsMap.has("workingDirectory")) {
    dockerCommandBuildOptions.workingDirectory = volumeConfigsArray.get("workingDirectory").mountPoint.value;
  }

  const gcloudCommand = `${command} ${additionalFlags}`.trim();
  const dockerCommand = docker.buildDockerCommand(dockerCommandBuildOptions);

  return exec(dockerCommand, {
    env: {
      AUTH_COMMAND,
      GCP_CREDENTIALS: credentials,
      SANITIZED_COMMAND: docker.sanitizeCommand(gcloudCommand, cliTool),
      ...environmentVariablesRequiredByShell,
    },
  });
}

module.exports = {
  execute,
};
