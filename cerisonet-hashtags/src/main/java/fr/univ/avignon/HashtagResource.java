package fr.univ.avignon;
import jakarta.inject.Inject;
import jakarta.ws.rs.*;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;
import java.util.List;

@Path("/api/hashtags")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
public class HashtagResource {
    
    @Inject
    HashtagService service;
    
    // GET - Récupérer un hashtag par ID
    @GET
    @Path("/{id}")
    public Hashtag getById(@PathParam("id") String id) {
        return service.findById(id);
    }
    
    // GET - Récupérer tous les hashtags
    @GET
    public List<Hashtag> getAll() {
        return service.findAll();
    }
    
    // POST - Créer un nouveau hashtag
    @POST
    public Response create(Hashtag hashtag) {
        Hashtag created = service.create(hashtag);
        return Response.status(201).entity(created).build();
    }
    
    // PUT - Mettre à jour un hashtag
    @PUT
    @Path("/{id}")
    public Hashtag update(@PathParam("id") String id, Hashtag hashtag) {
        return service.update(id, hashtag);
    }
    
    // DELETE - Supprimer un hashtag
    @DELETE
    @Path("/{id}")
    public Response delete(@PathParam("id") String id) {
        service.delete(id);
        return Response.status(204).build();
    }
    
    // Algorithme supplémentaire: trouver la position d'un mot dans un hashtag
    @GET
    @Path("/{id}/position/{word}")
    public Response findWordPosition(@PathParam("id") String id, @PathParam("word") String word) {
        int position = service.findWordPosition(id, word);
        return Response.ok().entity("{\"position\": " + position + "}").build();
    }
}
