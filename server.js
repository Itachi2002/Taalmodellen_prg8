const express = require('express');
const path = require('path');
const app = express();
const port = 3000;

// Serve static files from the CLIENT directory
app.use(express.static('CLIENT'));

// Serve the main page
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'CLIENT', 'index.html'));
});

app.listen(port, () => {
    console.log(`Backend server running at http://localhost:${port}`);
}); 