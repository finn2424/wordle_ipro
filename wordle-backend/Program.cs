using Kull.GenericBackend;
using Microsoft.OpenApi.Models;
using System.Data.Common;

/**
 * Wordle Backend Entry Point
 * Configures Kull.GenericBackend for auto-generated API endpoints from stored procedures.
 */
var builder = WebApplication.CreateBuilder(args);

var services = builder.Services;
services.AddMvcCore().AddApiExplorer();
services.AddGenericBackend()
    .ConfigureMiddleware(m =>
    {
        m.AlwaysWrapJson = true;
        m.RequireAuthenticated = false;
    })
    .ConfigureOpenApiGeneration(o => { })
    .AddFileSupport()
    .AddSystemParameters();

// You might have to register your Provider Factory
if (!DbProviderFactories.TryGetFactory("Microsoft.Data.SqlClient", out var _))
    DbProviderFactories.RegisterFactory("Microsoft.Data.SqlClient", Microsoft.Data.SqlClient.SqlClientFactory.Instance);

// Register DbConnection
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


var app = builder.Build();

if (app.Environment.IsDevelopment())
{
    app.UseSwagger(o =>
    {
        o.SerializeAsV2 = false;
    });


    app.UseSwaggerUI(c =>
    {
        c.SwaggerEndpoint("/swagger/v1/swagger.json", "My API V1");
    });
}

app.UseRouting();

app.UseCors(builder => builder
    .WithOrigins("http://localhost:4200", "http://localhost:8083", "https://wordle-fb.ddns.net")
    .AllowAnyMethod()
    .AllowAnyHeader());

app.UseGenericBackend();

// Configure the HTTP request pipeline.

app.UseHttpsRedirection();

app.UseAuthorization();

app.MapControllers();

app.Run();
