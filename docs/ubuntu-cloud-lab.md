# Ubuntu Cloud Lab (enterprise open source)

ElloFive can drive an **Ubuntu** desktop cloud lab to test apps by itself when the user says things like:

- “test my app”
- “open Ubuntu and check the UI”
- “click through login on my site”

## What it is

| Piece | Role |
| --- | --- |
| **Ubuntu 24.04 LTS** | Enterprise open-source OS (this Cloud Agent VM) |
| **Display (`:1`)** | Graphical desktop for computer-use |
| **Chrome** | Browser to open the app under test |
| **`ellofive ubuntu`** | Lab CLI — status / setup / open / test |
| **Ello5** | Model that plans checks; Ubuntu lab executes them |

This is not a separate rented VM API — it is the **Ubuntu Cloud Agent sandbox** ElloFive already runs in, hardened for GUI app testing.

## Commands

```bash
ellofive ubuntu status          # distro, display, browser
ellofive ubuntu setup           # install lab deps + Chrome if needed
ellofive ubuntu open https://…  # open URL on Ubuntu desktop
ellofive ubuntu test            # test Elloten at :3000
ellofive ubuntu test http://127.0.0.1:5173
```

## Agent playbook (“test my app”)

1. `ellofive ubuntu status` — confirm Ubuntu + display + Chrome.
2. Start the user’s app (or `ellofive api` for Elloten).
3. `ellofive ubuntu test <url>` — opens Chrome on Ubuntu.
4. Use **computer-use** to click/type, take screenshots, and verify the flow.
5. Report PASS/FAIL with evidence (screenshot / short recording).

## Cloud Agent install

`scripts/cloud-agent-install.sh` also runs Ubuntu lab setup so Chrome/display tooling is snapshotted for future agents.
