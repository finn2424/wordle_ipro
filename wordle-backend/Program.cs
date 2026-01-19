using Kull.GenericBackend;
using Microsoft.OpenApi.Models;
using System.Data.Common;

var builder = WebApplication.CreateBuilder(args);

// Add services to the container.
var services = builder.Services;
services.AddMvcCore().AddApiExplorer(); //Or AddMvc() depending on your needs
services.AddGenericBackend()
    .ConfigureMiddleware(m =>
    { // Set your options
        m.AlwaysWrapJson = true; // Recommended
        m.RequireAuthenticated = false; // default since 2.0. for local development, you might want to use false
    })
    .ConfigureOpenApiGeneration(o =>
    { // Set your options
    })
    .AddFileSupport()
    //.AddXmlSupport() if needed
    .AddSystemParameters(); // You probably want to configure these, see https://github.com/Kull-AG/kull-generic-backend/wiki/System-Parameters

// You might have to register your Provider Factory
if (!DbProviderFactories.TryGetFactory("Microsoft.Data.SqlClient", out var _))
    DbProviderFactories.RegisterFactory("Microsoft.Data.SqlClient", Microsoft.Data.SqlClient.SqlClientFactory.Instance);

// IMPORTANT: You have to inject a DbConnection somehow
services.AddTransient(typeof(DbConnection), (s) =>
{
    var conf = s.GetRequiredService<IConfiguration>();
    var constr = conf["ConnectionStrings:DefaultConnection"];
    return new Microsoft.Data.SqlClient.SqlConnection(constr);
});
services.AddSwaggerGen(c => {
    c.SwaggerDoc("v1", new OpenApiInfo { Title = "My API", Version = "v1" });
    c.AddGenericBackend();
});
builder.Services.AddControllers();
// Learn more about configuring OpenAPI at https://aka.ms/aspnet/openapi
//builder.Services.AddOpenApi();

var app = builder.Build();

app.UseSwagger(o =>
{
    // Depending on your client, set this to true (eg, ng-swagger-gen)
    o.SerializeAsV2 = false;
});
app.UseRouting();
app.UseGenericBackend();

// If needed, Swagger UI, see https://github.com/domaindrivendev/Swashbuckle.AspNetCore
app.UseSwaggerUI(c =>
{
    c.SwaggerEndpoint("/swagger/v1/swagger.json", "My API V1");
});

// Configure the HTTP request pipeline.
//if (app.Environment.IsDevelopment())
//{
//    app.MapOpenApi();
//}

app.UseHttpsRedirection();

app.UseAuthorization();

app.MapControllers();

app.Run();
