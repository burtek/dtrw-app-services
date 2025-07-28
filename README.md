# dtrw app template

This is a template for apps hosted in *.dtrw.ovh server

## Setup

1. Use this template in github, choose new name to be dtrw-app-APPNAME
2. Set repo secrets: PAT, VPS_HOST, VPS_PORT, VPS_SSH_KEY, VPS_SSH_PASSPHRASE, VPS_USER, KUMA_API_KEY, KUMA_CONTAINER
3. Clone repo locally and run init.sh, provide APPNAME when prompted. Push changes to repo and check Github Actions status.
4. Setup Nginx Proxy Manager to proxy traffic to new app:
    - add new proxy host for URL SUBDOMAIN.dtrw.ovh
        - scheme: http
        - hostname: APPNAME_frontend
        - port: 80
        - block common exploits
    - add custom location to the host:
        - location: `/api`
        - scheme: http
        - hostname: APPNAME_backend
        - port: 4000
