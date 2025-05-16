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
import dotenv from 'dotenv';
import { WebSocketServer } from 'ws';
import axios from 'axios';


//////////////////////////////
///// Initialsiation /////////
//////////////////////////////

// Chargement des variables d'environnement
dotenv.config();


// Chemins des fichiers et dossiers
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Connexion à PostgreSQL
const pool = new pg.Pool({
    user: process.env.POSTGRES_USER,
    host: process.env.POSTGRES_HOST,
    database: process.env.POSTGRES_DB,
    password: process.env.POSTGRES_PASSWORD,
    port: process.env.POSTGRES_PORT
});

// Instance de l'application Express
const app = express();

// Connexion à MongoDB
const MONGO_URI = process.env.MONGO_URI;

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
    secret: process.env.SESSION_SECRET,
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
    passphrase: process.env.CERTIFICATE_PASSPHRASE,
};

// Création du serveur HTTPS.
//https.createServer(options, app).listen(3223, () => {
//    console.log('Serveur HTTPS démarré sur https://pedago.univ-avignon.fr:3223');
//});

// Création du serveur WebSocket qui utilise le même serveur HTTPS
const server = https.createServer(options, app);
const wss = new WebSocketServer({ server, path: '/ws' });

//////////////////////////////
///// Fin Initialsiation /////
//////////////////////////////

/////////////////////////////
///// Websocket /////////////
/////////////////////////////

const connectedClients = new Map()

// Gestion des connexions WebSocket
wss.on('connection', (ws, req) => {

    // On récupére l'identifiant de l'utilisateur à partir de l'URL
    // URL factice pour obtenir l'id de l'user de wss:
    const url = new URL(req.url, 'https://pedago.univ-avignon.fr');
    const userId = url.searchParams.get('userId');

    console.log(`Nouvelle connexion WebSocket de l'utilisateur: ${userId}`);

    // On enregistre la connexion pour stocker la réf de connexion et l'id connecté
    if (userId) {
        connectedClients.set(userId, ws);
    }

    // Welcome 
    ws.send(JSON.stringify({
        type: 'info',
        message: 'Connexion WebSocket établie'
    }));

    // On écoute ce que fais l'utilisateur sur CeriSoNET
    ws.on('message', async (message) => {
        try {
            const data = JSON.parse(message);

            // On traite les différents types de messages
            switch (data.type) {
                case 'connection':

                    // On notifie tout le monde qu'un utilisateur s'est connecté
                    broadcastAll({
                        type: 'connection',
                        data: {
                            username: data.data.username,
                            timestamp: new Date().toISOString()
                        }
                    }, userId);
                    break;

                case 'like':

                    // On notifie tout le monde qu'un utilisateur a aimé un message
                    broadcastAll({
                        type: 'like',
                        data: {
                            username: data.data.username,
                            messageId: data.data.messageId,
                            timestamp: new Date().toISOString()
                        }
                    }, userId);
                    break;

                case 'comment':

                    // On notifie tout le monde qu'un utilisateur a commenté un message
                    broadcastAll({
                        type: 'comment',
                        data: {
                            username: data.data.username,
                            messageId: data.data.messageId,
                            commentText: data.data.commentText,
                            timestamp: new Date().toISOString()
                        }
                    }, userId);
                    break;

                case 'share':

                    // On notifie tout le monde qu'un utilisateur a partagé un message
                    broadcastAll({
                        type: 'share',
                        data: {
                            username: data.data.username,
                            messageId: data.data.messageId,
                            timestamp: new Date().toISOString()
                        }
                    }, userId);
                    break;

                case 'logout':

                    // On notifie tout le monde qu'un utilisateur s'est déconnecté
                    broadcastAll({
                        type: 'logout',
                        data: {
                            username: data.data.username,
                            timestamp: new Date().toISOString()
                        }
                    }, userId);
                    break;

                default:
                    console.log(`Type de message non connu: ${data.type}`);
            }
        } catch (error) {
            console.error('Erreur lors du traitement du message WS:', error);
        }
    });

    // On traite la fermeture du websocket de l'user
    ws.on('close', () => {
        console.log(`Connexion WebSocket fermée pour l'utilisateur: ${userId}`);

        // Supprimer la connexion
        if (userId) {
            connectedClients.delete(userId);
        }
    });
});

