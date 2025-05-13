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
import { ObjectId } from 'mongodb';
import axios from 'axios';




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

const connectedClients = new Map()

// Gestion des connexions WebSocket
wss.on('connection', (ws, req) => {
    // Récupérer l'identifiant de l'utilisateur à partir de l'URL
    const url = new URL(req.url, 'https://pedago.univ-avignon.fr');
    const userId = url.searchParams.get('userId');
    
    console.log(`Nouvelle connexion WebSocket de l'utilisateur: ${userId}`);
    
    // Enregistrer la connexion
    if (userId) {
        connectedClients.set(userId, ws);
    }
    
    // Envoyer un message de bienvenue
    ws.send(JSON.stringify({
        type: 'info',
        message: 'Connexion WebSocket établie'
    }));
    
    // Écouter les messages du client
    ws.on('message', async (message) => {
        try {
            const data = JSON.parse(message);
            
            // Traiter les différents types de messages
            switch (data.type) {
                case 'connection':
                    // Notifier tout le monde qu'un utilisateur s'est connecté
                    broadcastToAll({
                        type: 'connection',
                        data: {
                            username: data.data.username,
                            timestamp: new Date().toISOString()
                        }
                    }, userId);
                    break;
                    
                case 'like':
                    // Notifier tout le monde qu'un utilisateur a aimé un message
                    broadcastToAll({
                        type: 'like',
                        data: {
                            username: data.data.username,
                            messageId: data.data.messageId,
                            timestamp: new Date().toISOString()
                        }
                    }, userId);
                    break;
                    
                case 'comment':
                    // Notifier tout le monde qu'un utilisateur a commenté un message
                    broadcastToAll({
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
                    // Notifier tout le monde qu'un utilisateur a partagé un message
                    broadcastToAll({
                        type: 'share',
                        data: {
                            username: data.data.username,
                            messageId: data.data.messageId,
                            timestamp: new Date().toISOString()
                        }
                    }, userId);
                    break;
                    
                case 'logout':
                    // Notifier tout le monde qu'un utilisateur s'est déconnecté
                    broadcastToAll({
                        type: 'logout',
                        data: {
                            username: data.data.username,
                            timestamp: new Date().toISOString()
                        }
                    }, userId);
                    break;
                    
                default:
                    console.log(`Type de message non reconnu: ${data.type}`);
            }
        } catch (error) {
            console.error('Erreur lors du traitement du message WebSocket:', error);
        }
    });
    
    // Gérer la fermeture de connexion
    ws.on('close', () => {
        console.log(`Connexion WebSocket fermée pour l'utilisateur: ${userId}`);
        
        // Supprimer la connexion
        if (userId) {
            connectedClients.delete(userId);
        }
    });
});

// Fonction pour diffuser un message à tous les clients connectés sauf l'expéditeur
function broadcastToAll(message, excludeUserId) {
    const messageStr = JSON.stringify(message);
    
    connectedClients.forEach((client, id) => {
        if (id !== excludeUserId && client.readyState === 1) { // 1 = WebSocket.OPEN
            client.send(messageStr);
        }
    });
}

// Fonction pour envoyer un message à un client spécifique
function sendToUser(userId, message) {
    const client = connectedClients.get(userId);
    
    if (client && client.readyState === 1) { // 1 = WebSocket.OPEN
        client.send(JSON.stringify(message));
        return true;
    }
    
    return false;
}

server.listen(3223, () => {
    console.log('Serveur HTTPS et WebSockets démarrés sur https://pedago.univ-avignon.fr:3223');
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

        // Requête SQL pour vérifier les informations de connexion
        const result = await pool.query(
            'SELECT * FROM fredouil.compte WHERE mail = $1 AND motpasse = $2',
            [username, hashedPassword]
        );

        // Si les informations sont correctes enregistre l'utilisateur dans la session
        if (result.rowCount > 0) {
            req.session.userId = result.rows[0].mail;
            req.session.username = result.rows[0].motpasse;

            // Renvoie une réponse JSON indiquant que la connexion a reussi
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
        res.status(500).json({ message: 'Erreur serveur' });
    
    }
});

    // Route pour récupérer les messages avec pagination et filtres
app.get('/messages', async (req, res) => {
    try {
        // Vérifier si l'utilisateur est connecté
        if (!req.session.userId) {
            return res.status(401).json({ message: 'Non autorisé' });
        }

        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 5;
        const skip = (page - 1) * limit;
        const sortBy = req.query.sortBy || 'date';
        const filterOwner = req.query.filterOwner;
        const filterHashtag = req.query.filterHashtag;

        // Connexion à MongoDB
        const db = mongoose.connection.db;
        const messagesCollection = db.collection('CERISoNet');

        // Construire la requête en fonction des filtres
        let query = {};
        
        if (filterOwner === 'true') {
            // Récupérer l'ID de l'utilisateur connecté
            const userResult = await pool.query(
                'SELECT id FROM fredouil.compte WHERE mail = $1',
                [req.session.userId]
            );
            
            if (userResult.rows.length > 0) {
                query.createdBy = userResult.rows[0].id;
            }
        } else if (filterOwner === 'false') {
            // Messages des autres utilisateurs
            const userResult = await pool.query(
                'SELECT id FROM fredouil.compte WHERE mail = $1',
                [req.session.userId]
            );
            
            if (userResult.rows.length > 0) {
                query.createdBy = { $ne: userResult.rows[0].id };
            }
        }
        
        if (filterHashtag) {
            query.hashtags = { $regex: filterHashtag, $options: 'i' };
        }

        // Définir l'ordre de tri
        let sortOptions = {};
        switch (sortBy) {
            case 'date':
                sortOptions = { date: -1, hour: -1 };
                break;
            case 'date-asc':
                sortOptions = { date: 1, hour: 1 };
                break;
            case 'likes':
                sortOptions = { likes: -1 };
                break;
            case 'comments':
                    sortOptions = { 
                        commentsCount: -1 
                    };
                    break;
            default:
                sortOptions = { date: -1, hour: -1 };
        }

        // Compter le nombre total de messages
        const total = await messagesCollection.countDocuments(query);
        
        // Récupérer les messages avec pagination
        const messages = await messagesCollection.aggregate([
            { $match: query },
            { $addFields: { 
                commentsCount: { 
                    $size: { 
                        $ifNull: ["$comments", []] 
                    } 
                } 
            }},
            { $sort: sortOptions },
            { $skip: skip },
            { $limit: limit }
        ]).toArray();

        // Enrichir les messages avec les informations des utilisateurs
        const enrichedMessages = await Promise.all(messages.map(async (message) => {
            try {
                // Récupérer les infos de l'auteur
                const authorResult = await pool.query(
                    'SELECT nom, prenom, pseudo, avatar FROM fredouil.compte WHERE id = $1',
                    [message.createdBy]
                );
                
                const enrichedMessage = {
                    ...message,
                    authorName: authorResult.rows.length > 0 ? `${authorResult.rows[0].nom} ${authorResult.rows[0].prenom}` : 'Utilisateur inconnu',
                    authorPseudo: authorResult.rows.length > 0 ? authorResult.rows[0].pseudo : 'Utilisateur inconnu',
                    authorAvatar: authorResult.rows.length > 0 ? authorResult.rows[0].avatar : null
                };
                
                // Si c'est un message partagé, récupérer le message d'origine
                if (message.shared) {
                    try {
                        // Utiliser ObjectId pour récupérer le message partagé
                        const sharedMessage = await messagesCollection.findOne({ 
                            _id: typeof message.shared === 'string' ? new ObjectId(message.shared) : message.shared 
                        });
                        
                        if (sharedMessage) {
                            // Récupérer les infos de l'auteur du message partagé
                            const sharedAuthorResult = await pool.query(
                                'SELECT nom, prenom, pseudo, avatar FROM fredouil.compte WHERE id = $1',
                                [sharedMessage.createdBy]
                            );
                            
                            enrichedMessage.sharedMessage = {
                                ...sharedMessage,
                                authorName: sharedAuthorResult.rows.length > 0 ? `${sharedAuthorResult.rows[0].nom} ${sharedAuthorResult.rows[0].prenom}` : 'Utilisateur inconnu',
                                authorPseudo: sharedAuthorResult.rows.length > 0 ? sharedAuthorResult.rows[0].pseudo : 'Utilisateur inconnu',
                                authorAvatar: sharedAuthorResult.rows.length > 0 ? sharedAuthorResult.rows[0].avatar : null
                            };
                        }
                    } catch (error) {
                        console.error('Erreur lors de la récupération du message partagé:', error);
                    }
                }
                
                // Enrichir les commentaires avec les infos des auteurs
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
                console.error('Erreur lors de l\'enrichissement du message:', error);
                return message;
            }
        }));

        res.json({
            messages: enrichedMessages,
            total,
            page,
            limit
        });
    } catch (error) {
        console.error('Erreur lors de la récupération des messages:', error);
        res.status(500).json({ message: 'Erreur serveur' });
    }
});

// Route pour récupérer les détails d'un message partagé
app.get('/messages/:id', async (req, res) => {
    try {
        if (!req.session.userId) {
            return res.status(401).json({ message: 'Non autorisé' });
        }
        
        // Utiliser ObjectId au lieu de parseInt
        const messageId = req.params.id;
        const db = mongoose.connection.db;
        const messagesCollection = db.collection('CERISoNet');
        
        // Utiliser ObjectId pour la recherche
        const message = await messagesCollection.findOne({ _id: messageId });
        
        if (!message) {
            return res.status(404).json({ message: 'Message non trouvé' });
        }
        
        // Récupérer les infos de l'auteur
        const authorResult = await pool.query(
            'SELECT nom, prenom, pseudo, avatar FROM fredouil.compte WHERE id = $1',
            [message.createdBy]
        );
        
        const enrichedMessage = {
            ...message,
            authorName: authorResult.rows.length > 0 ? `${authorResult.rows[0].nom} ${authorResult.rows[0].prenom}` : 'Utilisateur inconnu',
            authorPseudo: authorResult.rows.length > 0 ? authorResult.rows[0].pseudo : 'Utilisateur inconnu',
            authorAvatar: authorResult.rows.length > 0 ? authorResult.rows[0].avatar : null
        };
        
        res.json(enrichedMessage);
    } catch (error) {
        console.error('Erreur lors de la récupération du message:', error);
        res.status(500).json({ message: 'Erreur serveur' });
    }
});

// Route pour liker un message
app.post('/messages/:id/like', async (req, res) => {
    try {
        if (!req.session.userId) {
            return res.status(401).json({ message: 'Non autorisé' });
        }
        
        // Récupérer l'ID de l'utilisateur connecté
        const userResult = await pool.query(
            'SELECT id FROM fredouil.compte WHERE mail = $1',
            [req.session.userId]
        );
        
        if (userResult.rows.length === 0) {
            return res.status(404).json({ message: 'Utilisateur non trouvé' });
        }
        
        const userId = userResult.rows[0].id;
        
        const db = mongoose.connection.db;
        const messagesCollection = db.collection('CERISoNet');
        
        // Convertir l'ID en ObjectId correctement
        const messageId = parseInt(req.params.id, 10);

        
        // Mettre à jour le nombre de likes du message
        const result = await messagesCollection.updateOne(
            { _id: messageId },
            { $inc: { likes: 1 } }
        );
        
        if (result.modifiedCount === 0) {
            return res.status(404).json({ message: 'Message non trouvé' });
        }
        
        res.json({ success: true });
    } catch (error) {
        console.error('Erreur lors du like du message:', error);
        res.status(500).json({ message: 'Erreur serveur' });
    }
});


// Route pour commenter un message
app.post('/messages/:id/comment', async (req, res) => {
    try {
        if (!req.session.userId) {
            return res.status(401).json({ message: 'Non autorisé' });
        }
        
        const { text } = req.body;
        
        if (!text || !text.trim()) {
            return res.status(400).json({ message: 'Le commentaire ne peut pas être vide' });
        }
        
        // Récupérer l'ID de l'utilisateur connecté
        const userResult = await pool.query(
            'SELECT id, nom, prenom, pseudo, avatar FROM fredouil.compte WHERE mail = $1',
            [req.session.userId]
        );
        
        if (userResult.rows.length === 0) {
            return res.status(404).json({ message: 'Utilisateur non trouvé' });
        }
        
        const user = userResult.rows[0];
        
        const db = mongoose.connection.db;
        const messagesCollection = db.collection('CERISoNet');
        
        const now = new Date();
        const date = now.toLocaleDateString('fr-FR');
        const hour = now.toLocaleTimeString('fr-FR');
        
        const newComment = {
            text,
            commentedBy: user.id,
            date,
            hour,
            // Informations ajoutées pour le front-end
            authorName: `${user.nom} ${user.prenom}`,
            authorPseudo: user.pseudo,
            authorAvatar: user.avatar
        };
        
        // Convertir l'ID en ObjectId correctement
        const messageId = parseInt(req.params.id, 10);

        
        // Ajouter le commentaire au message
        const result = await messagesCollection.updateOne(
            { _id: messageId },
            { $push: { comments: newComment } }
        );
        
        if (result.modifiedCount === 0) {
            return res.status(404).json({ message: 'Message non trouvé' });
        }
        
        res.json(newComment);
    } catch (error) {
        console.error('Erreur lors de l\'ajout du commentaire:', error);
        res.status(500).json({ message: 'Erreur serveur' });
    }
});

// Route pour partager un message
app.post('/messages/:id/share', async (req, res) => {
    try {
        if (!req.session.userId) {
            return res.status(401).json({ message: 'Non autorisé' });
        }
        
        const { body } = req.body;
        
        // Récupérer l'ID de l'utilisateur connecté
        const userResult = await pool.query(
            'SELECT id FROM fredouil.compte WHERE mail = $1',
            [req.session.userId]
        );
        
        if (userResult.rows.length === 0) {
            return res.status(404).json({ message: 'Utilisateur non trouvé' });
        }
        
        const userId = userResult.rows[0].id;
        
        const db = mongoose.connection.db;
        const messagesCollection = db.collection('CERISoNet');
        
        // Convertir l'ID en ObjectId correctement
        const messageId = parseInt(req.params.id, 10);

        
        // Vérifier que le message à partager existe
        const originalMessage = await messagesCollection.findOne({ _id: messageId });
        
        if (!originalMessage) {
            return res.status(404).json({ message: 'Message non trouvé' });
        }
        
        const now = new Date();
        const date = now.toLocaleDateString('fr-FR');
        const hour = now.toLocaleTimeString('fr-FR');
        
        // Créer le nouveau message (partagé)
        const newMessage = {
            date,
            hour,
            body: body || 'Je partage ce message',
            createdBy: userId,
            likes: 0,
            comments: [],
            hashtags: [],
            shared: messageId.toString() // Stocker l'ID original comme chaîne
        };
        
        // Insérer le nouveau message
        const result = await messagesCollection.insertOne(newMessage);
        
        res.json({
            ...newMessage,
            _id: result.insertedId
        });
    } catch (error) {
        console.error('Erreur lors du partage du message:', error);
        res.status(500).json({ message: 'Erreur serveur' });
    }
});

// Route pour récupérer les utilisateurs connectés
app.get('/connected-users', async (req, res) => {
    try {
        if (!req.session.userId) {
            return res.status(401).json({ message: 'Non autorisé' });
        }
        
        const result = await pool.query(
            'SELECT id, nom, prenom, pseudo, avatar FROM fredouil.compte WHERE statut_connexion = 1'
        );
        
        res.json(result.rows);
    } catch (error) {
        console.error('Erreur lors de la récupération des utilisateurs connectés:', error);
        res.status(500).json({ message: 'Erreur serveur' });
    }
});

// Route pour déconnexion
app.post('/logout', async (req, res) => {
    try {
        if (req.session.userId) {
            // Récupérer l'ID numérique de l'utilisateur
            const userResult = await pool.query(
                'SELECT id FROM fredouil.compte WHERE mail = $1',
                [req.session.userId]
            );
            
            if (userResult.rows.length > 0) {
                // Mettre à jour le statut de connexion
                await pool.query(
                    'UPDATE fredouil.compte SET statut_connexion = 0 WHERE id = $1',
                    [userResult.rows[0].id]
                );
            }
            
            // Détruire la session
            req.session.destroy(err => {
                if (err) {
                    console.error("Erreur lors de la destruction de la session:", err);
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

// Route pour mettre à jour le statut de connexion à la connexion
app.post('/update-connection-status', async (req, res) => {
    try {
        if (!req.session.userId) {
            return res.status(401).json({ message: 'Non autorisé' });
        }
        
        // Récupérer l'ID numérique de l'utilisateur
        const userResult = await pool.query(
            'SELECT id FROM fredouil.compte WHERE mail = $1',
            [req.session.userId]
        );
        
        if (userResult.rows.length === 0) {
            return res.status(404).json({ message: 'Utilisateur non trouvé' });
        }
        
        // Mettre à jour le statut de connexion
        await pool.query(
            'UPDATE fredouil.compte SET statut_connexion = 1 WHERE id = $1',
            [userResult.rows[0].id]
        );
        
        res.json({ success: true });
    } catch (error) {
        console.error('Erreur lors de la mise à jour du statut de connexion:', error);
        res.status(500).json({ message: 'Erreur serveur' });
    }
});

app.get('/api/hashtags', async (req, res) => {
  try {
    const response = await axios.get('http://localhost:8080/api/hashtags');
    res.json(response.data);
  } catch (error) {
    console.error('Erreur lors de la récupération des hashtags:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

app.get('/api/hashtags/:id', async (req, res) => {
  try {
    const response = await axios.get(`http://localhost:8080/api/hashtags/${req.params.id}`);
    res.json(response.data);
  } catch (error) {
    console.error(`Erreur lors de la récupération du hashtag ${req.params.id}:`, error);
    res.status(error.response?.status || 500).json({ message: 'Erreur serveur' });
  }
});

app.post('/api/hashtags', async (req, res) => {
  try {
    const response = await axios.post('http://localhost:8080/api/hashtags', req.body);
    res.status(201).json(response.data);
  } catch (error) {
    console.error('Erreur lors de la création du hashtag:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

app.put('/api/hashtags/:id', async (req, res) => {
  try {
    const response = await axios.put(`http://localhost:8080/api/hashtags/${req.params.id}`, req.body);
    res.json(response.data);
  } catch (error) {
    console.error(`Erreur lors de la mise à jour du hashtag ${req.params.id}:`, error);
    res.status(error.response?.status || 500).json({ message: 'Erreur serveur' });
  }
});

app.delete('/api/hashtags/:id', async (req, res) => {
  try {
    await axios.delete(`http://localhost:8080/api/hashtags/${req.params.id}`);
    res.status(204).send();
  } catch (error) {
    console.error(`Erreur lors de la suppression du hashtag ${req.params.id}:`, error);
    res.status(error.response?.status || 500).json({ message: 'Erreur serveur' });
  }
});

app.get('/api/hashtags/:id/position/:word', async (req, res) => {
  try {
    const response = await axios.get(`http://localhost:8080/api/hashtags/${req.params.id}/position/${req.params.word}`);
    res.json(response.data);
  } catch (error) {
    console.error(`Erreur lors de la recherche de position du mot ${req.params.word}:`, error);
    res.status(error.response?.status || 500).json({ message: 'Erreur serveur' });
  }
});