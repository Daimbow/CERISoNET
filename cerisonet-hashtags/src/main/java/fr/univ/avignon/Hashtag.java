package fr.univ.avignon;

import io.quarkus.mongodb.panache.PanacheMongoEntity;
import io.quarkus.mongodb.panache.common.MongoEntity;
import java.time.LocalDateTime;
import org.bson.types.ObjectId;

@MongoEntity(collection = "hashtags")
public class Hashtag extends PanacheMongoEntity {

    public String name;

    public int usageCount;

    public LocalDateTime lastUsed;

    public Hashtag() {
    }

    public Hashtag(String name, int usageCount) {
        this.name = name;
        this.usageCount = usageCount;
        this.lastUsed = LocalDateTime.now();
    }

    public static Hashtag findByName(String name) {
        return find("name", name).firstResult();
    }

    public void incrementUsage() {
        this.usageCount++;
        this.lastUsed = LocalDateTime.now();
        this.update();
    }
}