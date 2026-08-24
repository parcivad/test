// Der kleinste Dienst, der die ganze Kette beweist.
//
// Absichtlich ohne Abhaengigkeiten und ohne Bauschritt: was hier
// schiefgeht, liegt an der Kette, nicht an der Anwendung. Und `main` in
// der package.json zeigt auf genau diese Datei — das Baurezept sucht
// dort und nirgends sonst (workbench/src/build.rs, EXIT_ENTRY_MISSING).

const http = require('http');

const PORT = Number(process.env.PORT || 8080);

const server = http.createServer((req, res) => {
  res.writeHead(200, { 'content-type': 'application/json' });
  res.end(JSON.stringify({
    ok: true,
    app: 'hello-js',
    pfad: req.url,
    zeit: new Date().toISOString(),
  }));
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`hello-js hoert auf ${PORT}`);
});
