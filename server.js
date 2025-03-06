
// JULIEN JAMME ILSEN

import express from 'express';
import fs from 'fs';
import https from 'https';
import path from 'path';
import { fileURLToPath } from 'url';
import pg from 'pg'; 

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

    if(!username || !password){
        return res.status(400).send({message: "Veuillez fournir un nom d'utilisateur et un mot de passe."});
    }

    try{
        const result = await pool.query(
            'SELECT * FROM fredouil.compte WHERE mail = $1 AND motpasse = $2',
            [username, password]
        );

        if(result.rowCount > 0){
            res.status(200).json({message : 'Connexion réussie', user : result.rows[0]})

        }else{
            return res.status(400).send({message: "Identifiants incorrects."});
        }
    }catch (error) {
        console.error('Erreur lors de la connexion :', error);
        res.status(500).json({ message: 'Erreur serveur' });
    }
});