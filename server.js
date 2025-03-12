// JULIEN JAMME ILSEN

import express from 'express';
import session from 'express-session';
import fs from 'fs';
import https from 'https';
import path from 'path';
import { fileURLToPath } from 'url';
import pg from 'pg'; 
import mongoose from 'mongoose'
import MongoDBStore from 'connect-mongodb-session';
import crypto from 'crypto';


// Chemins des fichiers et dossiers
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Connexion à PostgreSQL
const pool = new pg.Pool({
    user: 'uapv2500814',
    host: 'pedago01c.univ-avignon.fr',
    database: 'etd',
    password: 'ALCrxZ',
    port: 5432
});

// Instance de l'application Express
const app = express();

const MONGO_URI = 'mongodb://pedago01c.univ-avignon.fr:27017/db-CERI';


mongoose.connect(MONGO_URI)
  .then(() => console.log('Connecté à MongoDB pour les sessions'))
  .catch(err => console.error('Erreur MongoDB:', err));


// Création du store MongoDB pour stocker les sessions
const MongoDBSessionStore = MongoDBStore(session);
const store = new MongoDBSessionStore({
    uri: MONGO_URI,
    collection: 'MySession3223', 
    expires: 1000 * 60 * 60 * 24 
});

// Middleware de session
app.use(session({
    secret: '5d41402abc4b2a76b9719d911017c5920a6e25eacdfcbb5a2dcf8a5b7b4a1e08',
    resave: false,
    saveUninitialized: false,
    store: store, 
    cookie: {
        maxAge: 1000 * 60 * 60 * 24, 
        secure: true
    }
}));


// Middlware pour les fichiers statiques
app.use(express.static(path.join(__dirname, 'CERISoNet/dist/ceriso-net/browser')));

// Configuration du serveur HTTPS.
const options = {
    pfx: fs.readFileSync(path.join(__dirname, 'certificat.pfx')),
    passphrase: 'NodeTP',
};

// Création du serveur HTTPS.
https.createServer(options, app).listen(3223, () => {
    console.log('Serveur HTTPS démarré sur https://pedago.univ-avignon.fr:3223');
});

// Middleware qui définit la route principal.
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'CERISoNet/dist/ceriso-net/browser/index.html'));
});

// Middleware pour parser les requêtes JSON
app.use(express.json());

// Middleware qui définit la route pour récupérer les informations de connexions.
app.post('/login', async (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
        return res.status(400).send({ message: "Veuillez fournir un nom d'utilisateur et un mot de passe." });
    }

    // Hash du mot de passe en SHA-1
    const hashedPassword = crypto.createHash('sha1').update(password).digest('hex');

    try {
        const result = await pool.query(
            'SELECT * FROM fredouil.compte WHERE mail = $1 AND motpasse = $2',
            [username, hashedPassword]
        );

        if (result.rowCount > 0) {
            console.log(result.rows[0].mail);
            req.session.userId = result.rows[0].mail;
            req.session.username = result.rows[0].motpasse;

            res.status(200).json({
                message: 'Connexion réussie',
                user: {
                    id: req.session.userId,
                    username: req.session.username
                }
            });
        } else {
            return res.status(400).send({ message: "Identifiants incorrects." });
        }
    } catch (error) {
        console.error('Erreur lors de la connexion :', error);
        res.status(500).json({ message: 'Erreur serveur' });
    }
});