// On diffuse un message à tous les clients connectés sauf l'expéditeur
function broadcastAll(message, excludeUserId) {
    const messageStr = JSON.stringify(message);

    connectedClients.forEach((client, id) => {

        // readystate = 1 veux dire que le websocket est ouvert 
        if (id !== excludeUserId && client.readyState === 1) {
            client.send(messageStr);
        }
    });
}


/////////////////////////////
///// Fin Websocket /////////
/////////////////////////////

/////////////////////////////
/// Ecoute des routes ///////
/////////////////////////////


server.listen(3223, () => {
    console.log('Serveur HTTPS et WebSockets démarrés sur https://pedago.univ-avignon.fr:3223');
});


// Middleware qui définit la route principal de la ( page d'accueil angular )
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'CERISoNet/dist/ceriso-net/browser/index.html'));
});

// Middleware pour parser les requêtes JSON
app.use(express.json());

// Middleware qui définit la route pour récupérer les informations de connexions.
app.post('/login', async (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
        return res.status(400).send({ message: " nom d'utilisateur et un mot de passe inexistant." });
    }

    // On hash le mot de passe en SHA-1
    const hash = crypto.createHash('sha1').update(password).digest('hex');

    try {
        // On intérroge la BDD pour vérifier si l'utilisateur existe bien
        const result = await pool.query(
            'SELECT * FROM fredouil.compte WHERE mail = $1 AND motpasse = $2',
            [username, hash]
        );

        // Si Ok, On enregistre l'utilisateur dans la session
        if (result.rowCount > 0) {
            req.session.userId = result.rows[0].mail;
            req.session.username = result.rows[0].motpasse;

            // On met à jour le statut de connexion
            await pool.query(
                'UPDATE fredouil.compte SET statut_connexion = 1 WHERE id = $1',
                [result.rows[0].id]
            );

            // On renvoie une réponse à Angular
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
        console.error('Erreur lors de la connexion:', error);
        res.status(500).json({ message: 'Erreur Login' });
    }
});

