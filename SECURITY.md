# Security Policy

## Reporting a vulnerability

**Do not open a public GitHub issue for security vulnerabilities.**

Email the report to: **filcastanheiradev@gmail.com**

Include:
- A description of the vulnerability
- Steps to reproduce
- The potential impact if exploited
- A suggested fix, if you have one

You will receive an initial response within 48 hours. A fix and disclosure timeline will follow within 7 days for confirmed issues.

## What counts as in scope

- The deployed website and its API routes (Vercel deployment)
- GitHub Actions workflows — secrets handling, supply chain risks
- Pipeline scripts and their handling of env vars and credentials
- Email distribution via Beehiiv — subscriber data handling, API key exposure
- Configuration handling — env vars, `.env` files committed to history

## What's out of scope

- Vulnerabilities in upstream dependencies — report those to the upstream project directly
- Issues that require physical access to the operator's machine
- Brute force or rate-limiting issues on the subscription form (Beehiiv handles rate limiting)
- Phishing attempts unrelated to this product

## Disclosure

Responsible disclosure is followed. Once a confirmed vulnerability is fixed and deployed:

- The fix will be committed with a descriptive commit message (no details of the exploit path)
- A CVE will be filed if the vulnerability is significant and meets CVE criteria
- The reporter will be credited in the fix commit unless they prefer anonymity

## Dependency vulnerabilities

`npm audit` is the baseline. Dependabot is configured on this repository and will open PRs for known CVEs in dependencies automatically.
