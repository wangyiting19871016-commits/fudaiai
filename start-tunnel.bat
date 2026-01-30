@echo off
cloudflared tunnel --url http://localhost:5173 > cf.log 2>&1
