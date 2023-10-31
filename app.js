const express = require('express');
const { Sequelize, DataTypes } = require('sequelize');
const bodyParser = require('body-parser');
const path = require('path');
const ejs = require('ejs'); // Import the EJS template engine
const app = express();

// Set up the SQLite database
const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: path.join(__dirname, 'db', 'notes.db'), // Specify the database path
});

// Define the Note model
const Note = sequelize.define('Note', {
  title: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  content: {
    type: DataTypes.STRING,
    allowNull: false,
  },
});

// Synchronize the model with the database
sequelize.sync({ force: false })
  .then(() => {
    console.log('Database synced');
  })
  .catch((err) => {
    console.error('Error syncing database:', err);
  });

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Serve static files from the 'public' directory
app.use(express.static(path.join(__dirname, 'public'))); // Specify the public directory path

// Set the view engine to EJS
app.set('view engine', 'ejs');

// Define routes
app.get('/', async (req, res) => {
    const notes = await Note.findAll();
    const body = await ejs.renderFile(path.join(__dirname, 'views', 'index.ejs'), { notes }, { async: true });
    res.render('base', { title: 'Notes', body, request: req });
  });
  
  
  app.get('/add', async (req, res) => {
    const body = await ejs.renderFile(path.join(__dirname, 'views', 'add.ejs'), {}, { async: true });
    res.render('base', { title: 'Add Note', body, request: req });
  });
  app.post('/add', async (req, res) => {
    const { title, content } = req.body;
    try {
      await Note.create({ title, content });
      res.redirect('/');
    } catch (err) {
      console.error('Error adding note:', err);
      res.redirect('/');
    }
  });
  
  app.get('/edit/:id', async (req, res) => {
    const id = req.params.id;
    const note = await Note.findByPk(id);
    if (note) {
      const body = await ejs.renderFile(path.join(__dirname, 'views', 'edit.ejs'), { note }, { async: true });
      res.render('base', { title: 'Edit Note', body, request: req });
    } else {
      res.redirect('/');
    }
  });
  
  app.post('/edit/:id', async (req, res) => {
    const id = req.params.id;
    const { title, content } = req.body;
    const note = await Note.findByPk(id);
    if (note) {
      note.title = title;
      note.content = content;
      try {
        await note.save();
        res.redirect('/');
      } catch (err) {
        console.error('Error updating note:', err);
        res.redirect('/');
      }
    } else {
      res.redirect('/');
    }
});

  
  app.post('/delete/:id', async (req, res) => {
    const id = req.params.id;
    const note = await Note.findByPk(id);
    if (note) {
      await note.destroy();
    }
    res.redirect('/');
  });  
  
  app.get('/search', async (req, res) => {
    const query = req.query.query;
  
    const notes = await Note.findAll({
      where: {
        title: {
          [Sequelize.Op.like]: `%${query.toLowerCase()}%`,
        },
      },
    });
  
    const body = await ejs.renderFile(path.join(__dirname, 'views', 'index.ejs'), { notes }, { async: true });
    res.render('base', { title: 'Search Results', body, request: req });
  });
  


// Start the server
const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
