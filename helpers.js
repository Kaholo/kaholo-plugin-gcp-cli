const fs = require("fs");
const { access } = require("fs/promises");

const assertPathExistence = (path) => (
  access(path, fs.constants.F_OK).catch(() => {
    throw new Error(`Path ${path} does not exist on agent.`);
  })
);

function tryParseJson(value) {
  try {
    return JSON.parse(value);
  } catch {
    return value;
  }
}

module.exports = {
  assertPathExistence,
  tryParseJson,
};
