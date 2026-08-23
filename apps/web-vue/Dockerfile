FROM node:22-alpine
WORKDIR /app
COPY apps/web-vue/package.json ./
RUN npm install --no-audit --no-fund
COPY apps/web-vue/ ./
EXPOSE 5173
# --host: ohne das horcht Vite nur auf 127.0.0.1 IM Container und ist
# von aussen nicht erreichbar. Der Port stimmt dann, und nichts
# antwortet.
CMD ["npx", "vite", "--host", "0.0.0.0", "--port", "5173"]
