# Data Transfer Service Launcher

Launcher script allows deploying Data Transfer Service for local directories' synchronisation to Windows hosts.
It handles Data Transfer Service failures and host restarts allowing to maintain continuous data synchronisation process.

# Install

To install dts InstallDts.ps1 script can be used.
Download the script and set `API`, `API_TOKEN` and `API_PUBLIC_KEY` environment variable placeholders in it.
Once the script is ready it can be executed from a Powershell console with administrative permissions using the commands below.

```powershell
Set-ExecutionPolicy Bypass -Scope Process -Force -Confirm:$false
& "$HOME\Downloads\InstallDts.ps1"
```

# Configure

To register new dts the command below can be used. Notice that DTS name should be the same as in the _Install_ step.

```bash
DTS_NAME="{PUT DTS HOST NAME HERE}"
pipe dts create --name "$DTS_NAME" \
                --url "$DTS_NAME" \
                --prefix "$DTS_NAME"
```

To synchronise some local directory as well as dts logs directory every midnight the command below can be used.

```bash
DTS_NAME="{PUT DTS HOST NAME HERE}"
pipe dts preferences update "$DTS_NAME" -p 'dts.local.sync.rules=[{
                                                "source": "c:\\local\\path\\to\\source\\directory",
                                                "destination": "s3://data/storage/path/to/destination/directory",
                                                "cron": "0 0/1 * ? * *"
                                            }, {
                                                "source": "c:\\Program Files\\CloudPipeline\\DTS\\logs",
                                                "destination": "s3://data/storage/path/to/logs/directory",
                                                "cron": "0 0/1 * ? * *"
                                            }]'
```

To restart dts the command below can be used.

```bash
DTS_NAME="{PUT DTS HOST NAME HERE}"
pipe dts preferences update "$DTS_NAME" -p 'dts.restart.force=true'
```