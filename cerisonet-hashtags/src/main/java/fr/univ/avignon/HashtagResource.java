package fr.univ.avignon;

import jakarta.inject.Inject;
import jakarta.ws.rs.*;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;
import java.util.List;
import java.util.HashMap;
import java.util.Map;
import org.bson.Document;

@Path("/api/hashtags")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
public class HashtagResource {

    @Inject
    HashtagService service;

    // get pour récupérer un hashtag par ID
    @GET
    @Path("/{id}")
    public Hashtag getById(@PathParam("id") String id) {
        return service.findById(id);
    }

    // get pour récupérer tous les hashtags
    @GET
    public List<Hashtag> getAll() {
        return service.findAll();
    }

    // post pour créer un nouveau hashtag
    @POST
    public Response create(Hashtag hashtag) {
        Hashtag created = service.create(hashtag);
        return Response.status(201).entity(created).build();
    }

    // put pour ùettre à jour un hashtag
    @PUT
    @Path("/{id}")
    public Hashtag update(@PathParam("id") String id, Hashtag hashtag) {
        return service.update(id, hashtag);
    }

    // delete pour supprimer un hashtag
    @DELETE
    @Path("/{id}")
    public Response delete(@PathParam("id") String id) {
        service.delete(id);
        return Response.status(204).build();
    }

    // Algo pour trouver la position d'un mot dans un hashtag
    @GET
    @Path("/{id}/position/{word}")
    public Response findWordPosition(@PathParam("id") String id, @PathParam("word") String word) {
        int position = service.findWordPosition(id, word);
        Map<String, Integer> result = new HashMap<>();
        result.put("position", position);
        return Response.ok(result).build();
    }

    // pour synchronise les hashtags depuis les messages
    @POST
    @Path("/sync")
    public Response synchronizeHashtags() {
        service.synchronizeHashtagsFromMessages();
        return Response.ok().entity(Map.of("success", true, "message", "Hashtags bien synchro")).build();
    }

    // pour trouver des messages par hashtag
    @GET
    @Path("/messages/{hashtag}")
    public Response getMessagesByHashtag(@PathParam("hashtag") String hashtag) {
        List<Document> messages = service.findMessagesByHashtag("#" + hashtag.replace("#", ""));
        return Response.ok(messages).build();
    }

    @GET
    @Path("/popular")
    public Response getPopularHashtags(@QueryParam("limit") @DefaultValue("10") int limit) {
        List<Hashtag> hashtags = service.findAll();

        hashtags.sort((a, b) -> Integer.compare(b.usageCount, a.usageCount));

        if (hashtags.size() > limit) {
            hashtags = hashtags.subList(0, limit);
        }
        return Response.ok(hashtags).build();
    }
}