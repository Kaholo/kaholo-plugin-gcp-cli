# Kaholo Gcloud CLI Plugin
This plugin runs commands using the [Google Cloud CLI (gcloud)](https://cloud.google.com/sdk/gcloud). The gcloud CLI is capable of a very broad range of operations on the Google Cloud Platform (GCP).

Kaholo provides specific plugins to work with GCP in a more user-friendly way, for example Cloud Compute, Cloud Storage, and Google Kubernetes Engine (GKE). It is recommended to use the specific plugin if one is available, and resort to the gcloud CLI plugin only if you are familiar and comfortable using the gcloud CLI, migrating automation that is already written in gcloud CLI, or if the specific plugins are lacking features to meet your needs.

Gcloud CLI commands are easily recognizable because they all begin with `gcloud` or `gsutil`. Some examples include:

`gcloud compute instances list`

`gcloud compute firewall-rules create mynet-allow-icmp --project=kaholo-alpha --network=projects/kaholo-alpha/global/networks/mynet --description=Allow\ Ping --direction=INGRESS --priority=65534 --source-ranges=0.0.0.0/0 --action=ALLOW --rules=icmp`

`gcloud container node-pools create node-pool-1 --cluster=sample-cluster --num-nodes=5`

`gsutil cp -r gs://mybucket-298r32s/ .`

The output of the command, which would normally appear in the command window, is made available in Final Result section of the Execution Results page in Kaholo. This is also downloadable and accessible in code as a JSON document.

## Use of Docker
This plugin relies on the [Google-provided docker container](https://hub.docker.com/r/google/cloud-sdk/) to run the gcloud CLI. This has many upsides but a few downsides as well of which the user should be aware.

If running your own Kaholo agents in a custom environment, you will have to ensure docker is installed and running on the agent and has sufficient privilege to retrieve the image and start a container. If the agent is already running in a container (kubernetes or docker) then this means a docker container running within another container.

The first time the plugin is used on each agent, docker may spend a minute or two downloading the image. After that the delay of starting up another docker image each time is quite small, a second or two. Command `gcloud --version` is a quick and easy way to both force the image to download and/or confirm it is already in the agent's docker image cache.

To run commands that have input/output files such as `gsutil` require parameter "Working Directory". This folder on the Kaholo agent is mapped as a volume in the docker image so files there are available to the command, and after the command finishes, files left there remain on the Kaholo agent for subsequent actions in the pipeline.

As a work-around, should these limitations have negative impact on your use case, the gcloud CLI can be installed on the agent and run via the Command Line plugin instead. A main purpose for this plugin is to help you avoid that inconvenience. If you find commands this plugin cannot run, please do [let us know](https://kaholo.io/contact/).

## Access and Authentication
The gcloud CLI uses a set of service account keys (Credentials) and a project for access and authentication.

* Credentials - JSON format service account keys as downloaded from GCP, stored in Kaholo Vault.
* Project - text NAME of GCP project in which to work

When creating keys for a GCP service account, they can be downloaded in either JSON or P12 format. The JSON format is required for Kaholo plugins. Store the entire JSON document in a Kaholo Vault item. The Kaholo Vault allows them to be safely used without exposing the keys in log files, error messages, execution results, or any other output.

When pasting your GCP service account credentials into the Kaholo Vault, be careful to avoid line break issues. These happen when you cut from some text editors that use word wrap and then paste into Kaholo - newline characters get introduced. To avoid this either disable word-wrap or use another product that takes word-wrap into account when cutting/copying. If you have this issue the error when running a gcloud command looks something like this:

    Error : Error: ERROR: (gcloud.auth.activate-service-account) Could not read json file /tmp/tmp.GLezAM1EsF.json: Invalid \escape: line 1 column 764 (char 763)

GCP also organizes resources into named projects. The Project determines which assets you can see as well as various other project-level settings and permissions. Run command `gcloud projects list` to get a list of projects usable by your service account. The Project parameter is not required to run this command, only valid service account credentials are needed.

## Plugin Installation
For download, installation, upgrade, downgrade and troubleshooting of plugins in general, see [INSTALL.md](./INSTALL.md).

## Plugin Settings
Plugin Settings and Accounts are accessed at Settings | Plugins by clicking on the blue name of the plugin "GCP CLI", which is a link to the settings and accounts for this specific plugin.

Plugin settings act as default parameter values. If configured in plugin settings, the parameters of newly created actions will be configured the same by default, as a convenience. Action parameters can then be reconfigured or cleared in cases where the default setting is not appropriate.

There is only one setting for gcloud CLI Plugin

* Default Project ID

## Plugin Account
Plugin Accounts are used for unique sets of configuration applicable to a plugin, usually including credentials. In the case of GCP CLI Plugin, the GCP account credentials are already self-contained in a JSON document, like in this example:

    {
    "type": "service_account",
    "project_id": "my-gcp-project-253sd",
    "private_key_id": "a76cd5324c8dd346342306656154cac43641b780",
    "private_key": "-----BEGIN PRIVATE KEY-----\nMIIEvA...very long...q2Zkp+vg==\n-----END PRIVATE KEY-----\n",
    "client_email": "plugins-helm-alpha-one@plugins-helm-alpha.iam.gserviceaccount.com",
    "client_id": "109210422390046424389",
    "auth_uri": "https://accounts.google.com/o/oauth2/auth",
    "token_uri": "https://oauth2.googleapis.com/token",
    "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
    "client_x509_cert_url": "https://www.googleapis.com/robot/v1/metadata/x509/plugins-helm-alpha-one%40plugins-helm-alpha.iam.gserviceaccount.com"
    }

Store the JSON credentials in a Kaholo Vault item, and then create an account in Plugin Settings that provides the vault item as the GCP Service Account Credentials. Create as many accounts as needed if using more than one set of credentials.

## Method: Run Command
This method runs any gcloud CLI command. While these commands all being with `gcloud`, in this plugin you may omit that first word if you wish. For example the command `compute instances list` will be interpreted the same as `gcloud compute instances list`. If you intend to run a `gsutil` command, you must start the command with `gsutil`.

Kaholo displays JSON results nicely and also makes them accessible on the code layer as objects. For example if an GCP CLI Action has the ID `gcpcli1` and the command is `gcloud projects list --format="json"`, then the name of the first project is accessible in code by downstream actions as `kaholo.actions.gcpcli1.result[0].name`, and its project number is `kaholo.actions.gcpcli1.result[0].projectNumber`. For this reason, commands using `--format="json"` can be especially useful in advanced pipelining.

### Parameters
Beyond the two discussed above in the [Access and Authentication](#Access-and-Authentication) section, only the command itself is required.

* Command - the command to run, e.g. `gcloud compute instances list`
