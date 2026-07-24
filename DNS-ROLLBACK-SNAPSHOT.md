# scaledesk.us DNS snapshot (before Vercel launch) — 2026-07-24
Old nameservers (HostGator/old dev): hgns1.hostgator.com, hgns2.hostgator.com
Old site A record: @ -> 66.235.200.251  (old developer's HostGator server = full rollback value)
www -> CNAME scaledesk.us.
MX: 0 mail.scaledesk.us. (HostGator email; mail A record below)
mail.scaledesk.us A: (see below)
SPF TXT: "v=spf1 ip4:129.121.65.187 a mx include:websitewelcome.com ~all"
To roll back to the old site: point nameservers back to hgns1/hgns2.hostgator.com. Done.
129.121.65.140
