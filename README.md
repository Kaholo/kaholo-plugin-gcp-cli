# Kaholo Gcloud CLI Plugin
This plugin runs commands using the [Google Cloud CLI (gcloud)](https://cloud.google.com/sdk/gcloud). The gcloud CLI is capable of a very broad range of operations on the Google Cloud Platform (GCP).

Kaholo provides specific plugins to work with GCP in a more user-friendly way, for example Cloud Compute, Cloud Storage, and Google Kubernetes Engine (GKE). It is recommended to use the specific plugin if one is available, and resort to the gcloud CLI plugin only if you are familiar and comfortable using the gcloud CLI, migrating automation that is already written in gcloud CLI, or if the specific plugins are lacking features to meet your needs.

Gcloud CLI commands are easily recognizable because they all begin with `gcloud`. Some examples include:

`gcloud compute instances list`

`gcloud compute firewall-rules create mynet-allow-icmp --project=kaholo-alpha --network=projects/kaholo-alpha/global/networks/mynet --description=Allow\ Ping --direction=INGRESS --priority=65534 --source-ranges=0.0.0.0/0 --action=ALLOW --rules=icmp`

`gcloud container node-pools create node-pool-1 --cluster=sample-cluster --num-nodes=5`

The output of the command, which would normally appear in the command window, is made available in Final Result section of the Execution Results page in Kaholo. This is also downloadable and accessible in code as a JSON document.

## Use of Docker
This plugin relies on the [Google-provided docker container](https://hub.docker.com/r/google/cloud-sdk/) to run the gcloud CLI. This has many upsides but a few downsides as well of which the user should be aware.

If running your own Kaholo agents in a custom environment, you will have to ensure docker is installed and running on the agent and has sufficient privilege to retrieve the image and start a container. If the agent is already running in a container (kubernetes or docker) then this means a docker container running within another container.

The first time the plugin is used on each agent, docker may spend a minute or two downloading the image. After that the delay of starting up another docker image each time is quite small, a second or two.

Next, input/output files such as needed to run `gsutil` to Cloud Storage are not supported. Future development will address this. There is a Google Cloud Storage plugin to move files to and from Cloud Storage, but in a user-friendly interface, not by means of executing `gsutil` commands directly.

As a work-around, should these limitations have severe impact on your use case, the gcloud CLI can be installed on the agent and run via the Command Line plugin instead. A main purpose for this plugin is to help you avoid that inconvenience.

## Access and Authentication
The gcloud CLI uses a set of service account keys (Credentials) and a project for access and authentication.

* Credentials - JSON format service account keys as downloaded from GCP, stored in Kaholo Vault.
* Project - text NAME of GCP project in which to work

When creating keys for a GCP service account, they can be downloaded in either JSON or P12 format. The JSON format is required for Kaholo plugins. Store the entire JSON document in a Kaholo Vault item. The Kaholo Vault allows them to be safely used without exposing the keys in log files, error messages, execution results, or any other output.

GCP also organizes resources into named projects. The Project determines which assets you can see as well as various other project-level settings and permissions. Run command `gcloud projects list` to get a list of projects usable by your service account. Project name is not required to run this command, only valid service account credentials are needed.

## Plugin Installation
For download, installation, upgrade, downgrade and troubleshooting of plugins in general, see [INSTALL.md](./INSTALL.md).

## Plugin Settings
Plugin settings act as default parameter values. If configured in plugin settings, the action parameters may be left unconfigured. Action parameters configured anyway over-ride the plugin-level settings for that Action.

The settings for gcloud CLI Plugin include the two discussed above in the [Access and Authentication](#Access-and-Authentication) section.

* Default Service Account Credentials
* Default Project

These are also required parameters for most methods of this plugin. (Some gcloud commands do work without specifying Project, so it is not necessarily a required parameter.)

## Method: Run Command
This method runs any gcloud CLI command. While these commands all being with `gcloud`, in this plugin you may omit that first word if you wish. For example the command `compute instances list` will be interpreted the same as `gcloud compute instances list`.

### Parameters
Beyond the two discussed above in the [Access and Authentication](#Access-and-Authentication) section, only the command itself is required.

* Command - the command to run, e.g. `gcloud compute instances list`