// Route pour récupérer les messages avec pagination et filtres
app.get('/messages', async (req, res) => {
    try {

        // On vérifie si l'utilisateur est connecté avant tout
        if (!req.session.userId) {
            return res.status(401).json({ message: 'Non autorisé' });
        }

        // On récupére tout les infos dans l'URL pour la pagination
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 5;
        const skip = (page - 1) * limit;
        const sortBy = req.query.sortBy || 'date';
        const filterOwner = req.query.filterOwner;
        const filterHashtag = req.query.filterHashtag;

        // Connexion à MongoDB
        const db = mongoose.connection.db;
        const messagesCollection = db.collection('CERISoNet');

        // Filtre pour la requête récupére toutes les données qu'on a bessoin
        let query = {};

        // On regarde si on dois afficher les postes de l'utilisateur ou de tout le monde
        if (filterOwner === 'true') {

            // On récupére l'ID de l'utilisateur connecté
            // messages lié à l'ID de l'utilisateur
            const userResult = await pool.query(
                'SELECT id FROM fredouil.compte WHERE mail = $1',
                [req.session.userId]
            );

            if (userResult.rows.length > 0) {

                // Filtre mongodb
                query.createdBy = userResult.rows[0].id;
            }

        } else if (filterOwner === 'false') {

            // On récupére l'ID des autres utilisateurs via l'id de l'utilisateur connecté, =!
            const userResult = await pool.query(
                'SELECT id FROM fredouil.compte WHERE mail = $1',
                [req.session.userId]
            );

            if (userResult.rows.length > 0) {

                // On récupère l'ID des autres utilisateurs différent de celui connecté
                query.createdBy = { $ne: userResult.rows[0].id };
            }
        }

        // On filtre le hastag si demandé 
        if (filterHashtag) {

            query.hashtags = { $regex: filterHashtag, $options: 'i' };
        }

        // On définie l'ordre de tri
        let sortOptions = {};
        switch (sortBy) {

            // message récent
            case 'date':
                sortOptions = { date: -1, hour: -1 };
                break;

            // message ancien
            case 'date-asc':
                sortOptions = { date: 1, hour: 1 };
                break;

            // message populaire
            case 'likes':
                sortOptions = { likes: -1 };
                break;

            // nombre de commentaire 
            case 'comments':
                sortOptions = { commentsCount: -1 };
                break;

            // message récent
            default:
                sortOptions = { date: -1, hour: -1 };
        }

        // On compte le nombre de messages par rapport au filtre
        const total = await messagesCollection.countDocuments(query);

        // framework d'agrégation, pour faire la requête
        const messages = await messagesCollection.aggregate([

            // On filtre par user ou tout le monde
            { $match: query },

            // On calul le nombre de commentaire et ajout du champ dans les "copies"
            {
                $addFields: {
                    commentsCount: {
                        $size: {
                            $ifNull: ["$comments", []]
                        }
                    }
                }
            },

            // On tri
            { $sort: sortOptions },

            // On skip les message pour pagination
            { $skip: skip },

            // On limite le nombre de message
            { $limit: limit }
        ]).toArray();

        // On enrichi les messages avec les informations des utilisateurs infos (SQL + mpngo sur la même vue)
        const enrichedMessages = await Promise.all(messages.map(async (message) => {
            try {

                // On récupére les infos de l'auteur
                const authorResult = await pool.query(
                    'SELECT nom, prenom, pseudo, avatar FROM fredouil.compte WHERE id = $1',
                    [message.createdBy]
                );

                // On enrichi le message les infos concernant la personne qui commente
                const enrichedMessage = {
                    ...message,
                    authorName: authorResult.rows.length > 0 ? `${authorResult.rows[0].nom} ${authorResult.rows[0].prenom}` : 'Utilisateur inconnu',
                    authorPseudo: authorResult.rows.length > 0 ? authorResult.rows[0].pseudo : 'Utilisateur inconnu',
                    authorAvatar: authorResult.rows.length > 0 ? authorResult.rows[0].avatar : null
                };

                // Si c'est un message partagé, on récupérer le message d'origine
                if (message.shared) {
                    try {

                        // On utilise l'id pour récupérer le message partagé mais on le convertis avant
                        const sharedMessage = await messagesCollection.findOne({
                            _id: typeof message.shared === 'string' ? parseInt(message.shared, 10) : message.shared
                        });

                        if (sharedMessage) {

                            // On récupére les infos de l'auteur du message partagé
                            const sharedAuthorResult = await pool.query(
                                'SELECT nom, prenom, pseudo, avatar FROM fredouil.compte WHERE id = $1',
                                [sharedMessage.createdBy]
                            );

                            // On enrichi le message les infos concernant la personne qui a partagé
                            enrichedMessage.sharedMessage = {
                                ...sharedMessage,
                                authorName: sharedAuthorResult.rows.length > 0 ? `${sharedAuthorResult.rows[0].nom} ${sharedAuthorResult.rows[0].prenom}` : 'Utilisateur inconnu',
                                authorPseudo: sharedAuthorResult.rows.length > 0 ? sharedAuthorResult.rows[0].pseudo : 'Utilisateur inconnu',
                                authorAvatar: sharedAuthorResult.rows.length > 0 ? sharedAuthorResult.rows[0].avatar : null
                            };
                        }
                    } catch (error) {
                        console.error('Erreur pendant la récupération du message partagé:', error);
                    }
                }

                // Et on enrichi les informations des commentaires avec les infos des auteurs
                if (message.comments && message.comments.length > 0) {
                    enrichedMessage.comments = await Promise.all(message.comments.map(async (comment) => {

                        const commentAuthorResult = await pool.query(
                            'SELECT nom, prenom, pseudo, avatar FROM fredouil.compte WHERE id = $1',
                            [comment.commentedBy]
                        );

                        return {
                            ...comment,
                            authorName: authorResult.rows.length > 0 ? `${authorResult.rows[0].nom} ${authorResult.rows[0].prenom}` : 'Utilisateur inconnu',
                            authorPseudo: commentAuthorResult.rows.length > 0 ? commentAuthorResult.rows[0].pseudo : 'Utilisateur inconnu',
                            authorAvatar: commentAuthorResult.rows.length > 0 ? commentAuthorResult.rows[0].avatar : null
                        };
                    }));
                }

                return enrichedMessage;
            } catch (error) {
                console.error('Erreur pendant l\'enrichissement du message:', error);
                return message;
            }
        }));

        // Retour à angular pour affichage des messages selon les infos 
        res.json({
            messages: enrichedMessages,
            total,
            page,
            limit
        });
    } catch (error) {
        console.error('Erreur pendant la récupération des messages:', error);
        res.status(500).json({ message: 'Erreur serveur' });
    }
});

