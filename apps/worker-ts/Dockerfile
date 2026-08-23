FROM node:22-alpine AS bau
WORKDIR /app
COPY apps/worker-ts/package.json ./
RUN npm install --omit=dev --no-audit --no-fund
COPY apps/worker-ts/tsconfig.json ./
COPY apps/worker-ts/src ./src
RUN npm install --no-save typescript tsx >/dev/null

FROM node:22-alpine
WORKDIR /app
COPY --from=bau /app/node_modules ./node_modules
COPY apps/worker-ts/package.json ./
COPY apps/worker-ts/src ./src
EXPOSE 8081
# tsx statt eines Bau-Schritts: dieser Dienst ist der Pruefstand, nicht
# das Erzeugnis. Wer ihn ausliefert, baut vorher.
CMD ["node", "--experimental-strip-types", "src/server.ts"]
