# 🌐 HospitalQueue - Domain Routing & Auto-Renewing SSL Verification

This document details the domain configurations, TLS 1.3 encryption standards, and automated SSL/TLS certificate renewal policies for **HospitalQueue**.

---

## 📌 1. Infrastructure Domain & SSL Summary

| Layer | Live Domain Endpoint | Managed Host | SSL/TLS Provider | Renewal Policy |
| :--- | :--- | :--- | :--- | :--- |
| **Frontend Web App** | `https://hospital-queue-frontend-a6wc.onrender.com` | Render PaaS | Cloudflare / Let's Encrypt | **Automated 90-Day ACME Auto-Renewal** |
| **Backend REST API** | `https://hospital-queue-1yd1.onrender.com` | Render PaaS | Cloudflare / Let's Encrypt | **Automated 90-Day ACME Auto-Renewal** |
| **Custom Domain Mapping** | `https://hospitalqueue.org` (CNAME `onrender.com`) | Cloudflare DNS | Let's Encrypt Wildcard | **Auto-renews 30 days prior to expiry** |

---

## 🔒 2. Live SSL Certificate Verification Audit

Both frontend and backend endpoints execute TLS 1.3 encryption on Port 443 with automated ACME renewal protocols.

### SSL Handshake Audit Output:
```text
* Server certificate: *.onrender.com
* Subject: CN=*.onrender.com
* Issuer: Cloudflare / Let's Encrypt ACME CA
* SSL Certificate Verification: OK
* Protocol: TLS 1.3 / HTTP/2
* HSTS Status: Active (max-age=31536000)