// Route pour liker un message
app.post('/messages/:id/like', async (req, res) => {
    try {

        // On verifie si l'utilisateur est connecté
        if (!req.session.userId) {
            return res.status(401).json({ message: 'Non autorisé' });
        }

        // On récupére l'id de l'utilisateur connecté
        const userResult = await pool.query(
            'SELECT id FROM fredouil.compte WHERE mail = $1',
            [req.session.userId]
        );


        if (userResult.rows.length === 0) {
            return res.status(404).json({ message: 'Utilisateur pas trouvé' });
        }

        // On recupere le message
        const db = mongoose.connection.db;
        const messagesCollection = db.collection('CERISoNet');

        // On recupere l'id du message
        const messageId = parseInt(req.params.id, 10);


        // On met à jour le nombre de likes du message
        const result = await messagesCollection.updateOne(
            { _id: messageId },
            { $inc: { likes: 1 } }
        );

        if (result.modifiedCount === 0) {
            return res.status(404).json({ message: 'Message pas trouvé' });
        }

        res.json({ success: true });
    } catch (error) {
        console.error('Erreur pendnat le like du message:', error);
        res.status(500).json({ message: 'Erreur serveur' });
    }
});


// Route pour commenter un message
app.post('/messages/:id/comment', async (req, res) => {
    try {

        // On verifie si l'utilisateur est connecté
        if (!req.session.userId) {
            return res.status(401).json({ message: 'Non autorisé' });
        }

        // commentaire à ajouter
        const { text } = req.body;

        if (!text || !text.trim()) {
            return res.status(400).json({ message: 'Le commentaire dois pas être vide' });
        }

        // On récupère l'id de l'utilisateur connecté
        const userResult = await pool.query(
            'SELECT id, nom, prenom, pseudo, avatar FROM fredouil.compte WHERE mail = $1',
            [req.session.userId]
        );

        if (userResult.rows.length === 0) {
            return res.status(404).json({ message: 'Utilisateur pas trouvé' });
        }

        // On recupere l'utilisateur
        const user = userResult.rows[0];

        // On recupere le message
        const db = mongoose.connection.db;
        const messagesCollection = db.collection('CERISoNet');

        // Ajout de la date du commentaire 
        const now = new Date();
        const date = now.toLocaleDateString('fr-FR');
        const hour = now.toLocaleTimeString('fr-FR');

        // Création du commentaire
        const newComment = {
            text,
            commentedBy: user.id,
            date,
            hour,

            // information qu'on ajoute pour le front-end
            authorName: `${user.nom} ${user.prenom}`,
            authorPseudo: user.pseudo,
            authorAvatar: user.avatar
        };

        // On recupere l'id du message
        const messageId = parseInt(req.params.id, 10);

        // On ajouteee le commentaire au message
        const result = await messagesCollection.updateOne(
            { _id: messageId },
            { $push: { comments: newComment } }
        );

        if (result.modifiedCount === 0) {
            return res.status(404).json({ message: 'Message pas trouvé' });
        }

        res.json(newComment);
    } catch (error) {
        console.error('Erreur pendant l\'ajout du commentaire:', error);
        res.status(500).json({ message: 'Erreur serveur' });
    }
});


// Route pour partager un message
app.post('/messages/:id/share', async (req, res) => {
    try {

        // On verifie si l'utilisateur est connecté
        if (!req.session.userId) {
            return res.status(401).json({ message: 'Non autorisé' });
        }

        // Commentaire du partage
        const { body } = req.body;

        // On récupére l'ID de l'utilisateur connecté
        const userResult = await pool.query(
            'SELECT id FROM fredouil.compte WHERE mail = $1',
            [req.session.userId]
        );

        if (userResult.rows.length === 0) {
            return res.status(404).json({ message: 'Utilisateur pas trouvé' });
        }

        const userId = userResult.rows[0].id;

        // On recupere le message
        const db = mongoose.connection.db;
        const messagesCollection = db.collection('CERISoNet');

        // On recupere l'id du message
        const messageId = parseInt(req.params.id, 10);


        // On vérifie que le message à partage existe
        const originalMessage = await messagesCollection.findOne({ _id: messageId });

        if (!originalMessage) {
            return res.status(404).json({ message: 'Message pas trouvé' });
        }

        // On ajoute la date du partage
        const now = new Date();
        const date = now.toLocaleDateString('fr-FR');
        const hour = now.toLocaleTimeString('fr-FR');

        // On créer le nouveau message (partagé)
        const newMessage = {
            date,
            hour,
            body: body || 'Je partage ce message',
            createdBy: userId,
            likes: 0,
            comments: [],
            hashtags: [],

            // Id du message original
            shared: messageId

        };

        // On insére le nouveau message
        const result = await messagesCollection.insertOne(newMessage);

        // Et on evoie le nouveau message
        res.json({
            ...newMessage,
            _id: result.insertedId
        });

    } catch (error) {

        console.error('Erreur pendant partage du message:', error);
        res.status(500).json({ message: 'Erreur serveur' });
    }
});

