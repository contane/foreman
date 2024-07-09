# Foreman

A Kubernetes application for managing Renovate jobs, developed by [Contane](https://contane.net).

Foreman is intended to be deployed together with self-hosted [Mend Renovate](https://www.mend.io/renovate/), either in
the same or a secondary Kubernetes cluster.
It provides a user interface for monitoring the Renovate CronJob including interactive progress and logs as well as the
ability to trigger custom jobs, speeding up the dependency upgrade cycle in the case of many repositories.

## Quick Reference

- GitHub: https://github.com/contane/foreman
- Docker Hub: https://hub.docker.com/r/contane/foreman
- Helm chart: https://github.com/contane/charts/tree/main/charts/foreman

## Installation

We recommend deploying Foreman on Kubernetes via Helm.
Alternatively, you can run Foreman via Docker or locally on your machine.

### Prerequisites

This guide assumes that you already have a Kubernetes CronJob running self-hosted Renovate.
There are two options to set this up:

- (Recommended) Use [Renovate's Helm chart](https://github.com/renovatebot/helm-charts).
- Create a CronJob manually, following the [Renovate self-hosting examples](https://docs.renovatebot.com/examples/self-hosting/#kubernetes).

### Kubernetes

Please refer to the official [Helm chart](https://github.com/contane/charts/tree/main/charts/foreman) for deploying
Foreman on Kubernetes.

When deploying Foreman to the same Kubernetes cluster as Renovate, we recommend setting up separate namespaces for both
applications and giving Foreman access to Renovate via a `Role` and `RoleBinding`.
Foreman requires the following permissions within the Renovate namespace:

```yaml
apiVersion: rbac.authorization.k8s.io/v1
kind: Role
metadata:
  name: renovate-foreman-role
  namespace: renovate
rules:
  - apiGroups: [""]
    resources: ["pods", "pods/log"]
    verbs: ["get", "list", "watch"]
  - apiGroups: ["batch"]
    resources: ["cronjobs"]
    verbs: ["get", "list", "watch"]
  - apiGroups: ["batch"]
    resources: ["jobs"]
    verbs: ["get", "list", "watch", "create", "update", "patch", "delete"]
```

For more information, refer to the [Kubernetes RBAC documentation](https://kubernetes.io/docs/reference/access-authn-authz/rbac/).

### Docker

You can run Foreman via Docker using the following command:

```sh
docker run -p 8080:8080 -v /path/to/config:/app/config contane/foreman:latest
```

Here, `/path/to/config` is the path to the configuration directory on the host, and Foreman will be accessible on
host port 8008.
The configuration must include a reference to the KubeConfig file and how to find the Renovate CronJob.

### Local

Running Foreman locally is useful for development and testing. To do this, you need to have Node.js and NPM installed.
After cloning the repository, run the following commands:

```sh
npm install
npm run build
npm start
```

Note that you will need to authenticate on the web interface. During development, it is recommended to set a password
for local login. You will also need to have a KubeConfig file available on your machine to access the Kubernetes API.

## Configuration

Create a YAML configuration file inside the `config` directory. The file can have any name ending with `.yaml`.
If there are multiple configuration files, they will be merged in alphabetical order. For example, if you have
`config/00-config.yaml` and `config/01-config.yaml`, the settings in `config/01-config.yaml` will take precedence.
The following sections describe the available configuration options.

Environment variables can be set on the command line or in an `.env` file in the root directory of the project.

### KubeConfig

Foreman supports multiple KubeConfig sources. The source to use can be specified by setting the `kubeConfig.source`
to one of the following values:

- `in-cluster`: Use the KubeConfig from the Kubernetes cluster environment. This is the default.
- `file`: Use the KubeConfig from the file specified by the `KUBECONFIG` environment variable, or `~/.kube/config`.

In the `in-cluster` mode, Foreman will look at the `KUBERNETES_SERVICE_HOST` and `KUBERNETES_SERVICE_PORT` environment
variables to determine the location of the Kubernetes API server. These variables are automatically set by Kubernetes.

You can use the `file` mode when developing Foreman locally, or when deploying it outside of Kubernetes.
If necessary, override the `KUBECONFIG` environment variable to point to the correct file.

You can select a context by setting `kubeConfig.context`. This defaults to the KubeConfig file's current context.

### CronJob Selection

Foreman queries a defined CronJob resource to determine which Renovate jobs to manage. By default, this is
`renovate/renovate` (namespace/name). You can override this by setting `cronJob.namespace` and `cronJob.name`.

### Session Cookies

Foreman authentication is stateless. Client auth information is stored in a cookie, which is encrypted using a key.
The key is generated on startup and is stored in memory. This means that the key will be different on each startup,
and that all clients will be logged out when Foreman is restarted. Note that key generation consumes about 256 MiB of
memory.

To avoid this, you can set `cookies.key` to a fixed value. This will cause the same key to be used on each startup,
and will allow clients to stay logged in across restarts, and less memory to be used.

`cookies.key` must be base64-encoded. To generate a key on Linux, run:

```sh
npx --yes @fastify/secure-session | base64
```

Sessions are valid for 24 hours by default. You can change this by setting `cookies.maxAge` to a duration string
such as "6h" or "14 days".

### Local Authentication

Foreman supports local authentication, which allows users to log in using a username and password. This is disabled by
default. To enable it, set the following config options:

```yaml
auth:
  local:
    enabled: true
    username: "any username (default: admin)"
    password: "any password"
```

### OIDC Authentication

Foreman supports authentication via OpenID Connect. To enable it, set the following config options:

```yaml
auth:
  oidc:
    enabled: true
    issuer: "https://oidc.example.com"
    clientId: "client-id"
    clientSecret: "client-secret"
    publicUrl: "https://foreman.example.com"
```

The following configuration must be set in the OIDC provider, assuming Foreman is running at
`https://foreman.example.com`:

- Response Type: Code
- Grant Type: Authorization Code
- Authentication Method: Basic
- Auth Token Type: Bearer
- Redirect URL: `https://foreman.example.com/api/auth/oidc/callback`

It is assumed that your OIDC provider restricts which users can log in to Foreman, as no additional role checks are
performed by Foreman.

### GitLab integration

Some GitLab-related functionality can be enabled by setting the following configuration options:

```yaml
gitlab:
  host: "https://gitlab.example.com"
```

This will enable the following features:

* Linking to GitLab repositories in the Renovate job list.

### Other settings

The following additional environment variables can be set:

- `PORT`: The port to listen on. Defaults to `8080`.

## Contributing

We welcome contributions from the community! If you have suggestions, find a bug, or want to add new features, please
open an issue or submit a pull request.
