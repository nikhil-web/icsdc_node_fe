const express = require('express');
const path = require('path');

const app = express();

// Serve static files from "public" folder
app.use(express.static(path.join(__dirname, 'public/ICSDC_Frontend/')));

const PORT = 3000;
app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});
// 