const _ = require("lodash");
const util = require("util");
const childProcess = require("child_process");

const exec = util.promisify(childProcess.exec);

// eslint-disable-next-line no-multi-str
const GCP_AUTH_COMMAND = "\
export AUTH_FILE=$(mktemp) && \
mv $AUTH_FILE $AUTH_FILE.json && \
echo $GCP_CREDENTIALS > $AUTH_FILE.json && \
gcloud auth activate-service-account --key-file=$AUTH_FILE.json; \
rm $AUTH_FILE.json && \
unset AUTH_FILE";

// eslint-disable-next-line no-multi-str
const DOCKER_GCP_CLI_COMMAND = "\
docker run \
-e GCP_CREDENTIALS \
-e GCP_AUTH_COMMAND \
-e SANITIZED_COMMAND \
--rm google/cloud-sdk bash -c \"$GCP_AUTH_COMMAND && gcloud $SANITIZED_COMMAND\"";

function sanitizeCommand(command, additionalFlags) {
  let sanitized = command;
  if (_.startsWith(command.toLowerCase(), "gcloud ")) {
    sanitized = command.slice(7);
  }

  // This is the safest way to escape the user provided command.
  // By putting the command in double quotes, we can be sure that
  // every character within the command is escaped, including the
  // ones that could be used for shell injection (e.g. ';', '|', etc.).
  // The escaped string needs then to be echoed back to the docker command
  // in order to be properly executed - simply passing the command in double quotes
  // would result in docker confusing the quotes as a part of the command.
  return `$(echo "${sanitized} ${additionalFlags}")`;
}

function execute(credentials, command, additionalFlags = "") {
  const cmdToExecute = `${DOCKER_GCP_CLI_COMMAND}`;
  return exec(cmdToExecute, {
    env: {
      GCP_CREDENTIALS: credentials,
      GCP_AUTH_COMMAND,
      SANITIZED_COMMAND: sanitizeCommand(command, additionalFlags),
    },
  });
}

module.exports = {
  execute,
};
