const util = require("util");
const childProcess = require("child_process");
const { docker } = require("@kaholo/plugin-library");
const { assertPathExistence } = require("./helpers");

const exec = util.promisify(childProcess.exec);

const DOCKER_COMMAND = "bash -c \"$AUTH_COMMAND && $SANITIZED_COMMAND\"";
const DOCKER_IMAGE = "google/cloud-sdk";
// eslint-disable-next-line no-multi-str
const AUTH_COMMAND = "\
export AUTH_FILE=$(mktemp) &&\
mv $AUTH_FILE $AUTH_FILE.json &&\
echo $GCP_CREDENTIALS > $AUTH_FILE.json &&\
gcloud auth activate-service-account --key-file=$AUTH_FILE.json;\
rm $AUTH_FILE.json &&\
unset AUTH_FILE";

async function execute({
  credentials,
  command,
  workingDirectory,
  cliTool,
  additionalFlags = "",
}) {
  const volumeConfigs = [];
  let workingDirectoryVolumeConfig;
  if (workingDirectory) {
    await assertPathExistence(workingDirectory);
    workingDirectoryVolumeConfig = docker.createVolumeConfig(workingDirectory);
    volumeConfigs.push(workingDirectoryVolumeConfig);
  }

  const {
    environmentVariablesRequiredByDocker,
    environmentVariablesRequiredByShell,
  } = docker.extractEnvironmentVariablesFromVolumeConfigs(volumeConfigs);

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
    volumeConfigs,
  };
  if (workingDirectoryVolumeConfig) {
    dockerCommandBuildOptions.workingDirectory = workingDirectoryVolumeConfig.mountPoint.value;
  }

  const gcloudCommand = `${command} ${additionalFlags}`;
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
