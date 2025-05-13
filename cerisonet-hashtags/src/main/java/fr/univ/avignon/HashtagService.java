package fr.univ.avignon;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.ws.rs.WebApplicationException;
import java.time.LocalDateTime;
import java.util.List;
import org.bson.types.ObjectId;

@ApplicationScoped
public class HashtagService {
    
    public Hashtag findById(String id) {
        Hashtag hashtag = Hashtag.findById(new ObjectId(id));
        if (hashtag == null) {
            throw new WebApplicationException("Hashtag non trouvé avec l'ID: " + id, 404);
        }
        return hashtag;
    }
    
    public List<Hashtag> findAll() {
        return Hashtag.listAll();
    }
    
    public Hashtag create(Hashtag hashtag) {
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
    
    // Algorithme pour trouver la position d'un mot dans un hashtag
    public int findWordPosition(String id, String word) {
        Hashtag hashtag = findById(id);
        String hashtagName = hashtag.name.toLowerCase();
        String searchWord = word.toLowerCase();
        
        return hashtagName.indexOf(searchWord);
    }
}
