using Microsoft.EntityFrameworkCore;
using ApiGRG.Models;

var builder = WebApplication.CreateBuilder(args);

// Add services to the container.
builder.Services.AddDbContext<GrgContext>(opt =>
opt.UseSqlServer(builder.Configuration.GetConnectionString
("GrgContext"))); // se va a conectar a la base de datos

builder.Services.AddControllers();
// Learn more about configuring Swagger/OpenAPI at https://aka.ms/aspnetcore/swashbuckle
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

builder.Services.AddCors(option =>
{
    option.AddDefaultPolicy(
     policy =>
        {
         policy.AllowAnyOrigin();

         policy.AllowAnyMethod();

         policy.AllowAnyHeader();
        });
    }
);

var app = builder.Build();

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

// Sirve wwwroot/index.html cuando entran a "/" y habilita el resto de archivos estáticos (js, css, html, img)
app.UseDefaultFiles();
app.UseStaticFiles();

app.UseHttpsRedirection();

app.UseCors();

app.UseAuthorization();

app.MapControllers();

app.Run();
