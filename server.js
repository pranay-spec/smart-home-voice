const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const api = require('./routes/api');
const path = require('path');

const app = express();
app.use(cors({
    origin: "*"
}));

app.use(bodyParser.json());
app.use('/api', api);

// Serve dashboard
app.use(express.static(path.join(__dirname, 'public')));

const PORT = process.env.PORT || 3000;
app.listen(PORT, ()=> console.log(`Server running on port ${PORT}`));