// Route pour déconnexion
app.post('/logout', async (req, res) => {
    try {

        // On verifie si l'utilisateur est connecté
        if (req.session.userId) {

            // On récupére l'ID numérique de l'utilisateur
            const userResult = await pool.query(
                'SELECT id FROM fredouil.compte WHERE mail = $1',
                [req.session.userId]
            );

            if (userResult.rows.length > 0) {

                // On met à jour le statut de connexion
                await pool.query(
                    'UPDATE fredouil.compte SET statut_connexion = 0 WHERE id = $1',
                    [userResult.rows[0].id]
                );
            }

            // On supprime la session de stockage
            req.session.destroy(err => {
                if (err) {

                    console.error("Erreur pendant la destruction de la session:", err);
                    return res.status(500).json({ message: 'Erreur serveur' });
                }

                res.clearCookie("connect.sid");
                res.status(200).json({ message: 'Déconnexion réussie' });
            });
        } else {

            res.status(200).json({ message: 'Déjà déconnecté' });
        }
    } catch (error) {
        console.error('Erreur lors de la déconnexion:', error);
        res.status(500).json({ message: 'Erreur serveur' });
    }
});

/////////////////////////////
///Fin ecoute des routes  ///
/////////////////////////////

//////////////////////////////////////////
////////// Redirection Quarkus //////////
//////////////////////////////////////////

// Route pour obtenir tous les hashtags
app.get('/api/hashtags', async (req, res) => {
    try {

        // On recupere tous les hashtags
        const response = await axios.get('http://localhost:8080/api/hashtags');
        res.json(response.data);

    } catch (error) {
        console.error('Erreur pendant la récupération des hashtags:', error);
        res.status(500).json({ message: 'Erreur serveur' });
    }
});

// Route pour obtenir un hashtag par ID
app.get('/api/hashtags/:id', async (req, res) => {
    try {

        // On recupere le hashtag
        const response = await axios.get(`http://localhost:8080/api/hashtags/${req.params.id}`);
        res.json(response.data);

    } catch (error) {
        console.error(`Erreur pendant la récupération du hashtag ${req.params.id}:`, error);
        res.status(error.response?.status || 500).json({ message: 'Erreur serveur' });
    }
});

// Route pour créer un nouveau hashtag
app.post('/api/hashtags', async (req, res) => {
    try {

        // On cree le hashtag
        const response = await axios.post('http://localhost:8080/api/hashtags', req.body);
        res.status(201).json(response.data);
    } catch (error) {

        console.error('Erreur pendant la création du hashtag:', error);
        res.status(500).json({ message: 'Erreur serveur' });
    }
});

// Route pour mettre à jour un hashtag existant
app.put('/api/hashtags/:id', async (req, res) => {
    try {

        // On met a jour le hashtag
        const response = await axios.put(`http://localhost:8080/api/hashtags/${req.params.id}`, req.body);
        res.json(response.data);
    } catch (error) {

        console.error(`Erreur pendant la mise à jour du hashtag ${req.params.id}:`, error);
        res.status(error.response?.status || 500).json({ message: 'Erreur serveur' });
    }
});

// Route pour supprimer un hashtag
app.delete('/api/hashtags/:id', async (req, res) => {
    try {

        // On supprime le hashtag
        await axios.delete(`http://localhost:8080/api/hashtags/${req.params.id}`);
        res.status(204).send();
    } catch (error) {

        console.error(`Erreur pendant la suppression du hashtag ${req.params.id}:`, error);
        res.status(error.response?.status || 500).json({ message: 'Erreur serveur' });
    }
});

// Route pour obtenir la position d'un mot dans un hashtag
app.get('/api/hashtags/:id/position/:word', async (req, res) => {
    try {

        // On recupere la position
        const response = await axios.get(`http://localhost:8080/api/hashtags/${req.params.id}/position/${req.params.word}`);
        res.json(response.data);
    } catch (error) {

        console.error(`Erreur pendant la recherche de position du mot ${req.params.word}:`, error);
        res.status(error.response?.status || 500).json({ message: 'Erreur serveur' });
    }
});

//////////////////////////////////////////
/////////////// Fin Quarkus //////////////
//////////////////////////////////////////