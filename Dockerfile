FROM node:24-bookworm
ENV NODE_ENV=production PORT=3000 STUDIO_PYTHON=/opt/studio-venv/bin/python
RUN --mount=type=secret,id=build_ca,mode=0444 \
    sed -i 's|http://deb.debian.org|https://deb.debian.org|g' /etc/apt/sources.list.d/debian.sources && \
    if [ -f /run/secrets/build_ca ]; then \
      apt-get -o Acquire::https::CaInfo=/run/secrets/build_ca update && apt-get -o Acquire::https::CaInfo=/run/secrets/build_ca install -y --no-install-recommends python3 python3-venv libreoffice-impress fonts-noto-cjk fonts-crosextra-carlito; \
    else \
      apt-get update && apt-get install -y --no-install-recommends python3 python3-venv libreoffice-impress fonts-noto-cjk fonts-crosextra-carlito; \
    fi && rm -rf /var/lib/apt/lists/*
COPY requirements.txt /tmp/studio-requirements.txt
RUN --mount=type=secret,id=build_ca,mode=0444 python3 -m venv /opt/studio-venv && if [ -f /run/secrets/build_ca ]; then /opt/studio-venv/bin/pip install --cert /run/secrets/build_ca --no-cache-dir -r /tmp/studio-requirements.txt; else /opt/studio-venv/bin/pip install --no-cache-dir -r /tmp/studio-requirements.txt; fi
WORKDIR /app
COPY --chown=node:node package.json server.js presentations.js drive.js ./
COPY --chown=node:node scripts ./scripts
COPY --chown=node:node public ./public
RUN mkdir -p .data && chown node:node .data
USER node
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=5s --start-period=15s CMD node -e "fetch('http://127.0.0.1:'+process.env.PORT+'/').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"
CMD ["node", "server.js"]
