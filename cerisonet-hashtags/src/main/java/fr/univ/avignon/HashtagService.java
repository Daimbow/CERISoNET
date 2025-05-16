package fr.univ.avignon;

import jakarta.enterprise.context.ApplicationScoped;
import jakarta.ws.rs.WebApplicationException;
import java.time.LocalDateTime;
import java.util.List;
import java.util.ArrayList;
import java.util.Map;
import java.util.HashMap;
import org.bson.types.ObjectId;
import com.mongodb.client.MongoCollection;
import com.mongodb.client.MongoCursor;
import org.bson.Document;
import jakarta.annotation.PostConstruct;
import jakarta.inject.Inject;
import com.mongodb.client.MongoClient;

@ApplicationScoped
public class HashtagService {

    @Inject
    MongoClient mongoClient;

    // méthode pour init qui s'exécute au démarrage du service
    @PostConstruct
    public void init() {
        synchronizeHashtagsFromMessages();
    }

    public Hashtag findById(String id) {
        Hashtag hashtag = Hashtag.findById(new ObjectId(id));
        if (hashtag == null) {
            throw new WebApplicationException("Hashtag pas trouvé avec l'ID: " + id, 404);
        }
        return hashtag;
    }

    public List<Hashtag> findAll() {
        return Hashtag.listAll();
    }

    public Hashtag create(Hashtag hashtag) {

        // On vérifie si le hashtag existe déjà
        Hashtag existing = Hashtag.findByName(hashtag.name);
        if (existing != null) {
            existing.usageCount += hashtag.usageCount;
            existing.lastUsed = LocalDateTime.now();
            existing.update();
            return existing;
        }

        hashtag.lastUsed = LocalDateTime.now();
        hashtag.persist();
        return hashtag;
    }

    public Hashtag update(String id, Hashtag hashtag) {
        Hashtag existingHashtag = findById(id);
        existingHashtag.name = hashtag.name;
        existingHashtag.usageCount = hashtag.usageCount;
        existingHashtag.lastUsed = LocalDateTime.now();
        existingHashtag.update();
        return existingHashtag;
    }

    public void delete(String id) {
        Hashtag hashtag = findById(id);
        hashtag.delete();
    }

    // algo pour trouver la position d'un mot dans un hashtag
    public int findWordPosition(String id, String word) {
        Hashtag hashtag = findById(id);
        String hashtagName = hashtag.name.toLowerCase();
        String searchWord = word.toLowerCase();

        return hashtagName.indexOf(searchWord);
    }

    // méthode pour synchro les hashtags depuis les messages
    public void synchronizeHashtagsFromMessages() {

        // on obtient la collection CERISoNet
        MongoCollection<Document> messageCollection = mongoClient.getDatabase("db-CERI").getCollection("CERISoNet");

        // on compte l'utilisation des hashtags
        Map<String, Integer> hashtagCounts = new HashMap<>();

        // on parcours tous les messages
        try (MongoCursor<Document> cursor = messageCollection.find().iterator()) {
            while (cursor.hasNext()) {
                Document message = cursor.next();
                List<String> hashtags = message.getList("hashtags", String.class);

                if (hashtags != null) {
                    for (String hashtag : hashtags) {
                        hashtagCounts.put(hashtag, hashtagCounts.getOrDefault(hashtag, 0) + 1);
                    }
                }
            }
        }

        // on met à jour la collection hashtags
        for (Map.Entry<String, Integer> entry : hashtagCounts.entrySet()) {
            String hashtagName = entry.getKey();
            Integer count = entry.getValue();

            // on vérifie si le hashtag existe déjà
            Hashtag existing = Hashtag.findByName(hashtagName);

            if (existing != null) {

                // met à jour le compteur
                existing.usageCount = count;
                existing.lastUsed = LocalDateTime.now();
                existing.update();
            } else {

                // et on crée un nouveau hashtag sinon
                Hashtag newHashtag = new Hashtag(hashtagName, count);
                newHashtag.persist();
            }
        }
    }

    // méthode pour trouver des messages par hashtag
    public List<Document> findMessagesByHashtag(String hashtagName) {
        MongoCollection<Document> messageCollection = mongoClient.getDatabase("db-CERI").getCollection("CERISoNet");
        List<Document> results = new ArrayList<>();

        // requete pour qu'on trouve les messages avec le hashtag spécifié
        try (MongoCursor<Document> cursor = messageCollection.find(new Document("hashtags", hashtagName)).iterator()) {
            while (cursor.hasNext()) {
                results.add(cursor.next());
            }
        }

        return results;
    }
}