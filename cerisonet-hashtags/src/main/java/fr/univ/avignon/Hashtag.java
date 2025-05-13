package fr.univ.avignon;
import io.quarkus.mongodb.panache.PanacheMongoEntity;
import io.quarkus.mongodb.panache.common.MongoEntity;
import java.time.LocalDateTime;

@MongoEntity(collection="hashtags")
public class Hashtag extends PanacheMongoEntity {
    
    public String name;
    
    public int usageCount;
    
    public LocalDateTime lastUsed;
    
    // Constructeur par défaut nécessaire pour Panache
    public Hashtag() {
    }
    
    // Constructeur pratique
    public Hashtag(String name, int usageCount) {
        this.name = name;
        this.usageCount = usageCount;
        this.lastUsed = LocalDateTime.now();
    }
}
